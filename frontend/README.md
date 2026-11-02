# FoodBridge — Frontend

The FoodBridge frontend is the user interface for a surplus-food sharing platform connecting food donors with recipient organisations in Lagos, Nigeria.

Donors can publish available food, recipients can browse and request listings, donors approve or decline requests, and the donor records the collection. The capstone brief also allows administrators to update the handover status; the current interface does not yet give administrators that control (see [Known limitations](#known-limitations)).

All demonstration organisations, people and activity are fictional. Nothing in the app represents real food redistributed.

## Live deployments

| Environment | URL | Purpose |
|---|---|---|
| Production (Vercel) | https://food-bridge-ruby.vercel.app | Main deployment, published by GitHub Actions when a change reaches `main` |
| Backup (Qocent), **unverified** | https://food-bridge--elmirvhe3.qocent.app/ | Not checked: whether it is current, and whether it updates from GitHub, are unconfirmed. Don't rely on it for a demonstration. |

The Vercel deployment is the production deployment. See [GitHub Actions and deployment](#github-actions-and-deployment). Keep the workflow and its Vercel configuration in place.

## Backend

- **Backend repository:** https://github.com/dayosvoid/foodbridge-backend
- **Live API:** https://foodbridge-backend-rg9f.onrender.com
- **API documentation:** https://foodbridge-backend-rg9f.onrender.com/swagger-ui/index.html
- **OpenAPI JSON:** https://foodbridge-backend-rg9f.onrender.com/v3/api-docs

The frontend communicates with the backend through the service files in `src/services/`.

## Technology stack

- React
- TypeScript
- Vite
- Redux Toolkit and RTK Query
- React Router
- Formik and Yup (forms and validation)
- Tailwind CSS, with design tokens in `src/styles/tokens.css`
- UI components copied from the shared component set (`src/components/ui/`)
- Vitest and Testing Library for tests

## Project structure

```text
frontend/
├── public/              # favicon and mock listing photos
├── src/
│   ├── app/             # Routes, router, store, providers and the session
│   ├── assets/          # Logo icons and landing photos
│   ├── components/      # ui/ (shared set), form/, common/, layout/
│   ├── config/          # env.ts: VITE_API_URL and VITE_USE_MOCKS
│   ├── constants/       # Routes, roles, statuses, listing options, demo accounts
│   ├── contexts/        # Empty on purpose
│   ├── docs/            # README.md explaining src/
│   ├── hooks/           # Reusable application hooks
│   ├── lib/             # Small helpers: formatting, deadlines, photos, request status
│   ├── mocks/           # Simulated data layer (used when mocks are on, and by tests)
│   ├── pages/           # Thin route files
│   ├── schema/          # Yup schemas
│   ├── sections/        # Screen sections, one folder per screen
│   ├── services/        # RTK Query endpoints and backend mappers
│   ├── styles/          # Tokens, layout and landing styles
│   ├── test/            # Vitest setup and render helpers
│   ├── types/           # TypeScript types
│   └── main.tsx
├── .env.example
├── package.json
├── vercel.json          # SPA rewrite; Vercel Git deploys switched off
└── vite.config.ts
```

## Getting started

Run these commands from the `frontend` directory:

```bash
npm install
```

Create your local environment file from the example:

```bash
cp .env.example .env
```

For live backend integration, configure the environment variables as follows:

```env
VITE_API_URL=https://foodbridge-backend-rg9f.onrender.com
VITE_USE_MOCKS=false
```

For local mock-data development, set `VITE_USE_MOCKS=true`.

How `src/config/env.ts` reads these:

- `VITE_API_URL` is required in every mode. If it is missing the app throws at start-up with "VITE_API_URL is not set…".
- Mocks are **on** unless `VITE_USE_MOCKS` is exactly `false`. The unchanged `.env.example` (which only sets `VITE_API_URL=http://127.0.0.1:4010`) therefore runs on simulated data.
- Tests run on simulated data by default (`MODE === 'test'`); `*.live.test.tsx` files switch this off and stub `fetch` instead.

Start the development server:

```bash
npm run dev
```

## Available scripts

Run these from `frontend/`:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run tests |
| `npm run build` | Build the production frontend |

Before pushing changes, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Main user workflows

### Donor
1. Sign in with a donor account. Donors land on Your listings (`/your-listings`).
2. Publish a surplus-food listing (`/listings/new`).
3. View and manage the donor's listings. Your listings has two tabs: **Your listings** (Available and Reserved) and **Listing history** (Collected and Expired), kept in the address as `?view=history`. A listing can be edited (`/listings/:id/edit`) only while it is **Available**: the Edit button only appears then, and the edit page explains why if opened directly.
4. Delete a listing (with confirmation) from its row or its details page. Delete is disabled, with the reason, on Collected listings; the backend refuses Reserved ones and the dialog says why.
5. Review recipient requests on the listing's details page, or on Requests (`/requests`), which currently lists every listing with pending requests and its requests panel.
6. Approve or decline a request. Approving asks for confirmation, updates the panel straight away (optimistic update) and rolls back if the service refuses. Approve and Decline show only while the listing is Available with no approved request.
7. Record the handover with **Mark as collected** on the approved request of a Reserved listing (`PATCH /api/requests/{requestId}/collected`). The listing then shows Collected and moves to Listing history.

### Recipient
1. Sign in with a recipient account. Recipients land on Find food (`/listings`).
2. Browse available food listings.
3. Search (food name, description, donor, area and category) and filter by category, pickup area and status. Filters combine and are kept in the address.
4. Open a listing to view its details.
5. Submit a request, from the listing card or the details page.
6. Track requests on Your requests (`/your-requests`), split into **Open requests** and **Request history**, and cancel a request while it is genuinely pending.

### Administrator
Administrators land on the Dashboard (`/admin`), which shows summary counts from the backend, and can browse All listings (`/listings`) without request buttons, and delete a listing from its details page (disabled on Collected listings). Under the capstone brief administrators monitor activity and may edit listings and update handover status; the interface does not offer those administrator actions yet. Donors make the decision to approve or decline recipient requests.

## Business rules shown in the interface

- A listing can be edited only while it is Available (owning donor; the edit page also allows an administrator, but the route itself is donor-only).
- Listing form: food name 3–80 characters; **description required**, up to 500 characters; category, quantity (whole number, 1 or more), unit, pickup area, collection date and time required; the combined deadline must be later than now; optional JPG or PNG photo up to 5 MB.
- A listing has at most one approved request. The donor's panel shows the approved request first.
- A recipient can cancel only their own request, and only while it is genuinely pending (see the status table below).
- Expired listings accept no requests.
- Delete: owning donor or administrator; disabled on Collected listings (`deleteBlockedReason` in `src/lib/listing-permissions.ts`). The backend deletes only Available and Expired listings (409 `LISTING_NOT_DELETABLE` otherwise) and keeps them as a record, so the dialog says "taken off FoodBridge", not "deleted for good".
- Daily fairness rule (backend): a recipient who already has an approval today (Lagos time) can't be approved again while another recipient has none (409 `DAILY_DISTRIBUTION_PRIORITY`). The donor's panel explains the refusal and disables Approve for that organisation for the rest of the visit; Decline stays available.

The backend is the authority for every rule. The frontend checks are for clarity and speed, not security.

## Request status display

The backend stores a status on each request (`PENDING`, `APPROVED`, `DECLINED`, `CANCELLED`, `EXPIRED`) and on each listing (`AVAILABLE`, `RESERVED`, `COLLECTED`, `EXPIRED`, `DELETED`; `REVERSED` is read as Available). What a recipient sees is derived from both by `getRecipientRequestStatus` in `src/lib/request-status.ts`, used by `src/sections/listing-details/RecipientAction.tsx`, `src/sections/your-requests/RequestItem.tsx` and `src/sections/your-requests/YourRequests.tsx`.

| Stored request | Listing | Recipient sees | Where on Your requests | Can cancel? |
|---|---|---|---|---|
| Pending | Available | Pending | Open requests | Yes |
| Pending | Reserved | Declined ("Another organisation's request was approved…" on listing details) | Request history | No |
| Pending | Collected | Declined | Request history | No |
| Pending | Expired | Expired | Request history | No |
| Approved | Reserved | Approved, with pickup details | Open requests | No |
| Approved | Collected | Collected (listing badge) | Request history | No |
| Declined, Cancelled, Expired | any | As stored | Request history | No |

The helper itself returns the request status (`APPROVED`); the Collected badge for an approved request on a collected listing is chosen by the components.

**This is a display fallback only.** It does not change the stored status of the losing request. The deployed backend leaves competing requests `PENDING` after another is approved (observed 2 November 2026); it should store them as `DECLINED`. The simulated data layer (`src/mocks/db.ts`) does store them as `DECLINED`.

A listing deleted by its donor shows "Deleted" and the note "The donor has removed this listing…" to a recipient who had requested it.

### Donor requests panel

In `src/sections/listing-details/RequestsPanel.tsx` and `RequestRow.tsx`:

- Approve and Decline are shown only while the listing is Available **and** no request on it is Approved.
- A pending request is displayed as Declined when another request is approved or the listing is Reserved or Collected, and as Expired when the listing is Expired. Again this is display only.
- The approve dialog's "The other [n] pending requests will be declined." counts only requests that can still be decided.
- After a `DAILY_DISTRIBUTION_PRIORITY` refusal, that organisation's Approve is shown disabled with the reason; Decline stays.

The navigation counts (`src/hooks/useNavCounts.ts`) count only requests still awaiting a decision: a donor's on Available listings, and a recipient's that show as Pending.

## Demo accounts

The frontend includes mock demo accounts for development and interface testing:

| Role | Email | Password |
|---|---|---|
| Donor | `donor@foodbridge.test` | `FoodBridge-demo-2026` |
| Recipient | `recipient@foodbridge.test` | `FoodBridge-demo-2026` |
| Administrator | `admin@foodbridge.test` | `FoodBridge-demo-2026` |

These are mock credentials. They are not the same as the seeded accounts on the live backend.

In live mode (`VITE_USE_MOCKS=false`) the sign-in page offers the backend's seeded accounts instead (`donor1@demo.foodbridge.invalid`, `recipient1@demo.foodbridge.invalid`, `admin@demo.foodbridge.invalid`), with passwords defined in `src/constants/demoAccounts.ts`. Confirm they still exist on the deployed backend before relying on them.

## API integration

The frontend service layer is organised into:

- `src/services/api.ts` — the one `createApi`, base URL, auth and tracing headers.
- `src/services/auth.ts` — sign-in.
- `src/services/listings.ts` — food listings and image uploads.
- `src/services/requests.ts` — recipient requests, decisions and the collected handover.
- `src/services/admin.ts` — administrator dashboard statistics.
- `src/services/backend-mappers.ts` — maps backend responses to frontend types and extracts the uploaded image URL.
- `src/services/errors.ts` — reads HTTP status, error code and field errors.

Every endpoint checks `env.useMocks` first and calls the simulated store in `src/mocks/` instead of the backend when mocks are on. Screens use only the hooks exported from `src/services/`.

### Endpoints the frontend calls in live mode

| Purpose | Endpoint | Hook |
|---|---|---|
| Sign in | `POST /api/auth/login` | `useSignIn` |
| Browse listings | `GET /api/listings` (`category`, `availability`, `offset`, `limit` up to 100); see "Find food filtering" below | `useListings` |
| Donor's own listings | `GET /api/listings?mine=true` | `useMyListings` |
| Listing details | `GET /api/listings/{listingId}` | `useListing` |
| Create listing | `POST /api/listings` (sends an `Idempotency-Key` header) | `useCreateListing` |
| Edit listing | `PUT /api/listings/{listingId}` | `useUpdateListing` |
| Delete listing | `DELETE /api/listings/{listingId}` (204 No Content) | `useDeleteListing` |
| Upload photo | `POST /api/listings/images` (multipart field `file`) | `useUploadListingImage` |
| Request food | `POST /api/listings/{listingId}/requests` (`Idempotency-Key`, no body) | `useCreateRequest` |
| Requests on a listing | `GET /api/listings/{listingId}/requests` | `useListingRequests` |
| Recipient's requests | `GET /api/requests?mine=true`, then `GET /api/listings/{listingId}` for each request | `useMyRequests` |
| Approve / decline | `PATCH /api/requests/{requestId}/approve` / `decline` | `useDecideRequest` |
| Cancel | `POST /api/requests/{requestId}/cancel` | `useCancelRequest` |
| Mark collected | `PATCH /api/requests/{requestId}/collected` (reply ignored; data refetched) | `useMarkCollected` |
| Admin dashboard | `GET /api/admin/dashboard` | `useAdminDashboard` |

Documented by the backend but **not called** by the frontend: `GET /api/auth/me`, `GET /api/requests/{requestId}`, `GET /api/admin/requests`, `GET /api/admin/distribution/today`, `GET /api/activity` and `PATCH /api/handovers/{handoverId}/reverse`.

**Find food filtering** (`src/services/listings.ts`, `src/lib/listing-search.ts`). The backend's `pickupArea` filter matches only the exact stored text, and its `keyword` search covers only the food name and description. So with no search and no area, the frontend sends the filters and lets the backend page the results. With a search or an area, it sends only `availability` and `category`, reads every page (100 at a time, using `X-Total-Count`), and matches the area and the search (food name, description, donor, area and category) itself.

Headers: every request sends `Authorization: Bearer <token>` when signed in, and an `X-Request-Id` UUID (see the contradiction noted in `../docs/decisions.md`, 2026-10-31). Requests time out after 45 seconds.

**Request enrichment.** `GET /api/requests?mine=true` returns request fields only. To show the food, donor, area, photo and listing status on Your requests, `getMyRequests` fetches each request's listing and passes it to `mapBackendRequest`. If a listing can't be fetched, the request falls back to placeholder text ("Food listing", "Food donor") and listing status Available. These extra calls can be removed once the backend returns an enriched response.

**Status mapping** (`src/services/backend-mappers.ts`): listing `REVERSED` and unknown values become `AVAILABLE`, and `DELETED` is kept; request `COLLECTED` or `COMPLETED` become `APPROVED` (the listing carries Collected); unknown request values become `PENDING`.

**Pickup area mapping.** `pickupAreaValue` (`src/constants/listingOptions.ts`) turns a stored area that starts with a known area into that option, so "Surulere, Lagos - …" shows, filters and edits as Surulere. Text that starts with no known area is kept as it is.

**Categories and units.** In live mode the form offers the backend values (`PREPARED_MEALS`, `PRODUCE`, `BAKERY`, `DAIRY`, `PANTRY`, `OTHER`; `PORTIONS`, `KG`, `LITRES`, `ITEMS`, `BOXES`). Simulated mode keeps the original lists (Bakery, Cooked meals, Produce, Pastries; loaves, portions, trays, baskets, pieces, boxes). Pickup areas are the same in both: Yaba, Surulere, Ikeja, Lekki, Ajegunle.

### Listing photos and Cloudinary

1. The donor chooses a JPG or PNG of 5 MB or less (validated by `src/schema/listingSchema.ts`).
2. On submit, the photo is uploaded first with `POST /api/listings/images`. The backend stores it in Cloudinary.
3. `extractImageReference` takes the image URL from the reply: a plain URL string, or the first `http(s)` URL found under `imageReference`, `imageUrl`, `url`, `secure_url`, `secureUrl` or `location`, then any other property (nested objects included). The deployed backend was observed replying `{ "imageUrl": "https://res.cloudinary.com/…" }` (2 November 2026).
4. The listing is created or updated with that URL as `imageReference`. When editing without choosing a new photo, the existing URL is kept.
5. If the upload fails, the form shows "Your photo couldn't be uploaded. Please try again." and the listing is not saved.

In simulated mode the photo is shrunk to 600 px and stored as a JPEG data URL (`src/lib/photo.ts`). The OpenAPI document still describes the upload reply generically, so the extraction stays tolerant until the contract names the field.

## GitHub Actions and deployment

The workflow is located at:

```text
.github/workflows/frontend.yml
```

It has two jobs:

1. **`check`**: `npm ci`, lint, typecheck, tests and build. Runs on every push that changes `frontend/` or the workflow, and on every pull request into `main`.
2. **`deploy`**: runs only on a push to `main` (such as a merged pull request) and only after `check` passes. It runs `vercel pull --environment=production` (production settings and environment variables, including `VITE_API_URL`), `vercel build --prod` and `vercel deploy --prebuilt --prod`. Deploys queue instead of cancelling each other.

A pull request runs the checks but never deploys. Vercel's own Git deployments are switched off (`vercel.json`), so this workflow is the only route to production.

The Vercel deployment uses these GitHub Actions secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Do not commit secrets or local `.env` files.

## Testing

Tests sit next to the code they test (`*.test.ts` / `*.test.tsx`) and run with `npm test` (Vitest, jsdom). Most use the simulated data layer. Files named `*.live.test.tsx` switch mocks off and stub `fetch` to imitate the backend, to test the live code paths; no test calls the deployed backend. Helpers live in `src/test/` (`render.tsx` renders a route signed in as a demo account; `mockDb.ts` changes the simulated data).

Current coverage includes: sign-in and redirects, layout and session guards, the highlighted menu link on sub-pages, form components, the listing schema (including the required description), Share food and its service errors, Find food and its live filtering, both listing-details views (including the donor's optimistic approve, conflict and offline rollback, the fairness refusal and Mark as collected), Your listings and Listing history, deleting listings, navigation counts, the simulated store's rules, backend mappers, formatting and deadlines, and the landing page.

Not yet covered by dedicated tests: `src/lib/request-status.ts`, the Open requests / Request history split on Your requests, the Edit listing page and its status rules, and the administrator dashboard.

Last local run (2 November 2026, `main` at `c857ea6`): 354 tests passed across 34 test files; typecheck and build passed; lint 0 errors and 1 warning in `src/components/ui/textarea.tsx` line 71 (`react-hooks/exhaustive-deps`, a copied shared component).

## Known limitations

- The dashboard shows "—" for Expired and Food saved (estimate). The documented dashboard response now includes `expiredListings` and `estimatedPortionsSaved`, but the dashboard doesn't use them yet; it has no recent-activity list (`GET /api/activity` is documented but not called).
- `PATCH /api/handovers/{handoverId}/reverse` is documented, but no response exposes a `handoverId`, so reversing a handover isn't available in the interface.
- The OpenAPI document describes the image-upload reply generically; the observed field is `imageUrl` (see above).
- The Qocent backup deployment is unverified: whether it is current and whether it updates from GitHub are unknown.
- Competing pending requests are only *displayed* as Declined after another request is approved; the deployed backend keeps them `PENDING`.
- The deployed backend accepts a second request from the same recipient on the same listing.
- The backend refuses to delete Reserved and Collected listings, and leaves deleted listings out of a donor's list, so Listing history can't show them. Requests on a deleted listing keep their stored status.
- Area and search filtering run in the browser when set (see "Find food filtering"); a backend fix to the area filter and keyword search would move this back to the server.
- Administrators cannot open `/listings/:id/edit` (the route is donor-only in `src/app/routes.tsx`) and see no requests panel, so they cannot edit listings or record handovers in the interface.
- `DATA_IS_SIMULATED` in `src/services/api.ts` is hard-coded to `true`, so the demonstration line says "(simulated)" in live mode too.
- `/requests` uses a temporary layout grouped by listing; the spec's tabbed S8 screen depends on an aggregate endpoint that isn't documented.

For API behaviour and current endpoint details, refer to the live Swagger documentation.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "VITE_API_URL is not set…" at start-up | No `.env` in `frontend/`, or the variable is missing. Copy `.env.example` and restart `npm run dev`. |
| App shows mock data although you wanted the live backend | `VITE_USE_MOCKS` must be exactly `false`. Restart the dev server after changing `.env`. |
| First live request is very slow or shows "FoodBridge is starting up…" | The Render free tier sleeps; the first request can take up to about a minute. |
| Live sign-in fails with the `@foodbridge.test` accounts | Those are simulated accounts. Use the live seeded accounts shown on the sign-in page in live mode. |
| Photo upload error | Check the file is JPG or PNG and 5 MB or less; otherwise the upload response may not contain a usable URL. |
| Your requests shows "Food listing" / "Food donor" | The listing for that request couldn't be fetched during enrichment. |

## Related documentation

- Project overview: `../README.md`
- Frontend instructions: `CLAUDE.md`
- Interface specification: `../docs/spec/foodbridge-interface.md`
- Project decisions: `../docs/decisions.md`
- AI usage log: `../docs/ai-log.md`
