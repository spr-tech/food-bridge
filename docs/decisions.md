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
