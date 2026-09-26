# Grounds and interior finish pass — September 26, 2026

## Reference decisions

- The National Park Service's White House East Wing Modernization and State Ballroom Environmental Assessment describes the Rose Garden's 2025 replacement of the central grass panel with a diamond-patterned concrete paver patio, retaining rose bushes and ornamental beds. Both the outdoor estate and the West Colonnade outlook now show a pale paved terrace. This is not described as marble.
  https://parkplanning.nps.gov/showFile.cfm?projectID=133780&sfid=823750
- White House Historical Association, “A Pool for the President,” documents the outdoor pool south of the West Wing. The game retains its approximate southwest location; the new basin, stairs and pool furniture are a visual interpretation, not a surveyed recreation.
  https://www.whitehousehistory.org/a-pool-for-the-president
- White House Historical Association's North Lawn fountain photographs informed the low basin and spray treatment. The old tiered pedestal and opaque blue tube streams are removed.
  https://www.whitehousehistory.org/photos/white-house-north-lawn-fountain-1890
- Marine One is a lightweight original VH-92-inspired model in presidential green and white. It is race scenery, not an exact aircraft simulation or actual flight operation. Four-bladed main/tail rotors, cockpit/cabin windows, landing gear, engine nacelles, lettering, spin-up, vertical lift and departure are included.
  https://www.aviation.marines.mil/Portals/11/Documents/Aviation%20Plan/2022%20Marine%20Aviation%20Plan%20FINAL%20April%202022.pdf

## Changes

- Ground meshes now have an actual pool opening. Recessed plaster/tile basin, coping, waterline tile, shallow entry steps, steel handrails, deck joints and chaises replace the blue slab. The basin is blocked for pedestrians and carts; swimming has not been added.
- Water uses a lightweight animated surface shader; the fountain uses 780 moving spray points, updated at 30 Hz nearby. No reflection render target or fluid simulation.
- Rose bushes use one shared 768 px alpha-tested cutout texture and instanced crossed cards. Geometry petals removed; no white placeholder cards while loading. The texture is generated original artwork, not a historical photograph.
- Shared room partitions are constructed once with door openings reconciled across both faces. Corridor envelope ends are enclosed. Door lintels remain camera obstacles; wall bases, panels and crowns are retained.
- Continuous stone residence circulation floors replace separate oversized checkerboard tiles. Ceiling fixtures, slatted benches, glazed planters, layered sofa pillows, softened mattresses/tabletops, detailed kitchen storage/sink and flower-workshop bouquets improve remaining primitive fixtures.
- Lobby sofa moved out of a doorway. Kitchen counter split around its side entrance. Residence display cases moved away from side-door openings.
- Marine One waits for the racer near the South Lawn, spins up, lifts and departs. Race exit/restart resets it. It does not obstruct the route or appear in the permanent minimap.

## Validation

See `tests/beauty-pass.test.mjs`: every declared doorway's center approach is checked with the walking collision radius, shared-wall construction is checked, the pool is ray-tested for depth and an unobstructed opening, fountain particles animate within a fixed budget, and race aircraft departure/reset and draw count are checked. Existing world navigation, room camera, controller and racing tests cover integration. These are geometry/simulation checks; no browser visual review or physical mobile FPS measurement is claimed.
