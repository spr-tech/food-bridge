# FoodBridge: intent

## Problem
Bakeries, caterers, restaurants and community kitchens often hold surplus food at the
end of a trading day. Community organisations can use it, but there is no reliable way
for the two sides to discover what is available, request it, and confirm it was collected.

## Users
- Donors: bakeries, caterers, restaurants, community kitchens
- Recipients: community groups and charities collecting food
- Administrator (demonstration role): reviews listings and monitors activity

## Goal
Make it simple for a donor to publish a surplus food offer, and for a recipient to request
and track a collection. FoodBridge coordinates offers. It does not certify food safety,
arrange transport, or guarantee that a collection takes place.

## User journeys
1. A donor creates a listing: food name, description, quantity, photo, pickup area,
   collection deadline.
2. A recipient browses listings and filters by category, area and availability.
3. The recipient requests a listing; the donor approves or declines it.
4. The donor or administrator updates the handover status until the food is collected,
   or the listing expires.
5. A dashboard summarises open listings, requests, completed handovers and estimated
   portions saved.

## Monday 26 October (MVP checkpoint)
- Journeys 1 to 3, end to end, against the deployed service (not the mock), from a
  clean browser.
- Three simultaneous requests produce exactly one approved reservation, proven by an
  automated test that also fails when the protection is removed.
- Both tiers deployed through GitHub Actions; seed data subset; demo credentials in
  the README; anything simulated labelled.

## Business rules
- A listing requires a title, category, quantity, pickup area, collection deadline and donor.
- An expired listing accepts no new requests. An expired listing holding an approved
  request must reach a defined final state, not stay open.
- A listing holds at most one approved reservation at a time, even when three requests
  arrive at once.
- Only the owning donor or the administrator can edit a listing or change its handover
  state. Enforced by the service, not the interface.
- Portions saved is derived from recorded handovers and labelled as an estimate.
  A reversed handover moves the figure back.

## Done when
- A listing survives a refresh; a listing past its deadline cannot be requested,
  shown from a clean start.
- Three recipients requesting the same listing in the same second produce exactly one
  approved reservation (automated test).
- Search and filters combine and can be cleared.
- Dashboard figures reflect seeded and created data and move correctly when a handover
  is reversed.
- Seed data: at least 40 listings covering every state, including two that expired
  while a request was pending.

## Out of scope
Delivery dispatch or route planning. Payments or donor billing. Food safety certification,
temperature tracking or any compliance claim. Chat and push notifications.

## Open decisions (record each in docs/decisions.md)
- What final state an expired listing with an approved request reaches.
- Which action uses an optimistic update with rollback (proposed: donor approves a request).
