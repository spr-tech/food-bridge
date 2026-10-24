# FoodBridge frontend

FoodBridge coordinates surplus food: donors list food, recipients request it, the donor approves one request. This folder is the interface tier. The Java service lives in `../backend/` and is not ours to edit.

Built for the TeSA Cohort 6 capstone. Monday 26 Oct 2026 is the MVP checkpoint: donor lists food, recipient requests it, donor approves, all against the deployed service.

## Read these first

- `../docs/intent/foodbridge.md`: what we're building and why
- `../docs/spec/foodbridge-interface.md`: every screen, state, message and rule. Copy wording from here, don't invent it
- `../openapi.yaml`: the contract with the service. Source of truth for every endpoint, field and error
- `../docs/decisions.md`: agreed decisions. Check before changing anything structural

If the spec and `openapi.yaml` disagree, `openapi.yaml` wins. Flag the mismatch instead of guessing.

## Stack

- Vite + React + TypeScript (strict)
- React Router for routing
- Redux Toolkit + RTK Query for server data, using the `injectEndpoints` pattern
- shadcn/ui components in `src/components/ui/`
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
├── app/           # router.tsx, store.ts, providers.tsx (Redux Provider + RouterProvider),
│                  # devRole.ts (the one temporary role constant)
├── assets/        # images and the logo
├── components/
│   ├── ui/        # shadcn primitives (as generated, plus our token, focus and no-dark-mode fixes)
│   ├── form/      # reusable Formik inputs, sharing one FormField wrapper; export from index.ts
│   ├── common/    # StatusBadge, PageHeader, LoadingState, EmptyState, ErrorState
│   └── layout/    # RootLayout, AppLayout, Header, DemoBanner, NavProgress, SkipLink
├── config/        # env.ts: reads VITE_API_URL and throws a clear error if it's missing
├── constants/     # routes.ts (every path; no hard-coded paths anywhere else), roles.ts,
│                  # status.ts (labels and tones), listingOptions.ts (categories, units, areas)
├── contexts/      # empty, with a .gitkeep (Redux holds shared state)
├── docs/          # README.md explaining this structure
├── hooks/         # useRole, useIdempotencyKey, useDocumentTitle, useAppStore (typed Redux hooks)
├── lib/           # utils.ts (cn), format.ts (dates as "Today, 7:00 PM", quantities)
├── pages/         # one thin file per route; a page only composes sections
├── schema/        # Yup schemas, one per form
├── sections/      # page-level blocks
├── services/      # api.ts (the one base createApi); one file per resource, e.g. listings.ts
├── styles/        # tokens.css
├── test/          # setup.ts for Vitest; test files sit next to the code they test
└── types/         # shared types: Role, RequestStatus, ListingStatus
```

## RTK Query rules

- There is exactly one `createApi`, in `src/services/api.ts`, with `endpoints: () => ({})`. Never create a second one.
- Each feature adds its endpoints in its own file with `api.injectEndpoints({ endpoints: (build) => ({ ... }) })`, for example `src/services/listings.ts`, and exports its generated hooks from there.
- `baseQuery` is `fetchBaseQuery` with `baseUrl: env.apiUrl` from `src/config/env.ts`, which reads `VITE_API_URL`. `prepareHeaders` adds:
  - the auth token
  - a new request ID header on every request (name per `openapi.yaml`, proposed `X-Request-Id`)
- Every endpoint must exist in `openapi.yaml`. Never call a path that isn't there. Never use `fetch` or axios directly.
- Request and response types come from `openapi.yaml`. Never use `any`.
- Use `tagTypes` and `providesTags` / `invalidatesTags` so lists refresh after writes. Tag listings by id, plus a `LIST` tag.
- Create listing and Request this food send an idempotency key (proposed header `Idempotency-Key`): generate one UUID when the user submits, reuse it on retry of the same submission.
- The donor's Approve is the one optimistic update. Use `onQueryStarted`: patch the cache with `updateQueryData`, `await queryFulfilled`, and on failure call `patchResult.undo()`, then refetch so the screen shows the service's true state. See spec S5 for the exact messages.
- Handle errors by status code (400, 401, 403, 404, 409, 500) as described in spec section 4.

## Forms (Formik + Yup)

- Every form uses Formik with a Yup schema. Schemas live in `src/schema/`, one per form, e.g. `src/schema/listingSchema.ts`.
- Error messages come word for word from the spec (S2 field table).
- Do NOT use shadcn's `<Form>` component. It is built for React Hook Form and won't work with Formik. Use the shadcn `Input`, `Textarea`, `Select`, `Label` and `Button` directly, wired to Formik.
- Every field: visible label tied to the input, error linked with `aria-describedby`, `aria-invalid` when invalid, error shown as text (not only a red border).
- On submit with errors, move focus to the first invalid field.
- Submit buttons show a loading state and ignore extra presses while submitting.
- Client validation is for speed. The service validates again, and its 400 errors map back onto the fields.

## shadcn/ui

- Add components with `npx shadcn@latest add <name>`. They land in `src/components/ui/`.
- Restyle them to use the tokens in `src/styles/tokens.css`. No hard-coded colours.
- Keep Radix's keyboard and focus behaviour intact. Don't remove focus rings.
- Don't add a component library besides shadcn.

## Statuses (use these words everywhere)

- Request: Pending, Approved, Declined, Expired
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

British spelling (organisation, neighbourhood). Sentence case. Buttons start with a verb. Real Lagos place names, fictional organisations only. Every page shows "Demonstration data · all organisations are fictional".

## Don't

- Don't edit `openapi.yaml` or anything in `../backend/`. Contract changes need both tiers' agreement and a line in `../docs/decisions.md`
- Don't hard-code data in components. Data comes from the API (the mock server while building)
- Don't store tokens in `localStorage` until the auth approach is agreed (see decisions file)
- Don't add dependencies without asking first
- Don't build features outside the spec: no chat, payments, maps, delivery or notifications

## Git workflow

- Every task starts on its own branch from an up-to-date `main` (`git pull` first), named `feature/<name>`, `fix/<name>`, `chore/<name>` or `ci/<name>`. Tell me the branch name when you start.
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
