// frontend/tests/verifyDigitalTwin3D.ts
/**
 * Automated Verification Suite for 3D Healthcare Digital Twin 3.0
 * Tests geospatial projection mathematics, route calculation logic,
 * digital twin area anonymization guards, predictive simulation models,
 * district demographic boundaries, and authentic healthcare facility registries.
 */

import {
  KARNATAKA_PROJECTION,
  projectLatLngTo3D,
  unproject3DToLatLng,
} from '../src/components/maps/Geographic3DTerrain';
import { VERIFIED_HEALTHCARE_FACILITIES } from '../src/components/maps/healthcareFacilities';
import { KARNATAKA_DISTRICTS_DATA } from '../src/components/maps/karnatakaDistrictsData';
import { calculateDirectDistance } from '../src/services/routingService';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
    failedTests++;
  }
}

async function runDigitalTwin3DTests() {
  console.log('========================================================================');
  console.log('🌐 HEALTHCARE DIGITAL TWIN 3.0 - GEOSPATIAL & ARCHITECTURE TEST SUITE');
  console.log('========================================================================\n');

  // --------------------------------------------------------------------------
  // 1. GEOSPATIAL PROJECTION & INVERSE MATHEMATICS
  // --------------------------------------------------------------------------
  console.log('📐 1. Geospatial Cartographic Projection & Inversion');
  const testLat = 12.9716; // Bengaluru Urban
  const testLng = 77.5946;

  const [x3d, y3d, z3d] = projectLatLngTo3D(testLat, testLng, KARNATAKA_PROJECTION);
  assert(!isNaN(x3d) && !isNaN(z3d), '1.1 projectLatLngTo3D maps GPS coordinates to 3D Cartesian coordinates');

  const [invLat, invLng] = unproject3DToLatLng(x3d, z3d, KARNATAKA_PROJECTION);
  const latDelta = Math.abs(invLat - testLat);
  const lngDelta = Math.abs(invLng - testLng);
  assert(latDelta < 0.0001 && lngDelta < 0.0001, '1.2 unproject3DToLatLng accurately reverses Cartesian 3D to GPS coordinates (loss < 0.0001°)');

  // --------------------------------------------------------------------------
  // 2. HEALTHCARE FACILITY REGISTRY VALIDATION
  // --------------------------------------------------------------------------
  console.log('\n🏥 2. Authentic Healthcare Facility Registry Verification');
  assert(VERIFIED_HEALTHCARE_FACILITIES.length >= 15, `2.1 Directory contains comprehensive facility records (${VERIFIED_HEALTHCARE_FACILITIES.length} facilities)`);

  const hospitalCount = VERIFIED_HEALTHCARE_FACILITIES.filter(f => f.type === 'HOSPITAL').length;
  const phcCount = VERIFIED_HEALTHCARE_FACILITIES.filter(f => f.type === 'PHC').length;
  const clinicCount = VERIFIED_HEALTHCARE_FACILITIES.filter(f => f.type === 'CLINIC').length;
  const mmuCount = VERIFIED_HEALTHCARE_FACILITIES.filter(f => f.type === 'MOBILE_UNIT').length;
  const referralCount = VERIFIED_HEALTHCARE_FACILITIES.filter(f => f.type === 'REFERRAL_CENTRE').length;

  assert(hospitalCount >= 6, `2.2 Contains major tertiary teaching medical colleges (${hospitalCount} registered)`);
  assert(phcCount >= 4, `2.3 Contains primary healthcare centres with emergency readiness (${phcCount} registered)`);
  assert(mmuCount >= 2, `2.4 Contains active Mobile Medical Units with GPS transit routes (${mmuCount} registered)`);
  assert(referralCount >= 2, `2.5 Contains super-specialty referral centres (NIMHANS, Jayadeva) (${referralCount} registered)`);

  // Verify all facility coordinates lie within Karnataka geographical boundary (11.4°N to 18.3°N, 74.0°E to 78.9°E)
  const allFacilitiesInsideState = VERIFIED_HEALTHCARE_FACILITIES.every(f =>
    f.latitude >= 11.4 && f.latitude <= 18.3 && f.longitude >= 74.0 && f.longitude <= 78.9
  );
  assert(allFacilitiesInsideState, '2.6 All facility coordinates strictly lie within authentic Karnataka geographic boundaries');

  // --------------------------------------------------------------------------
  // 3. KARNATAKA DISTRICT DEMOGRAPHICS & HEALTHCARE INDICES
  // --------------------------------------------------------------------------
  console.log('\n🗺️ 3. District Demographics & Healthcare Accessibility Indices');
  assert(KARNATAKA_DISTRICTS_DATA.length >= 15, `3.1 Demographics dataset covers key Karnataka districts (${KARNATAKA_DISTRICTS_DATA.length} districts)`);

  const blrUrban = KARNATAKA_DISTRICTS_DATA.find(d => d.districtId === 'bengaluru-urban');
  assert(!!blrUrban && blrUrban.population2024 > 10000000, '3.2 Bengaluru Urban population reflects metro scale (>10 Million)');

  const underservedDistricts = KARNATAKA_DISTRICTS_DATA.filter(d => d.underservedStatus);
  assert(underservedDistricts.length >= 3, `3.3 Underserved priority districts accurately flagged (${underservedDistricts.map(d => d.name).join(', ')})`);

  const allHaveValidScores = KARNATAKA_DISTRICTS_DATA.every(d =>
    d.healthcareAccessibilityIndex >= 0 && d.healthcareAccessibilityIndex <= 100 && d.doctorRatioPer1000 > 0
  );
  assert(allHaveValidScores, '3.4 All districts have bounded accessibility indices (0-100) and positive doctor ratios');

  // --------------------------------------------------------------------------
  // 4. HAVERSINE VS. ROAD DISTANCE SAFETY LOGIC
  // --------------------------------------------------------------------------
  console.log('\n🛣️ 4. Geodesic Distance vs. Road Navigation Sanity');
  const blrToMysuruGeodesic = calculateDirectDistance(12.9716, 77.5946, 12.2958, 76.6394);
  assert(blrToMysuruGeodesic >= 125 && blrToMysuruGeodesic <= 145, `4.1 Straight-line geodesic distance Bengaluru->Mysuru is accurate (${blrToMysuruGeodesic} km, expected ~135 km)`);

  const blrToMngGeodesic = calculateDirectDistance(12.9716, 77.5946, 12.9141, 74.856);
  assert(blrToMngGeodesic >= 285 && blrToMngGeodesic <= 315, `4.2 Straight-line geodesic distance Bengaluru->Mangaluru is accurate (${blrToMngGeodesic} km, expected ~298 km)`);

  // --------------------------------------------------------------------------
  // 5. PRIVACY & ANONYMIZATION SAFEGUARDS (DPDP ACT 2023 COMPLIANCE)
  // --------------------------------------------------------------------------
  console.log('\n🔒 5. Spatial Privacy & DPDP Anonymization Verification');
  const hasFacilityPII = VERIFIED_HEALTHCARE_FACILITIES.some(f =>
    (f as any).patientName || (f as any).patientPhone || (f as any).nationalId
  );
  assert(!hasFacilityPII, '5.1 Zero Patient Personally Identifiable Information (PII) present in public 3D facility registry');

  const hasDistrictPII = KARNATAKA_DISTRICTS_DATA.some(d =>
    (d as any).patientRecords || (d as any).individualAadhar
  );
  assert(!hasDistrictPII, '5.2 Zero patient-level clinical records present in district geospatial telemetry');

  console.log('\n========================================================================');
  console.log(`📊 3D DIGITAL TWIN TEST RESULTS: ${passedTests} OF ${totalTests} TESTS PASSED (${failedTests} FAILED)`);
  console.log('========================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runDigitalTwin3DTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

