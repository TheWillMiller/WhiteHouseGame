# White House · Free Roam

Play: https://thewillmiller.com/trumpgame/

Source: https://github.com/TheWillMiller/WhiteHouseGame

An unofficial browser game inspired by the supplied low-poly reference images. Play as Donald Trump, freely explore the modeled grounds, visit the furnished interior destinations on five floor maps, and talk to 14 NPCs. The grounds include the north and south lawns, gardens, pool, putting green, colonnades, and an illustrative East Wing ballroom construction site.

The graphics pass adds beveled character models, sculpted facial features, layered hair, suit details, physically lit procedural materials, cloth flags, atmospheric sky, and closer character framing. Furnishings include carved desk panels, dimensional carpet emblems, pleated curtains, lamps, fireplace details, and raised wall molding. Facade trim, shutters, tree branches, flowers, lanterns, and construction equipment receive additional detail. Material tiles are generated locally; no image service or paid asset download is needed at runtime.

## Run

Use Node 22.13 or newer. Run `npm install`, then `npm run dev`. `npm run build` creates the static export in `dist/client`. The site does not require a server database, API key, or external game assets. Audio is synthesized locally and begins muted.

WASD / arrows move; Shift runs; Space jumps; drag looks around; Q / R turn; E interacts; M opens the map. Touch controls are available on phones and tablets. Use the map to travel directly to any modeled destination. Progress counters are per session.

## Meshy player asset

The player uses `public/models/trump-detailed-v3.glb`: the original 60,000-triangle textured mesh with skin weights transferred from the supplied 28-joint Meshy rig. This restores facial detail lost in the much coarser animated export. The material is nonmetallic with restrained normal mapping; scene lighting includes softer fill.

Idle averages opposing walking poses into a centered standing stance with slight breathing. Strolling uses the continuous walk cycle at half speed, replacing the long look-around clip whose pauses caused sliding. Normal walking, running, sprinting and gestures retain the supplied skeleton animations. G plays the custom dance, Y YMCA, V victory and B backflip. Hold C to stroll, Shift to run or Shift + C to sprint. Moving cancels gestures.

`scripts/restore-player-detail.mjs` transfers skin weights from the animated model to the original optimized mesh, checks alignment, and writes the detailed version. `assets/models/detail-transfer.json` records the result. Original uploads remain untouched. `tests/player-model.test.mjs` checks real loader/mixer poses, skin weights and continuous foot motion during C movement.

## Architecture revision

The residence now has an open South Portico around a smaller curved wall, six fluted columns, a Truman Balcony, curved balustrades, a recessed attic and chimneys. The North Portico uses a triangular pediment. Limestone, lawn and tree treatment are revised to reduce the faceted, tiled prototype look.

The State Floor separates Entrance Hall and Cross Hall, with room-specific proportions and connecting doors based on the supplied Archisyllogy drawing. The West Wing repositions the major public rooms and briefing-room annex, adds the lobby and Upper Press Hallway, and reconnects the colonnade approach using the archived White House tour plan. There are 44 destinations. These are substantial corrections to the prototype, but not a complete measured reconstruction of all offices or floors; upper-floor layouts remain simplified. Architecture and collision checks verify all destinations and NPC approaches remain reachable.

## Custom-domain deployment

`npm run build:domain` exports the game for `/trumpgame` and stages its static assets in an ignored `.qa` folder. It generates `wrangler.trumpgame.jsonc`. With Cloudflare authentication configured, run `npm run deploy:domain` to rebuild and deploy the `white-house-game` static-assets Worker. The four routes cover `/trumpgame` and `/trumpgame/*` on both the apex and `www` hostnames. No server runtime, database, or paid API is required. Normal `npm run build` still produces the root-path export for Sites.

The domain build includes a narrowly scoped workaround for vinext beta.5's missing base path in loopback prerender requests. It fails if the game HTML is missing. Generated credentials, staging files, and local configuration are excluded from Git.

## Scope and sources

This is a public-plan adaptation, not a current measured blueprint. Major room relationships use the NPS brochure and the publicly archived West Wing tour plan. Rooms, scale, openings, furnishings, and upper floors are simplified or imagined for game navigation. The construction scene represents an illustrative stage, not live site progress. There are no claims to exact private layouts, security infrastructure, or full reproduction of every real White House room. All NPC conversations are fictional. The cast includes selected current and former second-administration figures; Karoline Leavitt is explicitly identified as a former press secretary.

- NPS rooms and grounds: https://www.nps.gov/whho/planyourvisit/park-brochure.htm
- Archived West Wing floor plan: https://obamawhitehouse.archives.gov/sites/default/files/docs/west-wing-tour-booklet.pdf
- Second floor history: https://www.whitehousehistory.org/white-house-tour/the-second-floor
- Ballroom proposal: https://www.ncpc.gov/projects/8733/
- Cabinet roster checked September 10, 2026: https://www.whitehouse.gov/administration/cabinet/
- Leavitt tenure: https://www.whitehouse.gov/releases/2026/08/never-surrender-karoline-leavitts-historic-tenure-as-white-house-press-secretary/

## Verification

`node tests/world.test.cjs` assembles every zone, validates finite mesh geometry, checks collision-free travel positions, flood-fills the walkable world to confirm every destination is connected, checks every NPC and entrance can be approached, and validates dialogue branches. `npx tsc --noEmit` checks TypeScript. The production build is checked before deployment.

No browser interaction or screenshot QA was requested. Optional WebMCP read/travel tools are feature-detected; a supported native WebMCP verification context was unavailable, so native registration has not been verified. The regular game controls do not depend on WebMCP.

## September performance and scenery pass

Camera obstruction now uses nearby collision footprints instead of raycasting the detailed render meshes five times every frame. In the same offline Node test positions, the previous camera median was 234 ms; the revised median was 0.03 ms (95th percentile 1.15 ms). These are CPU timings, not browser or mobile frame-rate measurements. `node scripts/benchmark-camera.mjs` reruns the current benchmark after `node tests/world.test.cjs`.

Rendering starts at at most 1x device scale on touch screens and 1.5x elsewhere, then adjusts with sustained frame times. Shadow maps use 1024 pixels and refresh at 15 Hz. Hidden tabs skip simulation/rendering. Trees have independently culled instance clusters and distant crowns use 48 leaf cards, rising to 96 nearby. HUD position updates are limited to five per second and gameplay panels no longer blur the scene beneath them.

The residence v2 retains the same 89,708 triangles while its color, normal, and surface maps use 2048/1024/512 pixels. Download size falls from 8,954,500 to 3,404,384 bytes; estimated uncompressed texture storage with mipmaps falls from about 128 MiB to 28 MiB. West Wing window reveals, masonry bands, roof balusters and garden entry columns, stone garden borders and urns, subtler grass, rounded upholstery and revised staff proportions carry the residence detail through the rest of the scene. The wings remain authored approximations. Staff were subsequently replaced with the textured Rocketbox models described below.

`node tests/render-budget.test.mjs` checks camera proxy clearance and adaptive resolution. Asset decoding, navigation, player animation and Oval Office geometry checks remain available in `tests/`.

Near foliage uses the original generated alpha texture in `public/textures/elm-foliage-v1.webp` (112,238 bytes); full-resolution source and generation prompt are retained under `assets/textures/`. One shared texture serves every tree.

## Mobile and staff revision

The phone HUD keeps location and a small map at the top, movement controls at the bottom, and one contextual conversation button above them. Player identity and progress are removed from the phone play surface; progress remains in the expanded map. Floating NPC names are hidden on phones and touch devices, and their width is capped on desktop.

Fourteen characters now use twelve textured, rigged adult assets from Microsoft's MIT-licensed Rocketbox library. These are generic representations, not accurate likenesses of officials. The source revision and complete license ship in `public/models/staff/credits.txt` and are linked from the field guide. `scripts/prepare-staff.mjs` converts the original FBX/TGA sources into compressed GLBs, normalizes scale and imports a quaternion-only breathing idle to preserve avatar proportions. Diffuse maps are at most 1024 pixels. There are no extra runtime lights in the character files.

Staff download only when their area is entered, share downloads and GPU assets, and retain separate skeletons. Nearby idle animations update at 20 Hz; staff beyond 65 game units are hidden. The existing camera proxies, adaptive resolution and reduced shadow update frequency remain. Textured foliage stays on distant trees, reducing card counts rather than switching to polygonal canopy blobs.

Run `node tests/world.test.cjs` before `node tests/staff-model.test.mjs`. The staff check decodes every shipped model, samples actual mixer poses, checks proportions and grounded feet, verifies texture limits, and checks shared loading with independent skeletons. This is offline geometry/animation validation, not a mobile FPS measurement.
