# Anveshana Club Website — Database Strategy, Operations & Handover Guide

**Document Version:** 1.0  
**Effective Date:** 2026-10-13  
**Audience:** Core Team Technical Leads, Faculty Advisors, and Future Student Administrators  
**Authority:** Supplements [TRD](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/docs/Anveshana_Club_TRD.pdf), [Backend Schema](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/docs/Anveshana%20Backend%20Schema.pdf), and [Spec Audit Corrections](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/docs/Anveshana_Club_Spec_Audit_Corrections.pdf).

---

## 1. Executive Summary & Purpose

The Anveshana Club website at Mohan Babu University (MBU) operates on an environment-isolated MongoDB Atlas architecture. To ensure multi-year continuity across graduating student cohorts, this guide establishes:
1. Strict separation of **Development** and **Production** database environments.
2. Zero-secret source control hygiene.
3. Fail-safe operational behavior preventing silent fallback to mock data.
4. Comprehensive backup, restore, credential rotation, and leadership handover protocols.

---

## 2. Environment Isolation & Database Topology

### 2.1 Multi-Environment Architecture

The application strictly separates database environments using environment-based connection strings:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MONGODB ATLAS CLUSTER                           │
├───────────────────────────────────┬────────────────────────────────────┤
│   DEVELOPMENT DATABASE            │   PRODUCTION DATABASE              │
│   (anveshana_dev)                 │   (anveshana_prod)                 │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Used for local coding & staging │ • Live student registrations       │
│ • Seeded with sample mock records │ • Production event announcements   │
│ • Safe to wipe or reset           │ • Real student feedback records    │
│ • Isolated DB user credentials    │ • Strict IP whitelisting & backups │
└───────────────────────────────────┴────────────────────────────────────┘
```

### 2.2 Connection Configuration via Environment Variables

The application contains **zero hardcoded database URIs**. The active target is determined entirely by `MONGO_URI` in `backend/.env`:

* **Local / Development Testing:**
  ```env
  MONGO_URI=mongodb+srv://<dev_user>:<dev_password>@cluster0.mongodb.net/anveshana_dev?retryWrites=true&w=majority
  ```
* **Production Live Deployment:**
  ```env
  MONGO_URI=mongodb+srv://<prod_user>:<prod_password>@cluster0.mongodb.net/anveshana_prod?retryWrites=true&w=majority
  ```

Swapping databases requires updating the environment variable and restarting the Node server. No source code modifications or rebuilds are ever required.

---

## 3. Fail-Safe Operations & Zero-Mock Policy

### 3.1 Strict Failure Policy (No Mock Data in Persistent Layers)
- **Core Directive:** The application **MUST NEVER** silently substitute in-memory data, mock objects, or hardcoded records when persistent storage is offline.
- If the MongoDB Atlas cluster is unreachable or unconfigured:
  - `POST /api/v1/admin/auth/login` returns **HTTP 503 Service Unavailable**:
    ```json
    {
      "success": false,
      "data": null,
      "error": "Database connection unavailable. MongoDB Atlas configuration is required."
    }
    ```
  - Protected administrative endpoints intercepting valid tokens return **HTTP 503**:
    ```json
    {
      "success": false,
      "data": null,
      "error": "Database connection unavailable. Persistent storage is offline."
    }
    ```
  - Public data endpoints (`/api/v1/events`, `/api/v1/team`) return empty arrays or a clean 503, prompting frontend skeleton/empty state components without leaking fake records.

### 3.2 Liveness & Health Monitoring
- Health status is exposed at `/api/health`:
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "database": {
        "configured": true,
        "connected": true,
        "state": "connected"
      },
      "timestamp": "2026-10-13T12:00:00.000Z",
      "uptime": 3600.5
    },
    "error": null
  }
  ```

---

## 4. Production Setup & IP Whitelisting

### 4.1 Atlas Cluster Setup
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com) using the official Anveshana Club account.
2. Select or create an M0 (Free Tier) cluster in the nearest region (e.g., `ap-south-1` Mumbai).
3. Under **Database Access**, create two distinct database users:
   - `anveshana_dev_user` (Read/Write access restricted to `anveshana_dev`).
   - `anveshana_prod_user` (Read/Write access restricted to `anveshana_prod`).
4. Generate strong 32+ character random passwords for each user.

### 4.2 Network Access (IP Whitelisting)
- **Local Development:** Add your current IP or office IP to Atlas Network Access with an optional expiration time.
- **Production (Render / Cloud Hosting):**
  - If using Render Web Services without static outbound IPs, configure Atlas Network Access to allow traffic from anywhere (`0.0.0.0/0`) with strict database user authentication and SCRAM-SHA-256 password hashing.
  - If hosting on a VPS or dedicated provider with static IPs, restrict Network Access strictly to the server's public IP.

---

## 5. Administrator Provisioning Protocol

### 5.1 No Public Admin Registration
Public account creation is strictly disabled. The `/admin` route is unlinked in the public UI.

### 5.2 Seeding the First Administrator
The initial superadmin account is provisioned exclusively via the CLI:

1. Configure temporary credentials in your local `backend/.env`:
   ```env
   ADMIN_DEFAULT_EMAIL=lead@anveshana-mbu.in
   ADMIN_DEFAULT_PASSWORD=StrongTemporaryPassword123!
   ```
2. Execute the seeder:
   ```bash
   npm --prefix backend run seed:admin
   ```
3. The script:
   - Connects to the configured database.
   - Verifies if the email already exists to prevent duplicate accounts.
   - Hashes the password using `bcryptjs` with 12 salt rounds.
   - Creates the account with `role: 'superadmin'` and `isActive: true`.
   - Never logs or exposes the password in the terminal.
4. Immediately log into `/admin/login` and remove the plain-text password from `backend/.env`.

---

## 6. Backup, Archival & Disaster Recovery

### 6.1 Automated Atlas Cloud Snapshots
- Enable automated daily snapshots on the MongoDB Atlas cluster.
- Atlas maintains continuous point-in-time restores (PITR) on supported tiers.

### 6.2 Manual CLI Backups (`mongodump`)
Before every major club event, semester transition, or database migration, the technical lead must execute a full export:

```bash
# Export production database to a timestamped archive directory
mongodump --uri="mongodb+srv://<prod_user>:<prod_password>@cluster0.mongodb.net/anveshana_prod" --out="./backups/backup-$(date +%Y%m%d)"
```

### 6.3 Database Restoration (`mongorestore`)
In the event of accidental data corruption or disaster recovery:

```bash
# Restore specific collection or full database
mongorestore --uri="mongodb+srv://<prod_user>:<prod_password>@cluster0.mongodb.net/anveshana_prod" --drop "./backups/backup-20261013/anveshana_prod"
```

### 6.4 Soft-Archival Data Retention
- Deleting an event with existing registrations sets `isArchived: true` / `isDeleted: true`.
- Historical participant records and dynamic form answer snapshots remain queryable for club audits and NAAC/AICTE accreditation reports.

---

## 7. Credential Rotation Procedures

Rotate secrets annually or immediately upon any member departure:

### 7.1 Database Password Rotation
1. In Atlas **Database Access**, generate a new password for `anveshana_prod_user`.
2. Update `MONGO_URI` in the production hosting dashboard (e.g. Render Environment Variables).
3. Trigger a redeploy of the web service.
4. Verify `/api/health` reports `database.connected: true`.

### 7.2 JWT Secret Rotation
1. Generate a new cryptographically random 64-character secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update `JWT_SECRET` in production environment variables.
3. Restart backend service. All existing sessions are cleanly invalidated, requiring administrators to re-authenticate.

### 7.3 Cloudinary Key Rotation
1. In the Cloudinary Console under **Security**, generate a new API Secret.
2. Update `CLOUDINARY_API_SECRET` in backend environment variables.
3. Test an image upload via the admin interface to confirm asset persistence.

---

## 8. Annual Cohort Handover Checklist

Two weeks before the graduating core team steps down, complete the following transition:

| Step | Action | Responsible Lead |
|:---:|---|---|
| **1** | Export a full `mongodump` of `anveshana_prod` and archive to secure university drive. | Outgoing Tech Lead |
| **2** | Add incoming Technical Lead and President as Project Owners in MongoDB Atlas. | Outgoing President |
| **3** | Add incoming team to Render (Backend) and Vercel (Frontend) team workspaces. | Outgoing Tech Lead |
| **4** | Add incoming leads to Cloudinary account management. | Outgoing Design Lead |
| **5** | Suspend graduating student admin accounts by setting `isActive: false` in the database. | Outgoing Superadmin |
| **6** | Provision new incoming lead accounts using `npm --prefix backend run seed:admin`. | Incoming Tech Lead |
| **7** | Rotate all production secrets (`MONGO_URI` user password, `JWT_SECRET`, Cloudinary secret). | Incoming Tech Lead |
| **8** | Verify live deployment `/api/health` and perform a test event creation walkthrough. | Joint Committee |
