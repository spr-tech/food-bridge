# FoodBridge

FoodBridge connects food donors with community organisations that need surplus food. Bakeries, caterers, restaurants and community kitchens can list available food, while charities and community groups can request and collect it.

Donors approve or decline recipient requests. Donors or administrators can update handover status. Administrators review listings and monitor platform activity.

FoodBridge coordinates food offers and collections. It does not provide food safety certification or delivery services.

Built for the **TeSA Africa Cohort 6 Software Engineering Capstone**.

## Live applications

| Application | Link |
|---|---|
| Frontend | https://frontend-six-zeta-39.vercel.app |
| Backend | https://foodbridge-backend-rg9f.onrender.com |
| API documentation | https://foodbridge-backend-rg9f.onrender.com/swagger-ui/index.html |

## Team

| Engineer | Responsibility |
|---|---|
| Muizz Jamiu | Frontend and interface |
| Adedayo Aboderin | Database and data integrity |
| Esther Ebagua | Backend API and authentication |
| Bibi | Supervisor |

**Repositories:**
- Frontend: https://github.com/spr-tech/food-bridge
- Backend: https://github.com/dayosvoid/foodbridge-backend

## Technology stack

**Frontend:** Vite, React, TypeScript, React Router, Redux Toolkit Query, Formik, Yup and Tailwind CSS.

**Backend:** Java, Spring Boot, PostgreSQL and Flyway.

## Getting started

### Requirements

- Node.js
- npm
- Git

### Installation

```bash
git clone https://github.com/spr-tech/food-bridge.git
cd food-bridge/frontend
npm ci
```

### Environment configuration

Create a `.env` file inside `frontend/`.

For the deployed backend:

```env
VITE_API_URL=https://foodbridge-backend-rg9f.onrender.com
VITE_USE_MOCKS=false
```

For simulated data:

```env
VITE_USE_MOCKS=true
```

### Run locally

```bash
npm run dev
```

### Run checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Demonstration accounts

These accounts are for the frontend's simulated mode only.

Password for all accounts: `FoodBridge-demo-2026`

| Role | Email | Organisation |
|---|---|---|
| Donor | `donor@foodbridge.test` | Mama's Oven, Yaba |
| Recipient | `recipient@foodbridge.test` | Hope Community Kitchen |
| Administrator | `admin@foodbridge.test` | FoodBridge demo admin |

Live backend demonstration credentials must be obtained and verified separately with the service engineers.

All demonstration organisations and people are fictional.

## Screenshots

Screenshots of the deployed application will be added here, covering the donor, recipient and administrator interfaces.

## Performance and load testing

Performance and load-test results must be measured against the deployed application and backend.

| Measurement | Result |
|---|---|
| Frontend performance | Pending measurement |
| Core Web Vitals | Pending measurement |
| Backend load test | Pending measurement |
| Saturation point | Pending measurement |

Do not treat local development measurements as deployed performance results.

## Hosting and free-tier verification

Record the hosting providers, plans, resource limits, usage allowances and verification date here.

| Service | Provider/plan | Terms checked on |
|---|---|---|
| Frontend | To be verified | Pending |
| Backend | To be verified | Pending |
| Database | To be verified | Pending |

## Known limitations and remaining work

- Verify live role permissions for listing edits, deletion and handover updates.
- Implement and connect reversal of completed handovers.
- Complete the dashboard's recent activity list and estimated portions-saved figures.
- Confirm the actual image upload response structure.
- Complete end-to-end tests against the deployed service.
- Add measured performance and load-test results.

Only mark a feature complete after implementation and verification.

## Project documentation

Further technical details are maintained separately:

- `frontend/CLAUDE.md` — frontend development instructions.
- `frontend/README.md` — frontend-specific setup.
- `docs/` — product intent, interface specification, design and decisions.
- `docs/ai-log.md` — AI-assisted development record.
- `docs/decisions.md` — engineering decisions and their rationale.