# White House reference and gameplay pass — September 27, 2026

## Evidence library

`assets/references/current-2026-09/index.html` is a browsable collection of 350 downloaded photographs, assembled from 19 official galleries. Of the 24 source pages checked, four returned access errors and are recorded in the manifest; one historical page yielded no images matching the current-photo filter. The JSON manifest preserves original URLs, captions, dates, source pages and hashes. Twelve contact sheets make comparisons practical. These research files are outside `public/` and are not downloaded by players.

This is a substantial public reference set, not every photograph on the internet. Dates matter: current photographs take precedence over older tours for finishes and furniture. A planning proposal is evidence of intended relationships, not proof that construction is complete.

## Evidence to implementation

| Area | Evidence | Change and remaining limits |
| --- | --- | --- |
| South Lawn | [Official September 21 helipad gallery](https://www.whitehouse.gov/gallery/president-donald-j-trump-participates-in-a-ribbon-cutting-ceremony-of-the-new-white-house-helipad/) | Restored a separate fountain farther south than the pad; low red planting at fountains; retained the separate flagpole and approach. Coordinates and basin radius remain photo estimates. |
| Drives and pool relationship | [NCPC April 2026 report, pp. 15, 30–31](https://www.ncpc.gov/docs/actions/2026April/8733_East_Wing_Modernization_Project_Staff_Report_Apr2026.pdf) | Replaced the round South Drive with an asymmetric traced loop and branching asphalt drives; moved the pool south of the West Wing; reduced and relocated the putting green. Adapted to existing game bounds, not survey coordinates. Proposed East Wing landscaping is not represented as completed work. |
| Pool size | [White House Historical Association](https://www.whitehousehistory.org/a-pool-for-the-president) | Basin footprint uses the documented 22 × 54 feet (6.706 × 16.459 m), replacing the oversized 12 × 24 m basin. Deck, rails, steps and depth profile remain approximations. |
| Rose Garden | [Official September 17 dinner gallery](https://www.whitehouse.gov/gallery/president-donald-j-trump-hosts-a-rose-garden-dinner-for-americas-hunters-and-fishermen-while-announcing-new-executive-orders-september-17-2026/) | Added white lattice chairs, round tables and alternating cream/gold parasols on the paved terrace, preserving clear circulation. Four representative settings, not an exact event seating plan. |
| West Colonnade | [AP report](https://apnews.com/article/61667fb3faaa9a7e9cfc9ffb4f7dc90e) and dated official photos | Dark granite finish replaces the earlier pale flagstone in the exterior and walkable interior. Portrait gallery remains in the colonnade. |
| Cabinet Room | [Official March 26 meeting](https://www.whitehouse.gov/gallery/president-donald-j-trump-hosts-a-cabinet-meeting-thursday-march-26-2026/) | Lengthened the undersized table, spaced ten seats down each side, added tabletop microphones. Exact carving, upholstery and decoration are still simplified. |
| Briefing room | [Official September 3 briefing](https://www.whitehouse.gov/gallery/vice-president-jd-vance-hosts-a-press-briefing-in-the-james-s-brady-press-briefing-room-at-the-white-house-september-3-2026/) | Navy segmented backdrop, pale central panel, white columns and oval sign; removed the unrelated side screens. Fixtures and emblem are simplified. |
| North Lawn | Public photographs of the tall pole on the west half of the lawn | Added the second freestanding flagpole. Position is a visual estimate, not a measured placement. |

## Shooting mode

The old wobbling target row is replaced by six separated bays on a dedicated arcade backboard outside the estate. The camera is fixed; pointer movement aims directly and holding fires. Eight-shot magazines reload automatically or with R / the reload button. Three timed waves introduce moving targets and a three-hit boss. Targets expire and return with different art; scoring rewards streaks and reports escapes, accuracy and the final score. The reused illustrated atlas is cropped more tightly so targets are larger and readable. Game decorations are excluded from the estate map. The race circuit bends farther south to clear the restored fountain and slightly inward along the west perimeter to clear the press equipment.

## Validation and limits

Type checking, production builds, walking connectivity for all 66 destinations and 14 NPCs, doorway approaches, pool geometry, target projection/touch hits on portrait and landscape displays, sustained aim without camera rotation, reload/armor/expiry behavior and existing flight/cart regressions are checked locally. CPU geometry previews are separate from the production renderer; they do not establish mobile frame rate or final lighting quality.

The reference library gives the project a repeatable basis for further corrections. It does not make the current model an exact replica: West Wing room dimensions, residence furnishings, terrain elevations, construction staging, detailed facade geometry and many decorative objects still need measured reconstruction. Retain the public-plan adaptation label.
