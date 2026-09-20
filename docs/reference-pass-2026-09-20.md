# Reference and interaction pass — September 20, 2026

## References checked

- Official archived West Wing tour: https://obamawhitehouse.archives.gov/node/354641
  - First-floor plan places the briefing stage at the west end of the connector, with press workspaces continuing east and the colonnade alongside its south wall.
  - The room has 49 fixed seats arranged seven by seven. The game preserves this count and provides a center aisle and rear/south circulation for its character collision radius.
  - Lobby reference includes a mahogany bookcase, clock and landscape artwork.
- Official gallery: https://www.whitehouse.gov/walk-of-fame/
  - The 47 individual framed gallery photographs are packed into a single local texture atlas. The fanlights, white wall, gold accents and plaque arrangement also follow the user's two supplied photos.
  - Game plaques show names and terms only. They do not reproduce the exhibition's biographical commentary.
- Washington Crossing the Delaware, Met Open Access: https://www.metmuseum.org/art/collection/search/11417
  - Public-domain reproduction used in the lobby/hallway treatment; additional placements are interpretive.
- Existing user-supplied first-floor plan and aerial reference remain the basis for room adjacency and exterior relationships.

## Changes

- West-facing briefing seating and west-end lectern; plain framed press windows, open doors at connector transitions, overhead lighting rails.
- Colonnade opens toward a garden outlook. The garden portal transfers to the full exterior estate; interior and exterior dimensions still differ.
- Fixed inward-facing residence sofas and guest chairs; removed desk props from bedroom bedside tables; Entrance Hall columns now stay inside its footprint.
- South residence exit moved to the Diplomatic Reception Room doorway; State Floor exit moved to the north Entrance Hall doorway. Upper floors use stairs rather than a portal in the middle of a room.
- Sitting at the Resolute desk and selected desks/sofas, a lectern stance with a hand gesture, and a worksite lift signal. E or movement leaves a seated/lectern pose and returns to the clear approach point.
- Articulated crane, cable/load and excavator animation; two stationary crew members reuse the existing licensed staff model. Construction timing/staging is illustrative, not a current site survey.
- Outdoor map rendered once from the actual estate scene at startup, with correctly aligned travel/player overlays. No additional WebGL context or per-frame map pass.

## Validation and remaining limits

Navigation checks cover all 63 destinations and 14 conversations. Regression checks cover the continuous briefing/press-office/Palm Room route, interactive poses and exit positions, moving crane geometry after static batching, seated skeleton measurements, and camera/wall intersections in all 54 rooms. Browser visuals and physical-device frame rates are not measured by these geometry tests.

This is still a public-plan game adaptation. Office dimensions, upper-floor interiors, furnishings and exterior/interior transitions are not a surveyed reconstruction. The changes do not establish that every wall or furnishing is historically exact.
