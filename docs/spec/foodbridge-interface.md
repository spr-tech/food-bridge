# FoodBridge: interface spec

Status: draft, 25 Oct 2026. Owner: Muizz Jamiu (interface).
Reads with: `/docs/intent/foodbridge.md` (what and why), `/openapi.yaml` (every endpoint, field and error shape) and `/docs/design/foodbridge-final/` (how every screen looks, see section 12).
This file covers only how the screens behave. If it ever disagrees with `openapi.yaml`, the OpenAPI document wins and this file gets corrected.

Items marked **TBC** need agreement with the service engineers (Adedayo, Esther) and a line in `/docs/decisions.md`.

---

## 1. Stack and conventions

- Vite + React + TypeScript, React Router for navigation, RTK Query for server data.
- API endpoints are hand-written with RTK Query's `injectEndpoints` for now, with types taken from `/openapi.yaml`. Once that document exists we decide whether to generate them with `@rtk-query/codegen-openapi`. No direct fetch calls, and no calls to paths that are not in the document.
- API address comes from `VITE_API_URL`: the mock server while building, the Render service from Friday onward. Monday runs against Render only.
- UI built from the interface engineers' shared component set (github.com/spr-tech/interface-eng-shared-components, Radix-based), copied unchanged into `frontend/src/components/ui/`, with FoodBridge's values in `frontend/src/styles/tokens.css`. No hard-coded colours, no `any`.
- Every request sends a request ID header so one user's journey can be followed in the service logs. Header name **TBC** (proposed `X-Request-Id`, a new UUID per request).
- Create listing and Request this food send an idempotency key, so a repeat submission records once. Header name **TBC** (proposed `Idempotency-Key`, one UUID per form submission, reused on retry).

## 2. Roles and routes

| Route | Screen | Role | Monday |
|---|---|---|---|
| `/sign-in` | Sign in | Anyone | Yes |
| `/listings` | Find food (browse listings) | Recipient | Yes |
| `/listings/:id` | Listing details | Recipient or donor (view differs) | Yes |
| `/your-listings` | Your listings | Donor | Yes |
| `/listings/new` | Share food (create listing) | Donor | Yes |
| `/your-requests` | Your requests | Recipient | Yes |
| `/requests` | Requests (every request on the donor's listings) | Donor | Once its endpoint exists (**TBC**, see S8). Monday's approve runs from S5 |
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
| Cancelled | `CANCELLED` (**TBC**) | Neutral | The recipient cancelled it while it was still pending (rule **TBC** with the service engineers, see `/docs/decisions.md`) |

### Listing status

| On screen | API value | Badge tone | Meaning |
|---|---|---|---|
| Available | **TBC** | Success | Open for requests |
| Reserved | **TBC** | Warm (see section 12) | Has an approved request |
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

**Demonstration label.** Every page shows "Demonstration data · organisations and people are fictional."

---

## 5. Screens

### S1. Sign in, `/sign-in`

**Shows:** email, password, Sign in button, and a demo accounts box with a button per account, showing its role and email (the password is also in the README).

**Demo accounts:** one per role, matching the service: donor (Mama's Oven, Yaba) `donor@foodbridge.test`, recipient (Hope Community Kitchen) `recipient@foodbridge.test`, administrator `admin@foodbridge.test`. The emails are **TBC** until the service engineers confirm their own. Other organisations in the sample data (for example Ajegunle Food Bank and Grace Shelter) have no login. On desktop each account in the box is a button (icon, role and email) with a visible hover and focus state, under "Use these accounts to explore the app. Choose one to fill in the email and password. Password in the README." On a phone the accounts are chips (Donor, Recipient, Administrator) under "Try a demo account" and "Tap one to fill in the email and password. Password in the README." On both, choosing an account (click, tap, or Enter or Space from the keyboard) fills in its email and the demo password, then moves focus to Sign in; it doesn't sign in by itself. The demo password must match the service's.

**States:**
- Loading: the Sign in button shows its loading state.
- Error, wrong details: "That email or password isn't right. Check them and try again." The email entered stays filled in.
- Error, empty fields: "Enter your email address" and "Enter your password".
- Error, service unreachable: "We can't reach FoodBridge right now. Try again in a moment." (Covers the free hosting waking up.)
- Success: redirect by role (section 2).
- Empty and confirmation: not applicable.

**Accessibility:** focus starts on the email field. Errors are linked to their fields and announced.

### S2. Share food (create listing), `/listings/new` (donor)

**Fields:**

| Field | Required | Rule and error message |
|---|---|---|
| Food name | Yes | 3 to 80 characters. "Enter the food name" |
| Description | No | Up to 500 characters, with a counter. Placeholder invites collection instructions: "Add any collection instructions here." (A separate collection notes field comes after Monday.) |
| Category | Yes | Bakery, Cooked meals, Produce, Pastries (list **TBC**). "Choose a category" |
| Quantity | Yes | Whole number, 1 or more. "Enter a quantity of 1 or more" |
| Unit | Yes | Loaves, portions, trays, baskets, pieces, boxes (list **TBC**). "Choose a unit" |
| Pickup area | Yes | Yaba, Surulere, Ikeja, Lekki, Ajegunle (list **TBC**). "Choose a pickup area" |
| Collection date | Yes | "Choose a collection date" |
| Time | Yes | "Choose a collection time" |
| Photo | No | JPG or PNG, up to 5 MB. Placeholder shown if none. Upload method **TBC** |

Collection date and Time are combined into one collection deadline, the single value sent to the service. The combined deadline must be later than now: "The deadline must be later than now" (shown under Time).

Validation runs on submit and again on the service. The client check is for speed; the service check is the one that counts.

No preview card: removed on purpose (section 12).

**States:**
- Loading: Publish listing shows its loading state and cannot be pressed twice. The same idempotency key is reused if the user retries.
- Error: field errors (section 4), or "Your listing wasn't published. Try again." with the form kept filled in.
- Success: go to the new listing's detail page, with the toast "Listing published".
- Confirmation: leaving with unsaved changes asks "Leave without publishing? Your details will be lost." with Stay and Leave.
- Empty: not applicable.

### S3. Find food (browse listings), `/listings` (recipient)

**Shows:** search box, Category, Pickup area and Status filters, a "Clear all" button, a result count, an "updated" time, a card grid, and "Load more" (12 at a time).

- Status filter defaults to Available.
- Filters combine. Each one is stored in the URL (for example `?category=bakery&area=yaba`), so a filtered view survives refresh and can be shared.
- Search waits until the user pauses typing (about 300 milliseconds) before asking the service.
- **Card:** thumbnail, status badge, food name (2 lines at most), category and donor ("Bakery · Mama's Oven"), quantity, pickup time ("Pickup by 7:00 PM"), area, and two buttons side by side: "View listing" (opens S4) and "Request food".
- **Requesting from the card.** A recipient can send a request from the card as well as from the detail page (S4). "Request food" follows S4's rules exactly: one idempotency key per press, reused on retry; a loading state that ignores further presses; the toast "Request sent" on success; on 409 (expired while viewing) the toast "This listing expired before your request was saved." and the card refreshes to its Expired state. No confirmation dialog, as in S4.
- **Button by situation:**

  | Situation | Second button | Under the card details |
  |---|---|---|
  | Available, not yet requested | "Request food" | |
  | Already requested by this recipient | "Requested" (disabled) | "Requested · waiting for donor" |
  | Reserved for someone else | "Reserved" (disabled) | |
  | Expired | "Expired" (disabled) | |

  The status badge still shows the listing status, so the disabled button is never the only signal.
- The result count ("6 listings available") is announced to screen readers when it changes.

**States:**
- Loading: six skeleton cards.
- Empty, nothing listed yet: "No food listed yet. Check back later today. Donors usually list in the afternoon."
- Empty, filters match nothing: "No listings match your filters" with a "Clear filters" button.
- Error: "We couldn't load listings." with "Try again".
- Error, a card's request fails (500 or no connection): the card's button returns to "Request food" and the toast says "Your request wasn't sent. Try again." with a Try again action.
- Success: the grid. After a card request, that card shows "Requested" and "Requested · waiting for donor".
- Confirmation: not applicable.

### S4. Listing details (recipient view), `/listings/:id`

**Shows:** image or placeholder, status badge, food name, donor and category, quantity, pickup area, collect by time, when it was listed ("Listed Today, 9:30 AM"), description, and one action. A listing with no description leaves the Description heading out.

**Action, by situation:**

| Situation | What the recipient sees |
|---|---|
| Available, not yet requested | "Request this food" button, with "The donor approves one request. You'll see the result in Your requests." |
| Already requested by this recipient | "Your request" with the request's status badge in place of the button; while it is Pending, a "Cancel request" button too |
| Reserved for someone else | "Already reserved", no button |
| Expired | Expired badge, no button, and "The collection deadline has passed, so this listing can't be requested." |
| Collected | No action line; the Collected badge says it |

A cancelled request doesn't count: the recipient can request the listing again.

**Cancel request** (only the recipient's own request, only while Pending; the service enforces both):
1. Confirmation dialog, danger tone: "Cancel this request?" and "The donor will no longer see it.", with "Keep request" and "Cancel request".
2. On success: the toast "Request cancelled", and "Request this food" is available again (focus moves to it).
3. 409 `REQUEST_NOT_PENDING` (the donor decided first, or it expired): the toast "This request can no longer be cancelled.", and the page refreshes to the request's true status.
4. 500 or no connection: the toast "Your request wasn't cancelled. Try again." with a Try again action.

**States:**
- Loading: skeleton for image and details. Request this food shows its loading state, cannot be pressed twice, and reuses its idempotency key on retry.
- Error, listing can't be loaded: "We couldn't load this listing." with "Try again".
- Error, not found (404): "This listing no longer exists." with a link to "Find food" (recipients) or "Your listings" (donors).
- Error, expired while viewing (409): "This listing expired before your request was saved." The page refreshes to the Expired view.
- Success: badge changes to Pending, with the toast "Request sent".
- Confirmation: no dialog before requesting. Cancel request asks first (above).
- Empty: not applicable.

### S5. Listing details (donor view), `/listings/:id`

**Shows:** the same listing details as S4 (with "Back to Your listings"), plus a requests panel under the `h2` "Requests", with "Updated [time]". Each request shows the organisation, area, request time ("Requested Today, 2:10 PM"), note, status badge, and Approve and Decline buttons on Pending requests.

**Rules shown on screen:**
- One approved request per listing. Once one is approved, the panel shows it at the top and every other request shows Declined, with no Approve buttons.
- An expired listing shows its requests as Expired, with no buttons.
- Only the owning donor sees this view. Any other donor gets the recipient-style view without the requests panel. The service enforces this regardless.

**Approve flow (this is the optimistic update, see section 6):**
1. Donor presses Approve.
2. Confirmation dialog: "Approve this request?" and "[Organisation] will be the only recipient for [food] ([quantity])." followed by "The other [n] pending requests will be declined." ("The other pending request will be declined." for one; left out for none). For example: "Hope Community Kitchen will be the only recipient for Wholewheat bread loaves (40 loaves). The other 2 pending requests will be declined." Cancel and Approve request buttons.
3. On Approve request, the panel updates immediately: this request Approved, the others Declined.
4. If the service confirms: toast "Request approved".
5. If the service refuses because another request was already approved (409): the panel puts itself back to the service's true state, and the toast says "This listing already has an approved request. Your approval was not saved." Focus moves to the request that is actually approved.
6. If the connection fails: the panel puts itself back, and the toast says "Your approval wasn't saved because the connection dropped. Try again." with a Try again action.
7. Other refusals also put the panel back, then show the true state: a server error (500), "Your approval wasn't saved. Try again." with Try again; the listing expired (409), "This listing expired before your approval was saved."; the request is no longer Pending (409), "This request can no longer be approved."
8. If the panel's refresh after a failure also fails, it keeps showing the state it put itself back to.

**Decline flow:** a confirmation dialog, "Decline this request?" ("[Organisation] will be told their request was declined."), with Cancel and "Decline request", then the badge changes to Declined with the toast "Request declined". Decline is not optimistic. If the request is no longer Pending (409): "This request can no longer be declined." and the panel shows the true state. Server error or no connection: "Your decline wasn't saved. Try again." with Try again, and nothing changes.

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

### S8. Requests, `/requests` (donor)

Every request on the signed-in donor's listings, in one place. For Monday, approving and declining run from S5 (listing details); this screen follows once its endpoint exists.

**Endpoint: TBC with the service engineers.** It needs a list of every request on the signed-in donor's listings, filterable by status, with a count per status (for the tabs and the sidebar count). Until it is in `openapi.yaml`, this screen is not built: no calls to paths that are not in the document.

**Shows:** heading "Requests", the line "Approve one request per listing. The others are declined automatically.", status tabs, and a card per request.

- **Tabs:** Pending, Approved, Declined and Expired, each with its count, for example "Pending (3)". Pending is selected first. The selected tab is stored in the URL (`?status=pending`) so it survives refresh. Built as real tabs: arrow keys move between them, and the selected one is announced. On a phone the tab row scrolls sideways.
- **Card:** the organisation's initials, organisation name, status badge, food and quantity ("Bread & pastries · 20 packs"), pickup time and area ("Pickup by 7:00 PM · Yaba, Lagos"), and the recipient's note. Pending requests show Approve and Decline.
- **Sidebar count:** "Requests" in the navigation shows the number of pending requests.

**Rules shown on screen:** the same as S5. One approved request per listing: once one is approved, the other pending requests for that listing move to Declined, with no buttons. Requests on an expired listing show Expired, with no buttons. The service enforces this regardless.

**Approve and decline:** exactly the S5 flows, the same dialogs, messages and toasts. Approve is the same optimistic update with rollback (section 6), applied to this list's cached data; on a 409 the list is fetched again and focus moves to the request that is actually approved.

**States:**
- Loading: three skeleton cards under the tabs. The tab counts show once loaded.
- Empty, no requests at all: "No requests yet. When recipients request your food, they'll appear here." with "Share food".
- Empty, the selected tab has none: "No [pending / approved / declined / expired] requests." The other tabs stay available.
- Error: "We couldn't load requests." with "Try again".
- Success: the list, with the S5 toasts after each action.
- Confirmation: the S5 approve and decline dialogs.

---

## 6. The optimistic update

**Chosen action:** the donor approving a request (S5).

**Why:** it's the action where a refusal is a real, expected outcome (the brief's three-requests rule), so it exercises the rollback path properly in the demo.

**How:** RTK Query `onQueryStarted` updates the listing's cached requests before the service answers; on any failure, `patchResult.undo()` restores the cache, then the listing's requests are fetched again so the screen shows the true state.

## 7. Repeat-safe writes

- **Publish listing** (Share food), **Request this food** (S4) and **Request food** on a Find food card (S3) each generate an idempotency key when the user presses the button, and reuse it if they retry the same submission.
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
- The endpoint behind Requests (S8): every request on the donor's listings, filtered by status, with counts.

---

## 12. Visual design

**Source of truth:** `/docs/design/foodbridge-final/`. Exact colours, sizes and spacing come from `source-html/`; motion and timings come from `foodbridge-sidebar-animation.html`. The PNGs are pictures of those files. Where this section differs from the design files, this section wins; every difference is listed under "Deliberate differences" at the end.

Every colour below becomes a token in `frontend/src/styles/tokens.css`. Components never hard-code colours.

### Colours

| Use | Value |
|---|---|
| Page background | `#f7f6f2` |
| Cards, inputs, top bar before the flood | `#ffffff`, lines `#e4e2dc` |
| Cream: sidebar and top bar after the flood, phone top bar and tab bar | `#f4f0e6`, border `#e6e0d1` |
| Dark green: sidebar before the flood, sign-in panel | `#1d4637` |
| Primary: buttons, current link on cream, "Food" on cream | `#1f5c45` |
| Active pill on dark (current link and hover) | `#2f6a52`, white text |
| Link text on cream | `#2d5a46` |
| Muted text on cream ("Coming soon" heading, coming-soon links, "Soon" tag) | `#4f6b5d` (5.14:1). "Soon" tag background `#e9e4d7` |
| Link text on dark | `#d2ded6` |
| Muted text on dark ("Coming soon" heading, coming-soon links) | `#9fb2a6` (4.74:1). "Soon" tag: white at 10% opacity, text `#cbd8cf` |
| Footer text on dark | `#cbd8cf` |
| Body text | `#1e2a24` |
| Muted text, demonstration label, input placeholders | `#5f6963` (5.27:1 on the page, 5.70:1 on white) |
| Input border | `#8a877c`, the existing token (3.60:1) |
| Count badge (sidebar and tabs) | `#e0a46b`, text `#1d4637` |
| Focus ring | 2px solid, 2px offset: `#f0a24b` on dark green (5.03:1), `#c2410c` on cream, white and the page (4.55:1 or better) |
| Required asterisk | `#a8321f` |
| Disabled button (Requested, Reserved, Expired) | `#eceae4`, text `#7a817c` |
| Category chip | `#efeee9`, text `#4a514c` |

No grey or black states anywhere in the sidebar: every state is dark green, cream or a green pill.

**Status badges** (12px, 700, pill): Available `#e3efe6` / `#2f6b4c`; Reserved `#fbe4dc` / `#a8432a` (the "Warm" tone in section 3); Pending `#fbecdc` / `#8a4b10`; Expired `#ecebe8` / `#5f6963`. Approved uses Available's colours and Declined uses Expired's, matching their tones in section 3. Every badge shows the word.

### Typography

- **DM Sans** (400, 500, 600, 700) for everything except headings. Body 15px.
- **Fraunces 600** for page headings and card titles only: `h1` 40px on desktop and 30px on a phone (listing details 32px and 26px; sign-in "Welcome back" 38px and 26px), card food names 18px.
- **Wordmark:** real text in DM Sans 700 next to the icon, never the full logo SVG (it can't load web fonts). Sidebar 24px, phone top bar 19px, letter spacing -0.01em. "Food" is white on dark and `#1f5c45` on cream; "Bridge" is `#f0a24b` on dark and `#b85f1f` on cream. The same rule applies on sign-in, desktop and phone.
- **Icon:** `logo-icon-dark.svg` on dark green and `logo-icon-light.svg` on cream or white, 34px high in the sidebar.

### Desktop layout (768px and up)

- A 248px sidebar beside the content. Content padding 38px 52px.
- **Page container:** every signed-in page (its heading and content) sits in one shared container. Where the content area is wider than the page's max width, the page is centred in it, not left-aligned. Max widths: Listing details 800px, Share food 860px, Find food (All listings for administrators) 1080px, and 1080px for every other page (Your listings, Your requests, Requests and those to come). On a phone the page fills the width, as before.
- **Sidebar**, top to bottom:
  - the logo
  - the role's links
  - a "Coming soon" heading
  - Collections and Impact
  - the footer, which sits at the bottom
- **Links:** icon 18px, padding 12px 14px, radius 12px, 4px apart, weight 500 (600 when current). Hover and the current link: a green pill with white text, `#2f6a52` on dark and `#1f5c45` on cream. The current link has `aria-current="page"`.
- **Coming soon:** the heading (11px, 700, uppercase, letter spacing 0.09em), then Collections and Impact, each with a "Soon" tag. They are shown disabled: not links, not focusable, marked `aria-disabled="true"`.
- **Footer:** the arch mark (`#e0a46b`) and "Together we reduce food waste."
- **Top bar:** 68px high. The account sits on the right:
  - avatar: a 38px circle with the organisation's initials, white on primary
  - organisation name (600, 14px), with the role (12px, muted) under it
  - a thin divider
  - "Sign out" with its icon, as a button
  
  There is no chevron. The bar is white with a `#e4e2dc` border before the flood, and cream with a `#e6e0d1` border after.

**Navigation per role:**
- Donor: Your listings, Share food, Requests (count of pending requests)
- Recipient: Find food, Your requests (count of the recipient's pending requests)
- Administrator: not designed yet (after Monday)

### Sidebar states and the flood animation

- **Dark green** straight after sign-in.
- **The flood** plays once per sign-in session, on the first click on any sidebar link, including the current page's link. The click navigates straight away; the animation plays in the layout around the new page and never delays it.
- **Cream** after that, for the rest of the session.
- The state is remembered in `sessionStorage`. Signing out clears it, so the next sign-in starts dark green. A refresh keeps the current state and never replays the animation.

**Timings** (exactly as in `foodbridge-sidebar-animation.html`, measured from the click):

| Step | What happens | Starts | Duration | Easing |
|---|---|---|---|---|
| 1 | Cream rises from the bottom of the sidebar to the top. Its top edge is curved (`border-radius: 60% 60% 0 0 / 40px 40px 0 0`) and flattens as it fills | 0s | 0.6s | `cubic-bezier(.45,0,.35,1)` |
| 1a | Sidebar text turns from the dark-state colours to the cream-state colours as the cream passes: footer at 0.05s, coming-soon links and tags at 0.2s, "Coming soon" heading at 0.28s, links at 0.35s; "Bridge" at 0.4s; the icon's bridge and water switch to the light version at 0.45s | 0.05s to 0.45s | 0.3s each | `ease` |
| 2 | Cream flows across the top bar from the left. Its leading edge is rounded (`border-radius: 0 40px 40px 0`) and flattens as it fills | 0.5s | 0.75s | `cubic-bezier(.25,.8,.35,1)` |
| 3 | A 3px green line (`#1f5c45`, rounded ends) runs along the bottom edge of the top bar, from its right edge to the logo (64px from the left of the page) | 1.3s | 0.7s | `cubic-bezier(.45,0,.25,1)` |
| 4 | "Food" fills with `#1f5c45` from the bottom up (a two-colour background clipped to the text) | 1.95s | 0.45s | `cubic-bezier(.45,0,.3,1)` |
| 5 | The green line fades out | 2.25s | 0.3s | `ease` |

**Layering (this matters):**
- The cream layers are absolutely positioned at `z-index: 0`. The sidebar's and top bar's content sits above them at `position: relative; z-index: 1`.
- The green line sits above everything at `z-index: 3`.
- The layers and the line are decorative: `aria-hidden="true"`, `pointer-events: none`.
- If the cream layer sits above the content, it covers the top bar and the top bar flood can't be seen.

**Reduced motion:** with `prefers-reduced-motion: reduce`, the switch to cream is instant. There are no transitions, and the line never shows.

### Phone (below 768px)

- No sidebar. The phone is always in the cream state, and there is no flood.
- **Top bar:** 60px, cream with a `#e6e0d1` bottom border, 16px side padding. The logo is on the left (cream colours) and a 34px avatar on the right.
- **Avatar menu:** the avatar is a button that opens a small menu with the organisation, the role and "Sign out". The menu closes on Escape and returns focus to the avatar.
- **Bottom tab bar:** cream, with a `#e6e0d1` top border, fixed to the bottom.
  - It holds the role's links: icon (22px) over label (11px), in `#2d5a46`. Coming-soon items are not shown.
  - The current tab is a green pill (`#1f5c45`, white text, radius 12px) with `aria-current="page"`.
  - Counts follow the label: "Your requests · 2".
- **Content:** padding 20px 16px. The content leaves room at the bottom so the tab bar never covers it.
- Works from 360px wide.

### Per screen

**Sign in (S1).**
- **Desktop:** two halves.
  - Left: the dark green panel with the wordmark and the headline "Good food deserves another table." (Fraunces 66px, styled text, not a heading). Then the description "A practical way for food businesses, community groups and charities to share surplus food and reduce waste in Lagos." and three icons: "Reduce food waste", "Support communities", "Build a stronger Lagos".
  - Right: the `h1` "Welcome back", "Sign in to your FoodBridge account.", Email address, Password, the Sign in button, then the Demo accounts box ("Use these accounts to explore the app. Choose one to fill in the email and password. Password in the README."), one button per account.
- **Phone:** a short dark green header with the logo and the headline only, then the form and the demo account chips (S1), so the page fits one screen.

**Find food (S3).**
- `h1` "Find food" and the line "Discover surplus food from local businesses and organisations in your area." (phone: "Surplus food from local businesses near you.").
- The search box ("Search by food name, donor or area…"), then the Category, Pickup area and Status filters: three across on desktop, two per row on a phone.
- Cards in three columns on desktop and one on a phone, as described in S3.
- "View listing" is an outline button and "Request food" is primary.
- "Requested · waiting for donor" sits above the buttons (12px, 600, `#8a4b10`).

**Listing details (S4).**
- A single column (card up to 760px wide), with a "Back to Find food" link above it.
- Image 260px high (200px on a phone), then the food name as the `h1` with the status badge beside it, and "category · donor".
- Quantity, pickup time and area. On desktop these sit in one row, with the day under the time.
- The "Description" and "Food category" sub-headings (`h2`), the latter with one category chip.
- A full-width "Request this food" button and S4's helper line under it.

**Share food (S2).**
- `h1` "Share food" and the line "Fill in the details below to list surplus food and get it to people who need it." (phone: "List surplus food so people who need it can request it.").
- One card holding the form in the designed order:
  - Food name
  - Description
  - Category, Quantity and Unit
  - Pickup area, Collection date and Time
  - Add photo (optional), a dashed drop zone: "Click to upload or drag and drop" (phone: "Take or upload a photo")
- Rows of three on desktop. On a phone each field is on its own row, except Quantity with Unit and Collection date with Time, which stay in pairs.
- Required fields are marked with an asterisk, explained once at the top of the form: "Fields marked * are required."
- "Publish listing" is right-aligned on desktop and full width on a phone.
- Donors put collection instructions in the description.

**Requests (S8).**
- `h1` "Requests", the S8 line, then the tabs as pills: the selected tab is primary with white text, the others white with a `#d9d7d0` border.
- Cards with the organisation's initials and the S8 details.
- Approve (primary) and Decline (outline) are 160px wide on desktop and split the card's width on a phone.
- The tabs scroll sideways on a phone.

### Removed on purpose

Google sign-in, Create account, the notifications bell, Dashboard, Transactions, Profile and Settings links, "Save for later", Share food's live preview card, and the account chevron in the desktop top bar. A separate collection notes field comes after Monday; until then, collection instructions go in the description.

### Deliberate differences from the design files

| Where | Design file | Build this | Why |
|---|---|---|---|
| Demonstration label | `#8a918c` (2.98:1) | `#5f6963` (5.27:1) | Text contrast 4.5:1 |
| Input placeholders | `#8a918c` (3.23:1) | `#5f6963` (5.70:1) | Text contrast 4.5:1 |
| Input borders | `#d9d7d0` (1.44:1) | `#8a877c` (3.60:1) | Input boundaries need 3:1 |
| Muted text on cream | `#5f7a6b` (4.12:1) | `#4f6b5d` (5.14:1) | Text contrast 4.5:1 |
| Focus ring on cream | `#f0a24b` (1.85:1) | `#c2410c` (4.55:1) | Focus must stay visible, 3:1 |
| Sign-in headline | A second `h1` | Styled text, not a heading | One `h1` per screen |
| Desktop sign-in wordmark | "FoodBridge" in Fraunces | DM Sans 700, "Food" white, "Bridge" `#f0a24b` | One wordmark everywhere |
| Demo accounts | Four, "Admin" on the phone | S1's three, one per role, "Administrator" | Matches the service's accounts |
| Share food: Description | Marked required | Optional, with the 500-character counter | S2 rules |
| Share food: Time | Not marked required | Required | The deadline needs a time |
| Share food: required fields | Asterisk not explained | "Fields marked * are required." | Instructions for every user |
| Account chevron (desktop) | Shown, opens nothing | Removed | Sign out is already visible |
| Phone Sign out | Missing | Avatar menu | Users must be able to sign out |
| Phone Find food | No Status filter | Status filter kept | S3 filters |
| Phone Requests tabs | Cut off at the edge | Scroll sideways | Every tab reachable |
| Listing details | "Back to browse"; `h3` sub-headings | "Back to Find food"; `h2` | Screen name; headings in order |
| Sizes that differ between files | Wordmark 22px, link padding 11px, top bar padding 28px in the animation file | 24px, 12px 14px, 32px from `source-html/` | Motion from the animation file, static sizes from the screens |

The categories, units and donors in the designs ("packs", "containers", "Restaurant", "Market") are sample text, not the S2 lists, which are still **TBC**.
