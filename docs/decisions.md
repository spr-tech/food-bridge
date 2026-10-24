# Decisions

One dated entry per decision: what was decided, why, and who agreed.
Changes to `openapi.yaml` need both tiers to agree (two engineers named).

2026-10-23  Frontend stack: Vite + React + TypeScript, React Router.
Why: the brief asks for the interface on a free static host (p.24) and React Router or equivalent (p.24). Vite builds a static site.
Agreed by: Muizz Jamiu (interface). Service engineers informed: TODO

2026-10-24  Server data with RTK Query (injectEndpoints pattern); forms with Formik + Yup; UI components from shadcn/ui.
Why: one tool for server state (avoids the doubled state tools the brief warns about, p.20); shadcn is Radix-based, matching the shared component set's accessibility baseline.
Agreed by: Muizz Jamiu. Shared component group informed: TODO

2026-10-24  Request statuses shown as Pending, Approved, Declined, Expired. Listing statuses: Available, Reserved, Collected, Expired.
Why: one vocabulary across donor and recipient screens.
PROPOSED: needs matching enum values in openapi.yaml. Agreed by: Muizz Jamiu, TODO (service engineer)

2026-10-24  Repository layout: one repo, frontend/ and backend/ folders, openapi.yaml at the root, separate GitHub Actions workflows per folder.
PROPOSED. Agreed by: Muizz Jamiu, TODO (service engineer)

2026-10-24  Optimistic update: the donor approving a request, rolled back if the service refuses (409) or the connection drops.
Why: refusal is an expected outcome (one approval per listing), so the rollback is exercised in the demo.
Agreed by: Muizz Jamiu

2026-10-24  Frontend foundation: Tailwind CSS v4 through the @tailwindcss/vite plugin (theme in CSS, tokens in src/styles/tokens.css). Folder structure by type: app, pages, sections, components (ui, form, common, layout), services, schema, hooks, constants, config, types, lib. React Router data mode (createBrowserRouter) with every page loaded lazily as its own chunk. Caching: RTK Query's default keepUnusedDataFor (60s), setupListeners for refetch on focus and reconnect, list endpoints to use refetchOnMountOrArgChange: 30 and refetchOnReconnect, listing cards to prefetch detail on hover and focus (ifOlderThan: 30). Endpoints hand-written with injectEndpoints until openapi.yaml exists.
Why: Tailwind v4 is what the current shadcn/ui CLI supports; lazy routes keep the first load small on slow connections; short refetch windows keep shared listings fresh without refetching on every visit.
Agreed by: Muizz Jamiu
