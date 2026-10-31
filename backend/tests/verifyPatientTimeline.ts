import app from '../src/app';
import { signAccessToken } from '../src/utils/jwt';
import { Role } from '../src/types';

const patientToken = signAccessToken({
  userId: 'timeline-test-patient',
  email: 'timeline-test@example.test',
  role: Role.PATIENT,
  firstName: 'Timeline',
  lastName: 'Patient',
});

const doctorToken = signAccessToken({
  userId: 'timeline-test-doctor',
  email: 'timeline-doctor@example.test',
  role: Role.DOCTOR,
  firstName: 'Timeline',
  lastName: 'Doctor',
});

async function run(): Promise<void> {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start patient timeline test server');
  }

  const baseUrl = `http://127.0.0.1:${address.port}/api/v1/patients/timeline`;
  let passed = 0;
  let failed = 0;

  const expectStatus = async (
    label: string,
    url: string,
    status: number,
    token?: string,
    method = 'GET',
  ) => {
    const response = await fetch(url, {
      method,
      headers: {
        Connection: 'close',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (response.status === status) {
      console.log(`✅ ${label}`);
      passed += 1;
    } else {
      console.error(`❌ ${label}: expected ${status}, received ${response.status}`);
      failed += 1;
    }
  };

  try {
    await expectStatus('Unauthenticated timeline request is rejected', baseUrl, 401);
    await expectStatus('Non-patient cannot access the patient timeline', baseUrl, 403, doctorToken);
    await expectStatus(
      'Patients cannot finalize a medical report',
      baseUrl.replace('/patients/timeline', '/reports/example-report/publish'),
      403,
      patientToken,
      'PATCH',
    );
    await expectStatus('Unknown event type is rejected', `${baseUrl}?type=UNKNOWN`, 400, patientToken);
    await expectStatus('Repeated event type parameters are rejected', `${baseUrl}?type=SCREENING&type=REFERRAL`, 400, patientToken);
    await expectStatus('Invalid calendar dates are rejected', `${baseUrl}?startDate=2025-02-30`, 400, patientToken);
    await expectStatus(
      'Reversed date ranges are rejected',
      `${baseUrl}?startDate=2025-02-02&endDate=2025-02-01`,
      400,
      patientToken,
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });
  }

  console.log(`\nPatient timeline API checks: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

run().catch((error: unknown) => {
  console.error('Patient timeline API checks failed:', error);
  process.exitCode = 1;
});
