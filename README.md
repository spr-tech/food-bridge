# FoodBridge

FoodBridge helps bakeries, caterers, restaurants and community kitchens pass surplus food to
community groups and charities: donors list what they have, recipients request it, and the
donor approves one request.

This repository is the **interface tier** (Vite, React and TypeScript). The Java service lives in
its own repository, owned by the service engineers: TODO (link).

**Live:** https://frontend-six-zeta-39.vercel.app

## Where things live

- `frontend/`: the web app. Start with `frontend/README.md`
- `docs/`: intent, interface spec, design files, decisions and the AI log
- `openapi.yaml`: the contract with the service (not added yet)
- `.github/workflows/`: the frontend pipeline (checks on every push, then deploy to Vercel)

## Demo accounts (simulated)

Every organisation is fictional. All five accounts use the password **`FoodBridge-demo-2026`**.

| Role | Email | Organisation |
| --- | --- | --- |
| Donor | `donor@foodbridge.test` | Mama's Oven, Yaba |
| Recipient | `recipient@foodbridge.test` | Hope Community Kitchen |
| Recipient 2 | `recipient2@foodbridge.test` | Ajegunle Food Bank |
| Recipient 3 | `recipient3@foodbridge.test` | Grace Shelter |
| Administrator | `admin@foodbridge.test` | FoodBridge demo admin |

Until the service exists, the app runs on simulated data in the browser tab
(`frontend/src/mocks/`), and the demonstration line on every page says "(simulated)". The data
lasts for the tab, so you can sign out and back in as another account and see each other's
changes. Closing the tab starts it again from the sample data.

## Still to come

The free tier terms we checked, performance figures and known limitations will be added here.
