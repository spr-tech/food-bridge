# FoodBridge frontend

FoodBridge coordinates surplus food: donors list food, recipients request it, and the donor approves or declines a request. The donor or administrator can update the handover status. This repository is the interface tier. The Java service lives in a separate repository owned by the service engineers: `github.com/dayosvoid/foodbridge-backend`. Never edit the backend repository from here.

Built for the TeSA Cohort 6 capstone. The Monday MVP checkpoint (26 October 2026) ran on simulated data. The frontend has since been connected to the deployed backend (PR #16 and #17, merged); every endpoint still supports the simulated data layer when `VITE_USE_MOCKS` is not `false`. The current priority is verifying the required journeys against the live backend and closing the gaps listed in `README.md` ("Known limitations").

## Read these first

- `../docs/intent/foodbridge.md`: what we're building and why.
- `../docs/spec/foodbridge-interface.md`: every screen, state, message and rule. Copy wording from here; don't invent it.
- `../openapi.yaml`: the planned path for the frontend's API contract copy. **This file does not exist in the repository** (it has never been committed). Until a copy is added, the live OpenAPI document at `https://foodbridge-backend-rg9f.onrender.com/v3/api-docs` is the reference.
- `README.md` (this folder): endpoint usage, request status display rules, Cloudinary handling, testing and known limitations.
- `../docs/decisions.md`: agreed decisions. Check before changing anything structural.
- `../docs/ai-log.md`: record of AI-assisted work and verification.

If the interface specification and the backend's OpenAPI document disagree about an API operation, the agreed backend OpenAPI contract wins. Flag mismatches instead of guessing. For product behaviour, follow the original TeSA capstone brief and recorded team decisions.

`../openapi.yaml` remains the intended frontend contract path. The backend team's `contracts/openapi.yaml` is maintained in the backend repository. If a frontend copy is added, keep it synchronised with the backend version. Do not independently invent or silently alter API operations.

## Design

- Build every screen from `../docs/design/foodbridge-final/`. Read `source-html/` and `foodbridge-sidebar-animation.html` for exact values; don't approximate from PNGs. Before pushing a screen, list any difference from its design.
- The landing page (`/`) and the sign-in page's full-page photo and form card come from the FoodBridge landing canvas (https://claude.ai/artifact/MgPj42vTu3L4esQ6EosDHy), not `foodbridge-final/`. See `../docs/decisions.md` (2026-10-27).
- Spec section 12 ("Visual design") lists deliberate differences from the design files (contrast fixes, one `h1`, phone Sign out). Where they disagree, section 12 wins.
- Use canonical Tailwind classes; only use an arbitrary value when no standard class gives exactly that value. ESLint enforces this (`better-tailwindcss/enforce-canonical-classes`) in `className` and `cn()`, but not in plain string constants, so check those by hand.

## Stack

- Vite + React + TypeScript (strict).
- React Router for routing.
- Redux Toolkit + RTK Query for server data, using the `injectEndpoints` pattern.
- UI components from the shared component set (github.com/spr-tech/interface-eng-shared-components), copied into `src/components/ui/`.
- Formik for forms, Yup for validation schemas.
- Tailwind CSS, colours and fonts from `src/styles/tokens.css`.
- Fonts: Fraunces (headings) and DM Sans (body) via `@fontsource`.

## Commands

Run commands from `frontend/`, not the repository root.

```bash
npm run dev         # local dev server
npm run build       # production build
npm run lint        # ESLint
npm run typecheck   # TypeScript check
npm test            # Vitest
npx @stoplight/prism-cli mock ../openapi.yaml
```

The Prism mock server runs at `http://127.0.0.1:4010` when started successfully. It needs `../openapi.yaml`, which is not currently in the repository, so this command fails until a contract copy is added. The simulated data layer (`VITE_USE_MOCKS` not `false`) does not need Prism.

Before saying a task is done, run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`. All four must pass. CI runs the same checks and blocks deployment on failure.

## Environment

- `VITE_API_URL`: API base address.
- `VITE_USE_MOCKS`: controls whether the frontend uses simulated data or the live backend, according to `src/configs/env.ts`. Mocks are on unless it is exactly `false`; tests use mocks by default (`*.live.test.tsx` files mock `env` to switch them off and stub `fetch`). `VITE_API_URL` is required even with mocks on (start-up throws without it).
- Local development against the deployed backend uses `https://foodbridge-backend-rg9f.onrender.com` as the API base URL.
- The deployed backend's Swagger UI is at `https://foodbridge-backend-rg9f.onrender.com/swagger-ui/index.html`.
- Its OpenAPI JSON is at `https://foodbridge-backend-rg9f.onrender.com/v3/api-docs`.
- Use the local Prism mock server when deliberately testing the mock workflow.
- Never commit `.env` files, tokens, passwords or other secrets.
- Keep `.env.example` synchronised with required variable names, but never put real credentials in it.

## Folder structure

The layout follows section 2 of the frontend structure guide, adapted for Vite + React Router. `STRUCTURE.md` describes each folder in more detail.

```text
src/
├── app/                # Routing only.
│   ├── routes.tsx      # route table, allowed roles and canOpen(role, path); the one place role rules live
│   ├── router.tsx      # browser router
│   ├── providers.tsx   # Redux Provider + RouterProvider
│   └── pages/          # one thin file per route (lazy-loaded from routes.tsx); dev/ holds FormPreviewPage
├── assets/             # images, logo-icon-dark.svg and logo-icon-light.svg (icon only; wordmark is text),
│                       # landing/handover.jpg (temporary; see decisions 2026-10-27)
├── components/
│   ├── ui/             # generic, knows nothing about FoodBridge; one folder per component
│   │   ├── <shared>/   # the 14 shared-repo components (see "UI components" below)
│   │   ├── form/       # Formik adapters around the shared FormField and controls
│   │   └── summary-strip/, view-tabs/, loading-state/   # our own generic pieces
│   ├── layouts/        # page frame: RequireSession, RequireRole, RootLayout, AppLayout, Sidebar, TopBar,
│   │                   # PhoneTopBar, AccountMenu, TabBar, Logo, navigation, PageContainer, PageHeader
│   └── content/        # feature screens; knows the domain
│       ├── auth/sign-in/            # forms/SignInForm
│       ├── landing/
│       ├── listings/                # find-food, share-food (forms/, modals/), listing-details, your-listings,
│       │                            # shared/ (StatusBadge, ListingPhoto, MetaIcons, DeleteListingButton)
│       ├── requests/                # your-requests, shared/ (CancelRequestButton)
│       └── admin/                   # dashboard, requests, completed-handovers
├── configs/            # env.ts (reads VITE_API_URL and VITE_USE_MOCKS), serviceConfig.ts (the one
│                       # createApi), storeConfig.ts (makeStore)
├── mocks/              # simulated service: db.ts (rules), seed.ts (demo data),
│                       # simulate.ts (controlled delays and demo error states)
├── models/             # requests/ (outgoing shapes), responses/ (backend response shapes),
│                       # entities/ (the app's own shapes: Listing, ListingRequest, Session, ...),
│                       # validations/ (Yup schemas)
├── services/           # auth.ts, listings.ts, requests.ts, admin.ts (endpoints and hooks),
│                       # mappers/backend-mappers.ts (backend DTO to frontend model conversion)
├── stores/             # sessionStore.ts (signed-in session in sessionStorage; role comes from it;
│                       # signOutSession() for deliberate sign-out, clearSession() for expiry)
├── styles/             # tokens.css, layout.css, landing.css
├── test/               # Vitest setup, render helpers and test utilities
└── utilities/
    ├── constants/      # routes.ts, roles.ts, status.ts, listingOptions.ts, demoAccounts.ts, activity.ts
    ├── enums/          # role.ts, status.ts, food.ts: fixed value lists as TypeScript types, the app's
    │                   # (Role, ListingStatus, RequestStatus) and the backend's (BackendRole, ...)
    ├── helpers/        # cn.ts, format.ts, deadline.ts, photo.ts, request-status.ts, listing-permissions.ts,
    │                   # listing-search.ts, food-saved.ts, accent-heading.ts (landing closing heading), pagedQuery.ts (read every page),
    │                   # apiErrors.ts (read status, code and field errors)
    └── hooks/          # useRole, useIdempotencyKey, useDocumentTitle, useAppStore, useSessionEnded,
                        # useSignOut, useMediaQuery, useNavCounts, useNow, useRequestFood, useSessionCheck
```

## Where things go

| Adding a… | Put it in |
|---|---|
| Route | `src/app/routes.tsx`, plus a thin page in `src/app/pages/` that renders one content component and sets the title |
| Screen (the real work of a page) | `src/components/content/<domain>/<screen>/` |
| Form for a screen | `src/components/content/<domain>/<screen>/forms/` |
| Modal or confirmation for a screen | `src/components/content/<domain>/<screen>/modals/` |
| Domain piece used by several screens | `src/components/content/<domain>/shared/` |
| Generic component (no FoodBridge knowledge) | `src/components/ui/<name>/` |
| Formik field adapter | `src/components/ui/form/` |
| Page frame, navigation, route guard | `src/components/layouts/` |
| Endpoint and its hook | the matching file in `src/services/` (one per backend resource) |
| Backend DTO conversion | `src/services/mappers/backend-mappers.ts` |
| Outgoing shape (request body, filters, form input sent to a service) | `src/models/requests/` |
| Backend response shape | `src/models/responses/` |
| The app's own shape (what screens use, e.g. `Listing`) | `src/models/entities/` |
| Yup schema | `src/models/validations/` |
| Client-only state | `src/stores/` |
| Shared hook | `src/utilities/hooks/` |
| Pure helper | `src/utilities/helpers/` |
| User-facing text (labels, headings, messages) | `src/locales/<lang>/<namespace>.json` for `en`, `fr` and `es`, shown with `t()` from `useTranslation()` |
| Constant or option list (text in it is a translation key, not words) | `src/utilities/constants/` |
| Fixed value list (role, status, food category or unit; app or backend) | `src/utilities/enums/` |
| API client, environment or translation setup | `src/configs/` |

- **Types:** one file per backend controller or subject in `models/requests/`, `models/responses/` and `models/entities/` (e.g. `listingRequest.ts`, `listingResponse.ts`, `listing.ts`). Import each type from the file it lives in; there is no re-export index.
- **Dependency rule:** `src/components/ui/` never imports from `src/components/content/`, `src/services/`, `src/stores/` or `src/app/`. If a generic component needs domain behaviour, pass it in as a prop.
- **Text:** never hard-code new user-facing text in a component. Add the key to the English file in `src/locales/en/<namespace>.json` first (it types every key), then to `fr` and `es`, and show it with `const { t } = useTranslation()` and `t('nav.findFood')` (`t('auth:...')` for another namespace). Constants hold the key and never call `t()`. Namespaces: `common` (buttons, navigation, statuses, roles), `landing`, `auth`, `listings`, `requests`, `admin`, `validation`.
- **Language:** the switcher (`src/components/layouts/LanguageSwitcher.tsx`) only calls `i18n.changeLanguage`; `src/configs/i18nConfig.ts` saves the choice in localStorage (`foodbridge.language`, via `src/utilities/helpers/language.ts`) and starts from it next time. Never save the language anywhere else. Supported languages come only from `LANGUAGES` in `src/utilities/constants/languages.ts`; their names stay in their own language and are never translated. The shared `SelectOption` has no `lang` field yet, so the language options can't carry `lang="fr"`/`"es"` for screen-reader pronunciation; add it there before relying on it.
- **Translation tone:** formal everywhere. French uses "vous" ("Vos annonces", never "Tes annonces"); Spanish uses "usted" ("Sus anuncios", never "Tus anuncios"), with verbs, imperatives and pronouns to match ("Compartir" or "Comparta", never "Comparte").
- **Error messages** are chosen by the screen from the status and code, using `src/utilities/helpers/apiErrors.ts`. Never show the service's own message text (spec section 4). This is a deliberate departure from section 6 of the frontend structure guide.
- Tests sit next to the file they test. Tests that render a page to check a feature live with that feature's content folder, not in `app/pages/`.
- Imports use the `@/` alias, including inside the copied shared components.

## RTK Query rules

- There is exactly one `createApi`, in `src/configs/serviceConfig.ts`, with `endpoints: () => ({})`. Never create a second one.
- Each feature adds endpoints in its own file with `api.injectEndpoints({ endpoints: (build) => ({ ... }) })`, for example `src/services/listings.ts`, and exports its generated hooks from there.
- `baseQuery` is `fetchBaseQuery` with `baseUrl: env.apiUrl` from `src/configs/env.ts`.
- `prepareHeaders` adds the authenticated user's token using the authentication scheme defined by the current OpenAPI contract. It must not send credentials on login requests.
- Add `X-Request-Id` only according to the agreed API contract. Do not assume a header exists merely because an older integration note proposed it. Note: `src/configs/serviceConfig.ts` currently still sends an `X-Request-Id` UUID on every request; this conflicts with the 2026-10-31 decision and needs resolving.
- Every endpoint must exist in the current backend OpenAPI contract. Never call an undocumented path. Never use `fetch` or Axios directly for application API calls.
- Screens use only hooks exported from `src/services/`. They must never import `src/mocks/` directly.
- Mock and live data paths must be controlled by the existing environment configuration. Do not silently return mock data after a live API failure.
- Request and response types must match the API contract. Never use `any` to bypass a type mismatch.
- Convert backend DTOs into frontend types in `src/services/mappers/backend-mappers.ts`. Do not spread backend field-name conversions across screen components.
- Use `tagTypes` and `providesTags` / `invalidatesTags` so affected lists and details refresh after successful writes. Tag listings by ID plus a `LIST` tag.
- `POST /api/listings/{listingId}/requests` requires an `Idempotency-Key`. Generate one UUID for the user's submission and reuse it when retrying that same submission.
- The current Swagger does not document an `Idempotency-Key` for `POST /api/listings`. Do not add one unless the backend contract is updated. Note: `createListing` in `src/services/listings.ts` currently does send one in live mode; confirm with the backend engineer whether it is accepted or ignored, then align code or contract.
- The donor's Approve action is the optimistic update. Use `onQueryStarted`: patch the cache with `updateQueryData`, await `queryFulfilled`, and on failure call `patchResult.undo()`, then refetch so the screen shows the service's true state. See spec S5 for exact messages.
- Handle errors by HTTP status and the machine-readable error code when provided. Account for 400, 401, 403, 404, 409 and 500 where applicable.
- Never display a successful state before the backend confirms a live write.

## Current live backend contract

The deployed backend is:

`https://foodbridge-backend-rg9f.onrender.com`

Use `/api` as the API path prefix.

### Authentication

- `POST /api/auth/login`
  - Request body: `email`, `password`.
  - Response: `token`, `id`, `name`, `role`, `organisationName`, `email`.
- `GET /api/auth/me`
  - Returns: `id`, `name`, `role`, `organisationName`, `email`.

Do not assume demo credentials work unless they have been verified against the deployed service. Keep simulated demo credentials separate from live backend credentials.

### Listings

- `GET /api/listings`
  - Query parameters documented: `category`, `pickupArea`, `availability`, `keyword`, `mine`, `offset`, `limit` (100 at most; more gives 400 `INVALID_PAGE`).
  - The documented response is an array of listing objects; the total is in the `X-Total-Count` header.
  - Deployed behaviour: `pickupArea` matches the exact stored text only, and `keyword` searches the food name and description only. With a search or an area set, `useListings` sends only `availability` and `category`, reads every page, and matches area and search in `src/utilities/helpers/listing-search.ts`. Stored areas such as "Surulere, Lagos - …" are mapped to the area option by `pickupAreaValue` (`src/utilities/constants/listingOptions.ts`).
- `GET /api/listings/{listingId}`
  - Retrieves one listing.
- `POST /api/listings`
  - Creates a listing.
- `PUT /api/listings/{listingId}`
  - Updates a listing.
- `DELETE /api/listings/{listingId}`
  - Deletes a listing. Documented success response: HTTP 204 No Content.
  - Deployed behaviour: owning donor or administrator; only Available or Expired listings (409 `LISTING_NOT_DELETABLE` otherwise). It is a soft delete: the listing gets status `DELETED` and `deleted: true`, is left out of donors' and recipients' lists (an administrator's unfiltered list includes it), and is still returned by id to its donor, an administrator and its requesters. Backend defect (2 November 2026): `availability=EXPIRED` also returns deleted listings, and `availability=DELETED` gives 400; see README, Known limitations. Its requests keep their stored status.
- `POST /api/listings/images`
  - Uploads an image using `multipart/form-data` with the binary field named `file`.

Listing request fields currently documented:
- `foodName`
- `description`
- `category`
- `quantity`
- `unit`
- `imageReference`
- `pickupArea`
- `collectionDeadline`

Listing response fields currently documented:
- `id`
- `foodName`
- `description`
- `category`
- `quantity`
- `unit`
- `imageReference`
- `pickupArea`
- `collectionDeadline`
- `status`
- `donorId`
- `donorName`
- `createdAt`
- `pendingRequestCount`

The category values shown in the contract are `PREPARED_MEALS`, `PRODUCE`, `BAKERY`, `DAIRY`, `PANTRY` and `OTHER`.

The unit values shown in the contract are `PORTIONS`, `KG`, `LITRES`, `ITEMS` and `BOXES`.

Do not silently map unsupported frontend categories or units to a different value. Flag mismatches and agree a mapping with the backend engineer.

### Image upload

The image endpoint documents a multipart field named `file`, but its successful response schema is currently generic. Do not assume the response property containing the Cloudinary URL or image reference.

Current implementation: `extractImageReference` in `src/services/mappers/backend-mappers.ts` accepts a plain URL string, or the first `http(s)` URL under `imageReference`, `imageUrl`, `url`, `secure_url`, `secureUrl` or `location`, then any other (nested) property. The form uploads the photo before creating or updating the listing and keeps the existing URL when editing without a new photo. This tolerant extraction is a stopgap.

The deployed endpoint was observed replying `{ "imageUrl": "https://res.cloudinary.com/…" }` (2 November 2026). Once the contract names this field, update the mapper and types to match it and drop the tolerant extraction.

The listing's `imageReference` is the value returned or agreed by the backend. The frontend must use the confirmed browser-loadable reference when displaying the listing photo.

### Requests

- `POST /api/listings/{listingId}/requests`
  - Creates a request.
  - Requires the `Idempotency-Key` header.
  - The current documented operation has no request body.
- `GET /api/listings/{listingId}/requests`
  - Retrieves requests associated with a listing.
- `GET /api/requests`
  - Retrieves requests. The frontend calls it with `mine=true` (the parameter defaults to false) for the recipient's own requests.
  - The response contains request fields only, so `getMyRequests` fetches `GET /api/listings/{listingId}` for each request to supply the listing summary. Remove these calls once the backend returns an enriched response.
- `GET /api/requests/{requestId}`
  - Retrieves one request.
- `PATCH /api/requests/{requestId}/approve`
  - Approves a request.
- `PATCH /api/requests/{requestId}/decline`
  - Declines a request.
- `POST /api/requests/{requestId}/cancel`
  - Cancels a request.

Request response fields currently documented:
- `id`
- `listingId`
- `recipientId`
- `recipientName`
- `status`
- `createdAt`

Do not add a request note or requested-quantity field to the API payload unless the backend contract explicitly supports it.

### Handovers

- `PATCH /api/requests/{requestId}/collected`
  - Marks the request's food as collected.
  - Its current Swagger success response schema is generic.

The original capstone brief requires handovers to be completed or reversed. The current Swagger lists the collected operation but does not show a reverse-handover endpoint.

Do not fake a successful reversal locally or invent a reverse endpoint. Record this as an API gap and agree the endpoint and response with the backend engineer before implementing live reversal.

### Administrator dashboard

- `GET /api/admin/dashboard`
  - Returns the following documented statistics:
    - `totalUsers`
    - `totalDonors`
    - `totalRecipients`
    - `totalListings`
    - `availableListings`
    - `reservedListings`
    - `collectedListings`
    - `totalRequests`
    - `pendingRequests`
    - `completedHandovers`
    - `expiredListings` (shown, linked to the Expired listings) and `estimatedPortionsSaved` (not shown: its calculation can't yet be traced; see README, Known limitations)

The documented dashboard response does not include a recent activity list. Do not present invented or mock-derived numbers as live backend statistics, and label portions saved as an estimate.

### API limitations to keep visible

As of 2 November 2026, the deployed OpenAPI document:
- Documents `PATCH /api/handovers/{handoverId}/reverse`, but no listing or request response exposes a `handoverId`, so the interface can't call it yet. Confirm with the backend engineer how a handover id is obtained.
- Documents `expiredListings` and `estimatedPortionsSaved` in the dashboard response. The dashboard shows `expiredListings`; for food saved it totals the listed quantity of Collected listings per unit instead of `estimatedPortionsSaved` (see README, Known limitations). `pendingRequests` also counts pending requests on Collected and Deleted listings; `/admin/requests` shows which are really waiting.
- Documents a separate `GET /api/activity`, not called by the interface. The dashboard response itself has no recent-activity list.

The image upload response schema is generic; the observed reply field is `imageUrl`.

Swagger proves that an endpoint is documented. It does not by itself prove that every role is authorised to use it or that every business rule is enforced. Verify permissions with the backend engineer and service tests.

## FoodBridge business rules and roles

Follow the original TeSA Cohort 6 capstone brief (FoodBridge, pages 6–7) and the team's agreed decisions.

### Donor

- Creates food listings.
- Manages and edits their own listings.
- Deletes their own listings, subject to backend validation and restrictions on listings with requests.
- Views requests on their own listings.
- Approves or declines recipient requests for their own listings.
- Updates the handover status for their own listings.
- Must not approve or decline requests belonging to another donor's listing.

### Recipient

- Browses available listings.
- Searches and filters by keyword, category, pickup area and availability.
- Views listing details.
- Requests food.
- Views and tracks their own requests.
- Cancels an eligible pending request.
- Must not approve or decline requests or edit another user's listing.

### Administrator

- Reviews listings and monitors platform activity.
- Views the administrator dashboard and its available statistics.
- Can edit listings.
- Can update handover status.
- Must not be given donor-only request approval controls under the original brief.
- Must not be given listing verification or administrator-led recipient-allocation workflows unless the product requirements are formally changed and the decision is recorded.

### Permission rules

The original brief states that only the donor who owns a listing, or the administrator, can edit it or change its handover state. These permissions must be enforced by the backend service, not just by hiding buttons.

The original brief says donors approve or decline recipient requests. Do not move this decision to administrators without a formally agreed change to the capstone requirements.

The brief requires donors to create, edit and delete their own listings. The deployed backend also lets administrators delete listings (same status rule as donors), and the interface offers it to them (`canDeleteListing` in `src/utilities/helpers/listing-permissions.ts`).

The backend is the final authority for permissions. Frontend role checks only control what actions are presented to the user; they are not security controls.

### Listing and request integrity

- A listing requires a food name/title, category, quantity, pickup area, collection deadline and donor. The frontend form also requires a description (PR #18).
- A listing can be edited only while it is `AVAILABLE` (`isListingEditable` in `src/utilities/helpers/listing-permissions.ts`: Your listings shows Edit only then, and `src/app/pages/EditListingPage.tsx` explains otherwise; the form handles a backend `LISTING_NOT_EDITABLE` code). The simulated store does not enforce this rule.
- Delete is offered to the owning donor and administrators on Available and Expired listings, disabled with the reason on Collected and Reversed listings (`deleteBlockedReason`), and not offered on Reserved or Deleted ones (`canDeleteListing`), since the backend refuses them. On Listing details, Edit and Delete sit together at the foot of the listing's card. The simulated store follows the backend's delete rule.
- The backend's daily fairness rule refuses a second approval for a recipient on the same Lagos day while another recipient has none (409 `DAILY_DISTRIBUTION_PRIORITY`). Donors can't see who has been served, so the panel can only explain the refusal afterwards; don't invent a client-side eligibility rule.
- An expired listing accepts no new requests.
- An expired listing with an approved request must reach a defined final state rather than remaining open.
- A listing can have at most one approved reservation at a time.
- Three recipients requesting the same listing at the same time must never result in two approved reservations.
- Preserve the existing database constraint `one_approved_request_per_listing`.
- Portions saved must be derived from recorded handovers and labelled as an estimate. Reversing a handover must reverse its contribution to that estimate.
- Do not assume the quantity listed equals the quantity collected. Use only the quantity model agreed by the team and supported by the backend.

## Forms (Formik + Yup)

- Every form uses Formik with a Yup schema. Schemas live in `src/models/validations/`, one per form, e.g. `src/models/validations/listingValidation.ts`.
- Error messages come word for word from the spec where defined.
- Build fields with the adapters in `src/components/ui/form/` (FormInput, FormPasswordInput, FormTextarea, FormSelect, FormCheckbox, FormDate, FormTime, FormImageUpload). They wrap the shared FormField and controls and show an error only after the field is left or the form submitted (`useFieldError`).
- Submit with the shared `Button` and `type="submit"`.
- Every field needs a visible label tied to the input, an error linked with `aria-describedby`, `aria-invalid` when invalid, and an error shown as text (not only a red border).
- On submit with errors, move focus to the first invalid field: put `<FocusFirstError order={[...]} />` inside the form, and use `focusField(name)` after mapping a 400 response.
- Submit buttons show a loading state and ignore extra presses while submitting.
- Client validation is for speed. The service validates again, and its 400 errors map back onto the fields.

## UI components (shared component set)

- UI components come from the shared repo, github.com/spr-tech/interface-eng-shared-components. Its README is the reference for every prop; `.claude/skills/shared-components/` tells Claude Code when to use which.
- The copied shared components each have their own folder, `src/components/ui/<name>/<name>.tsx`: `button`, `card`, `checkbox`, `dialog`, `empty-state`, `error-state`, `filter-bar`, `form-field`, `input`, `select`, `skeleton`, `status-badge`, `textarea` and `toast`. Their `cn` helper is `src/utilities/helpers/cn.ts`. Do not casually change their implementation in this product repository. Fixes go to the shared repo first, then are copied in. Record the shared commit in `../docs/decisions.md` each time.
- When copying a shared component in, put `<name>.tsx` in `src/components/ui/<name>/` and rewrite its import lines to the `@/` alias: `cn` to `@/utilities/helpers/cn`, and sibling components such as `./button` to `@/components/ui/button/button`. Those import lines are the only local change allowed.
- Every other folder in `src/components/ui/` is ours, not the shared repo's: `form/` (Formik adapters), `summary-strip/`, `view-tabs/` and `loading-state/`. FoodBridge-specific behaviour lives in `src/components/content/`, for example `content/listings/shared/StatusBadge.tsx`, which maps our statuses to the shared tones.
- Change the look through token values in `src/styles/tokens.css`, never the names the shared components read. No hard-coded colours.
- Keep Radix's keyboard and focus behaviour intact. Don't remove focus rings.
- Don't add another component library. If the shared set can't cover a need, say so and propose it for the shared repo.

## Statuses (use these words everywhere)

Frontend labels:
- Request: Pending, Approved, Declined, Expired, Cancelled.
- Listing: Available, Reserved, Collected, Expired, Deleted.

The backend response examples describe status as a string. Confirm actual values returned by the deployed service and normalise them centrally in `src/utilities/constants/status.ts` and `src/services/mappers/backend-mappers.ts`.

Do not invent backend status values. In particular, do not treat a frontend label such as Reversed as a confirmed backend listing status without checking the contract and actual response.

Badges always show the word, never colour alone. Map API values to these labels in one place.

The status a **recipient** sees is derived from both the request and the listing status by `getRecipientRequestStatus` in `src/utilities/helpers/request-status.ts` (Pending + Reserved or Collected listing → Declined; Pending + Expired listing → Expired). Use it wherever a recipient's request status is shown or decides whether Cancel appears. It is a display fallback only: it never changes the stored status. The deployed backend leaves competing requests `PENDING`; it should persist them as `DECLINED`. See `README.md`, "Request status display", for the full table and the donor-panel equivalent.

## Every screen has five states

Loading (skeletons), Empty (first use, inviting copy and an action), Error (plain message + Try again), Success (data plus a toast after actions), Confirmation (a dialog before anything hard to undo). The spec gives the exact wording for each screen.

## Accessibility (WCAG 2.2 AA)

- One `h1` per screen, headings in order.
- Fully keyboard operable, focus always visible.
- Toasts and result counts announced through live regions.
- Dialogs trap focus, close on Escape and return focus to the trigger.
- Works from 360px wide upward.

## Copy

- British spelling (organisation, neighbourhood).
- Sentence case.
- Buttons start with a verb.
- Real Lagos place names, fictional organisations only.
- Every page shows "Demonstration data · organisations and people are fictional" when displaying demonstration data. Do not label real live backend data as simulated.

## Don't

- Don't edit the backend service repository from the frontend repository.
- Don't independently edit the authoritative backend OpenAPI contract. Contract changes need both tiers' agreement and a line in `../docs/decisions.md`.
- Don't hard-code data in components. Data comes from the API, or from the mock service when the mock mode is deliberately enabled.
- Don't store tokens in `localStorage` until the authentication approach is agreed (see decisions file). Follow the existing session storage implementation.
- Don't add dependencies without asking first.
- Don't build features outside the capstone scope: no chat, payments, maps, delivery or notifications.
- Don't invent API endpoints, fields, status values, permissions or response properties.
- Don't claim an API action is complete until it has been tested against the deployed backend or the limitation is clearly labelled.
- Don't quietly change the original donor-approval workflow into administrator-led allocation.
- Don't display simulated dashboard statistics as if they came from the live backend.
- Don't bypass backend permissions with frontend-only role checks.

## Git workflow

- The backend integration on `feature/connect-backend` has been merged (PR #16 and #17). Follow-up work uses its own branches (for example `fix/listing-edit-rules`, `fix/collected-status-on-request-cards`, `fix/prevent-second-request-approval`).
- For each task, start on a separate branch from an up-to-date `main` (`git pull` first), named `feature/<name>`, `fix/<name>`, `chore/<name>`, `ci/<name>` or `docs/<name>`. Tell Muizz the branch name when you start.
- When the task is done and lint, typecheck, test and build all pass locally:
  1. Commit with a clear message.
  2. Push the branch with `git push -u origin <branch>`.
  3. Stop. Tell Muizz the branch name, what changed and how it was checked.
- Do NOT open pull requests, merge or turn on auto-merge. Muizz opens and merges pull requests himself.
- Never delete a branch, local or remote. Never push to `main` directly, never merge locally into `main`, never use `--admin`.
- If CI fails on a branch you've pushed, fix the cause on the same branch, push again, and tell Muizz what failed and why.
- Never weaken a check to make it pass: don't delete or skip tests, loosen lint or type rules, or edit the workflow file unless the task is about the pipeline. Never use `git push --force` or `git reset --hard`.
- Every feature adds tests for its own behaviour before it is pushed: at least its form validation, its five states, and any business rule it shows on screen (e.g. no Approve button once a listing has an approved request).

## Working with me (Muizz)

- Before writing code for a new screen or feature, explain the plan and the key decisions, and wait for my go-ahead.
- Explain one part at a time and wait for me to ask for the next.
- Give the full path of every file you mention.
- Spell out abbreviations the first time (RTK = Redux Toolkit).
- Use everyday comparisons when explaining a concept.
- If I explain something back, grade it out of 10 and correct me honestly.
- Push back if an idea of mine is flawed, and say why.