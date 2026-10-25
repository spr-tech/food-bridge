# FoodBridge frontend

FoodBridge coordinates surplus food: donors list food, recipients request it, the donor approves one request. This repository is the interface tier. The Java service lives in a separate repository owned by the service engineers (link TODO); never edit it from here.

Built for the TeSA Cohort 6 capstone. Monday 26 Oct 2026 is the MVP checkpoint: donor lists food, recipient requests it, donor approves, all against the deployed service.

## Read these first

- `../docs/intent/foodbridge.md`: what we're building and why
- `../docs/spec/foodbridge-interface.md`: every screen, state, message and rule. Copy wording from here, don't invent it
- `../openapi.yaml`: the contract with the service. Source of truth for every endpoint, field and error
- `../docs/decisions.md`: agreed decisions. Check before changing anything structural

If the spec and `openapi.yaml` disagree, `openapi.yaml` wins. Flag the mismatch instead of guessing.

`../openapi.yaml` stays the contract path. If the contract's source moves to the backend repository, the copy here is read-only: it is only updated by syncing from the source, never edited directly.

## Design

- Build every screen from `../docs/design/foodbridge-final/`. Read `source-html/` and `foodbridge-sidebar-animation.html` for exact values; don't approximate from the PNGs. Before pushing a screen, list any difference from its design.
- Spec section 12 ("Visual design") lists the deliberate differences from the design files (contrast fixes, one `h1`, phone Sign out). Where they disagree, section 12 wins.

## Stack

- Vite + React + TypeScript (strict)
- React Router for routing
- Redux Toolkit + RTK Query for server data, using the `injectEndpoints` pattern
- UI components from the shared component set (github.com/spr-tech/interface-eng-shared-components), copied into `src/components/ui/`
- Formik for forms, Yup for validation schemas
- Tailwind CSS, colours and fonts from `src/styles/tokens.css`
- Fonts: Fraunces (headings) and DM Sans (body) via `@fontsource`

## Commands

```bash
npm run dev         # local dev server
npm run build       # production build
npm run lint        # ESLint
npm run typecheck   # tsc -b
npm test            # Vitest
npx @stoplight/prism-cli mock ../openapi.yaml   # mock server on http://127.0.0.1:4010
```

Before saying a task is done, run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`. All four must pass. CI runs the same checks and blocks the deploy on failure.

## Environment

- `VITE_API_URL`: the API address. Mock server locally, Render service in production
- Never commit `.env` files or secrets

## Folder structure

```
src/
├── app/           # router.tsx, store.ts (makeStore), providers.tsx (Redux Provider + RouterProvider),
│                  # session.ts (the signed-in session in sessionStorage),
│                  # devRole.ts (the one temporary role constant)
├── assets/        # images, logo-icon-dark.svg and logo-icon-light.svg (icon only; the wordmark is text)
├── components/
│   ├── ui/        # shared components, copied unchanged from the shared repo (never edited here)
│   ├── form/      # Formik adapters around the shared FormField and controls; export from index.ts
│   ├── common/    # StatusBadge (our statuses on the shared badge), PageHeader, LoadingState
│   └── layout/    # RootLayout, AppLayout (frame and sidebar flood state), Sidebar, TopBar,
│                  # PhoneTopBar, AccountMenu, TabBar, Logo, NavIcons, DemoBanner, NavProgress, SkipLink
├── config/        # env.ts: reads VITE_API_URL and throws a clear error if it's missing
├── constants/     # routes.ts (every path; no hard-coded paths anywhere else), roles.ts,
│                  # status.ts (labels and tones), listingOptions.ts (categories, units, areas)
├── contexts/      # empty, with a .gitkeep (Redux holds shared state)
├── docs/          # README.md explaining this structure
├── hooks/         # useRole, useIdempotencyKey, useDocumentTitle, useAppStore (typed Redux hooks),
│                  # useSidebarTheme (sessionStorage), useSignOut, useMediaQuery, useNavCounts
├── lib/           # cn.ts (from the shared repo), format.ts (dates as "Today, 7:00 PM", quantities)
├── mocks/         # TEMPORARY simulated service: db.ts (the rules), seed.ts (demo data),
│                  # simulate.ts (delay and the dev-only ?simulate=error|empty|slow switches)
├── pages/         # one thin file per route; a page only composes sections
├── schema/        # Yup schemas, one per form
├── sections/      # page-level blocks
├── services/      # api.ts (the one base createApi); auth.ts, listings.ts, requests.ts (the hooks
│                  # screens use); errors.ts (reading status, code and field errors)
├── styles/        # tokens.css; layout.css (the app frame and the sidebar flood's exact timings)
├── test/          # setup.ts for Vitest, render.tsx (renderRoutes, signInAs); tests sit next to their code
└── types/         # shared types: Role, RequestStatus, ListingStatus; api.ts (Listing, ListingRequest, Session)
```

## RTK Query rules

- There is exactly one `createApi`, in `src/services/api.ts`, with `endpoints: () => ({})`. Never create a second one.
- Each feature adds its endpoints in its own file with `api.injectEndpoints({ endpoints: (build) => ({ ... }) })`, for example `src/services/listings.ts`, and exports its generated hooks from there.
- `baseQuery` is `fetchBaseQuery` with `baseUrl: env.apiUrl` from `src/config/env.ts`, which reads `VITE_API_URL`. `prepareHeaders` adds:
  - the auth token
  - a new request ID header on every request (name per `openapi.yaml`, proposed `X-Request-Id`)
- Every endpoint must exist in `openapi.yaml`. Never call a path that isn't there. Never use `fetch` or axios directly.
- TEMPORARY, until the API and `openapi.yaml` exist: every endpoint is simulated with `queryFn` calling `src/mocks/`. Screens only ever use the hooks exported from `src/services/`, never `src/mocks/`. When the API arrives, each `queryFn` becomes `query`, and the screens don't change. Keep `src/mocks/db.ts` enforcing the same rules the service must.
- Request and response types come from `openapi.yaml`. Never use `any`.
- Use `tagTypes` and `providesTags` / `invalidatesTags` so lists refresh after writes. Tag listings by id, plus a `LIST` tag.
- Create listing and Request this food send an idempotency key (proposed header `Idempotency-Key`): generate one UUID when the user submits, reuse it on retry of the same submission.
- The donor's Approve is the one optimistic update. Use `onQueryStarted`: patch the cache with `updateQueryData`, `await queryFulfilled`, and on failure call `patchResult.undo()`, then refetch so the screen shows the service's true state. See spec S5 for the exact messages.
- Handle errors by status code (400, 401, 403, 404, 409, 500) as described in spec section 4.

## Forms (Formik + Yup)

- Every form uses Formik with a Yup schema. Schemas live in `src/schema/`, one per form, e.g. `src/schema/listingSchema.ts`.
- Error messages come word for word from the spec (S2 field table).
- Build fields with the adapters in `src/components/form/` (FormInput, FormTextarea, FormSelect, FormCheckbox, FormDateTime, FormImageUpload). They wrap the shared FormField and controls and show an error only after the field is left or the form submitted (`useFieldError`). Submit with the shared `Button` and `type="submit"`.
- Every field: visible label tied to the input, error linked with `aria-describedby`, `aria-invalid` when invalid, error shown as text (not only a red border). The shared FormField does this; the shared Checkbox can't show an error itself, so FormCheckbox puts it in the checkbox's description.
- On submit with errors, move focus to the first invalid field.
- Submit buttons show a loading state and ignore extra presses while submitting.
- Client validation is for speed. The service validates again, and its 400 errors map back onto the fields.

## UI components (shared component set)

- UI components come from the shared repo, github.com/spr-tech/interface-eng-shared-components. Its README is the reference for every prop; `.claude/skills/shared-components/` tells Claude Code when to use which.
- The copied files in `src/components/ui/` (and `src/lib/cn.ts`) are never edited here. Fixes go to the shared repo first, then are copied in unchanged. Record the shared commit in `../docs/decisions.md` each time.
- FoodBridge-specific behaviour lives in our own wrappers: `src/components/form/` (Formik adapters) and `src/components/common/` (for example StatusBadge, which maps our statuses to the shared tones).
- Change the look through token values in `src/styles/tokens.css`, never the names the shared components read. No hard-coded colours.
- Keep Radix's keyboard and focus behaviour intact. Don't remove focus rings.
- Don't add another component library. If the shared set can't cover a need, say so and propose it for the shared repo.

## Statuses (use these words everywhere)

- Request: Pending, Approved, Declined, Expired, Cancelled
- Listing: Available, Reserved, Collected, Expired

Badges always show the word, never colour alone. Map API values to these labels in one place, `src/constants/status.ts`.

## Every screen has five states

Loading (skeletons), Empty (first use, inviting copy and an action), Error (plain message + Try again), Success (data plus a toast after actions), Confirmation (a dialog before anything hard to undo). The spec gives the exact wording for each screen.

## Accessibility (WCAG 2.2 AA)

- One `h1` per screen, headings in order
- Fully keyboard operable, focus always visible
- Toasts and result counts announced through live regions
- Dialogs trap focus, close on Escape, return focus to the trigger
- Works from 360px wide upward

## Copy

British spelling (organisation, neighbourhood). Sentence case. Buttons start with a verb. Real Lagos place names, fictional organisations only. Every page shows "Demonstration data · organisations and people are fictional".

## Don't

- Don't edit `openapi.yaml` or the service's repository. Contract changes need both tiers' agreement and a line in `../docs/decisions.md`
- Don't hard-code data in components. Data comes from the API (the mock server while building)
- Don't store tokens in `localStorage` until the auth approach is agreed (see decisions file)
- Don't add dependencies without asking first
- Don't build features outside the spec: no chat, payments, maps, delivery or notifications

## Git workflow

- Every task starts on its own branch from an up-to-date `main` (`git pull` first), named `feature/<name>`, `fix/<name>`, `chore/<name>`, `ci/<name>` or `docs/<name>` (documentation only). Tell me the branch name when you start.
- When the task is done and lint, typecheck, test and build all pass locally:
  1. Commit with a clear message.
  2. Push the branch with: `git push -u origin <branch>`
  3. Stop. Tell me the branch name, what changed, and how it was checked.
- Do NOT open pull requests, merge, or turn on auto-merge. I open and merge pull requests myself.
- Never delete a branch, local or remote. Never push to `main` directly, never merge locally into `main`, never use `--admin`.
- If CI fails on a branch you've pushed, fix the cause on the same branch, push again, and tell me what failed and why.
- Never weaken a check to make it pass: don't delete or skip tests, loosen lint or type rules, or edit the workflow file unless the task is about the pipeline. Never use `git push --force` or `git reset --hard`.
- Every feature adds tests for its own behaviour before it's pushed: at least its form validation, its five states, and any business rule it shows on screen (e.g. no Approve button once a listing has an approved request).

## Working with me (Muizz)

- Before writing code for a new screen or feature, explain the plan and the key decisions, and wait for my go-ahead
- Explain one part at a time and wait for me to ask for the next
- Give the full path of every file you mention
- Spell out abbreviations the first time (RTK = Redux Toolkit)
- Use everyday comparisons when explaining a concept
- If I explain something back, grade it out of 10 and correct me honestly
- Push back if an idea of mine is flawed, and say why
