# State Floor corrections from the public virtual tour

The owner supplied the [Google Arts & Culture White House tour](https://artsandculture.google.com/story/aQVRQ1-zMnlrnQ). Its credits and Google's [October 27, 2023 launch](https://blog.google/company-news/outreach-and-initiatives/arts-culture/explore-the-white-house-with-google-arts-culture/) date the reference to 2023. This is a public residence tour, not a survey of the West Wing, private upper floors, or September 2026 construction.

The four panorama stills on Google's launch page were inspected for the Blue, East, Green and Red Rooms. The linked [State Floor exhibit](https://artsandculture.google.com/story/jgXBMr3Z9lSjLw), [National Park Service brochure](https://www.nps.gov/whho/planyourvisit/park-brochure.htm), and [archived official State Dining description](https://clintonwhitehouse4.archives.gov/WH/glimpse/tour/html/dining.html) provide additional context. The NPS/archived sources specifically establish the State Dining fireplace in the center of the west wall, with Lincoln above and windows to either side.

## Implemented

- Replaced the Blue Room's rectangular shell and blue-painted walls with an oval shell, cream upper walls, white lower panels, blue textiles, gilt seating, central flower table, mantel and three curved-wall window bays. The map outline and location detection use the same oval. Three open passages connect it to the Cross Hall and adjoining salons.
- Removed the sofa across the East Room's west entrance. Kept a broad clear floor with sparse wall seating, dark mantels, tall mirrors, explicit tall window bays, and three chandeliers. Removed the overlapping fourth chandelier and unrelated corridor fixtures inside the room.
- Gave the Green and Red Rooms separate wall/textile palettes, perimeter seating, glass-front cabinets, windows and mantels. Kept the east–west doorway approaches clear rather than placing sofas across them.
- Replaced State Dining's generic office arrangement with a lower banquet table, dining chairs, table settings, west-wall mantel and Lincoln portrait, flanking windows, and three eagle-base pier tables.
- Added furniture collision footprints and curved-wall camera proxies. Prevented walking/teleporting into unusable space behind the Blue Room's shell while keeping off-center doorway approaches open.
- Added the dated tour references to the in-game field guide.

The assets are lightweight procedural geometry using the established static batching. Existing public-domain artwork is reused; the Google panorama images are research references outside the published game, not republished textures.

## Accuracy limits

Room dimensions remain playable approximations. Window counts, furniture positions, fabric patterns, carved ornament and mirrors are representative of the inspected views, not a measured reconstruction. The narrower Blue Room shell corrects its shape without claiming surveyed dimensions. Green/Red mantel mirrors are simplified stand-ins for their changing artwork. The dining table is one event arrangement, not a permanent fixture. Current exterior changes are not rolled back to the 2023 tour imagery.

## Verification

Navigation checks cover all destinations and NPC approaches, every existing interior doorway, the East Room entry, the continuous Red–Blue–Green route, and center/off-center north Blue Room approaches. Curved-wall checks exercise camera angles, door headers, and invalid teleport destinations. Static mesh/triangle limits guard against unbounded ornament cost. Offline CPU geometry views diagnose the four representative rooms; they do not reproduce game lighting or establish device frame rates. Type checking and both production builds are required before publishing.
