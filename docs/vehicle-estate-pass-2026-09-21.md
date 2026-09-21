# Vehicle and estate pass - September 21, 2026

The source White House West Wing is now rendered at the same unit scale and origin as the residence. Its roughly 30 m main block sits farther west and south, with the longer press/colonnade connection retained. The old procedural wing is removed. New entry openings are carved through the actual triangles, preserving interpolated texture coordinates. Gardens, exterior entrance/return positions, circulation, perimeter and the generated overhead map move with this geometry.

The ballroom construction follows the north-south mass and east connection in the NCPC March 2026 report (pages 14, 15 and 30 in the PDF). The exterior works are approximately 42 x 94 m; the indicated event area is 36 x 57 m (about 22,000 sq ft), within that larger support-building footprint. Roof framing reaches about 18.3 m. These are game approximations inferred from the public illustrative plan, not measured construction drawings. The upper deck, steel framing, crane and excavator show a fictional construction stage. Existing interior rooms remain a separate public-plan adaptation and do not become surveyed interiors through this change.

Reference: https://www.ncpc.gov/docs/actions/2026March/8733_East_Wing_Modernization_Project_Staff_Report_Mar2026.pdf
White House source and cart licenses: public/models/credits.txt.

The gold golf cart uses Michael Ruddy's downloadable CC BY 3.0 asset, repainted and batched to 20 draw calls and 5,548 triangles. Wheels retain real pivots. Vehicle motion uses acceleration, braking, reverse and bicycle steering, with substepped footprint collision checks, seated driver posing and checked dismount positions. It stays outdoors; travelling to an interior parks it. The mobile thumbstick, camera pointer, jump and run/brake controls use independent pointer capture.

Walking accelerates/decelerates smoothly. Jump has a short input buffer and ledge grace; horizontal control remains active in the air. Manual looking overrides auto-follow without rotating a held movement direction into a circle. Keyboard and pointer input clear on pause, loss of focus and visibility changes.

Validation: actual GLB loader and wheel pivots, production movement/cart simulation, simultaneous movement/jump/look, pointer ownership, forward/turn/brake/reverse/dismount, swept thin-obstacle collision, all existing room/NPC routes, entrance mesh rays including imported facade, staircase routes and animated skeleton regressions. Offline checks do not establish physical-device FPS or photorealism.
