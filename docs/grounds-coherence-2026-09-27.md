# Grounds corrections following the wider aerial references

This pass supersedes the compressed outer boundaries and fountain coordinates in the earlier September 27 reference pass. The four owner-supplied Google Earth/map photographs establish the enduring estate relationships. Their East Wing and garden imagery predates recent construction, so it is not used to undo dated 2026 changes.

## Layout and circulation

- Replaced the closed North Drive ellipse with the open U-shaped approach and two northern entrances. Moved the North Lawn fountain into that larger lawn.
- Extended the lower southern grounds, with a curved boundary and connected perimeter walk. The southern fountain is now beyond the transverse drive, with open lawn separating it from the helipad.
- Kept the asymmetric South Drive traced from the [NCPC April 2026 report](https://www.ncpc.gov/docs/actions/2026April/8733_East_Wing_Modernization_Project_Staff_Report_Apr2026.pdf), and corrected its connecting branches.
- Replaced disconnected rectangular path strips with shared curved route geometry. Added a continuous western walking connection around the West Wing to the pool deck and South Drive. Paved entrance mouths interrupt the fence rails.
- Removed the 52 obsolete curb strips and obsolete lamps along the starting approach. Matched the two lawn layers so their rectangular boundary is not visible in the estate map.
- Removed the eight formula-positioned lawn benches, including one inside the fountain and another in the construction footprint. Four deliberately placed garden benches remain, clear of walking routes.
- Tree placement now excludes pavement, fountain beds, the pool, landing area and construction footprint. Two trees that obstructed the race circuit were relocated after collision sampling.

The wider aerials put the southern fountain at approximately z=135–140 and the outer southern arc near z=212–220 in the existing game coordinate system; the implementation uses z=136 and a boundary apex at z=224, leaving the perimeter walk at z=214. The North Lawn fountain is approximately z=-92. These are estimates from photographs of maps, with perspective and scale uncertainty. Existing east–west building scale is retained; this is not a survey or a claim of exact current dimensions.

## Entrances, planting and map

- Open West Wing doors now reveal enclosed, finished entrance foyers with floors, side walls, ceilings and inner doors. They retain the existing interaction portals to the walkable interior. These small foyer sets are visual closures, not assertions about the exact current rooms behind those entrances.
- Replaced spherical red flower heads with small five-petal annuals, varied leaves and continuous soil beds. Each fountain bed uses two instanced meshes. This avoids adding separate draw calls for every flower.
- Expanded the one-time overhead map capture to include the full northern and southern grounds. Distant tree culling is temporarily suspended for the capture, then restored, so the map no longer depends on where the player was standing.
- Removed an obsolete teleport exclusion at the old pool location. The current basin collider continues to prevent teleporting into the pool.

Current helipad and fountain ordering is also supported by the [official September 21 helipad gallery](https://www.whitehouse.gov/gallery/president-donald-j-trump-participates-in-a-ribbon-cutting-ceremony-of-the-new-white-house-helipad/). Its downloaded source photographs and captions remain in the existing reference library. The current paved Rose Garden, press tents by the western fence, construction site and helipad are retained.

## Verification

- Walking connectivity to all 66 destinations and approaches to all 14 NPCs, with the curved outer boundary included in the navigation check.
- Clearance along every paved route, sampled with space for a walking capsule; garden bench and tree clearance from paths and sensitive scenery areas.
- Actual imported West Wing facade rays: clear door openings and opaque foyer closures from multiple horizontal and vertical positions.
- Overhead capture at device-pixel ratios 1, 1.5, 2 and 3, including restoration of tree visibility and foliage instance counts.
- Complete driven race laps, all course lanes sampled against colliders, flight, teleport, movement, jumping and camera regressions.
- 154 interior doorway approaches, recessed pool geometry and fountain particle animation.
- Offline CPU geometry views of the whole estate, an entrance, fountain planting and starting approach. These diagnose placement; they do not reproduce production lighting or establish real-device frame rates.

The broader model still uses approximate terrain, interior proportions and representative construction staging. This pass addresses the reported placement failures and circulation gaps; it does not make the estate a finished photorealistic replica.
