// frontend/tests/verifyFrontend.ts
/**
 * Frontend Quality Assurance & Utility Verification Suite
 * Tests client-side helpers, routing calculations, offline storage schemas, and date formatters
 */

import {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  getCampStatusColor,
  getAppointmentStatusColor,
} from '../src/utils/helpers';
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

async function runFrontendQA() {
  console.log('========================================================================');
  console.log('🌐 FRONTEND QUALITY ASSURANCE & UNIT VERIFICATION SUITE');
  console.log('========================================================================\n');

  // --------------------------------------------------------------------------
  // 1. DATE AND TIME FORMATTING HELPERS
  // --------------------------------------------------------------------------
  console.log('📅 1. Date & Time Utility Formatting');
  const validIso = '2026-11-15T09:30:00Z';
  const formattedDate = formatDate(validIso);
  assert(formattedDate.includes('2026'), '1.1 formatDate converts ISO string to standard human-readable date');

  const formattedTime = formatTime(validIso);
  assert(formattedTime !== 'Invalid time' && formattedTime.length > 0, '1.2 formatTime extracts valid 12-hour AM/PM time');

  const formattedDateTime = formatDateTime(validIso);
  assert(formattedDateTime.includes('2026') && formattedDateTime.includes(','), '1.3 formatDateTime outputs unified date and timestamp');

  const invalidResult = formatDate('invalid-date-string');
  assert(invalidResult === 'Invalid date', '1.4 formatDate gracefully handles invalid date inputs without crashing');

  const relativeResult = formatRelativeTime(new Date(Date.now() - 3600000));
  assert(relativeResult.includes('hour') || relativeResult.includes('ago'), '1.5 formatRelativeTime formats past intervals correctly');

  // --------------------------------------------------------------------------
  // 2. STATUS BADGE COLOR MAPPINGS
  // --------------------------------------------------------------------------
  console.log('\n🎨 2. Status Color and Badge Mappings');
  const upcomingColor = getCampStatusColor('upcoming');
  assert(upcomingColor.includes('blue'), '2.1 Upcoming camp status maps to blue badge styling');

  const ongoingColor = getCampStatusColor('ongoing');
  assert(ongoingColor.includes('green'), '2.2 Ongoing camp status maps to vibrant green badge styling');

  const completedColor = getCampStatusColor('completed');
  assert(completedColor.includes('gray'), '2.3 Completed camp status maps to neutral gray styling');

  const cancelledColor = getCampStatusColor('cancelled');
  assert(cancelledColor.includes('red'), '2.4 Cancelled camp status maps to alert red styling');

  const checkedInApptColor = getAppointmentStatusColor('checked_in');
  assert(checkedInApptColor.includes('purple'), '2.5 Checked-in appointment status maps to purple badge styling');

  // --------------------------------------------------------------------------
  // 3. HAVERSINE GEODETIC DISTANCE ACCURACY
  // --------------------------------------------------------------------------
  console.log('\n🗺️ 3. Geodetic Distance Calculations (Haversine)');
  // Bangalore to Mysore coordinates
  const bngLat = 12.9716;
  const bngLng = 77.5946;
  const mysLat = 12.2958;
  const mysLng = 76.6394;
  const distanceKm = calculateDirectDistance(bngLat, bngLng, mysLat, mysLng);

  assert(distanceKm >= 120 && distanceKm <= 135, `3.1 Straight-line Bangalore to Mysore calculated accurately (${distanceKm} km, expected ~127 km)`);

  const sameLocationDist = calculateDirectDistance(bngLat, bngLng, bngLat, bngLng);
  assert(sameLocationDist === 0, '3.2 Identical coordinates yield exactly 0.0 km distance');

  // Extreme coordinate boundary check
  const northPoleDist = calculateDirectDistance(0, 0, 90, 0);
  assert(northPoleDist >= 9900 && northPoleDist <= 10100, `3.3 Equator to North Pole matches Earth circumference quarter (${northPoleDist} km)`);

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`📊 FRONTEND QA REPORT: ${passedTests}/${totalTests} TESTS PASSED (${failedTests} FAILED)`);
  console.log('========================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runFrontendQA().catch((err) => {
  console.error('Frontend QA Execution Error:', err);
  process.exit(1);
});
