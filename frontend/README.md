# FoodBridge — Frontend

The FoodBridge frontend is the user interface for a surplus-food sharing platform connecting food donors with recipient organisations in Lagos, Nigeria.

Donors can publish available food, recipients can browse and request listings, and donors can approve or decline requests. Donors or administrators can update the handover status.

## Live deployments

| Environment | URL | Purpose |
|---|---|---|
| Primary production | https://frontend-six-zeta-39.vercel.app | Main deployment, published through GitHub Actions |
| Secondary backup | https://food-bridge--elmirvhe3.qocent.app/ | Backup deployment; automatic updates from GitHub are not yet confirmed |

The Vercel deployment is the primary production deployment. The existing GitHub Actions workflow runs the frontend checks before deploying to Vercel. Keep this workflow and its Vercel configuration in place.

## Backend

- **Backend repository:** https://github.com/dayosvoid/foodbridge-backend
- **Live API:** https://foodbridge-backend-rg9f.onrender.com
- **API documentation:** https://foodbridge-backend-rg9f.onrender.com/swagger-ui/index.html
- **OpenAPI JSON:** https://foodbridge-backend-rg9f.onrender.com/v3/api-docs

The frontend communicates with the backend through the service files in `src/services/`.

## Technology stack

- React
- TypeScript
- Vite
- Redux Toolkit and RTK Query
- React Router
- CSS
- Vitest for tests

## Project structure

```text
frontend/
├── public/
├── src/
│   ├── app/             # Application setup and routing
│   ├── components/      # Shared UI components
│   ├── config/          # Environment configuration
│   ├── constants/       # Roles, options and demo accounts
│   ├── hooks/           # Reusable application hooks
│   ├── mocks/           # Mock data and mock behaviour
│   ├── sections/        # Feature screens and sections
│   ├── services/        # API and RTK Query services
│   ├── styles/          # Global and layout styles
│   ├── types/           # TypeScript types
│   └── main.tsx
├── .env.example
├── package.json
└── vite.config.ts
```

## Getting started

Run these commands from the `frontend` directory:

```bash
npm install
```

Create your local environment file from the example:

```bash
cp .env.example .env
```

For live backend integration, configure the environment variables as follows:

```env
VITE_API_URL=https://foodbridge-backend-rg9f.onrender.com
VITE_USE_MOCKS=false
```

For local mock-data development, set `VITE_USE_MOCKS=true`.

Start the development server:

```bash
npm run dev
```

## Available scripts

Run these from `frontend/`:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run tests |
| `npm run build` | Build the production frontend |

Before pushing changes, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Main user workflows

### Donor
1. Sign in with a donor account.
2. Publish a surplus-food listing.
3. View and manage the donor's listings.
4. Review recipient requests.
5. Approve or decline a request.
6. Update the handover status when collection is completed.

### Recipient
1. Sign in with a recipient account.
2. Browse available food listings.
3. Search and filter listings.
4. Open a listing to view its details.
5. Submit a request.
6. Track and cancel requests where applicable.

### Administrator
The administrator dashboard provides an overview of platform activity. Under the current project workflow, administrators monitor activity and can assist with listing edits and handover-status updates. Donors make the decision to approve or decline recipient requests.

## Demo accounts

The frontend includes mock demo accounts for development and interface testing:

| Role | Email | Password |
|---|---|---|
| Donor | `donor@foodbridge.test` | `FoodBridge-demo-2026` |
| Recipient | `recipient@foodbridge.test` | `FoodBridge-demo-2026` |
| Administrator | `admin@foodbridge.test` | `FoodBridge-demo-2026` |

These are mock credentials. They are not the same as the seeded accounts on the live backend.

## API integration

The frontend service layer is organised into:

- `src/services/api.ts` — shared API configuration.
- `src/services/auth.ts` — authentication.
- `src/services/listings.ts` — food listings and image uploads.
- `src/services/requests.ts` — recipient requests and handover actions.
- `src/services/backend-mappers.ts` — maps backend responses to frontend types.

The frontend uses the backend API for authentication, listings, image uploads, requests and dashboard statistics.

The backend stores image references while the actual images are hosted through Cloudinary.

## GitHub Actions and deployment

The workflow is located at:

```text
.github/workflows/frontend.yml
```

The existing workflow:

1. Installs frontend dependencies.
2. Runs linting.
3. Runs TypeScript checks.
4. Runs tests.
5. Builds the frontend.
6. Deploys to Vercel production only after the checks pass and the change is pushed to `main`.

The Vercel deployment uses these GitHub Actions secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Do not commit secrets or local `.env` files.

## Known limitations

- The backend currently exposes summary dashboard statistics; recent activity and estimated portions saved are not included in the documented dashboard response.
- A reverse-handover endpoint is not currently documented by the backend.
- The response shape from the image-upload endpoint should be confirmed against the live backend.
- Qocent is maintained as a secondary deployment. Its automatic GitHub deployment behaviour still needs to be confirmed.

For API behaviour and current endpoint details, refer to the live Swagger documentation.

## Related documentation

- Project overview: `../README.md`
- Frontend instructions: `CLAUDE.md`
- Interface specification: `../docs/spec/foodbridge-interface.md`
- Project decisions: `../docs/decisions.md`
- AI usage log: `../docs/ai-log.md`
