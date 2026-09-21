# Optional sandbox modes

The Play menu now offers Gold Jetpack, Gold Rush, and Free Roam alongside the existing gestures. Choosing a challenge moves the player to the South Lawn. Exiting returns them to the normal walkthrough. Map travel also clears challenge state and restores the previous camera mode.

Gold Jetpack supports simultaneous lateral movement, climbing, camera turning, and boost. Space rises, C descends, Shift boosts; phone players have separate Up, Down, and Boost buttons. The eight ordered rings form a timed aerial course; the player may keep flying after finishing. Movement sweeps the character against nearby height-aware obstacle boxes, with estate boundaries and a 60 m height limit. Building clearance is a conservative approximation based on the existing camera collision volumes.

Gold Rush uses first-person aiming, a gold pulse blaster with recoil and muzzle flash, short-lived beam effects, and five moving orb targets. Hold the left mouse button while dragging to aim, hold X, or use the phone Fire button. The first shot starts a 60-second round. Targets score 100 points and respawn after 0.8 seconds; the HUD shows score, time, and accuracy. Occlusion checks stop scoring through collision volumes. Restart and exit controls are always on the challenge card. Menus, hidden tabs, and pause suspend challenge progression.

No additional models, textures, network requests, or dependencies. Mode geometry is created on first selection, reused, hidden when inactive, and disposed with the game. Shared geometry totals 2,064 triangles. Flight collision uses a nearby subset; firing rays run only when a shot is ready.

Validation: production-loop flight/boost/turn controls, swept building collisions, roof descent, bounds, ordered ring collection, target hits and occlusion, respawn, held fire, timer completion, pause/travel/exit, resource reuse/disposal, actual Meshy skeleton flight pose, prior walking/jumping/cart regressions, TypeScript, and production build. These are automated non-browser checks, not a mobile FPS measurement or visual browser review.
