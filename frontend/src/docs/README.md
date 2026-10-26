# How src/ is organised

- `app/`: wiring. Router, store, providers, and `session.ts` (the signed-in session, where the role comes from).
- `pages/`: one thin file per route. A page only puts sections together and sets its title.
- `sections/`: the page-level blocks that pages are made of, one folder per screen.
- `components/`: `ui/` holds the shared component set, copied unchanged from
  github.com/spr-tech/interface-eng-shared-components (never edited here). `form/` holds the
  Formik adapters around the shared controls, `common/` our own patterns (StatusBadge,
  PageHeader, LoadingState), and `layout/` the page frame: the desktop sidebar and top bar,
  the phone top bar, account menu and tab bar, and the logo. Empty and error states use the
  shared EmptyState and ErrorState directly.
- `services/`: RTK Query. `api.ts` is the one `createApi`; each resource adds endpoints in its
  own file with `injectEndpoints`.
- `mocks/`: TEMPORARY. The simulated service the endpoints call until the API exists: the
  rules (`db.ts`), the demo data (`seed.ts`) and the delay and `?simulate=` switches. Screens
  never import from here.
- `schema/`: Yup schemas, one per form.
- `hooks/`: shared hooks, including the typed Redux hooks in `useAppStore.ts`.
- `constants/`: routes, roles, status labels and form options. Paths come only from `routes.ts`.
- `config/`: environment settings (`env.ts`).
- `types/`: shared TypeScript types.
- `lib/`: small helpers (`cn.ts` from the shared repo, formatting).
- `contexts/`: empty on purpose. Shared state lives in Redux.
- `styles/tokens.css`: every colour, font and radius. No hard-coded colours elsewhere.
- `styles/layout.css`: the app frame, including the sidebar flood with its exact timings
  (from `docs/design/foodbridge-final/foodbridge-sidebar-animation.html`).
- `test/setup.ts`: Vitest setup. Test files sit next to what they test, e.g. `lib/format.test.ts`.
