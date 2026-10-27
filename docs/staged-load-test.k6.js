/**
 * ==============================================================================
 * ANVESHANA CLUB — STAGED LOAD & STRESS TESTING SPECIFICATION (k6)
 * ==============================================================================
 * Institutional Context: Mohan Babu University (MBU), Tirupati
 * Target System: Isolated Staging Environment (Local Docker / Staging Cluster)
 *
 * SAFETY INVARIANT:
 * This script is strictly forbidden from running against production infrastructure
 * (Render production service or Vercel production deployment).
 * ==============================================================================
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// --- Production Protection Safeguard ---
const BASE_URL = __ENV.STAGING_URL || 'http://localhost:5000';

if (BASE_URL.includes('onrender.com') || BASE_URL.includes('vercel.app')) {
  throw new Error(
    `[SAFETY VIOLATION] Target URL '${BASE_URL}' appears to be a live production domain. ` +
    'Load testing against production is strictly prohibited to avoid downtime and unexpected billing.'
  );
}

// --- Custom Metrics & Telemetry ---
const RegistrationCounter = new Counter('successful_registrations');
const RegistrationErrorRate = new Rate('registration_failures');
const CatalogLatency = new Trend('catalog_fetch_duration', true);
const FormFetchLatency = new Trend('form_schema_duration', true);
const RegistrationLatency = new Trend('registration_post_duration', true);

// --- Workload Stages (10, 25, 50, 100, 200, and 1,000 Virtual Users) ---
export const options = {
  scenarios: {
    staged_scalability_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        // Stage 1: Warm-up & baseline club browsing (10 VUs)
        { duration: '1m', target: 10 },
        { duration: '2m', target: 10 },

        // Stage 2: Normal campus traffic (25 VUs)
        { duration: '1m', target: 25 },
        { duration: '2m', target: 25 },

        // Stage 3: Event announcement / workshop rush (50 VUs)
        { duration: '1m', target: 50 },
        { duration: '2m', target: 50 },

        // Stage 4: University-wide hackathon registration opening (100 VUs)
        { duration: '2m', target: 100 },
        { duration: '3m', target: 100 },

        // Stage 5: Peak concurrency stress (200 VUs)
        { duration: '2m', target: 200 },
        { duration: '3m', target: 200 },

        // Stage 6: DDoS / flash-mob limit test (1,000 VUs burst for 1 minute)
        { duration: '1m', target: 1000 },
        { duration: '1m', target: 1000 },

        // Stage 7: System recovery and cool-down
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    // 95% of catalog requests must complete within 250ms
    catalog_fetch_duration: ['p(95)<250'],
    // 95% of registration POST operations must complete within 500ms
    registration_post_duration: ['p(95)<500'],
    // Overall HTTP failure rate must stay below 1% (excluding deliberate rate-limiting 429s)
    http_req_failed: ['rate<0.01'],
  },
};

// --- Test Data Generation Utilities ---
function randomStudentId() {
  const prefix = '22BU1A';
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${digits}`;
}

function randomEmail() {
  const rand = Math.random().toString(36).substring(2, 8);
  return `student_${rand}@mbu.edu.in`;
}

// --- Main Virtual User Execution Flow ---
export default function () {
  const userType = Math.random();

  // -------------------------------------------------------------------------
  // FLOW 1 (65% of Users): Public Read Browsing (Catalog, Team, Settings)
  // -------------------------------------------------------------------------
  if (userType < 0.65) {
    group('Public Browsing Flow', function () {
      // 1. Fetch club settings & branding
      const resSettings = http.get(`${BASE_URL}/api/v1/settings`);
      check(resSettings, {
        'settings returned 200': (r) => r.status === 200,
      });

      // 2. Fetch published event catalog
      const startCat = Date.now();
      const resEvents = http.get(`${BASE_URL}/api/v1/events?status=upcoming&limit=10`);
      CatalogLatency.add(Date.now() - startCat);

      check(resEvents, {
        'events returned 200': (r) => r.status === 200,
        'events has data array': (r) => {
          try {
            return JSON.parse(r.body).success === true;
          } catch {
            return false;
          }
        },
      });

      // 3. Fetch team directory
      const resTeam = http.get(`${BASE_URL}/api/v1/team`);
      check(resTeam, {
        'team returned 200': (r) => r.status === 200,
      });

      sleep(Math.random() * 3 + 2); // 2-5 second think time
    });
  }

  // -------------------------------------------------------------------------
  // FLOW 2 (25% of Users): Event Inspection & Form Schema Loading
  // -------------------------------------------------------------------------
  else if (userType < 0.90) {
    group('Event Detail & Form Inspection Flow', function () {
      const targetSlug = __ENV.TEST_EVENT_SLUG || 'annual-hackathon-2026';

      // 1. Load Event by Slug
      const resDetail = http.get(`${BASE_URL}/api/v1/events/${targetSlug}`);
      check(resDetail, {
        'event detail returned 200 or 404': (r) => r.status === 200 || r.status === 404,
      });

      // 2. Load Form Schema for Event
      const startForm = Date.now();
      const resForm = http.get(`${BASE_URL}/api/v1/events/${targetSlug}/form`);
      FormFetchLatency.add(Date.now() - startForm);

      check(resForm, {
        'form schema returned status < 500': (r) => r.status < 500,
      });

      sleep(Math.random() * 4 + 1); // 1-5 second think time
    });
  }

  // -------------------------------------------------------------------------
  // FLOW 3 (10% of Users): Active Event Registration Submission
  // -------------------------------------------------------------------------
  else {
    group('Registration Submission Flow', function () {
      const targetIdentifier = __ENV.TEST_EVENT_ID || 'annual-hackathon-2026';
      const studentId = randomStudentId();
      const email = randomEmail();

      const payload = JSON.stringify({
        studentId: studentId,
        email: email,
        answers: {
          fullName: `MBU Student ${studentId}`,
          email: email,
          studentId: studentId,
          department: 'School of Computing',
          yearOfStudy: '3rd Year',
          codingExperience: 'Intermediate',
        },
      });

      const params = {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://anveshana-rho.vercel.app',
        },
      };

      const startReg = Date.now();
      const resReg = http.post(
        `${BASE_URL}/api/v1/events/${targetIdentifier}/register`,
        payload,
        params
      );
      RegistrationLatency.add(Date.now() - startReg);

      const isSuccess = resReg.status === 201;
      const isDuplicate = resReg.status === 409;
      const isRateLimited = resReg.status === 429;

      if (isSuccess) {
        RegistrationCounter.add(1);
        RegistrationErrorRate.add(0);
      } else if (isDuplicate || isRateLimited) {
        // Handled business logic errors (not infrastructure failures)
        RegistrationErrorRate.add(0);
      } else {
        RegistrationErrorRate.add(1);
      }

      check(resReg, {
        'registration response is valid (201, 409, or 429)': (r) =>
          r.status === 201 || r.status === 409 || r.status === 429,
      });

      sleep(Math.random() * 5 + 3);
    });
  }
}
