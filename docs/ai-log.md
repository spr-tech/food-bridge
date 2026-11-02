# AI log

Tools used, what we asked, what we accepted, what we rejected, and what we checked and found wrong.

The brief (p.25) requires at least one case where AI output was checked and found wrong.

## Tools

- Claude (claude.ai): planning, specs, shared components, design renders, landing and sign-in design
- Claude Code: building the frontend
- Replit Agent: clickable design prototype
- ChatGPT: backend integration planning, API contract review, code troubleshooting and documentation support

## Entries

### 2026-10-23 · Replit Agent · design prototype

Asked: a clickable prototype of every FoodBridge screen and state, using our colour tokens.

Accepted: the overall layout and the green-and-serif visual style.

Found wrong, and how we checked:

- It ignored the colour tokens we gave it and invented its own palette. Checked by comparing the screens with the token list in the prompt. We chose to keep the new style deliberately and recorded the values in our tokens.
- Every "collect by" time read 0:38. Checked by reading the dates on the cards; real deadlines would vary. Treated as a data generation bug; our seed data must use realistic times.
- Demo emails used foodbridge.org, which could belong to a real organisation (brief p.3). Replaced with @foodbridge.test.
- Food, category and donor didn't match (vegetable boxes from a bakery; photos of bread on stew listings), and place names weren't Lagos. Our seed data and screens use matching data and real Lagos areas.
- The donor requests table showed an Approve button on a second request for a listing that looked already approved, which is the exact defect the brief's main rule forbids. Our spec (S5) now hides Approve once a listing has an approval.
- An orange label likely failed WCAG contrast. Checked with a contrast calculation; darkened to pass 4.5:1.

### TODO · Claude (claude.ai) · earlier design and layout work

Fill in the details for the three cases from before 27 Oct:

- Contrast failures in the AI's design colours. Which colours, the measured ratios, and the replacements (spec section 12, "Deliberate differences").
- The cropped-screenshot "empty top bar": the AI diagnosed an empty top bar from a cropped screenshot. How we found the bar was fine.
- The wrong PageContainer diagnosis: what the AI said was wrong, how we checked, and the real cause.

### TODO · Claude Code · foundation setup

Asked:

Accepted:

Rejected or corrected:

### 2026-10-27 · Claude Code · sign-in redirect fix (fix/sign-in-redirect)

Asked: fix the bug where a donor signing in after a recipient signed out landed on a page the donor can't open.

Accepted: one place for role rules (routes.tsx and canOpen), sign-in following ?next= only when the role may open it, and a deliberate sign-out leaving no ?next=. Its tests were checked by breaking the code on purpose: each failed when its fix was removed.

Found wrong, and how we checked:

- One of its new tests, desktop Sign out ending on /sign-in with no query, passed with and without the fix, so it proved nothing (brief: "a test that passes both before and after proves nothing"). Claude Code reported this itself; we kept it only as a regression check and didn't list it as proof in the pull request.
- Its root-cause fix (a flag for a deliberate sign-out) works around a timing problem (the session clears before the page changes) rather than removing it. Kept, because it also separates a deliberate sign-out from an expired session, which the app needs. Recorded so we can explain the trade-off.

### 2026-10-27 · Claude (claude.ai) · landing page and sign-in redesign

Asked: design options for a landing page and a sign-in page with a full-page photo, then walk through building them in the codebase by hand.

Accepted: the landing design (photo hero, the evening story, How it works cards, the closing animation), the sign-in layout (photo across the page, form on a white card), the shared .photo-backdrop class, the green focus ring with red on error fields, and the fix for the demo account picker.

Found wrong, and how we checked:

- It guessed function names that don't exist in our code (homeFor, getSession) and wrote them into a new guard component. Found through red TypeScript errors. We pasted HomeRedirect.tsx, found the real helpers (homePathFor, useRole), and dropped the new guard: HomeRedirect now does the job.
- It agreed to switch our components to export default without checking the codebase, which uses named exports (routes.tsx loads every page as m.PageName). Found when m.LandingPage showed an error. Switched back to named exports.
- It described results it hadn't looked at, saying a canvas board could be scrolled to see an effect. Found from a screenshot; the board's frame cut the content off. Since then we ask it to say when it hasn't checked something.
- Its letter-by-letter heading animation lost the spaces ("gotowaste."), because a box holding only a space collapses to zero width. Found by looking at the page; fixed by giving the space boxes a fixed width.
- Its first closing animation used scroll ranges the last section can never reach, so parts would never have appeared. The AI caught this itself before handing over; recorded because we would not have spotted it on a tall screen.
- It suggested a stock photo that turned out to be a 612×407 iStock preview: blurry when stretched, and not licensed for public use. Found from the blurry result and the file size. Recorded as TEMPORARY in decisions.md; to be replaced with a licensed or free photo.
- The demo account picker (built earlier) set email and password in two separate calls, so validation ran against an empty email and showed "Enter your email address" with the email filled in. Found by using the page. Fixed with one setValues call; a test should fail on the old code.

### 2026-10-31 · ChatGPT · backend integration and API contract review

Asked: help connect the existing FoodBridge frontend to the deployed backend while keeping the existing service-layer structure, user journeys and original capstone business rules.

Accepted:

- Reviewed the live backend Swagger documentation and used its documented endpoints and response fields to guide the frontend integration.
- Continued using the existing RTK Query service structure rather than introducing a separate API-calling pattern.
- Added backend response mapping in `frontend/src/services/backend-mappers.ts` and tests in `frontend/src/services/backend-mappers.test.ts`.
- Updated the authentication, listing and request service files and related frontend types and screens to use the backend contract.
- Kept mock demo credentials distinct from the live backend's seeded demo accounts.
- Kept the Vercel deployment as the primary production deployment, with Qocent as a secondary backup. Qocent's automatic deployment behaviour still needs to be confirmed after a GitHub push.

Rejected or corrected:

- A newer admin-led task document proposed that administrators approve or decline recipient requests. We compared it with the original capstone brief and kept the original workflow: the donor makes the request approval or decline decision. The administrator monitors activity and has the listing and handover responsibilities described in the original brief. The proposed change should not be implemented without an explicit team decision.
- We did not assume that every dashboard feature in the interface was supported by the API. The documented dashboard response contains summary statistics, but does not include recent activity or estimated portions saved.
- We did not assume that a reverse-handover API exists. No reverse-handover endpoint appears in the Swagger endpoint list reviewed.
- The image-upload endpoint's documented response did not clearly establish the exact image-reference property returned. This needs confirmation against the actual response or from the backend engineer before treating the response shape as verified.

What we checked and found:

- The Swagger documentation exposes the login, current-user, listings, image-upload, request, request-decision, collection and admin-dashboard endpoints used to assess the integration.
- The listing response uses fields such as `foodName`, `collectionDeadline` and `imageReference`; these need mapping to the frontend's listing model rather than assuming the names are identical.
- The request response uses `recipientId`, `recipientName` and `status`. Older field names should not be assumed.
- The request-creation endpoint documents an `Idempotency-Key` header and does not document a request body.
- The documented category and unit values differ from ordinary display labels, so the frontend needs deliberate mapping.
- The dashboard response documents summary counts, not every metric shown in the interface. We recorded these gaps rather than claiming that the backend already provides them.

Checks still required before the integration is considered fully verified:

- Run lint, TypeScript checks, tests and the production build.
- Test the important donor and recipient journeys against the deployed API.
- Confirm the image-upload response shape and the relevant edit, delete and handover permissions with the backend engineer.
- Confirm whether Qocent updates automatically after a push to GitHub, and check that its deployment does not bypass the GitHub Actions checks.

### 2026-11-01 · Claude Code · documentation refresh

Asked: bring every existing documentation file in line with the code after PR #17 to #20 and the open `fix/prevent-second-request-approval` branch, without changing application code.

Accepted: updates to `README.md`, `frontend/README.md`, `frontend/CLAUDE.md`, `frontend/src/docs/README.md`, `docs/spec/foodbridge-interface.md` (new section 14) and `docs/decisions.md`, each checked against the source files they describe. Lint, typecheck, tests (248 passed) and build were re-run on the working tree.

Found wrong in the existing documentation, and how we checked:

- `frontend/CLAUDE.md` and the spec pointed to `../openapi.yaml` as the API contract; `git log --all -- openapi.yaml` shows it has never been committed.
- `frontend/CLAUDE.md` listed a `useSidebarTheme` hook that was deleted in `c06e44d`, and told contributors to keep working on `feature/connect-backend`, which has been merged.
- The spec still described the description field as optional; `src/schema/listingSchema.ts` now requires it.
- The root README said live demonstration credentials must be obtained separately; `src/constants/demoAccounts.ts` shows them on the sign-in page in live mode.

Code that contradicts the recorded rules, left for the team (not changed in a docs-only task): `X-Request-Id` is still sent on every request; `POST /api/listings` sends an `Idempotency-Key` the contract doesn't document; `DATA_IS_SIMULATED` is always true; the edit route is donor-only although the edit page and the brief allow administrators.

### 2026-11-02 · Claude Code · QA audit, PR #22 to #24, documentation update

Asked: audit the local and deployed app; then implement listing history, state-aware listing actions and fairness handling (PR #23), fix the Find food filters and disable Delete on Collected listings (PR #24); then bring the documentation in line with `main` after PR #24 without changing application code.

Accepted: the code in PR #23 and #24, each with lint, typecheck, tests and build passing locally (354 tests across 34 files on `main` at `c857ea6`), and checked in a browser against the deployed backend using only clearly labelled QA listings. The documentation updates in this entry's commit.

Checked and found wrong, and how:

- The documentation said the backend's handling of competing requests was unconfirmed. A live check and the backend source (`DefaultReservationOperations.approve`) show it leaves them `PENDING`.
- The pickup area filter returned 1 of 14 Available Surulere listings and 0 of 15 Yaba. Comparing the API's own data showed seeded areas stored as longer text ("Surulere, Lagos - …") against an exact-match filter; the search box also promised donor and area search that the backend doesn't do.
- The first version of the delete dialog said a listing would be "removed for good"; the backend keeps it as a record (soft delete), so the wording was changed.
- In a test fixture for the filters the expected total was 118; the run gave 119, and a recount of the fixture confirmed 119 was right.
- The documentation said the backend documents no handover-reversal endpoint and no expired or portions-saved dashboard figures; the live OpenAPI document now lists all three, though no response yet exposes the `handoverId` reversal needs.

Rejected: predicting the daily fairness rule in the browser, because a donor's data can't show it reliably (see `decisions.md`, 2026-11-02).

Still unverified: whether the Qocent backup deployment is current or updates from GitHub.

### 2026-11-02 · Claude Code · listing status and dashboard fixes

Asked: fix the Expired filter showing deleted listings, donor and recipient handling of expired listings, Edit and Delete placement on Listing details, the rejection message that disappeared, the dashboard's Requests waiting and Expired cards, and the Food saved figure. Report backend defects instead of hiding them.

Accepted: the changes on `fix/foodbridge-listing-status-and-dashboard-bugs` (not committed), with typecheck and build passing and lint at 0 errors (1 existing warning in `src/components/ui/textarea.tsx`). The suite has 509 tests across 53 files. It has intermittent 5-second timeouts under load, also seen on `main`. The final full runs had 6 failures each, and 1 with `--maxWorkers=2`, all in tests this branch doesn't change. Each failing file passed when run alone, so they aren't fixed, only shown to depend on load. They were checked in a browser against the deployed backend at 1440, 820 and 390 px wide, using reads only (no listing, request or delete was changed).

Checked and found wrong, and how:

- Admin Expired filter: a live `GET /api/listings?availability=EXPIRED` returned 1 `EXPIRED` and 23 `DELETED` rows. Each row reported its status correctly, so the backend filter was wrong, not the frontend mapping.
- Requests waiting: all 16 `PENDING` requests counted by the dashboard sat on Collected or Deleted listings. None was waiting for a decision.
- Rejection message: it required the request to be `PENDING`. A refetch returning `DECLINED`, or the listing becoming Collected, removed it.
- The first fix said "Another organisation was approved" whenever the listing was Reserved or Collected. Review showed that was a guess: the backend sends no decline reason, and a donor can decline by hand. It was replaced with a neutral message that gives no reason.
- Edit on Listing details: the details page never rendered it.
- Food saved: the frontend totals matched the 12 Collected listings exactly (no duplicates). The backend's 78 portions and 13 handovers couldn't be traced from what it returns.

Rejected: removing deleted rows from the Expired view without saying so, and building the reversal action, because no response carries the `handoverId` it needs.
