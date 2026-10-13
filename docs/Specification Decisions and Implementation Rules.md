# Anveshana Club Website — Specification Decisions & Implementation Rules

**Document Version:** 1.0  
**Status:** Approved Baseline  
**Date:** 2026-10-13  
**Authority:** Supplements and refines original specifications ([PRD](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/docs/Anveshana_Club_PRD.pdf), [TRD](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/docs/Anveshana_Club_TRD.pdf), [App Flow](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/docs/Anveshana_App_Flow.pdf), [UI/UX Brief](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/docs/Anveshana%20UI_UX%20Design%20Brief.pdf), [Backend Schema](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/docs/Anveshana%20Backend%20Schema.pdf), [Implementation Plan](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/docs/Anveshana%20Implementation%20Plan.pdf), and [Change Request](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/docs/Change%20Request_%20Dynamic%20Registration.pdf)).

---

## 1. Approved Decisions & Architectural Directives

The following architectural resolutions have been formally approved and serve as the binding contract for engineering implementation:

### Decision 1: Native Event Registration & Dynamic Form Builder
- **Directive:** The native dynamic form builder and event registration mechanism defined in `Change Request_ Dynamic Registration.pdf` completely supersedes all previous references to external Google Forms and WhatsApp links.
- **Frontend Behavior:** The public Event Details page (`/events/:slug`) dynamically renders the event's form schema when status is `Open`. No external redirect occurs.
- **Backend Behavior:** 
  - Dynamic schema generation stored on the `Events` document (`formSchema`, `formVersion`).
  - Form edits increment `formVersion`, snapshotting past submissions against the version they were submitted with.
  - Submissions are validated server-side against the event schema snapshot.
  - Capacity locks and deduplication rules (Student ID with fallback to Email) are enforced atomically before persistence.
  - Generates a unique reference ID upon confirmation.

### Decision 2: Data Retention & Soft-Archival Policy
- **Directive:** To protect participant records and ensure student registration history is preserved, hard deletion of events that contain registrations is prohibited.
- **Rules:**
  - Events with **zero registrations** may be hard-deleted, triggering Cloudinary image cleanup.
  - Events with **existing registrations** must be softly archived (`isArchived: true` or `isPublished: false`, status updated to `completed`/`archived`).
  - Soft-archived events remain visible in the Admin Dashboard for auditing, participant export, and historical review, but are hidden or read-only on the public catalog.

### Decision 3: Standardized API Route Structure
- **Directive:** All backend endpoints are standardized under the unified `/api/v1/` prefix.
- **Public Endpoints:**
  - `GET /api/v1/events` (paginated, filterable by status/date)
  - `GET /api/v1/events/:slug` (event details)
  - `GET /api/v1/events/:identifier/form` (fetches form schema; accepts `:slug` or `:id`)
  - `POST /api/v1/events/:identifier/register` (submits registration payload)
  - `GET /api/v1/events/:slug/gallery` (event image array)
  - `GET /api/v1/team` (active categories and members)
  - `POST /api/v1/feedback` (submit rating and feedback; rate-limited)
  - `GET /api/v1/settings` (club public contact and meta info)
- **Admin Endpoints (`/api/v1/admin/*`, protected by `isAuth` / `requireAdmin`):**
  - `POST /api/v1/admin/auth/login`
  - `POST /api/v1/admin/auth/logout`
  - `GET /api/v1/admin/auth/me`
  - `GET|POST /api/v1/admin/events`
  - `PUT|DELETE /api/v1/admin/events/:id`
  - `PUT /api/v1/admin/events/:id/form`
  - `GET /api/v1/admin/events/:id/registrations`
  - `GET /api/v1/admin/events/:id/export`
  - `PUT /api/v1/admin/events/:id/gallery`
  - `GET|POST|PUT|DELETE /api/v1/admin/team/categories`
  - `GET|POST|PUT|DELETE /api/v1/admin/team/members`
  - `GET|DELETE /api/v1/admin/feedback`
  - `PUT /api/v1/admin/settings`

### Decision 4: Dynamic Team Categories with Seeded Baseline
- **Directive:** Implement a dedicated `TeamCategories` MongoDB collection rather than a static TypeScript enum.
- **Seeded Categories:** The database seeder will initialize the 7 mandatory categories in the exact order specified by PRD Section 6/10.3:
  1. `Team Leads`
  2. `Infrastructure`
  3. `Design`
  4. `Data Management`
  5. `Social Media`
  6. `Public Relations (PR)`
  7. `Technical`
- **Flexibility:** Core team members reference category IDs, allowing future category management and custom display ordering via the admin dashboard without schema migrations.

### Decision 5: Tiered Media Upload Limits
- **Directive:** Multer and frontend file validators enforce a tiered maximum upload size:
  - **2 MB** for Event Banners and Team Member Profile photos.
  - Up to **5 MB** for Event Gallery photographs (completed event retrospectives).
- **Format Restrictions:** Exclusively `image/jpeg`, `image/png`, and `image/webp`.
- **Optimization:** Cloudinary downscaling to max width 1920px with `f_auto,q_auto`.

### Decision 6: Dual CSV & XLSX Export with Formula Injection Protection
- **Directive:** Participant exports support both `.csv` and `.xlsx` formats.
- **Spreadsheet Security:** Both exporters must sanitize all user-supplied text fields to prevent CSV/Spreadsheet Formula Injection. Any string beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` must be prefixed with a single apostrophe (`'`).
- **Filename convention:** `[Event_Slug]_Participants_[Date].[csv|xlsx]`.

### Decision 7: Monorepo Folder Structure
- **Directive:** Structure the repository with `frontend/` and `backend/` top-level directories:
  - `frontend/` — React 18+ (Vite) + TypeScript + Tailwind CSS.
  - `backend/` — Node.js + Express + TypeScript.
  - Root directory manages shared tooling, environment templates, and documentation.

---

## 2. Core Implementation Rules & Non-Negotiables

1. **Zero Hardcoded Secrets:**
   - All database URIs, JWT secrets, and Cloudinary keys must be loaded via `process.env`.
   - Never commit `.env` files. Maintain complete `.env.example` templates in both workspaces.
2. **Standard API Response Envelope:**
   - All JSON responses must follow:
     ```json
     {
       "success": true,
       "data": {},
       "error": null,
       "meta": {}
     }
     ```
3. **Authentication Security:**
   - Admin JWT tokens stored exclusively in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
   - Tokens are never exposed in response bodies.
   - Passwords hashed using `bcrypt` (work factor 10+).
   - Initial administrator provisioned strictly via environment variables or startup seeder script.
4. **Design Token Integrity:**
   - Primary Navy: `#0B132B`
   - Secondary Navy: `#1C2541`
   - Golden-Orange: `#F5A623`
   - Warm Ivory: `#FDFBF7`
   - Surface Light: `#F3F4F6`
   - Text Primary: `#0F172A`
   - Typography: `Playfair Display` for display/headings, `Figtree`/`Inter` for UI/body text.
5. **No Intermediate Authentication for Students:**
   - Public access requires no login, no accounts, and no authentication walls.
6. **Immutable Specifications:**
   - The 7 PDF specifications in `docs/` remain immutable baseline references. This document records the authoritative execution rules.

---

## 3. Remaining Decisions Requiring Future Approval

Before moving into Phases 2 and beyond, the following minor operational decisions are flagged for review:

1. **Root Workspace Orchestration:**
   - Option A: Root `npm` workspaces with a single `package.json` and `npm run dev` running both frontend and backend concurrently via `concurrently`. (Recommended)
   - Option B: Separate commands run independently inside `/frontend` and `/backend`.
2. **Default Admin Bootstrap Mechanism:**
   - Option A: Automatic startup check in `backend/src/server.ts` that creates the default admin from `ADMIN_DEFAULT_EMAIL` and `ADMIN_DEFAULT_PASSWORD` in `.env` if no admin exists. (Recommended)
   - Option B: A manual CLI seeder command (`npm run seed:admin`).
3. **Brand Assets & Hero Imagery:**
   - The `references/` directory is currently empty. We will build with high-quality CSS gradient overlays and royalty-free campus aesthetics until official Mohan Babu University / Anveshana Club high-res photography and logos are placed into `references/`.
