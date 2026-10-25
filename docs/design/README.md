# Design references

`foodbridge-final/` holds the final FoodBridge design: every Monday screen on desktop and
phone, the logo files, and the approved sidebar animation.

**Source of truth.** `foodbridge-final/source-html/` and
`foodbridge-final/foodbridge-sidebar-animation.html` are the source of truth for exact colours,
sizes, spacing and timings. The PNGs are pictures of them: use them to see the screen, never to
measure it.

The designs show the success state only, with demonstration data. Wording, the other four
states (loading, empty, error, confirmation) and behaviour come from
`../spec/foodbridge-interface.md`. Where a design and the spec differ, the spec wins: section 12
("Visual design") lists the deliberate differences, including the colour fixes for WCAG
contrast.

## Desktop screens

| File | Shows |
|---|---|
| `1-sign-in.png` | Sign in: dark green left panel (headline, description, three icons), form and demo accounts box on the right |
| `2-donor-share-food.png` | Share food (create listing), donor, with the cream sidebar |
| `3a-find-food-sidebar-green.png` | Find food, recipient, just after signing in: dark green sidebar, white top bar |
| `3b-find-food-sidebar-light.png` | Find food, recipient, after the first sidebar click: cream sidebar and top bar |
| `4-recipient-listing-details.png` | Listing details, recipient view, single column with "Request this food" |
| `5-donor-requests.png` | Requests, donor: Pending, Approved, Declined and Expired tabs, cards with Approve and Decline |

## Phone screens (below 768px)

| File | Shows |
|---|---|
| `m1-sign-in.png` | Sign in: short dark green header (logo and headline), form, demo accounts as tap-to-fill chips |
| `m2-donor-share-food.png` | Share food, donor |
| `m3-recipient-find-food.png` | Find food, recipient, with the cream bottom tab bar |
| `m4-recipient-listing-details.png` | Listing details, recipient view |
| `m5-donor-requests.png` | Requests, donor, with the status tabs scrolling sideways |

## Logo

| File | Use |
|---|---|
| `logo-full-light.svg`, `logo-full-dark.svg` | Icon and wordmark. Docs and slides only: the SVG can't load web fonts, so the app never uses it |
| `logo-icon-light.svg`, `logo-icon-dark.svg` | Icon only. The app uses these, with the wordmark as real text in DM Sans 700 beside it |
| `favicon.svg` | Browser tab icon: the dark icon on a dark green rounded square |

"Light" files are for light backgrounds (cream, white): green bridge and water. "Dark" files
are for the dark green background: pale green bridge and cream water.

## Animation

`foodbridge-sidebar-animation.html` is the approved sidebar "flood" animation, with exact
timings, easing and layering. Open it in a browser and click a sidebar link to play it. The
Replay button is for the demo only and is not part of the app.

## Source HTML

`source-html/` has the exact HTML and CSS behind every screen above, one file per PNG with the
same name. Read these for values; don't copy the markup, which is static and not accessible as
written (for example, the sign-in files have two `h1` headings).
