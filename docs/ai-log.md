# AI log

Tools used, what we asked, what we accepted, what we rejected, and what we checked and found wrong.
The brief (p.25) requires at least one case where AI output was checked and found wrong.

## Tools
- Claude (claude.ai): planning, specs, shared components, design renders
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

### TODO · Claude Code · foundation setup
Asked:
Accepted:
Rejected or corrected:
