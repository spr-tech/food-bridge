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
4. Edit and delete a listing from its row, or from the action row at the foot of its details card, where Edit and Delete sit together. Edit shows only on an Available listing. Delete (with confirmation) shows on Available and Expired listings, is disabled with the reason on Collected ones, and isn't offered on Reserved ones, which the backend refuses.
5. Review recipient requests on the listing's details page, or on Requests (`/requests`), which lists every **Available** listing with requests waiting, each with its requests panel. A listing leaves Requests once a request on it is approved.
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
Administrators land on the Dashboard (`/admin`): summary counts from the backend, the listing pipeline, the share of listings collected, today's distribution, recent activity, the expired count and the food saved per unit. The **Requests waiting** card opens Requests waiting (`/admin/requests`), the **Expired** card opens All listings filtered to Expired, and the **Completed handovers** card opens Completed handovers (`/admin/handovers`, also in the menu as Handovers), which lists every Collected listing with its donor, recipient, quantity and, when recorded, its collection time. Administrators can also browse All listings (`/listings`) without request buttons, including a **Deleted** status only they are offered, and delete a listing from its details page (disabled on Collected listings, not offered on Reserved ones). Under the capstone brief administrators monitor activity and may edit listings and update handover status; the interface does not offer those administrator actions yet. Donors make the decision to approve or decline recipient requests.

## Business rules shown in the interface

- A listing can be edited only while it is Available (owning donor; the edit page also allows an administrator, but the route itself is donor-only).
- Listing form: food name 3–80 characters; **description required**, up to 500 characters; category, quantity (whole number, 1 or more), unit, pickup area, collection date and time required; the combined deadline must be later than now; optional JPG or PNG photo up to 5 MB.
- A listing has at most one approved request. The donor's panel shows the approved request first.
- A recipient can cancel only their own request, and only while it is genuinely pending (see the status table below).
- Expired listings accept no requests, and Find food shows them only under the Expired status, with a disabled Expired button.
- A listing the service marks `deleted: true` is Deleted, never Expired, even when its deadline has passed (`mapBackendListing`).
- Delete: owning donor or administrator; not offered on Reserved listings, disabled on Collected listings and on listings whose handover was reversed (`canDeleteListing` and `deleteBlockedReason` in `src/lib/listing-permissions.ts`). The backend deletes only Available and Expired listings (409 `LISTING_NOT_DELETABLE` otherwise) and keeps them as a record, so the dialog says "taken off FoodBridge", not "deleted for good".
- Daily fairness rule (backend): a recipient who already has an approval today (Lagos time) can't be approved again while another recipient has none (409 `DAILY_DISTRIBUTION_PRIORITY`). The donor's panel explains the refusal and disables Approve for that organisation for the rest of the visit; Decline stays available.

The backend is the authority for every rule. The frontend checks are for clarity and speed, not security.

## Request status display

The backend stores a status on each request (`PENDING`, `APPROVED`, `DECLINED`, `CANCELLED`, `EXPIRED`, `REVERSED`) and on each listing (`AVAILABLE`, `RESERVED`, `COLLECTED`, `REVERSED`, `EXPIRED`, `DELETED`). Reversing a handover now sets the request to `REVERSED` and reopens the listing as `AVAILABLE`; a listing stored as `REVERSED` comes only from reversals made before that change. Both `REVERSED` statuses show as "Not collected". What a recipient sees is derived from both by `getRecipientRequestStatus` in `src/lib/request-status.ts`, used by `src/sections/listing-details/RecipientAction.tsx`, `src/sections/your-requests/RequestItem.tsx` and `src/sections/your-requests/YourRequests.tsx`.

| Stored request | Listing | Recipient sees | Where on Your requests | Can cancel? |
|---|---|---|---|---|
| Pending | Available | Pending | Open requests | Yes |
| Pending | Reserved | Declined, with "This request was not approved…" | Request history | No |
| Pending | Collected | Declined, with the same explanation | Request history | No |
| Pending | Expired, Deleted or Reversed | Expired | Request history | No |
| Approved | Reserved | Approved, with pickup details | Open requests | No |
| Approved | Collected | Collected (listing badge) | Request history | No |
| Approved | Reversed | Approved | Request history | No |
| Reversed | any | Not collected | Request history | No |
| Declined, Cancelled, Expired | any | As stored | Request history | No |

The helper itself returns the request status (`APPROVED`); the Collected badge for an approved request on a collected listing is chosen by the components.

The message "This request was not approved. The food listing is no longer available for requests." shows on the request in Your requests and on listing details whenever the listing is Reserved or Collected and the request is Pending or Declined (`wasNotApprovedAndListingClosed`). It comes from the data on every render, so it stays after a refetch, a refresh or a later visit. It gives no reason, and never says another organisation was approved, because the backend sends no decline reason (see Known limitations).

**This is a display fallback only.** It does not change the stored status of the losing request. Since backend PR #40 (deployed 2 November 2026), approving a request stores the listing's other pending requests as `DECLINED`. Requests approved before that change, and requests left on a listing that was deleted or expired, can still be stored as `PENDING`, so the fallback stays. The simulated data layer (`src/mocks/db.ts`) also stores them as `DECLINED`.

A listing deleted by its donor shows "Deleted" and the note "The donor has removed this listing…" to a recipient who had requested it.

### Donor requests panel

In `src/sections/listing-details/RequestsPanel.tsx` and `RequestRow.tsx`:

- Approve and Decline are shown only while the listing is Available **and** no request on it is Approved.
- A pending request is displayed as Declined when another request is approved or the listing is Reserved, Collected or Reversed, and as Expired when the listing is Expired. Again this is display only. Approving still updates the panel straight away, marking the other pending requests Declined, without waiting for the service.
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
| Sign in | `POST /api/auth/login` (90-second timeout) | `useSignIn` |
| Wake the service | `GET /api/listings?limit=1`, once, when sign in opens; the reply is ignored | `wakeService` |
| Browse listings | `GET /api/listings` (`category`, `availability`, `offset`, `limit` up to 100; "Load more" past 100 is read in pages); see "Find food filtering" below | `useListings` |
| Donor's own listings | `GET /api/listings?mine=true`, every page | `useMyListings` |
| Listing details | `GET /api/listings/{listingId}` | `useListing` |
| Create listing | `POST /api/listings` (sends an `Idempotency-Key` header) | `useCreateListing` |
| Edit listing | `PUT /api/listings/{listingId}` | `useUpdateListing` |
| Delete listing | `DELETE /api/listings/{listingId}` (204 No Content) | `useDeleteListing` |
| Upload photo | `POST /api/listings/images` (multipart field `file`, compressed first; see below) | `useUploadListingImage` |
| Request food | `POST /api/listings/{listingId}/requests` (`Idempotency-Key`, no body) | `useCreateRequest` |
| Requests on a listing | `GET /api/listings/{listingId}/requests` | `useListingRequests` |
| Recipient's requests | `GET /api/requests?mine=true`, then `GET /api/listings/{listingId}` for each request | `useMyRequests` |
| Approve / decline | `PATCH /api/requests/{requestId}/approve` / `decline` | `useDecideRequest` |
| Cancel | `POST /api/requests/{requestId}/cancel` | `useCancelRequest` |
| Mark collected | `PATCH /api/requests/{requestId}/collected` (reply, including `handoverId`, ignored; data refetched) | `useMarkCollected` |
| Admin dashboard | `GET /api/admin/dashboard` | `useAdminDashboard` |
| Requests waiting | `GET /api/admin/requests?status=PENDING` (every page), then `GET /api/listings/{listingId}` for each listing | `usePendingRequests` |
| Today's distribution | `GET /api/admin/distribution/today` | `useDistributionToday` |
| Recent activity | `GET /api/activity?limit=10` | `useRecentActivity` |
| Completed handovers | `GET /api/listings?availability=COLLECTED` (every page), `GET /api/admin/requests` (every page) and `GET /api/activity?limit=100`, joined in `joinCompletedHandovers` | `useCompletedHandovers` |

Documented by the backend but **not called** by the frontend: `GET /api/requests/{requestId}` and `PATCH /api/handovers/{handoverId}/reverse`.

**Find food filtering** (`src/services/listings.ts`, `src/lib/listing-search.ts`). The backend's `pickupArea` filter matches only the exact stored text, and its `keyword` search covers only the food name and description. So with no search and no area, the frontend sends the filters and lets the backend page the results. With a search or an area, it sends only `availability` and `category`, reads every page (100 at a time, using `X-Total-Count`), and matches the area and the search (food name, description, donor, area and category) itself.

Headers: every request sends `Authorization: Bearer <token>` when signed in, and an `X-Request-Id` UUID (see the contradiction noted in `../docs/decisions.md`, 2026-10-31). Requests time out after 45 seconds, sign-in after 90, because a sleeping service can take up to a minute to wake. While signing in, the form shows "Hang tight, we're getting things ready for you." and, after five seconds, explains that FoodBridge is waking up.

**Ending a session.** The backend's tokens last 30 minutes and are lost whenever the service restarts. Any 401 (except a refused sign-in) goes through the base query in `src/services/api.ts`, which ends the session; `RequireSession` then sends the user to sign in with "Your session ended. Sign in again." and `?next=` back to the page. A late 401 for an earlier account never ends a newer session.

**Request errors.** Screens choose their own plain wording from the status and code, never the backend's message. Requesting food handles `409 LISTING_ALREADY_RESERVED`, `404 LISTING_NOT_FOUND`, `403 FORBIDDEN` and `409 LISTING_EXPIRED` with a message and no Try again, since retrying can't change them; only an unreachable service offers Try again. `ALREADY_REQUESTED` is handled for when the backend adds it.

**Request enrichment.** `GET /api/requests?mine=true` returns request fields only. To show the food, donor, area, photo and listing status on Your requests, `getMyRequests` fetches each request's listing and passes it to `mapBackendRequest`. If a listing can't be fetched, the request falls back to placeholder text ("Food listing", "Food donor") and listing status Available. These extra calls can be removed once the backend returns an enriched response.

**Status mapping** (`src/services/backend-mappers.ts`): known listing statuses, `REVERSED` and `DELETED` included, are kept and unknown ones become `AVAILABLE`; known request statuses, `REVERSED` included, are kept, `COLLECTED` or `COMPLETED` become `APPROVED` (the listing carries Collected), and unknown ones become `PENDING`.

**Pickup area mapping.** `pickupAreaValue` (`src/constants/listingOptions.ts`) turns a stored area that starts with a known area into that option, so "Surulere, Lagos - …" shows, filters and edits as Surulere. Text that starts with no known area is kept as it is.

**Categories and units.** In live mode the form offers the backend values (`PREPARED_MEALS`, `PRODUCE`, `BAKERY`, `DAIRY`, `PANTRY`, `OTHER`; `PORTIONS`, `KG`, `LITRES`, `ITEMS`, `BOXES`). Simulated mode keeps the original lists (Bakery, Cooked meals, Produce, Pastries; loaves, portions, trays, baskets, pieces, boxes). Pickup areas are the same in both: Yaba, Surulere, Ikeja, Lekki, Ajegunle.

### Listing photos and Cloudinary

1. The donor chooses a JPG or PNG of 5 MB or less (validated by `src/schema/listingSchema.ts`).
2. On submit, the photo is compressed and uploaded with `POST /api/listings/images`. The backend accepts at most 1 MB (Spring's default; no larger limit is configured), so `compressPhoto` (`src/lib/photo.ts`) sends a photo already under 900 KB unchanged, and otherwise redraws it as a JPEG of at most 1600 px, lowering the quality and then the size until it is under 900 KB. If the browser can't redraw it, the photo is sent as chosen. The backend stores it in Cloudinary.
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

Current coverage includes: sign-in and redirects (including the waiting message and the 90-second sign-in timeout), layout and session guards, ending the session on a 401, the donor's Requests page, request-creation errors, photo compression and upload, the highlighted menu link on sub-pages, form components, the listing schema (including the required description), Share food and its service errors, Find food and its live filtering, both listing-details views (including the donor's optimistic approve, conflict and offline rollback, the fairness refusal and Mark as collected), Your listings and Listing history, deleting listings, navigation counts, the simulated store's rules, backend mappers (including `REVERSED` and `DELETED`), recipient request status and the Open requests / Request history split, the administrator dashboard, formatting and deadlines, and the landing page.

Not yet covered by dedicated tests: the Edit listing page and its status rules.

Last local run (2 November 2026, `fix/frontend-integration-audit` at `50e00bf`): 441 tests passed across 47 test files; typecheck and build passed; lint 0 errors and 1 warning in `src/components/ui/textarea.tsx` line 71 (`react-hooks/exhaustive-deps`, a copied shared component).

## Known limitations

- There is no handover endpoint to list completed handovers, so Completed handovers joins three reads (see the endpoint table). No response carries a collection time: it comes from the `COLLECTED` activity event, and only the 100 most recent events can be read, so older handovers show "Not recorded". The recipient comes from the listing's approved request; if none is returned it also shows "Not recorded". Every page of collected listings and of all requests is read, which grows with the platform; an enriched handover endpoint (listing, donor, recipient, quantity, `collectedAt`, `handoverId`) would replace this.
- `PATCH /api/handovers/{handoverId}/reverse` is live, but only the Mark collected reply carries a `handoverId`; request responses don't, so reversing a handover isn't available in the interface.
- The OpenAPI document describes the image-upload reply generically; the observed field is `imageUrl` (see above).
- The Qocent backup deployment is unverified: whether it is current and whether it updates from GitHub are unknown.
- Sign-in tokens last 30 minutes and are lost when the backend restarts, so people are signed out then (and sent back to sign in with "Your session ended").
- Other people's changes appear only when a screen refetches (on revisit after 30 seconds, on reconnect, or on refresh). The backend has no way to push updates (no SSE or WebSocket endpoint).
- The deployed backend accepts a second request from the same recipient on the same listing.
- **Backend defect: the Expired filter returns deleted listings.** On 2 November 2026 `GET /api/listings?availability=EXPIRED` (as administrator) returned 24 rows: 1 with status `EXPIRED` and 23 with status `DELETED` (`deleted: true`). `availability=DELETED` is refused with 400 `INVALID_LISTING`. The dashboard's `expiredListings` (1) is correct. The interface keeps each row by the status it carries: the Expired status shows the expired listing and says how many deleted ones the service also returned, and administrators get a Deleted status read from the unfiltered list (`getListings`). Backend fix needed: `availability=EXPIRED` should return only listings with status `EXPIRED` and `deleted = false`, and `availability=DELETED` should be accepted for administrators. Once fixed, drop the browser-side status matching.
- **Backend defect: `pendingRequests` counts requests no one can decide.** On 2 November 2026 the dashboard said 16 requests waiting, but every one of the 16 `PENDING` requests sat on a Collected (9) or Deleted (7) listing; Available listings had none (`pendingRequestCount` 0). The card shows the service's figure unchanged. Requests waiting (`/admin/requests`) counts only Pending requests on Available listings as waiting. It counts the rest as "No decision due" and lists them apart, without actions, each with its listing's status. A note explains why the dashboard's figure is higher. Every count comes from the rows `GET /api/admin/requests?status=PENDING` returns. Backend fix needed: decline (or expire) pending requests when a listing is collected or deleted, and count only those on Available listings.
- **No decline reason.** Request responses have only `status`, so the interface can't tell a request a donor declined by hand from one declined because another request was approved. Recipients see the neutral "This request was not approved…" message; the interface never says another organisation was approved. Backend fix needed: a decline reason on the request response (for example `declineReason`: `ANOTHER_REQUEST_APPROVED`, `DECLINED_BY_DONOR`). The interface spec (`docs/spec/foodbridge-interface.md`, S4 and the status table) still has the earlier "Another organisation's request was approved" wording.
- **Food saved is shown per unit from the listed quantity, not the service's estimate.** The dashboard's food saved totals the quantity listed on each Collected listing, one figure per unit, never converted or added together; a reversed handover's listing is no longer Collected, so it drops out. The service's `estimatedPortionsSaved` (78 on 2 November 2026) isn't shown: it counts portions from 13 `completedHandovers` against 12 Collected listings holding 58 portions, and the response doesn't say which handovers or recorded estimates make up the difference. Backend fix needed: document how the estimate is calculated, or return totals per unit from handovers.
- The backend refuses to delete Reserved and Collected listings, and leaves deleted listings out of a donor's list, so Listing history can't show them. A pending request on a deleted listing stays stored as `PENDING`; it shows as Expired, in Request history.
- Area and search filtering run in the browser when set (see "Find food filtering"); a backend fix to the area filter and keyword search would move this back to the server.
- Administrators cannot open `/listings/:id/edit` (the route is donor-only in `src/app/routes.tsx`) and see no requests panel, so they cannot edit listings or record handovers in the interface.
- `/requests` uses a temporary layout grouped by listing; the spec's tabbed S8 screen depends on an aggregate endpoint that isn't documented.

For API behaviour and current endpoint details, refer to the live Swagger documentation.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "VITE_API_URL is not set…" at start-up | No `.env` in `frontend/`, or the variable is missing. Copy `.env.example` and restart `npm run dev`. |
| App shows mock data although you wanted the live backend | `VITE_USE_MOCKS` must be exactly `false`. Restart the dev server after changing `.env`. |
| First live request is very slow, or sign-in says "FoodBridge is waking up" | The Render free tier sleeps; the first request can take up to about a minute. Sign-in waits up to 90 seconds. |
| Sent back to sign in with "Your session ended" | The token expired (after 30 minutes) or the backend restarted. Sign in again to return to the same page. |
| Live sign-in fails with the `@foodbridge.test` accounts | Those are simulated accounts. Use the live seeded accounts shown on the sign-in page in live mode. |
| Photo upload error | Check the file is JPG or PNG and 5 MB or less. The photo is compressed below 900 KB first; if the browser couldn't redraw it, the original may exceed the backend's 1 MB limit. |
| Your requests shows "Food listing" / "Food donor" | The listing for that request couldn't be fetched during enrichment. |

## Related documentation

- Project overview: `../README.md`
- Frontend instructions: `CLAUDE.md`
- Interface specification: `../docs/spec/foodbridge-interface.md`
- Project decisions: `../docs/decisions.md`
- AI usage log: `../docs/ai-log.md`
