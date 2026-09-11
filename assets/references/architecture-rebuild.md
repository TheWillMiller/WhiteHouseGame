# Architecture rebuild reference brief

User supplied September 11, 2026 after rejecting the prototype's layout, architecture and grounds. User has firsthand West Wing experience and is preparing a rigged/animated Trump replacement separately.

## Accepted starting references

- Archisyllogy: https://www.archisyllogy.com/the-white-house
- Inspected State Floor drawing: https://images.squarespace-cdn.com/content/v1/58c5a3d2db29d6bfd8e14813/1490452911581-RAG4P3FKP7LV3VGUBL33/01_White_House.jpg
- User-attached exploded White House illustration: useful for floor stacking, building masses, wing connections and room relationships. Its upper-floor numbering uses a different convention from the game's US floor labels; normalize by room identity rather than copying floor numbers.
- Existing publicly archived West Wing tour booklet: https://obamawhitehouse.archives.gov/sites/default/files/docs/west-wing-tour-booklet.pdf

These are architectural references, not verified current measured blueprints. Reconcile the historical East Wing depicted in the illustration with the game's separately illustrated ballroom construction scene. Do not silently treat both as contemporaneous. Linked reference images are not bundled into the public game as distributable artwork.

## Confirmed prototype problems

- `lib/world-data.ts` models the West Wing as six similarly sized rooms on a three-column, two-row grid. This is placeholder navigation, not a traced plan.
- The State Floor combines Entrance Hall and Cross Hall in one destination. The inspected drawing shows a north Entrance Hall and a separate east-west Cross Hall connecting the ceremonial rooms.
- State Floor room proportions need rebuilding from the drawing. Preserve the eastern full-depth East Room, western dining spaces, and Red / Blue / Green south-side sequence; trace their boundaries rather than fitting them into regular tiles.
- Stair locations, door openings, window bays and the south oval projection should be derived together with room boundaries. Existing travel markers are not evidence of architectural placement.
- Grounds and facade need consistent scale with the reconstructed interior. Do not preserve existing arbitrary room sizes merely to retain the old collision grid.

## Implementation sequence

1. Establish a single scale and north direction, then trace the residence State Floor footprint, room polygons, openings and circulation from the dimensioned drawing.
2. Reconcile the West Wing public plan with the supplied exploded illustration, including the colonnade / residence connection. Produce a readable top-down layout for the owner's corrections before spending time on furnishings.
3. Build walls and collision boundaries from the same geometry; check door widths, walkable connections, room proportions and alignment between floors.
4. Rebuild the exterior massing and landscape against those dimensions, then add material and furnishing detail.
5. Integrate the user's forthcoming skeleton and animation clips. Keep the current basic runtime rig only until the supplied replacement is available.

Status: references reviewed and corrections recorded. No architecture changes or new game deployment were made in this reference intake.
