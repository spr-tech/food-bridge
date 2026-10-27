# AI log

Tools used, what we asked, what we accepted, what we rejected, and what we checked and found wrong.
The brief (p.25) requires at least one case where AI output was checked and found wrong.

## Tools
- Claude (claude.ai): planning, specs, shared components, design renders, landing and sign-in design
- Claude Code: building the frontend
- Replit Agent: clickable design prototype

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