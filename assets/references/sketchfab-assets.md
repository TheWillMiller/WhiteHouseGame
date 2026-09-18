# Sketchfab assets — September 11, 2026

Downloaded through the owner's signed-in Chrome session using Sketchfab's glTF download buttons. No purchase or subscription was made. The GLB download navigation for an earlier Oval Office candidate was blocked; the official glTF archive downloads worked normally.

## Integrated: main residence

- The White House, by Void: https://sketchfab.com/3d-models/the-white-house-dbdb320ba4c6427ca4f2b2c2438034f9
- Listed license and included license.txt: CC BY 4.0. Attribution is in public/models/credits.txt and linked in the in-game guide.
- Original archive: C:/Users/New User/Downloads/the_white_house (1).zip (31,846,514 bytes).
- Original includes both wings, colonnades, residence, albedo, normal and surface textures. About 390,400 triangles.
- Game asset: public/models/white-house-residence-v2.glb, 89,708 triangles, 3,404,384 bytes. Main residence only. Both wings remain in the downloaded archive for a future coherent layout pass; the current game's wings and ballroom construction remain authored geometry.
- Adaptation script: scripts/prepare-residence.mjs. Removes presentation tilt, extracts central residence, converts centimeters to game dimensions, faces South Portico toward +Z, simplifies geometry, compresses with Meshopt and optimizes textures.
- Collision footprint and entry markers measured from the new mesh. The North Portico's steps use an entry marker at their foot; the game does not implement stair climbing on this exterior mesh.
- This is a third-party architectural visualization, not an authoritative current blueprint. Interiors continue to use the public-plan game layout.

## Downloaded and evaluated, not integrated

- The White House, by Daken.Hoo: https://sketchfab.com/3d-models/the-white-house-30c2a830d9994e71b67edfa37a56ea2f
- Listed license and included license.txt: CC BY 4.0.
- Original archive: C:/Users/New User/Downloads/the_white_house.zip (14,367,114 bytes).
- 1.5 million triangles, STL-derived geometry, no textures. The textured Void model was selected instead.

## Other candidates reviewed

- NET Oval Office Tarkka, PetriParkkinen: https://sketchfab.com/3d-models/net-oval-office-tarkka-5a48369d2196421eae664d9bc8fc38fb — CC BY; preview too basic to replace current room. No completed download.
- White House 2, 3Dlights: https://sketchfab.com/3d-models/white-house-2-3ed81aa01af2419a86d5bddf9dca1a16 — noncommercial license; not selected.

## Validation

- Offline north/south and plan renders inspected. Texture raster previews omit the real-time normal map and game lighting.
- World navigation, interior/camera regression checks, TypeScript and production build.
- Actual compressed asset decoded independently; finite geometry, bounds, textures, orientation and camera obstructions checked by tests/residence-model.test.mjs.
- No browser gameplay QA performed in this task.
