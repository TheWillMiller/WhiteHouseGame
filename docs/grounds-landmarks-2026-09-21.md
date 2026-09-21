# Grounds detail pass

Adds a 30.48 m diameter South Lawn helipad, with a local monochrome presidential
seal vector texture, granite grain, fine slab joints and narrow stone approach.
Its center is at (0,25) in the game's approximate estate coordinate system.
The existing fountain and race route remain clear. The travel map now includes
the helipad, South Lawn flagpole and TV press tents.

The South Lawn flagpole is 26.8224 m (88 ft), with a tapered metal shaft, base
collar, halyard, cleat, finial, planting and white border flowers. A subdivided
flag deforms at 20 Hz when nearby; the hoist remains attached. This is the only
new continuously animated landmark. Static components join the existing batches.

Four open-front press canopies stand on the North Lawn near the West Wing, in
the public-reference broadcast area rather than the helipad's flight surface.
They include tensioned hip roofs, curtain folds, crossed bracing, weighted legs,
tripod cameras, lenses, softboxes, equipment cases and cables. Equipment and
tent supports have collision, while tent fronts remain accessible. No additional
real-time lights, model downloads or render passes are introduced.

The game retains approximate overall estate dimensions. These additions improve
the specified landmarks; they are not a claim that all grounds now match a survey.
Reference URLs and asset provenance are in public/textures/helipad-credits.txt.

Validation: world connectivity for 66 destinations, NPC approach points and
finite geometry; actual race motor completes the two-lap route with the new
collisions; flag deformation/anchor and static geometry bounds; TypeScript and
production builds. No browser visual review or real-device FPS measurement.
