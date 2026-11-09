# How src/ is organised

The layout follows section 2 of the frontend structure guide, adapted for Vite + React Router.
`CLAUDE.md` has the folder tree and a "Where things go" table for new files.

- `app/`: routing only. `routes.tsx` (route table and role rules), `router.tsx`, `providers.tsx`,
  and `pages/`: one thin file per route. A page puts content components together and sets its
  title. `pages/dev/` holds the form preview page.
- `components/`:
  - `ui/`: generic components that know nothing about FoodBridge, one folder per component.
    Fourteen of them are the shared component set from
    github.com/spr-tech/interface-eng-shared-components (`button`, `card`, `checkbox`, `dialog`,
    `empty-state`, `error-state`, `filter-bar`, `form-field`, `input`, `select`, `skeleton`,
    `status-badge`, `textarea`, `toast`). They are copied in with only their import lines
    rewritten to the `@/` alias. The rest are ours: `form/` (the Formik adapters around the
    shared controls), `summary-strip/`, `view-tabs/` and `loading-state/`. Empty and error
    states use the shared EmptyState and ErrorState directly.
  - `layouts/`: the page frame. The route guards (RequireSession, RequireRole), the desktop
    sidebar and top bar, the phone top bar, account menu and tab bar, the logo, PageContainer
    and PageHeader.
  - `content/`: the feature screens, grouped by domain: `auth/`, `landing/`, `listings/`,
    `requests/` and `admin/`. Each screen has its own folder, with `forms/` and `modals/`
    subfolders where it has them. Pieces several screens share sit in the domain's `shared/`
    folder, e.g. `listings/shared/StatusBadge.tsx` and `requests/shared/CancelRequestButton.tsx`
    (the cancel flow shared by Listing details and Your requests).
- `services/`: RTK Query endpoints. Each resource adds endpoints to the one `createApi` with
  `injectEndpoints` in its own file (`auth.ts`, `listings.ts`, `requests.ts`, `admin.ts`).
  Each endpoint calls the live backend, or the simulated store when mocks are on.
  `mappers/backend-mappers.ts` turns backend responses into our types.
- `configs/`: `env.ts` (environment settings), `serviceConfig.ts` (the one `createApi`) and
  `storeConfig.ts` (the Redux store).
- `models/`: the TypeScript shapes and the Yup schemas, one file per backend controller or
  subject. Import each type from the file it lives in; there is no re-export index.
  - `requests/`: what we send: backend request bodies (`BackendLoginRequest`,
    `BackendCreateListingRequest`) and the inputs and filters the services take
    (`CreateListingInput`, `ListingFilters`, `AdminRequestFilters`).
  - `responses/`: what the backend sends back, as its contract describes it
    (`BackendListingResponse`, `BackendFoodRequest`, ...), plus the error body (`ApiErrorBody`).
  - `entities/`: the app's own shapes that screens use, produced by the mappers
    (`Listing`, `ListingRequest`, `Session`, `CompletedHandover`, ...).
  - `validations/`: Yup schemas, one per form.
- `stores/`: client-only state. `sessionStore.ts` holds the signed-in session, where the role
  comes from.
- `mocks/`: the simulated service, used when `VITE_USE_MOCKS` is not `false` and by the
  tests (except `*.live.test.tsx`, which stub `fetch` instead): the rules (`db.ts`), the demo
  data (`seed.ts`) and the delay and `?simulate=` switches. Screens never import from here.
- `utilities/`:
  - `hooks/`: shared hooks, including the typed Redux hooks in `useAppStore.ts`.
  - `helpers/`: small helpers: `cn.ts` from the shared repo, `format.ts`, `deadline.ts`
    (collection date and time), `photo.ts` (shrinks a photo for the simulated store),
    `request-status.ts` (the status a recipient sees, from the request and listing status),
    `listing-permissions.ts` (who is offered Delete and Edit), `listing-search.ts` (Find
    food's search and pickup area matching), `pagedQuery.ts` (reads every page of a list) and
    `apiErrors.ts` (reads status, code and field errors, so screens choose their own message).
  - `constants/`: routes, roles, status labels and form options. Paths come only from `routes.ts`.
  - `enums/`: fixed value lists as TypeScript types: the app's `Role`, `ListingStatus` and
    `RequestStatus`, and the backend's `BackendRole`, `BackendListingState`,
    `BackendRequestState`, `BackendFoodCategory` and `BackendFoodUnit`.
- `styles/tokens.css`: every colour, font and radius. No hard-coded colours elsewhere.
- `styles/layout.css`: the app frame. The sidebar stays dark green; there is no longer a
  sidebar flood animation.
- `test/`: `setup.ts` (Vitest setup), `render.tsx` (render routes, sign in as a demo account,
  find a toast's action) and `mockDb.ts` (change the simulated data behind a screen). Test
  files sit next to what they test, e.g. `utilities/helpers/format.test.ts`. Tests that render
  a page to check a feature sit in that feature's `content/` folder.
