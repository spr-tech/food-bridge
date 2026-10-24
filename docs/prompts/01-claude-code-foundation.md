Use in Claude Code, opened in foodbridge/frontend, in plan mode (Shift+Tab).

```
Read CLAUDE.md, ../docs/intent/foodbridge.md and ../docs/spec/foodbridge-interface.md
before anything else. ../openapi.yaml does not exist yet; do not invent endpoints.

Task: set up the foundation of the FoodBridge frontend. No real screens and no API calls
yet. Just the base everything else will sit on.

Scope:
1. Install and configure: Tailwind CSS (check which version works with Vite and shadcn
   today), shadcn/ui (init only, then add: button, input, textarea, label, select,
   checkbox, card, badge, dialog, sonner for toasts, skeleton), Redux Toolkit + React
   Redux, React Router, Formik, Yup, @fontsource/fraunces and @fontsource/dm-sans.
2. src/styles/tokens.css with these values, and wire them into Tailwind and shadcn's
   theme variables so shadcn components use them:
   --color-bg #f7f6f2; --color-surface #ffffff; --color-surface-2 #efede6;
   --color-border #dedad0; --color-border-input #8a877c; --color-text #1c2621;
   --color-text-muted #55605a; --color-primary #1f5c45; --color-primary-hover #184a37;
   --color-on-primary #ffffff; --color-brand-dark #1f4a3a; --color-accent #b4532a;
   --color-logo #e0a46b; --color-danger #a8321f; --color-focus #c2410c;
   --radius-md 10px; --font-sans "DM Sans", system-ui, sans-serif;
   --font-display Fraunces, Georgia, serif.
   Load only the font weights we use: Fraunces 400 and 600, DM Sans 400, 500, 600, 700.
3. src/app/api.ts: the one base createApi (fetchBaseQuery, baseUrl from
   import.meta.env.VITE_API_URL, endpoints: () => ({}), tagTypes for Listing and
   Request). prepareHeaders adds an X-Request-Id header with a new UUID per request.
   Leave the auth header as a TODO.
4. src/app/store.ts and src/app/hooks.ts (typed hooks).
5. src/app/router.tsx with every route from spec section 2. Each route renders a
   placeholder page showing only its h1, so I can click through.
6. A layout with the header (logo, role-based nav from the spec, signed-in name, sign out)
   and the "Demonstration data · all organisations are fictional" banner. Hard-code the
   role as "donor" behind a single constant for now so I can switch it by hand.
7. src/lib/status.ts with the request and listing status labels from the spec, mapping
   API values to labels. API values are TBC, so use placeholders and mark them TODO.
8. .env.example with VITE_API_URL=http://127.0.0.1:4010
9. package.json scripts: dev, build, lint, typecheck (tsc --noEmit).

Out of scope: real screens, forms, API endpoints, auth logic, tests, CI.

First, show me your plan: the steps in order, every file you will create or change with
its full path, and any decision I need to make (for example the Tailwind version). Wait
for my approval. When you're done, run lint, typecheck and build, and tell me the results.
```
