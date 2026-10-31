import app from '../src/app';
import { signAccessToken } from '../src/utils/jwt';
import { Role } from '../src/types';

const tokenFor = (role: Role, userId: string) => signAccessToken({
  userId,
  email: `${userId}@example.test`,
  role,
  firstName: 'Education',
  lastName: 'Test',
});

const patientToken = tokenFor(Role.PATIENT, 'education-test-patient');
const doctorToken = tokenFor(Role.DOCTOR, 'education-test-doctor');

async function run(): Promise<void> {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start education API test server');
  }

  const baseUrl = `http://127.0.0.1:${address.port}/api/v1/education`;
  let passed = 0;
  let failed = 0;

  const expectStatus = async (
    label: string,
    path: string,
    status: number,
    token?: string,
    method = 'GET',
    body?: unknown,
  ) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Connection: 'close',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    if (response.status === status) {
      console.log(`✅ ${label}`);
      passed += 1;
    } else {
      console.error(`❌ ${label}: expected ${status}, received ${response.status}`);
      failed += 1;
    }
  };

  const incompleteVideoResource = {
    slug: 'education-video-validation',
    category: 'GENERAL_AWARENESS',
    format: 'VIDEO',
    translations: [{
      language: 'en',
      title: 'Video resource',
      description: 'A valid length description',
      body: 'A valid length lesson body for test validation.',
      sourceReferences: ['https://example.test/source'],
    }],
  };
  const insecureVideoResource = {
    ...incompleteVideoResource,
    translations: incompleteVideoResource.translations.map((translation) => ({
      ...translation,
      videoUrl: 'http://example.test/lesson',
    })),
  };

  try {
    await expectStatus('Invalid language code is rejected', '/resources?language=invalid-code', 400);
    await expectStatus('Unknown category is rejected', '/resources?category=UNKNOWN', 400);
    await expectStatus('Unauthenticated bookmark filter is rejected', '/resources?bookmarked=true', 401);
    await expectStatus('Unauthenticated progress access is rejected', '/progress', 401);
    await expectStatus('Patient cannot access editorial resources', '/admin/resources', 403, patientToken);
    await expectStatus(
      'Patient cannot create editorial resources',
      '/admin/resources',
      403,
      patientToken,
      'POST',
      incompleteVideoResource,
    );
    await expectStatus(
      'Video resources require a video URL for every language',
      '/admin/resources',
      400,
      doctorToken,
      'POST',
      incompleteVideoResource,
    );
    await expectStatus(
      'Education media and references require HTTPS URLs',
      '/admin/resources',
      400,
      doctorToken,
      'POST',
      insecureVideoResource,
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });
  }

  console.log(`\nEducation API checks: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

run().catch((error: unknown) => {
  console.error('Education API checks failed:', error);
  process.exitCode = 1;
});
