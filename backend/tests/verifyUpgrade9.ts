// backend/tests/verifyUpgrade9.ts
import { getCampRoute } from '../src/controllers/routeController';
import {
  getMultiCampPlans,
  createMultiCampPlan,
  approveMultiCampPlan,
} from '../src/controllers/multiCampPlannerController';
import { DEMO_CAMPS } from '../src/utils/mockStore';

// Mock Express Request & Response
function createMockReqRes(params: any = {}, query: any = {}, body: any = {}, user: any = { id: 'admin-1', role: 'ADMIN' }) {
  const req: any = {
    params,
    query,
    body,
    user,
  };
  let statusCode = 200;
  let jsonResponse: any = null;
  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    setHeader(name: string, value: string) {
      return res;
    },
    header(name: string, value: string) {
      return res;
    },
    json(data: any) {
      jsonResponse = data;
      return res;
    },
    getStatusCode: () => statusCode,
    getResponse: () => jsonResponse,
  };
  return { req, res };
}

async function runUpgrade9Verification() {
  console.log('====================================================');
  console.log('🩺 UPGRADE 9 AUTOMATED VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      process.exitCode = 1;
    }
  }

  // -----------------------------------------------------------------
  // 1. ROUTE CONTROLLER VERIFICATION (OSRM & Geodesic Fallback)
  // -----------------------------------------------------------------
  console.log('--- 1. Testing Route Planning Engine ---');
  {
    // Bangalore center to Mysore palace coordinates
    const { req, res } = createMockReqRes(
      {},
      { startLat: '12.9716', startLng: '77.5946', destLat: '12.3051', destLng: '76.6551' }
    );
    await getCampRoute(req, res, (() => {}) as any);
    const body = res.getResponse();

    assert(res.getStatusCode() === 200, 'Route endpoint responds with HTTP 200');
    assert(body.success === true, 'Route response has success: true');
    assert(typeof body.data?.roadDistanceKm === 'number', 'Calculates valid road distance in km');
    assert(typeof body.data?.straightLineDistanceKm === 'number', 'Calculates valid straight-line distance');
    assert(body.data?.roadDistanceKm >= body.data?.straightLineDistanceKm, 'Road distance is >= straight-line distance');
    assert(typeof body.data?.estimatedDurationMinutes === 'number', 'Returns realistic travel time');
    assert(Array.isArray(body.data?.coordinates) && body.data?.coordinates.length > 0, 'Route geometry coordinates returned');
    assert(body.data?.disclaimer !== undefined, 'Epidemiological / routing non-fabrication disclaimer provided');
    console.log(`    ℹ️ Route from Bangalore to Mysore: ${body.data?.roadDistanceKm} km road (${body.data?.straightLineDistanceKm} km direct), ~${body.data?.estimatedDurationMinutes} mins. Provider: ${body.data?.provider}`);
  }

  // Input validation on route parameters
  {
    const { req, res } = createMockReqRes({}, { startLat: 'invalid' });
    await getCampRoute(req, res, (() => {}) as any);
    assert(res.getStatusCode() === 400, 'Rejects invalid or missing geographic coordinates with HTTP 400');
  }

  // -----------------------------------------------------------------
  // 2. MULTI-CAMP CIRCUIT PLANNER (GET /multi-plans)
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing Multi-Camp Mobile Circuit Planner ---');
  {
    const { req, res } = createMockReqRes();
    await getMultiCampPlans(req, res, (() => {}) as any);
    const body = res.getResponse();

    assert(res.getStatusCode() === 200, 'GET /multi-plans returns HTTP 200');
    assert(Array.isArray(body.data), 'Returns list of planned mobile circuits');
    assert(body.data.length > 0, 'Initial seeded circuits exist');
    const firstPlan = body.data[0];
    assert(Array.isArray(firstPlan.stops) && firstPlan.stops.length >= 2, 'Circuit plan has sequential stops');
    assert(typeof firstPlan.totalCircuitDistanceKm === 'number', 'Circuit distance calculated');
    assert(typeof firstPlan.estimatedTransitHours === 'number', 'Circuit transit time calculated');
    console.log(`    ℹ️ Existing Circuit: "${firstPlan.title}" (${firstPlan.targetRegion}) - ${firstPlan.stops.length} stops, ${firstPlan.totalCircuitDistanceKm} km, status: ${firstPlan.status}`);
  }

  // -----------------------------------------------------------------
  // 3. CREATE NEW MULTI-CAMP CIRCUIT (POST /multi-plans)
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Circuit Creation & Conflict Detection ---');
  let createdPlanId = '';
  {
    const newPlanPayload = {
      title: 'North Karnataka Tele-Ophthalmology Circuit',
      targetRegion: 'Hubli-Dharwad & Belgaum',
      notes: 'Testing rapid deployment for seasonal eye screenings',
      stops: [
        {
          name: 'Hubli Urban Vision Checkup',
          location: 'Hubli Community Hall',
          district: 'Dharwad',
          latitude: 15.3647,
          longitude: 75.124,
          plannedDate: '2026-11-10T09:00:00Z',
          targetCapacity: 120,
          services: ['Ophthalmology', 'General Medicine'],
          assignedStaff: ['Dr. Ramesh Rao', 'Nurse Deepa'],
        },
        {
          name: 'Belgaum Rural Outreach Camp',
          location: 'Belgaum ZP School',
          district: 'Belagavi',
          latitude: 15.8497,
          longitude: 74.4977,
          plannedDate: '2026-11-11T09:00:00Z',
          targetCapacity: 150,
          services: ['Ophthalmology', 'Pediatrics'],
          assignedStaff: ['Dr. Ramesh Rao', 'Nurse Deepa'],
        },
      ],
    };

    const { req, res } = createMockReqRes({}, {}, newPlanPayload);
    await createMultiCampPlan(req, res, (() => {}) as any);
    const body = res.getResponse();

    assert(res.getStatusCode() === 201, 'POST /multi-plans creates draft with HTTP 201');
    assert(body.data?.id !== undefined, 'Created plan has an assigned ID');
    assert(body.data?.status === 'DRAFT', 'Created plan starts in DRAFT state');
    assert(body.data?.totalCircuitDistanceKm > 0, 'Sequential road transit distance computed automatically');
    assert(body.data?.estimatedTransitHours > 0, 'Estimated transit hours computed automatically');
    createdPlanId = body.data?.id;
    console.log(`    ℹ️ Drafted Circuit ID ${createdPlanId}: ${body.data?.totalCircuitDistanceKm} km circuit transit, ${body.data?.estimatedTransitHours} hours transit`);
  }

  // -----------------------------------------------------------------
  // 4. APPROVE CIRCUIT (POST /multi-plans/:id/approve)
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Multi-Camp Plan Approval & Stop Promotion ---');
  {
    const initialCampCount = DEMO_CAMPS.length;
    const { req, res } = createMockReqRes({ id: createdPlanId });
    await approveMultiCampPlan(req, res, (() => {}) as any);
    const body = res.getResponse();

    assert(res.getStatusCode() === 200, 'Approve endpoint returns HTTP 200');
    assert(body.data?.status === 'APPROVED', 'Circuit status transitioned to APPROVED');
    assert(DEMO_CAMPS.length === initialCampCount + 2, 'Approved circuit stops successfully promoted into active DEMO_CAMPS');
    console.log(`    ℹ️ Promoted ${body.promotedCampsCount} circuit stops into live system (DEMO_CAMPS total: ${DEMO_CAMPS.length})`);
  }

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed === total) {
    console.log('🎉 UPGRADE 9 VERIFICATION PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runUpgrade9Verification().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
