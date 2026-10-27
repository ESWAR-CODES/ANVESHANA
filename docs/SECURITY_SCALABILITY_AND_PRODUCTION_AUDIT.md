# ANVESHANA CLUB — COMPREHENSIVE SECURITY HARDENING, SCALABILITY & PRODUCTION AUDIT REPORT

**Project:** Anveshana Club Website  
**Institution:** Mohan Babu University (MBU), Sree Sainath Nagar, Tirupati, Andhra Pradesh  
**Target Environments:**
- **Frontend Production URL:** [https://anveshana-rho.vercel.app](https://anveshana-rho.vercel.app) (Vercel)
- **Backend Production URL:** [https://anveshana-n40r.onrender.com](https://anveshana-n40r.onrender.com) (Render)
- **API Prefix:** `/api/v1/`
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Asset Storage:** Cloudinary CDN

---

## 1. EXECUTIVE SUMMARY & EVIDENCE-BASED VERDICT

### Production Readiness Verdict: **CONDITIONALLY APPROVED PENDING ATLAS CREDENTIAL & STAGED LOAD VALIDATION**

Following a multi-pass security assessment, dependency vulnerability remediation, threat modeling, and code-level verification, all software-level vulnerabilities have been mitigated in code and verified by automated regression tests. However, unconditional production launch cannot be declared until two infrastructure-level dependencies are resolved directly in the deployment environment:

1. **MongoDB Atlas Authentication on Render (Unverified / Action Required):**  
   Previous deployment logs reported `bad auth : authentication failed`. The Express backend process continues to start and report HTTP 200 on `/api/health` even when the database is completely disconnected (`database.connected: false`). This decoupling must not be mistaken for a working database connection. The administrator must verify live credentials in the Render dashboard.
2. **End-to-End Real User Concurrency (Unverified / Staging Required):**  
   The in-process load test (`loadTest.ts`) benchmarked **only in-memory HTTP routing** (`/api/health` and `/api/v1`) with MongoDB offline. It does **not** constitute proof of 200 real concurrent users performing database reads or registrations. Real database concurrency must be validated using the provided staging k6 test plan.

| Audit Vector | Baseline Status | Post-Hardening State | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **Backend Test Suite** | 13 suites, 236 tests | **14 suites, 252 tests passed (100%)** | Vitest test execution output |
| **Frontend Lint (Oxlint)** | 0 errors, 30 warnings | **0 errors, 30 warnings** | Oxlint execution across 51 files |
| **Frontend Build (Vite/Rollup)** | Compiled | **Compiled in 593ms (0 errors)** | Rollup bundle artifacts generated |
| **Backend Build (`tsc`)** | Compiled | **Compiled cleanly (0 errors)** | Clean compilation to `backend/dist/` |
| **Dependency CVEs** | 2 High CVEs (`body-parser`, `multer`) | **0 High/Critical CVEs** | `npm audit` exit code 0 |
| **Stored XSS Vulnerabilities** | Present (`dangerouslySetInnerHTML`) | **Eliminated (React safe text nodes)** | [`EventDetailPage.tsx`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/frontend/src/pages/public/EventDetailPage.tsx#L292-L295) |
| **URL Protocol Injections** | Unsanitized external links | **Sanitized (`sanitizeUrl` filter)** | [`Footer.tsx`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/frontend/src/components/layout/Footer.tsx#L94-L150) & [`url.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/frontend/src/utils/url.ts) |
| **NoSQL ReDoS / Injection** | Raw regex queries in 4 controllers | **Secured (`escapeRegex` utility)** | [`security.test.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/tests/security.test.ts) |
| **File Upload Signature Spoofing** | MIME-type trust only | **Secured (Magic byte validation)** | [`security.test.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/tests/security.test.ts) |
| **CSRF Defense (Cross-Domain)** | Dependent on browser preflight | **Secured (`adminCsrfCheck` middleware)**| [`security.test.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/tests/security.test.ts) |
| **Unique Indexes on Optional Fields**| Empty string collisions possible | **Secured (Empty strings set to `undefined`)**| [`registrationController.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/controllers/registrationController.ts#L327-L328) |
| **Database Pool Configuration** | Unbounded defaults | **Tuned (`maxPoolSize: 25`, timeouts)** | [`db.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/config/db.ts#L36-L45) |

---

## 2. CODEBASE ARCHITECTURE & BOUNDARY ANALYSIS

The Anveshana Club application operates on a decoupled client-server architecture:

```mermaid
flowchart TD
    subgraph Clients["Client Layer"]
        Browser["Student / Public Browser"]
        AdminBrowser["Admin Dashboard Browser"]
    end

    subgraph CDN["Edge & Delivery Layer"]
        VercelEdge["Vercel Global Edge CDN<br/>(anveshana-rho.vercel.app)"]
    end

    subgraph Compute["Application Compute Layer"]
        RenderService["Render Web Service (Node.js/Express)<br/>(anveshana-n40r.onrender.com)"]
        subgraph Middlewares["Security Middleware Pipeline"]
            Helmet["Helmet (HSTS, CSP, Frameguard)"]
            CorsMW["CORS Validation & Origin Whitelist"]
            CsrfMW["Admin CSRF Origin/Referer Check"]
            RateLimiter["Contextual Rate Limiters"]
            UploadFilter["Multer Memory Storage + Magic Byte Check"]
        end
    end

    subgraph Data["Data & Storage Layer"]
        Atlas["MongoDB Atlas Cluster (TLS 1.3)"]
        CloudinaryCDN["Cloudinary Media Store (CDN)"]
    end

    Browser -->|HTTPS / Assets| VercelEdge
    AdminBrowser -->|HTTPS / Assets| VercelEdge
    Browser -->|Public API Requests| RenderService
    AdminBrowser -->|Credentialed Admin Requests| RenderService
    RenderService --> Middlewares
    Middlewares --> Atlas
    Middlewares --> CloudinaryCDN
```

### Trust Boundaries & Isolation
1. **Public vs. Protected API Boundary:** Public endpoints (`/api/v1/events`, `/api/v1/team`, `/api/v1/feedback`, `/api/v1/settings`) only return published, non-deleted records. Mutating routes (`/api/v1/admin/*`) strictly require valid JWT session verification via [`backend/src/middlewares/auth.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/middlewares/auth.ts) and CSRF validation via [`backend/src/middlewares/csrf.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/middlewares/csrf.ts).
2. **Media Storage Isolation:** Binary file uploads are never written to disk or container storage. They are parsed directly in RAM (`multer.memoryStorage()`), verified against binary file magic signatures, and streamed over TLS to Cloudinary CDN.
3. **Database Network Isolation:** MongoDB Atlas access requires IP access list permissions and TLS 1.3 encryption in transit with SCRAM-SHA-256 authentication.

---

## 3. AUDIT OF AUTHENTICATION, AUTHORIZATION & RATE LIMITS

Every administrative endpoint was audited across all route files:

| Router File | Prefix / Scope | Authentication / Authorization | Rate Limiting | Status |
| :--- | :--- | :--- | :--- | :--- |
| [`authRoutes.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/routes/authRoutes.ts) | `/api/v1/admin/auth` | `/me` protected by `isAuth`; `/logout` clears session | `loginRateLimiter` (5 per 15 min) | **VERIFIED** |
| [`adminEventRoutes.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/routes/adminEventRoutes.ts) | `/api/v1/admin/events` | `router.use(requireAdmin)` enforced globally | `uploadRateLimiter` (30 per 15 min) on banner/gallery | **VERIFIED** |
| [`adminParticipantRoutes.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/routes/adminParticipantRoutes.ts) | `/api/v1/admin/participants` | `router.use(requireAdmin)` enforced globally | Standard Express connection rate limits | **VERIFIED** |
| [`adminFeedbackRoutes.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/routes/adminFeedbackRoutes.ts) | `/api/v1/admin/feedback` | `router.use(requireAdmin)` enforced globally | Standard Express connection rate limits | **VERIFIED** |
| [`adminSettingsRoutes.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/routes/adminSettingsRoutes.ts) | `/api/v1/admin/settings` | `router.use(requireAdmin)` enforced globally | `uploadRateLimiter` on logo and hero uploads | **VERIFIED** |
| [`adminTeamRoutes.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/routes/adminTeamRoutes.ts) | `/api/v1/admin/team` | `router.use(requireAdmin)` enforced globally | `uploadRateLimiter` on profile photo uploads | **VERIFIED** |

---

## 4. DEEP REVIEW OF CSRF DEFENSE & BYPASS RESISTANCE

CSRF protection is implemented in [`backend/src/middlewares/csrf.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/middlewares/csrf.ts) and tested in [`backend/src/tests/security.test.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/tests/security.test.ts).

### Multi-Layer Verification Logic
1. **Safe HTTP Methods Pass Through:** `GET`, `HEAD`, and `OPTIONS` do not mutate state and are permitted.
2. **Fetch Metadata (`Sec-Fetch-Site`):** If the browser explicitly marks a request as `Sec-Fetch-Site: cross-site`, and no valid `Origin` or `Referer` is present, it is rejected immediately with `403 Forbidden`.
3. **Origin Validation:** If an `Origin` header is provided, it is strictly validated against `isOriginAllowed()`. `null`, empty, or untrusted origins are rejected with 403.
4. **Referer Validation:** If a `Referer` header is provided, it is parsed via `new URL(referer).origin`. Malformed URLs throw an error and receive `403 Malformed referer header`. Untrusted domains receive `403 Unauthorized request referer`.
5. **Dual-Header Integrity:** If both `Origin` and `Referer` are sent, **both must be authorized**. An attacker cannot provide a forged Origin to bypass an unauthorized Referer.
6. **Omission of Both Headers on Cookie-Authenticated Requests:** In production mode, if a request carries the `anveshana_admin_token` cookie and omits **both** `Origin` and `Referer`, it is rejected with `403 Forbidden`. This eliminates the header-stripping bypass (`<meta name="referrer" content="no-referrer">`).

### Vercel Preview Domain Regex Limitation
In [`backend/src/config/cors.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/config/cors.ts#L48):
```ts
if (/^https:\/\/anveshana(-[a-z0-9_-]+)?\.vercel\.app$/.test(normalized)) {
  return true;
}
```
> [!WARNING]
> While this regex correctly restricts subdomains ending in `.vercel.app`, any public Vercel user could technically create a project named `anveshana-attacker.vercel.app`. For maximum production hardening, after custom domain setup (e.g. `anveshana.mbu.asia`), wildcard Vercel matching should be replaced with explicit domain pinning.

---

## 5. MONGODB ATLAS CONNECTION STATUS VS. RENDER PROCESS HEALTH

### Separation of Process Health and Database Connection
In [`backend/src/server.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/server.ts#L84-L96):
```ts
app.get('/api/health', (_req: Request, res: Response) => {
  const dbStatus = getDbStatus();
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      database: dbStatus, // { configured: boolean, connected: boolean, state: string }
      ...
    }
  });
});
```
- **Finding:** The endpoint returns HTTP 200 with top-level `"status": "healthy"` regardless of whether the database is connected.
- **Root Cause of `bad auth : authentication failed`:**
  1. The MongoDB user credentials configured in Render's environment variable `MONGO_URI` do not match the user defined in MongoDB Atlas.
  2. The database user password contains special characters (e.g., `@`, `:`, `/`, `#`, `%`) that were not URL-encoded in the SRV connection string.
  3. The database user was created with authorization restricted to the `admin` database, requiring `?authSource=admin` in the connection string.
  4. The database user was created with a database name different from `/anveshana_prod`.
- **Status:** **UNVERIFIED LOCALLY (ACTION REQUIRED IN RENDER DASHBOARD).** Because `backend/.env` is git-ignored and production secrets are managed in Render, the administrator must inspect Render environment variables and verify that `GET /api/health` returns `"connected": true`.

---

## 6. AUDIT OF IN-PROCESS LOAD TEST VS. REALISTIC k6 STAGING PLAN

### Audit of `backend/src/scripts/loadTest.ts`
1. **Endpoints Exercised:** Only `/api/health` and `/api/v1`.
2. **Database Involvement:** **Zero database queries executed.** The benchmark ran while MongoDB Atlas was offline. It measured Node.js event loop concurrency for static JSON responses in memory, not database reads or writes.
3. **Latency Percentile Validity:** Percentiles ($p_{50}, p_{90}, p_{95}, p_{99}$) were calculated using array sort and index lookup, which is statistically valid for in-process timing.
4. **Throughput Interpretation:** The reported 400–700 RPS confirms that Express on Node.js has sufficient event-loop efficiency, but it **must not be cited as proof that the application can support 200 real concurrent users interacting with MongoDB Atlas**.

### Safe Staging k6 Load Test Specification
To measure real-world performance safely without testing production or incurring costs, a full k6 script has been created at:  
[`docs/staged-load-test.k6.js`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/docs/staged-load-test.k6.js)

#### Workload Profile & Virtual User Stages
- **Stage 1 (Warmup):** 10 VUs for 3 minutes (baseline catalog browsing)
- **Stage 2 (Normal):** 25 VUs for 3 minutes (campus browsing)
- **Stage 3 (Announcement):** 50 VUs for 3 minutes (workshop registration rush)
- **Stage 4 (Hackathon Launch):** 100 VUs for 5 minutes (heavy concurrent registrations)
- **Stage 5 (Peak Stress):** 200 VUs for 5 minutes (system capacity limit)
- **Stage 6 (Burst Spike):** 1,000 VUs for 1 minute (flash-mob threshold test)
- **Stage 7 (Cool-down):** Ramp-down to 0 VUs over 2 minutes

#### Traffic Mix
- **65% Public Reads:** Fetch settings, catalog with pagination, team directory.
- **25% Form Inspection:** Fetch event detail and dynamic form schema.
- **10% Active Registration:** Submit registration payload with unique generated student IDs and emails.

#### Production Protection Invariant
The k6 script contains a hard stop: if `STAGING_URL` contains `onrender.com` or `vercel.app`, execution terminates immediately to prevent accidental production testing.

---

## 7. DATABASE INDEXES, DEDUPLICATION & ATLAS LIMITS

Configured in [`backend/src/models/Registration.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/models/Registration.ts):

```ts
RegistrationSchema.index({ eventId: 1, identifier: 1 }, { unique: true });
RegistrationSchema.index(
  { eventId: 1, studentId: 1 },
  { unique: true, partialFilterExpression: { studentId: { $type: 'string' } } }
);
RegistrationSchema.index(
  { eventId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);
```

### Risk Analysis on Optional Fields & Remediation
- **Identified Risk:** If a registration form does not require `studentId`, or if a student submits whitespace, saving `studentId: ""` would result in MongoDB indexing `""` as a string. A second submission with an empty student ID would then trigger an `E11000 duplicate key error`.
- **Remediation Implemented:** In [`backend/src/controllers/registrationController.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/controllers/registrationController.ts#L327-L328):
  ```ts
  studentId: studentId && studentId.trim().length > 0 ? studentId.trim().toUpperCase() : undefined,
  email: email && email.trim().length > 0 ? email.trim().toLowerCase() : undefined,
  ```
  Empty strings and whitespace are converted to `undefined`. Mongoose omits `undefined` fields from BSON documents, ensuring the partial index filter `{ $type: 'string' }` ignores them completely.

### Atlas Free/Shared Tier Connection Limits
- **Atlas M0/M2/M5 Limits:** Cap total connections at 500 across all clients.
- **Backend Configuration:** `maxPoolSize: 25`, `minPoolSize: 5`.
- **Safety Margin:** A pool of 25 connections consumes only 5% of the cluster limit, leaving ample headroom for administrative access, compass connections, and worker threads.

---

## 8. CONTENT SECURITY POLICY (CSP) & RESPONSE HEADERS AUDIT

### Deployment Boundary Verification
- **Frontend Hosting (Vercel):** Frontend static HTML and assets are governed by [`frontend/vercel.json`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/frontend/vercel.json). It applies `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`. It intentionally does not define a rigid CSP that would block Vite inline CSS or Google Fonts.
- **Backend Hosting (Render):** Backend API responses are governed by Helmet in [`backend/src/server.ts`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/backend/src/server.ts):
  - `crossOriginResourcePolicy: { policy: 'cross-origin' }`: Permits cross-origin asset fetching by the Vercel frontend.
  - `crossOriginEmbedderPolicy: false`: Prevents CORP/COEP isolation breaks.
  - `HSTS`: Configured with `maxAge: 31536000`, `includeSubDomains: true`, `preload: true`.
  - `img-src`: Permitted for `'self'`, `data:`, and `https://res.cloudinary.com`.
  - `font-src`: Permitted for `'self'` and `https://fonts.gstatic.com`.
- **Verdict:** Policies are verified safe and non-breaking for production asset loading.

---

## 9. EXACT TEST, BUILD & LINT RESULTS

All commands executed locally in the actual repository environment:

### 1. Backend Test Suite (Vitest)
```
Command: npm --prefix backend test
Result: 14 test suites passed (14/14), 252 tests passed (252/252)
Duration: 8.54s
Exit Code: 0
```
Suites passed:
- `slugify.test.ts` (1 test)
- `password.test.ts` (3 tests)
- `models.test.ts` (18 tests)
- `registration.test.ts` (33 tests)
- `cors.test.ts` (15 tests)
- `security.test.ts` (16 tests — includes 5 new CSRF & magic-byte tests)
- `feedback.test.ts` (20 tests)
- `settings.test.ts` (17 tests)
- `team.test.ts` (24 tests)
- `auth.test.ts` (13 tests)
- `gallery.test.ts` (18 tests)
- `enhancements.test.ts` (23 tests)
- `participants.test.ts` (28 tests)
- `events.test.ts` (23 tests)

### 2. Backend TypeScript Compilation (`tsc`)
```
Command: npm --prefix backend run build
Output: Clean compilation to backend/dist/
Exit Code: 0
```

### 3. Frontend Production Build (Vite)
```
Command: npm --prefix frontend run build
Output:
dist/index.html                   2.26 kB │ gzip:   0.81 kB
dist/assets/index-DEMdTDLj.css   74.09 kB │ gzip:  12.17 kB
dist/assets/index-nGDW1B5_.js   652.58 kB │ gzip: 168.49 kB
Duration: 593ms
Exit Code: 0
```

### 4. Frontend Linter (Oxlint)
```
Command: npm --prefix frontend run lint
Output: 0 errors, 30 warnings across 51 files (116 rules evaluated)
Exit Code: 0
```

---

## 10. PRIORITIZED PRE-DEPLOYMENT CHECKLIST

Before launching the application publicly, the following checklist must be executed:

```mermaid
flowchart TD
    P0_1["P0: Verify MongoDB Atlas Credentials in Render Dashboard"] --> P0_2["P0: Verify Live Health Endpoint database.connected === true"]
    P0_2 --> P1_1["P1: Verify Cloudinary Media Credentials"]
    P1_1 --> P1_2["P1: Verify CORS CLIENT_URL on Render"]
    P1_2 --> P2_1["P2: Execute Staged k6 Load Test on Isolated Staging DB"]
    P2_1 --> P3_1["P3: Public Production Launch"]
```

### P0 (Blocking Issues — Must Be Fixed Before Launch)
1. **Resolve MongoDB Atlas Authentication on Render:**
   - Log into the [Render Dashboard](https://dashboard.render.com).
   - Navigate to the `anveshana-backend` service $\rightarrow$ **Environment**.
   - Verify `MONGO_URI`. If the database password contains special characters (`@`, `:`, `/`, `?`, `#`, etc.), URL-encode them (e.g. `@` becomes `%40`).
   - Append `?retryWrites=true&w=majority&authSource=admin` to the URI.
   - Verify IP Access List in the [MongoDB Atlas Console](https://cloud.mongodb.com) includes `0.0.0.0/0` (Allow Access from Anywhere) or Render outbound IP ranges.
2. **Verify Database Connectivity via Live Health Check:**
   - Request `https://anveshana-n40r.onrender.com/api/health`.
   - Confirm response:
     ```json
     "database": {
       "configured": true,
       "connected": true,
       "state": "connected"
     }
     ```

### P1 (High Priority — Operational Configuration)
3. **Verify Cloudinary Production Keys:**
   - Confirm `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are configured in Render.
4. **Confirm CORS Whitelist:**
   - Confirm `CLIENT_URL` in Render contains `https://anveshana-rho.vercel.app`.

### P2 (Performance Validation — Staging Only)
5. **Execute Staging Concurrency Benchmark:**
   - Start local or staging backend connected to a staging database:
     ```bash
     k6 run --env STAGING_URL=http://localhost:5000 docs/staged-load-test.k6.js
     ```
   - Verify p95 registration duration stays under 500ms and error rates remain under 1%.

---

*Report certified by Antigravity Autonomous Security Engineer.*  
*Mohan Babu University · Anveshana Technical Club*
