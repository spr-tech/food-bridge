# FoodBridge

FoodBridge connects food donors in Lagos, Nigeria with community organisations that need surplus food. Bakeries, caterers, restaurants and community kitchens can list available food, while charities and community groups can request and collect it.

The core workflow is: **donor publishes a listing → recipient requests it → donor approves or declines requests → donor records collection.**

Under the capstone brief, the donor or an administrator may update the handover status, and administrators review listings and monitor platform activity. What the current interface actually offers each role is listed under [Current features](#current-features).

FoodBridge coordinates food offers and collections. It has no delivery service, payment system, in-app chat or food-safety certification.

Built for the **TeSA Africa Cohort 6 Software Engineering Capstone**. It is a student project: all demonstration organisations, people and activity are fictional, and no figure in the application represents real food redistributed or a real partnership.

## Live applications

| Application | Link |
|---|---|
| Frontend (production, Vercel) | https://food-bridge-ruby.vercel.app |
| Backend (Render) | https://foodbridge-backend-rg9f.onrender.com |
| API documentation (Swagger) | https://foodbridge-backend-rg9f.onrender.com/swagger-ui/index.html |
| OpenAPI JSON | https://foodbridge-backend-rg9f.onrender.com/v3/api-docs |

The backend runs on Render's free tier, which sleeps when idle: the first request after a pause can take up to about a minute.

## Team

| Engineer | Responsibility |
|---|---|
| Muizz Jamiu | Frontend and interface |
| Adedayo Aboderin | Database and data integrity |
| Esther Ebagua | Backend API and authentication |
| Bibi | Supervisor |

**Repositories:**
- Frontend: https://github.com/spr-tech/food-bridge
- Backend: https://github.com/dayosvoid/foodbridge-backend

## Technology stack

**Frontend:** Vite, React, TypeScript, React Router, Redux Toolkit Query, Formik, Yup and Tailwind CSS, tested with Vitest and Testing Library. Deployed to Vercel through GitHub Actions.

**Backend:** Java, Spring Boot, PostgreSQL and Flyway, hosted on Render. Listing photos are stored in Cloudinary by the backend. The backend lives in its own repository; this repository contains the frontend only.

## Current features

What the frontend implements on `main` (merge commit `c857ea6`, PR #24), checked against the source on 2 November 2026. Every screen calls the deployed backend when `VITE_USE_MOCKS=false` and the simulated data layer otherwise.

| Role | Feature | Notes |
|---|---|---|
| Everyone | Landing page (`/`), sign in (`/sign-in`) | Sign-in uses `POST /api/auth/login`. The role comes from the signed-in account. |
| Everyone signed in | Navigation | The menu link of the section a page belongs to stays highlighted on its sub-pages, e.g. **Your listings** on a donor's listing details and edit page, **Find food** on a recipient's listing details. |
| Donor | Share food (`/listings/new`) | Food name, description (required), category, quantity, unit, pickup area, collection date and time, optional JPG/PNG photo up to 5 MB. |
| Donor | Edit listing (`/listings/:id/edit`) | Only while the listing is **Available**. The Edit button is hidden for other listings, and the edit page explains why if opened directly. An existing photo is kept unless a new one is chosen. |
| Donor | Your listings (`/your-listings`) | Two tabs: **Your listings** (Available and Reserved) and **Listing history** (Collected and Expired), kept in the address (`?view=history`). |
| Donor, administrator | Delete listing | Behind a confirmation, from Your listings and listing details. Disabled, with the reason, on Collected listings. The backend refuses Reserved listings; the dialog then says why. |
| Donor | Listing details with requests panel | Approve (optimistic, rolled back on failure), Decline, and **Mark as collected** on the approved request of a Reserved listing. Approve and Decline only show while the listing is Available with no approved request. A refusal under the backend's daily fairness rule is explained. |
| Donor | Requests (`/requests`) | Temporary layout: the donor's listings that still have pending requests, each with the same requests panel. |
| Recipient | Find food (`/listings`) | Search (food name, description, donor, area and category), category, pickup area and status filters; request from the card or the details page. |
| Recipient | Listing details | Request this food, cancel a genuinely pending request, see the request's status. |
| Recipient | Your requests (`/your-requests`) | **Open requests** (Pending, Approved) and **Request history** (Collected, Declined, Cancelled, Expired). |
| Administrator | Dashboard (`/admin`) | Summary counts from `GET /api/admin/dashboard`. "Expired" and "Food saved (estimate)" show "—": the backend now documents `expiredListings` and `estimatedPortionsSaved`, but the dashboard doesn't use them yet. |
| Administrator | All listings (`/listings`) | Browse with the same filters, and Delete listing on listing details. |

Not implemented: reversing a completed handover, administrator handover or edit controls in the interface, and the S8 tabbed Requests screen. See [Known limitations and remaining work](#known-limitations-and-remaining-work).

## Getting started

### Requirements

- Node.js
- npm
- Git

### Installation

```bash
git clone https://github.com/spr-tech/food-bridge.git
cd food-bridge/frontend
npm ci
```

### Environment configuration

Create a `.env` file inside `frontend/` (`cp .env.example .env`). Two variables are read by `frontend/src/config/env.ts`:

| Variable | Required | Meaning |
|---|---|---|
| `VITE_API_URL` | Yes | API base address. The app throws at start-up if it is missing, even in simulated mode. A trailing `/` is removed. |
| `VITE_USE_MOCKS` | No | Simulated data unless this is exactly `false`. Tests use simulated data by default. |

`.env.example` contains only `VITE_API_URL=http://127.0.0.1:4010`, so a copied `.env` runs on **simulated data** by default.

For the deployed backend:

```env
VITE_API_URL=https://foodbridge-backend-rg9f.onrender.com
VITE_USE_MOCKS=false
```

For simulated data (any `VITE_API_URL` value works, but it must be set):

```env
VITE_API_URL=http://127.0.0.1:4010
VITE_USE_MOCKS=true
```

The production build on Vercel takes its environment variables from the Vercel project settings (`vercel pull` in the pipeline).

### Run locally

```bash
npm run dev
```

### Run checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Last local results (2 November 2026, `main` at `c857ea6`): 354 tests passed across 34 test files; typecheck passed; lint had no errors and one warning (`react-hooks/exhaustive-deps` in `frontend/src/components/ui/textarea.tsx`, line 71, a copied shared component); build passed. Re-run the checks rather than relying on these numbers.

Most tests run against the simulated data layer. Files named `*.live.test.tsx` run the live code paths against a stubbed `fetch` that imitates the backend; none call the deployed backend. There are no automated end-to-end tests against the deployed service.

## Deployment

The frontend is deployed by GitHub Actions (`.github/workflows/frontend.yml`); Vercel's own Git deployments are switched off in `frontend/vercel.json`.

1. **Checks** (`check` job): `npm ci`, lint, typecheck, tests and build. They run on every push that changes `frontend/` or the workflow, and on every pull request into `main`.
2. **Deploy** (`deploy` job): only on a push to `main` (for example, merging a pull request), and only after the checks pass. It runs `vercel pull` (production settings and environment variables, including `VITE_API_URL`), `vercel build --prod` and `vercel deploy --prebuilt --prod`. Deploys queue rather than cancel each other.

A pull request therefore never deploys; production changes when the merge reaches `main`. The pipeline needs the `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` repository secrets.

## Demonstration accounts

The sign-in page shows a different set of demo accounts depending on the data mode (`frontend/src/constants/demoAccounts.ts`).

**Simulated mode** (`VITE_USE_MOCKS` not `false`). Password for all accounts: `FoodBridge-demo-2026`

| Role | Email | Organisation |
|---|---|---|
| Donor | `donor@foodbridge.test` | Mama's Oven, Yaba |
| Recipient | `recipient@foodbridge.test` | Hope Community Kitchen |
| Administrator | `admin@foodbridge.test` | FoodBridge demo admin |

**Live mode** (`VITE_USE_MOCKS=false`). The sign-in page offers the backend's seeded demo accounts (`donor1@demo.foodbridge.invalid`, `recipient1@demo.foodbridge.invalid`, `admin@demo.foodbridge.invalid`), with their passwords defined in `frontend/src/constants/demoAccounts.ts`. Confirm with the service engineers that these accounts still exist on the deployed backend before a demonstration.

All demonstration organisations and people are fictional. Records created through either set of accounts are demonstration activity, not real food redistribution.

## Screenshots

Screenshots of the deployed application will be added here, covering the donor, recipient and administrator interfaces.

## Performance and load testing

Performance and load-test results must be measured against the deployed application and backend.

| Measurement | Result |
|---|---|
| Frontend performance | Pending measurement |
| Core Web Vitals | Pending measurement |
| Backend load test | Pending measurement |
| Saturation point | Pending measurement |

Do not treat local development measurements as deployed performance results.

## Hosting and free-tier verification

Record the hosting providers, plans, resource limits, usage allowances and verification date here.

| Service | Provider/plan | Terms checked on |
|---|---|---|
| Frontend | To be verified | Pending |
| Backend | To be verified | Pending |
| Database | To be verified | Pending |

## Known limitations and remaining work

- Verify live role permissions for listing edits, deletion and handover updates.
- Connect reversal of completed handovers. The backend documents `PATCH /api/handovers/{handoverId}/reverse`, but no response exposes a `handoverId` yet.
- Show the dashboard's Expired and estimated portions-saved figures (now in the documented dashboard response) and a recent activity list (`GET /api/activity` is documented but not used).
- Confirm the actual image upload response structure. The frontend currently accepts the first `http(s)` URL it finds in the response (see `frontend/README.md`).
- Complete end-to-end tests against the deployed service.
- Add measured performance and load-test results.
- **Competing requests after an approval (backend).** The deployed backend does **not** decline the other pending requests when one is approved: they stay `PENDING` in the database and in the API (observed on 2 November 2026). The frontend *displays* them as Declined, to the recipient and in the donor's panel, and leaves them out of the navigation counts, but it does not change the stored status. The backend should store them as `DECLINED`. A second approval on a reserved listing is refused by the backend (409 `LISTING_ALREADY_RESERVED`).
- **Duplicate requests (backend).** The deployed backend accepts a second request from the same recipient on the same listing.
- **Listing deletion rules (backend).** The backend deletes only Available and Expired listings (409 `LISTING_NOT_DELETABLE` otherwise) and keeps a deleted listing as a record (a soft delete). It leaves deleted listings out of a donor's list, so they don't appear in Listing history. Requests on a deleted listing keep their stored status.
- **Pickup areas and search (backend).** Some listings store the pickup area as longer text ("Surulere, Lagos - …"); the backend's area filter matches the exact text only, and its keyword search covers only the food name and description. When an area or search is set, the frontend reads every page and matches area and search itself. A backend fix (clean area values, or a prefix match, and a wider keyword search) would let the server do this again.
- **Daily fairness rule (backend).** The backend refuses a second approval for a recipient on the same Lagos day while another recipient has none (409 `DAILY_DISTRIBUTION_PRIORITY`). Donors can't see which recipients have been served, so the frontend can't tell beforehand; it explains the refusal afterwards.
- **Administrator actions.** The `/listings/:id/edit` route is open to donors only, and the administrator sees no requests panel, so administrators cannot edit listings or record handovers from the interface yet. Administrators can delete listings.
- **Simulated label.** `DATA_IS_SIMULATED` in `frontend/src/services/api.ts` is hard-coded to `true`, so the demonstration line says "(simulated)" even when the app is connected to the live backend.

Only mark a feature complete after implementation and verification.

## Project documentation

Further technical details are maintained separately:

- `frontend/CLAUDE.md` — frontend development instructions.
- `frontend/README.md` — frontend-specific setup, API integration, status rules and troubleshooting.
- `frontend/src/docs/README.md` — how `frontend/src/` is organised.
- `docs/intent/foodbridge.md` — product intent and business rules.
- `docs/spec/foodbridge-interface.md` — every screen, state and message (section 14 records the implementation as of PR #24).
- `docs/design/` — the final visual design.
- `docs/ai-log.md` — AI-assisted development record.
- `docs/decisions.md` — engineering decisions and their rationale.

## Recent changes

Merged into `main`:

- **PR #16, #17 (31 Oct – 1 Nov 2026):** frontend connected to the deployed backend; listing editing and administrator dashboard integration.
- **PR #18 (1 Nov 2026):** listing edit rules (only Available listings can be edited) and a required description.
- **PR #19, #20 (1 Nov 2026):** clearer recipient request and listing statuses (Open requests and Request history, Collected badge); sign-in UI and zoom fixes.
- **PR #21 (1 Nov 2026):** shared recipient status helper (`frontend/src/lib/request-status.ts`), so a recipient sees the status that follows from both the request and the listing.
- **PR #22 (2 Nov 2026):** listing deletion for donors and administrators.
- **PR #23 (2 Nov 2026):** Listing history on Your listings; Edit only on Available listings; the donor's panel hides Approve and Decline once a listing is no longer open for decisions; the section's menu link stays highlighted on listing details; the backend's `DELETED` listing status; the daily fairness refusal explained; navigation counts only include requests still awaiting a decision.
- **PR #24 (2 Nov 2026, merge commit `c857ea6`):** pickup-area normalisation, search across food name, description, donor, area and category, correct combined filters, and Delete disabled on Collected listings for donors and administrators.