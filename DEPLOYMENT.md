# Anveshana Club Web Platform — Master Deployment Guide

**Mohan Babu University (MBU)**  
**Version:** 1.0.0 (Production Release)  
**Target Architecture:** Vercel (Frontend SPA) + Render (Backend API) + MongoDB Atlas (Database) + Cloudinary (CDN)

---

## 1. Production Architecture Overview

```
                                  ┌──────────────────────────────────────────────┐
                                  │             MOHAN BABU UNIVERSITY            │
                                  │          Students, Faculty & Visitors        │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                        HTTPS Requests   │
                                                         ▼
                                  ┌──────────────────────────────────────────────┐
                                  │             VERCEL CDN / EDGE                │
                                  │        React 19 + Vite Static SPA            │
                                  │     (https://anveshana-club.vercel.app)      │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                      REST API Calls     │ (HttpOnly Session Cookie)
                                      with Credentials   ▼
                                  ┌──────────────────────────────────────────────┐
                                  │            RENDER WEB SERVICE                │
                                  │         Node.js 22 + Express API             │
                                  │    (https://anveshana-backend.onrender.com)  │
                                  └───────────────┬──────────────┬───────────────┘
                                                  │              │
                           Mongoose TLS Connection│              │ REST API (Upload / Delete)
                                                  ▼              ▼
                    ┌───────────────────────────────┐  ┌─────────────────────────┐
                    │      MONGODB ATLAS CLUSTER    │  │     CLOUDINARY CDN      │
                    │         (anveshana_prod)      │  │   (Images / Galleries)  │
                    └───────────────────────────────┘  └─────────────────────────┘
```

---

## 2. Pre-Deployment Setup

### Step 2.1: MongoDB Atlas Production Cluster
1. Log into your [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. Select or create an **M0 (Free Tier)** or dedicated cluster in **Asia-Pacific (Mumbai - ap-south-1)**.
3. Under **Security $\rightarrow$ Database Access**:
   - Create a production user: `anveshana_prod_user`.
   - Set a strong, 32+ character random password.
   - Assign `Read and write to any database` or restrict to `anveshana_prod`.
4. Under **Security $\rightarrow$ Network Access**:
   - For cloud platforms with dynamic outbound IPs (Render, Railway, Heroku), click **Add IP Address** $\rightarrow$ **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Retrieve your standard SRV connection string:
   ```
   mongodb+srv://anveshana_prod_user:<password>@<cluster-url>/anveshana_prod?retryWrites=true&w=majority
   ```

### Step 2.2: Cloudinary Media Storage
1. Log into [Cloudinary](https://cloudinary.com/).
2. From the Cloudinary Dashboard, note down:
   - **Cloud Name**: (e.g. `anveshana-mbu`)
   - **API Key**: (e.g. `123456789012345`)
   - **API Secret**: (e.g. `abcdefghijklmnopqrstuvwxyz12345`)
3. The backend automatically organizes assets under:
   - `anveshana/banners` (Event promotional posters)
   - `anveshana/gallery` (Event photo archives)
   - `anveshana/team` (Core member portraits)
   - `anveshana/logos` (Club & university emblems)
   - `anveshana/hero` (Custom homepage hero backgrounds)

### Step 2.3: Generate Cryptographic Secrets
Generate a cryptographically secure 64-character hex string for signing JWT administrator session tokens:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 3. Deployment Instructions

### Option A: Recommended Split Deployment (Vercel Frontend + Render Backend)

#### Phase 1: Deploy Backend to Render
1. Log into [Render](https://dashboard.render.com/) and click **New + $\rightarrow$ Web Service**.
2. Connect your GitHub repository (`ANVESHANA.git`).
3. Configure the service settings:
   - **Name**: `anveshana-backend`
   - **Region**: `Singapore` (or nearest region)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Under **Advanced $\rightarrow$ Health Check Path**, enter:
   ```
   /api/health
   ```
5. Under **Environment Variables**, add the following:

   | Variable Key | Recommended Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production security & optimizations |
   | `PORT` | `5000` | (Render auto-allocates if omitted) |
   | `CLIENT_URL` | `https://<your-vercel-app>.vercel.app` | **No trailing slash**. Comma-separated if multiple |
   | `MONGO_URI` | `mongodb+srv://anveshana_prod_user:...` | Atlas production connection string |
   | `JWT_SECRET` | *(64-char hex string generated in 2.3)* | Secret key for admin session cookies |
   | `JWT_EXPIRES_IN` | `2h` | Standard admin session lifetime |
   | `COOKIE_SAME_SITE` | `none` | **Critical for cross-domain cookies** (Vercel + Render) |
   | `COOKIE_SECURE` | `true` | Required when SameSite is None over HTTPS |
   | `CLOUDINARY_CLOUD_NAME` | *(Your Cloudinary Cloud Name)* | Cloudinary configuration |
   | `CLOUDINARY_API_KEY` | *(Your Cloudinary API Key)* | Cloudinary configuration |
   | `CLOUDINARY_API_SECRET` | *(Your Cloudinary API Secret)* | Cloudinary configuration |
   | `ADMIN_DEFAULT_EMAIL` | `lead@anveshana-mbu.in` | First superadmin login email |
   | `ADMIN_DEFAULT_PASSWORD` | `YourStrongInitialPassword123!` | Temporary initial password (min 8 chars) |

6. Click **Create Web Service**. Wait for the build to finish.
7. Test the health endpoint: `https://anveshana-backend.onrender.com/api/health`. It should return HTTP 200 with `database.connected: true`.

---

#### Phase 2: Deploy Frontend to Vercel
1. Log into [Vercel](https://vercel.com/) and click **Add New... $\rightarrow$ Project**.
2. Import the `ANVESHANA` repository.
3. In the project configuration modal:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select `frontend`
   - **Build Command**: `npm run build` (or leave default `tsc -b && vite build`)
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:

   | Variable Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://anveshana-backend.onrender.com` |

   *(Ensure there is no trailing slash in the URL)*
5. Click **Deploy**.
6. Once deployed, copy your public Vercel URL (e.g. `https://anveshana-club.vercel.app`).
7. **Important**: Go back to Render Web Service settings and ensure `CLIENT_URL` matches your exact Vercel URL.

---

### Option B: 1-Click Deployment via Render Blueprint (`render.yaml`)

The repository includes a root [`render.yaml`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/render.yaml) specification that orchestrates both frontend and backend on Render:
1. In Render, select **New + $\rightarrow$ Blueprint**.
2. Select your repository. Render automatically reads [`render.yaml`](file:///c:/Users/eswar/OneDrive/Desktop/Anveshana-Club-Project/render.yaml).
3. Fill in the required secrets (`MONGO_URI`, Cloudinary credentials, `ADMIN_DEFAULT_EMAIL`, `ADMIN_DEFAULT_PASSWORD`).
4. Click **Apply**. Both the backend API and frontend static site will be provisioned automatically.

---

### Option C: Containerized Deployment via Docker (`docker-compose.yml`)

For VPS (Ubuntu / Debian), AWS EC2, or DigitalOcean Droplets:

1. Clone the repository onto the server:
   ```bash
   git clone https://github.com/ESWAR-CODES/ANVESHANA.git
   cd ANVESHANA
   ```
2. Create your environment configuration:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your production credentials
   ```
3. Build and run containers in the background:
   ```bash
   docker compose up -d --build
   ```
4. Verify running containers:
   ```bash
   docker compose ps
   ```
   - Frontend is accessible at `http://<server-ip>:80`
   - Backend API is accessible at `http://<server-ip>:5000`

---

## 4. Initial Database Seeding & Administrator Provisioning

Once the backend service is running and connected to MongoDB Atlas, execute the initial database seeders.

### Seeding from Your Local Machine Targeting Production Atlas:
1. Temporarily configure `MONGO_URI`, `ADMIN_DEFAULT_EMAIL`, and `ADMIN_DEFAULT_PASSWORD` in your local `backend/.env`.
2. Run the seed scripts from the root directory:
   ```bash
   # Provision the first superadmin account
   npm run seed:admin

   # Provision default team categories (Team Leads & Champions) and club settings
   npm run seed
   ```
3. Alternatively, on Render:
   - Navigate to the **Shell** tab in the Render dashboard for `anveshana-backend`.
   - Run:
     ```bash
     npm run seed:admin
     npm run seed
     ```
4. Output should report:
   ```
   [Seed] Successfully created initial administrator account: lead@anveshana-mbu.in
   [Seed] Default ClubSettings initialized.
   [Seed] Completed baseline seeding.
   ```
5. **Security**: Immediately log in at `https://<frontend-url>/admin/login` and verify access. Remove the plaintext password from environment variables if no longer needed.

---

## 5. Post-Deployment Smoke Test Checklist

Execute this verification checklist immediately following deployment:

| # | Check | Procedure | Expected Result |
|:---:|---|---|---|
| 1 | **Backend Liveness** | Visit `https://<backend-url>/api/health` | Returns HTTP 200, `"database": { "connected": true }` |
| 2 | **Root API Info** | Visit `https://<backend-url>/api/v1` | Returns HTTP 200 with API version & status |
| 3 | **CORS Verification** | Inspect Network tab when opening frontend | No CORS errors in browser console |
| 4 | **SPA Direct Routing** | Direct navigate to `/events` and refresh | Page renders cleanly without 404 |
| 5 | **Admin Authentication** | Log into `/admin/login` with seeded credentials | Sets HttpOnly `anveshana_admin_token` cookie, redirects to `/admin/dashboard` |
| 6 | **Protected Session Check** | Reload `/admin/dashboard` | Session persists seamlessly; does not kick back to login |
| 7 | **Event Creation & Cloudinary** | In Admin, create an event with a poster image | Poster uploads to Cloudinary, event saves to Atlas, appears on `/events` |
| 8 | **Form Builder** | Add custom fields to the event in Admin Form Builder | Dynamic fields display properly on public registration modal |
| 9 | **Registration Submission** | Submit a test participant registration | Participant stored in Atlas, capacity increments |
| 10 | **Data Export** | Click **Export CSV** and **Export Excel** in Admin | Downloads clean `.csv` and `.xlsx` files |
| 11 | **Public Gallery** | View event gallery page | Photos render with lightbox modal; retrospective story and winners display |
| 12 | **Admin Logout** | Click Logout in admin header | Cookie cleared; protected endpoints reject with HTTP 401 |

---

## 6. Ongoing Maintenance & Operations

- **Backups**: MongoDB Atlas takes automatic daily snapshots. For manual pre-event backups, execute `mongodump` as documented in `docs/Database Strategy and Handover Guide.md`.
- **Secret Rotation**: To invalidate all active admin sessions at any time, rotate `JWT_SECRET` in the backend environment variables and restart the web service.
- **Log Monitoring**: Real-time logs are accessible in the Render/Vercel dashboard or via `docker compose logs -f backend`.
