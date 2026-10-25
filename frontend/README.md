# FoodBridge frontend

The interface tier of FoodBridge: Vite, React and TypeScript. See `CLAUDE.md` for how the
code is organised and `../docs/` for the intent, spec and decisions.

The service lives in its own repository: TODO (link). It must allow this site's address,
https://frontend-six-zeta-39.vercel.app, in its CORS (Cross-Origin Resource Sharing) settings, or
the browser blocks every call from the app to the service.

## Pipeline

GitHub Actions runs `.github/workflows/frontend.yml` (at the repository root).

**What runs**

- **check**: on Node 24, `npm ci`, then `npm run lint`, `npm run typecheck`, `npm test` and
  `npm run build`, all inside `frontend/`.
- **deploy**: only after check passes. Uses the Vercel CLI: `vercel pull`, `vercel build --prod`,
  `vercel deploy --prebuilt --prod`. One deploy runs at a time; a second one waits.

**When**

- check runs on every push that changes `frontend/` or the workflow file, and on every pull
  request into `main`.
- deploy runs only on a push to `main`, which in practice means merging a pull request.
- Any failing check stops the deploy.
- Vercel's own Git deploys are turned off in `vercel.json`. Production only changes through this
  pipeline.

**Secrets** (GitHub repository secrets, never committed)

- `VERCEL_TOKEN`: a Vercel access token
- `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`: which Vercel team and project to deploy to

`VITE_API_URL` is not a GitHub secret. It is set in the Vercel project's environment variables,
and `vercel pull` brings it into the build. Vite builds it into the app, so changing it needs a
new deploy.

## Running locally

```bash
cp .env.example .env   # points VITE_API_URL at the mock server
npm install
npm run dev
```
