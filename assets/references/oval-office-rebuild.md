# Oval Office reconstruction — September 11, 2026

## Follow-up: room scale and camera

Owner reported cramped circulation behind the desk and the camera showing the inside of Trump's torso. The playable ellipse is now 16 by 17.2 game units (previously 12 by 13), with furniture retaining its size. The office moves slightly southeast to preserve neighboring rooms. Sofa spacing, fireplace chairs and flags are repositioned; both desk-side approaches and the route behind the president's chair are tested continuously from the entry.

The indoor camera uses a wider 66-degree field of view, architectural obstruction meshes preserved through batching, five clearance rays, immediate retraction and damped recovery. It hides the avatar below two units of camera distance rather than showing an interior cross-section. Camera orbit tests cover desk approaches and windows, and assert the view remains inside the room. Curtains remain camera blockers; movable-looking flags and chairs do not shove the Oval Office camera forward.

Owner feedback: walls intersect and sofas face backwards. The two supplied photographs are the primary visual references: desk-to-fireplace and fireplace-to-desk views.

Implemented in `lib/oval-office.ts`: continuous extruded ellipse, openings split from the same angular ranges, smooth curved crown/base mouldings, curved window arrangement with three tall sashes, pleated gold fabric and scalloped valances, a centered north fireplace, inward-facing upholstered sofas, a low coffee table, fireplace armchairs, guest chairs facing the desk, Resolute-style desk facing the room, parquet and cream bordered carpet. The northwest entry and walking dimensions are game adaptations. The ceiling remains open for the third-person camera.

The old 40 overlapping rotated boxes and their mismatched collisions are removed. Dense collision samples now follow the actual ellipse. Collision also applies to furniture; both sofa aisles are checked for clearance. Tests raycast against the built inward-facing geometry through a full camera turn and verify seat-facing directions and the doorway. Offline views were rendered from both ends and overhead, without browser automation.

## Reuse search

- [NET Oval Office Tarkka by PetriParkkinen](https://sketchfab.com/3d-models/net-oval-office-tarkka-5a48369d2196421eae664d9bc8fc38fb): listed as downloadable under CC Attribution, 35.4k triangles, published 2017. Official download API returned HTTP 401; not downloaded or bundled. A downloaded authorized GLB could be assessed later. Do not imply this model was imported.
- Other search results lacked a confirmed freely downloadable asset. No viewer assets were extracted and no paid model was purchased.

Six public-domain portrait reproductions were bundled with source links in `public/art/credits.txt`. User reference photographs are not redistributed. Portrait placement and inventory are adapted to the game.

## Verification

`node tests/world.test.cjs` transpiles scene modules and checks all 44 travel destinations, 14 NPCs, walking connectivity, scene geometry, movement, jump/landing, pause, travel and interactions using a stub renderer.

`node tests/oval-office.test.mjs` runs against those transpiled modules: 1,440 collision samples, radial camera raycasts, entry clearance, physical seat orientation, furniture collision and both sofa aisles.

TypeScript, scoped lint, production builds and deployed-file byte comparisons complete release checks. Whole-repository lint reports existing component accessibility/style errors and CommonJS-test import rules; these are outside this room reconstruction. Offline renders establish geometry and composition; they are not browser playtesting or a photorealism certification.
