# FoodBridge: interface spec

Status: draft, 24 Oct 2026. Owner: Muizz Jamiu (interface).
Reads with: `/docs/intent/foodbridge.md` (what and why) and `/openapi.yaml` (every endpoint, field and error shape).
This file covers only how the screens behave. If it ever disagrees with `openapi.yaml`, the OpenAPI document wins and this file gets corrected.

Items marked **TBC** need agreement with the service engineers (Adedayo, Esther) and a line in `/docs/decisions.md`.

---

## 1. Stack and conventions

- Vite + React + TypeScript, React Router for navigation, RTK Query for server data.
- API endpoints are hand-written with RTK Query's `injectEndpoints` for now, with types taken from `/openapi.yaml`. Once that document exists we decide whether to generate them with `@rtk-query/codegen-openapi`. No direct fetch calls, and no calls to paths that are not in the document.
- API address comes from `VITE_API_URL`: the mock server while building, the Render service from Friday onward. Monday runs against Render only.
- UI built from shadcn/ui components (Radix-based) and `/src/styles/tokens.css`. No hard-coded colours, no `any`.
- Every request sends a request ID header so one user's journey can be followed in the service logs. Header name **TBC** (proposed `X-Request-Id`, a new UUID per request).
- Create listing and Request this food send an idempotency key, so a repeat submission records once. Header name **TBC** (proposed `Idempotency-Key`, one UUID per form submission, reused on retry).

## 2. Roles and routes

| Route | Screen | Role | Monday |
|---|---|---|---|
| `/sign-in` | Sign in | Anyone | Yes |
| `/listings` | Browse listings | Recipient | Yes |
| `/listings/:id` | Listing detail | Recipient or donor (view differs) | Yes |
| `/your-listings` | Your listings | Donor | Yes |
| `/listings/new` | Create listing | Donor | Yes |
| `/your-requests` | Your requests | Recipient | Yes |
| `/listings/:id/edit` | Edit listing | Owning donor | After Monday |
| `/admin` | Dashboard | Administrator | After Monday |

- After sign in: donors land on `/your-listings`, recipients on `/listings`, administrators on `/admin`.
- The role comes from the signed-in account, never from a choice on screen.
- Hiding a route from a role is convenience only. The service enforces who can do what (brief, page 6).
- A signed-out user opening any route other than `/sign-in` is sent to `/sign-in`, then back to where they were going after signing in.

## 3. Status vocabulary

One set of words, used on every screen and in every message.

### Request status

| On screen | API value | Badge tone | Meaning |
|---|---|---|---|
| Pending | `PENDING` (**TBC**) | Warning | Waiting for the donor |
| Approved | `APPROVED` (**TBC**) | Success | The donor chose this request |
| Declined | `DECLINED` (**TBC**) | Neutral | The donor declined it, or another request was approved |
| Expired | `EXPIRED` (**TBC**) | Neutral | The listing passed its deadline before approval |

### Listing status

| On screen | API value | Badge tone | Meaning |
|---|---|---|---|
| Available | **TBC** | Success | Open for requests |
| Reserved | **TBC** | Info | Has an approved request |
| Collected | **TBC** | Neutral | Handover recorded as complete (after Monday) |
| Expired | **TBC** | Neutral | Deadline passed, accepts no requests |

Badges always show the word, never colour alone.

## 4. Shared behaviour on every screen

**Five states.** Every screen defines all five below.

| State | Pattern |
|---|---|
| Loading | Skeleton shapes matching the content, region marked `aria-busy` |
| Empty | Empty state component: a title that invites action, one line, one button |
| Error | Error state component: what happened in plain words, plus a "Try again" button |
| Success | The normal screen, plus a success toast after any action |
| Confirmation | Dialog component before any action that is hard to undo |

**Error responses.**

| Response | What the user sees |
|---|---|
| Validation error (400) | Errors shown under each field, focus moves to the first one |
| Signed out or session expired (401) | Sent to `/sign-in` with "Your session ended. Sign in again." |
| Not allowed (403) | "You don't have access to this." with a link back to their home screen |
| Not found (404) | "This listing no longer exists." with a link to browse |
| Conflict (409) | Specific message per action, see screens S5 and S4 |
| Server error (500) or no connection | Error state with "Try again". Raw error text is never shown |

**Stale figures.** Lists show when they were last updated, for example "Updated 2 minutes ago."

**Demonstration label.** Every page shows "Demonstration data · all organisations are fictional."

---

## 5. Screens

### S1. Sign in, `/sign-in`

**Shows:** email, password, Sign in button, and a demo accounts box listing each role and email (passwords are in the README).

**Demo accounts:** donor (Mama's Oven, Yaba), recipient (Hope Community Kitchen), recipient 2 (Ajegunle Food Bank), recipient 3 (Grace Shelter), administrator. All emails use `@foodbridge.test`.

**States:**
- Loading: the Sign in button shows its loading state.
- Error, wrong details: "That email or password isn't right. Check them and try again." The email entered stays filled in.
- Error, empty fields: "Enter your email address" and "Enter your password".
- Error, service unreachable: "We can't reach FoodBridge right now. Try again in a moment." (Covers the free hosting waking up.)
- Success: redirect by role (section 2).
- Empty and confirmation: not applicable.

**Accessibility:** focus starts on the email field. Errors are linked to their fields and announced.

### S2. Create listing, `/listings/new` (donor)

**Fields:**

| Field | Required | Rule and error message |
|---|---|---|
| Food name | Yes | 3 to 80 characters. "Enter the food name" |
| Description | No | Up to 500 characters, with a counter |
| Category | Yes | Bakery, Cooked meals, Produce, Pastries (list **TBC**). "Choose a category" |
| Quantity | Yes | Whole number, 1 or more. "Enter a quantity of 1 or more" |
| Unit | Yes | Loaves, portions, trays, baskets, pieces, boxes (list **TBC**). "Choose a unit" |
| Pickup area | Yes | Yaba, Surulere, Ikeja, Lekki, Ajegunle (list **TBC**). "Choose a pickup area" |
| Collection deadline | Yes | Must be later than now. "The deadline must be later than now" |
| Photo | No | JPG or PNG, up to 5 MB. Placeholder shown if none. Upload method **TBC** |

Validation runs on submit and again on the service. The client check is for speed; the service check is the one that counts.

A preview card on the side shows how recipients will see the listing.

**States:**
- Loading: Publish listing shows its loading state and cannot be pressed twice. The same idempotency key is reused if the user retries.
- Error: field errors (section 4), or "Your listing wasn't published. Try again." with the form kept filled in.
- Success: go to the new listing's detail page, with the toast "Listing published".
- Confirmation: leaving with unsaved changes asks "Leave without publishing? Your details will be lost." with Stay and Leave.
- Empty: not applicable.

### S3. Browse listings, `/listings` (recipient)

**Shows:** search box, Category, Pickup area and Status filters, a "Clear all" button, a result count, an "updated" time, a card grid, and "Load more" (12 at a time).

- Status filter defaults to Available.
- Filters combine. Each one is stored in the URL (for example `?category=bakery&area=yaba`), so a filtered view survives refresh and can be shared.
- Search waits until the user pauses typing (about 300 milliseconds) before asking the service.
- **Card:** category, status badge, food name (2 lines at most), donor, quantity, area, collect by time, View listing button. Listings the recipient has already requested show "Requested by you".
- The result count ("6 listings available") is announced to screen readers when it changes.

**States:**
- Loading: six skeleton cards.
- Empty, nothing listed yet: "No food listed yet. Check back later today. Donors usually list in the afternoon."
- Empty, filters match nothing: "No listings match your filters" with a "Clear filters" button.
- Error: "We couldn't load listings." with "Try again".
- Success: the grid.
- Confirmation: not applicable.

### S4. Listing detail (recipient view), `/listings/:id`

**Shows:** image or placeholder, status badge, food name, donor and category, quantity, pickup area, collect by time, when it was listed, description, and one action.

**Action, by situation:**

| Situation | What the recipient sees |
|---|---|
| Available, not yet requested | "Request this food" button, with "The donor approves one request. You'll see the result in Your requests." |
| Already requested by this recipient | The request's status badge in place of the button |
| Reserved for someone else | "Already reserved", no button |
| Expired | Expired badge, no button, and "The collection deadline has passed, so this listing can't be requested." |

**States:**
- Loading: skeleton for image and details. Request this food shows its loading state, cannot be pressed twice, and reuses its idempotency key on retry.
- Error, listing can't be loaded: "We couldn't load this listing." with "Try again".
- Error, expired while viewing (409): "This listing expired before your request was saved." The page refreshes to the Expired view.
- Success: badge changes to Pending, with the toast "Request sent".
- Confirmation: no dialog needed. A request can be withdrawn later (after Monday).
- Empty: not applicable.

### S5. Listing detail (donor view), `/listings/:id`

**Shows:** the same listing details as S4, plus a requests panel listing each request with the organisation, area, request time, note, status badge, and Approve and Decline buttons on Pending requests.

**Rules shown on screen:**
- One approved request per listing. Once one is approved, the panel shows it at the top and every other request shows Declined, with no Approve buttons.
- An expired listing shows its requests as Expired, with no buttons.
- Only the owning donor sees this view. Any other donor gets the recipient-style view without the requests panel. The service enforces this regardless.

**Approve flow (this is the optimistic update, see section 6):**
1. Donor presses Approve.
2. Confirmation dialog: "Approve this request?" and "[Organisation] will be the only recipient for [quantity] [food]. The other [n] pending requests will be declined." Cancel and Approve request buttons.
3. On Approve request, the panel updates immediately: this request Approved, the others Declined.
4. If the service confirms: toast "Request approved".
5. If the service refuses because another request was already approved (409): the panel puts itself back to the service's true state, and the toast says "This listing already has an approved request. Your approval was not saved." Focus moves to the request that is actually approved.
6. If the connection fails: the panel puts itself back, and the toast says "Your approval wasn't saved because the connection dropped. Try again." with a Try again action.

**Decline flow:** a confirmation dialog, "Decline this request?" ("[Organisation] will be told their request was declined."), then the badge changes to Declined with the toast "Request declined". Decline is not optimistic.

**States:**
- Loading: skeletons for details and the requests panel.
- Empty, no requests yet: "No requests yet. Recipients nearby can see this listing until [deadline]."
- Error: "We couldn't load requests." with "Try again".
- Success: the panel.
- Confirmation: the approve and decline dialogs above.

### S6. Your listings, `/your-listings` (donor)

**Shows:** the donor's listings, newest first, each with its status, its number of pending requests, and its collect by time. A "List surplus food" button goes to S2. Selecting a listing opens S5.

**States:**
- Loading: skeleton rows.
- Empty: "List your first surplus food. Community groups nearby will be able to request it." with "List surplus food".
- Error: "We couldn't load your listings." with "Try again".
- Success: the list, with listings that have pending requests marked "3 requests waiting".
- Confirmation: not applicable.

### S7. Your requests, `/your-requests` (recipient)

**Shows:** each request with the food, donor, area, request time, note and status badge, newest first, plus "Updated [time]".

- Approved requests show the pickup area and collect by time prominently.
- Declined and Expired requests are kept, below the open ones, so the recipient sees what happened.

**States:**
- Loading: skeleton rows.
- Empty: "You haven't requested any food yet." with "Find food".
- Error: "We couldn't load your requests." with "Try again".
- Success: the list.
- Confirmation: not applicable.

---

## 6. The optimistic update

**Chosen action:** the donor approving a request (S5).

**Why:** it's the action where a refusal is a real, expected outcome (the brief's three-requests rule), so it exercises the rollback path properly in the demo.

**How:** RTK Query `onQueryStarted` updates the listing's cached requests before the service answers; on any failure, `patchResult.undo()` restores the cache, then the listing's requests are fetched again so the screen shows the true state.

## 7. Repeat-safe writes

- **Create listing** and **Request this food** each generate an idempotency key when the user presses the button, and reuse it if they retry the same submission.
- Buttons show their loading state and ignore further presses while a request is in flight.
- The client's part (generate once, reuse on retry) is documented here; the service's part (store the key, return the original result on a repeat) is documented in `openapi.yaml`. **TBC** with the service engineers.

## 8. Slow network and connection drops

Tested with the browser's network throttling (Slow 4G) on every Monday screen.

- Skeletons appear straight away, so the screen never looks frozen.
- **If a save is in flight and the connection drops:** the button stops loading, the screen returns to its last confirmed state, and a toast says the action wasn't saved, with Try again. The screen never shows a change the service hasn't confirmed, except during the optimistic approve, which rolls back as in S5.
- **If the service is waking up (Render free tier, up to about a minute):** after 8 seconds of loading, show "FoodBridge is starting up. This can take up to a minute." under the skeleton.

## 9. Accessibility (WCAG 2.2 AA)

- Every screen has one `h1`, and headings follow in order.
- Every input has a visible label. Errors are linked with `aria-describedby` and announced.
- Toasts and result counts are announced through live regions.
- Dialogs trap focus, close with Escape, and return focus to the button that opened them.
- Everything works with a keyboard alone, and focus is always visible.
- Colours come from tokens that pass contrast (text 4.5:1, borders and focus 3:1).
- Layout works from a 360 pixel wide phone up to desktop.
- Screen reader testing with NVDA (NonVisual Desktop Access) or VoiceOver happens after Monday, with findings in the README.

## 10. Copy rules

- British spelling: neighbourhood, organisation.
- Sentence case everywhere. Buttons start with a verb: "Request this food", "Approve request".
- Errors say what happened, then what to do.
- Places are real Lagos areas; every organisation and person is fictional.

## 11. Open decisions

- API values for each status (section 3), agreed with the service engineers.
- Header names for request ID and idempotency key (section 1).
- Category, unit and pickup area lists (S2).
- How photos are uploaded and stored (S2).
- What final state an expired listing with an approved request reaches (brief, page 6), and how S5 and S7 show it.
