# Decisions

One dated entry per decision: what was decided, why, and who agreed.
Changes to `openapi.yaml` need both tiers to agree (two engineers named).

2026-10-23  Frontend stack: Vite + React + TypeScript, React Router.
Why: the brief asks for the interface on a free static host (p.24) and React Router or equivalent (p.24). Vite builds a static site.
Agreed by: Muizz Jamiu (interface).
Informed: Adedayo Aboderin, Esther Ebagua, 2026-10-24

2026-10-24  Server data with RTK Query (injectEndpoints pattern); forms with Formik + Yup; UI components from shadcn/ui.
Why: one tool for server state (avoids the doubled state tools the brief warns about, p.20); shadcn is Radix-based, matching the shared component set's accessibility baseline.
Agreed by: Muizz Jamiu. Shared component group informed: TODO
Informed: Adedayo Aboderin, Esther Ebagua, 2026-10-24
Superseded in part on 2026-10-25 (UI components only; RTK Query and Formik + Yup stand), see below.

2026-10-24  Request statuses shown as Pending, Approved, Declined, Expired. Listing statuses: Available, Reserved, Collected, Expired.
Why: one vocabulary across donor and recipient screens.
PROPOSED: needs matching enum values in openapi.yaml. Agreed by: Muizz Jamiu, TODO (service engineer)

2026-10-24  Repository layout: one repo, frontend/ and backend/ folders, openapi.yaml at the root, separate GitHub Actions workflows per folder.
PROPOSED. Agreed by: Muizz Jamiu, TODO (service engineer)
Superseded on 2026-10-24, see below.

2026-10-24  Two repositories. Frontend: github.com/spr-tech/food-bridge. Backend: separate repository owned by the service engineers (link TODO). openapi.yaml: one source copy only. Until the team decides its final home, the draft lives at the root of this repo; if it moves to the backend repo, this repo keeps a synced read-only copy and every change goes to the source first.
Why: the service engineers chose their own repo; one source copy prevents the two tiers drifting apart.
PROPOSED. Agreed by: Muizz Jamiu, TODO (service engineer)

2026-10-24  Optimistic update: the donor approving a request, rolled back if the service refuses (409) or the connection drops.
Why: refusal is an expected outcome (one approval per listing), so the rollback is exercised in the demo.
Agreed by: Muizz Jamiu
Informed: Adedayo Aboderin, Esther Ebagua, 2026-10-24

2026-10-24  Frontend foundation: Tailwind CSS v4 through the @tailwindcss/vite plugin (theme in CSS, tokens in src/styles/tokens.css). Folder structure by type: app, pages, sections, components (ui, form, common, layout), services, schema, hooks, constants, config, types, lib. React Router data mode (createBrowserRouter) with every page loaded lazily as its own chunk. Caching: RTK Query's default keepUnusedDataFor (60s), setupListeners for refetch on focus and reconnect, list endpoints to use refetchOnMountOrArgChange: 30 and refetchOnReconnect, listing cards to prefetch detail on hover and focus (ifOlderThan: 30). Endpoints hand-written with injectEndpoints until openapi.yaml exists.
Why: Tailwind v4 is what the current shadcn/ui CLI supports; lazy routes keep the first load small on slow connections; short refetch windows keep shared listings fresh without refetching on every visit.
Agreed by: Muizz Jamiu
Informed: Adedayo Aboderin, Esther Ebagua, 2026-10-24

2026-10-24  Frontend pipeline and Git workflow. GitHub Actions (.github/workflows/frontend.yml) runs a "check" job (lint, typecheck, Vitest tests, build on Node 24) on every push that touches frontend/ and on every pull request into main. A "deploy" job runs only on push to main after check passes and deploys to Vercel production with the Vercel CLI (pull, build --prod, deploy --prebuilt --prod), one deploy at a time. Vercel's own Git deploys are off (frontend/vercel.json), so production only changes through the pipeline. Git workflow: one branch per task from an up-to-date main (feature/, fix/, chore/, ci/); the owner opens and merges pull requests after the check job passes; branches are never deleted; no direct pushes to main.
Why: the brief requires tests, type checking and linting on every push, any failure blocking the deploy, and deploys only through the pipeline (p.24).
Agreed by: Muizz Jamiu
Informed: Adedayo Aboderin, Esther Ebagua, 2026-10-24
Updated 2026-10-25: docs/ added to the branch prefixes, for documentation-only tasks.

2026-10-25  Final visual design and navigation, from docs/design/foodbridge-final/ (replaces monday-screens/). Desktop: a 248px sidebar with role-based links (donor: Your listings, Share food, Requests; recipient: Find food, Your requests), Collections and Impact shown disabled as "Coming soon", and the account (avatar, organisation, role, Sign out) at the top right with no chevron. The sidebar starts dark green after sign-in; the first click on any sidebar link plays the flood animation once (cream rises through the sidebar, flows across the top bar, then a green line fills "Food"), and it stays cream for the session (sessionStorage; signing out resets it; a refresh doesn't replay it; reduced motion switches instantly). Find food cards get "View listing" and "Request food" side by side, so a request can be sent from the card as well as the detail page. Phone (below 768px): no sidebar, a cream top bar with the logo and an avatar menu holding Sign out, and a cream bottom tab bar. A donor Requests screen (S8, /requests) is added; its endpoint is TBC, so Monday's approve stays on listing details (S5). Removed: Google sign-in, Create account, notifications bell, Dashboard, Transactions, Profile and Settings links, "Save for later", the Share food preview card. The demonstration label becomes "Demonstration data · organisations and people are fictional". Five design colours that failed WCAG contrast are replaced (spec section 12).
Why: one finished look for Monday, with fewer links so each role sees only what works today; requesting from the card saves a page visit; the animation marks the move from welcome to work once, without repeating.
Agreed by: Muizz Jamiu

2026-10-25  UI components from the interface engineers' shared component set (github.com/spr-tech/interface-eng-shared-components), replacing shadcn/ui. Copied from the shared repo's main at commit dbe1cac1f5e6e0838331e35b8da482ab4a1497fc: button, form-field, input, textarea, select, checkbox, card, dialog, toast, status-badge, skeleton, empty-state, error-state, filter-bar and lib/cn.ts, all byte-identical (no lines changed). The copies are never edited here; fixes go to the shared repo first and are copied in. FoodBridge behaviour lives in our wrappers: Formik adapters in components/form/ and StatusBadge in components/common/, which maps our statuses to the shared tones and sets the spec section 12 badge colours on the badge itself. Our tokens.css keeps FoodBridge's values and defines every variable the shared components read, plus --color-info, --color-on-info, --color-surface-hover and --font-display from the shared repo's unmerged feature/complete-tokens branch. Contrast with our values (text 4.5:1, borders and focus 3:1): text 13.75 on the page and 14.87 on white; muted text 5.27, 5.70 and 4.86 on surface-hover; danger text 6.18; white on primary 7.85 and on primary-hover 10.13, on danger 6.69 and on danger-hover 8.76, on success 6.31, on warning 6.79, on info 8.53; input border 3.33 on the page, 3.60 on white, 3.07 on surface-hover; focus 4.79, 5.18 and 4.42. One shared failure, reported to the shared repo: the Select's highlighted option differs from the list only by --color-surface on --color-bg (1.08:1 with our values, 1.09:1 with the shared defaults).
Why: the brief requires all eight products to use the shared set (p.3) and the interface to be drawn from it (p.24).
Agreed by: Muizz Jamiu
Informed: Ehimare J. Okosun, Victor Oyeleke, Ufoma Onowho

2026-10-25  Simulated data layer until the API exists. Every endpoint is a real RTK Query endpoint added with injectEndpoints whose queryFn calls a simulated store in frontend/src/mocks/ (instead of query calling the service). Screens use only the hooks in src/services/: useSignIn, useListings, useListing, useCreateListing, useMyListings, useListingRequests, useCreateRequest, useDecideRequest, useCancelRequest, useMyRequests. When the API arrives, each queryFn becomes query and the screens don't change. The store keeps its data in sessionStorage (key foodbridge.mock-db, separate from the session), so it survives signing out and in as another demo account in the same tab. The session (token, account, role, organisation name) is kept in sessionStorage (key foodbridge.session) until the auth approach is agreed; signing out clears only the session. The demo line says "(simulated)" while data is simulated (brief p.3). Dev builds read ?simulate=error, ?simulate=empty and ?simulate=slow.
The store enforces the rules the service must, with these error codes, proposed for openapi.yaml: 401 INVALID_CREDENTIALS (sign in), 401 SESSION_EXPIRED, 403 NOT_ALLOWED (wrong role), 403 NOT_OWNER (not the listing's donor, or not the request's recipient), 404 LISTING_NOT_FOUND, 404 REQUEST_NOT_FOUND, 400 VALIDATION_FAILED (with a message per field), 409 LISTING_ALREADY_RESERVED (a second approval; approving one request declines the other pending ones), 409 LISTING_EXPIRED (requesting or approving past the deadline), 409 LISTING_NOT_AVAILABLE (requesting a reserved or collected listing), 409 ALREADY_REQUESTED (the same recipient twice), 409 REQUEST_NOT_PENDING. A repeated idempotency key returns the original result. A pending request on a listing past its deadline reads as EXPIRED.
Why: there is no service or openapi.yaml yet; queryFn endpoints give screens the real hooks, cache, tags and error shapes now, so swapping in the service changes only the inside of each endpoint.
PROPOSED: the codes and request statuses need confirming in openapi.yaml. Agreed by: Muizz Jamiu, TODO (service engineer)

2026-10-25  A recipient can cancel their own request while it is still PENDING. New request status CANCELLED (on screen "Cancelled", neutral tone). Only the recipient who made the request can cancel it (403 otherwise); only a PENDING request can be cancelled (409 REQUEST_NOT_PENDING otherwise). A cancelled request no longer counts as pending (navigation counts, a listing's pending requests) and doesn't stop the recipient requesting that listing again. Cancelling an approved request is out of scope for now. The simulated store enforces this (useCancelRequest); the Cancel button comes in batch 2 on Your requests and Listing details.
Why: a recipient whose plans change should free the food for others instead of leaving the donor waiting.
PROPOSED: a new rule for the service. Agreed by: Muizz Jamiu, TODO (service engineer)

2026-10-26  Canonical Tailwind classes, enforced by ESLint. Added eslint-plugin-better-tailwindcss 4.10.0 (dev dependency) with one rule, enforce-canonical-classes (rootFontSize 16, collapse off), for every file except the copied shared components in src/components/ui/. 29 classes in our files were replaced with their canonical form (for example md:p-[26px] became md:p-6.5); each pair was checked to compute the same value at the default 16px root font size. Arbitrary values stay only where no standard class gives exactly that value. Collapsing pairs ("text-3xl leading-tight" into "text-3xl/tight") is off, because it changes the line height when a responsive size follows. The rule reads className and cn(), not plain string constants.
Why: the editor flagged arbitrary values that have a standard class; a lint rule keeps new code consistent and CI enforces it.
Agreed by: Muizz Jamiu

2026-10-26  One demo account per role, matching the service: donor@foodbridge.test (Mama's Oven), recipient@foodbridge.test (Hope Community Kitchen) and admin@foodbridge.test, all with the README's password. The emails are TBC until the service engineers confirm theirs. In the simulated store, Ajegunle Food Bank and Grace Shelter become organisations without a login, so a listing can still have several requests and some can be declined. Replaces the five accounts in the 2026-10-25 simulated data entry.
Why: the sign-in page should offer the accounts the service will have, no more.
Agreed by: Muizz Jamiu. Emails TBC: TODO (service engineer)

2026-10-26  Demo switch ?simulate=offline: while the data is simulated, every save (publish, request, approve, decline, cancel) fails as if the connection dropped, in every build including the deployed demo; reads still work. Dev and demo only: it lives in frontend/src/mocks/simulate.ts and goes when the simulated layer does. The dev-only switches (error, empty, slow) stay dev-only.
Why: the simulated data lives in one browser tab, so a dropped connection and its rollback can't otherwise be shown live.
Agreed by: Muizz Jamiu
