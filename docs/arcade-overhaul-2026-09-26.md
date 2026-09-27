# Estate arcade overhaul — September 26, 2026

## Cabinet Grand Prix

Race acceleration is automatic. A/D or horizontal stick input steers; S, downward stick input, Space, the touch Brake button, or the controller reverse trigger brakes. Shift/RB boosts and X/LB uses the collected item. Free-roam carts retain manual throttle and reverse.

Steering uses a soft center and a speed-dependent yaw cap instead of multiplying steering by vehicle speed. Releasing the stick recenters quickly. Optional steering assistance aims ahead along the existing course and eases speed through tight turns; it can be disabled in race options. Turn cues, compact telemetry, and a finish/replay card make the loop clearer. Existing cabinet drivers, two laps, construction ramps, Marine One, pickups, and boost pads remain.

## The Big Beautiful Shootout

An original transparent 1024px atlas replaces the metal spheres with tax bills, red tape, inflation pigs, and fictional clerical regime bosses. A carnival backboard provides contrast. Targets award different point values, consecutive hits build a multiplier up to 5×, and misses break the streak. Three 20-second rounds gradually increase target movement. Hits emit a small shared particle burst. Results show score, accuracy, and best streak.

Click or tap the target itself to shoot using a camera ray. Dragging continues to aim; X, the Fire button, and controller RT fire through the reticle. The shooting station is fixed and adapts its distance to viewport aspect ratio, so all five targets fit on phones and laptops. Opening menus or losing window focus stops gameplay.

## Sky Rally

A scenic spline above the estate replaces chasing camera-facing rings. Forward motion is automatic after an input and a three-second countdown. The stick/WASD shifts horizontally and vertically within the flight corridor; releasing recenters. Shift/RB boosts. Twelve fixed gates show the route, with mint marking the active gate and gold the next gates. Center passes earn bonuses and streak points; misses automatically advance to the next gate. A separate free-flight option retains manual controls and collision sweeps.

## Validation

- TypeScript and production builds.
- World navigation/movement regression suite: 66 destinations, 14 NPCs.
- Actual two-lap cart simulation with cabinet rigs, jumps, boost, pickups, pause and recovery.
- Additional full lap with steering assistance and no throttle/steering juggling; brake override and manual steering checked.
- Flight corridor checked against the real architecture at center and extreme control offsets.
- Twelve perfect gates at 30, 60, and 120 fps; missed-gate completion; fixed gate orientation; background pause.
- Actual camera-projected touch shots at 390×844 and 1366×768, plus cooldown, occlusion, streak/reset, and results checks.
- Existing controller, vehicle, manual-flight collision and pause/travel regression tests.

Rendering is stubbed in automated gameplay tests. These checks do not establish GPU frame rate or physical phone/controller feel; those still require hands-on feedback. The target atlas is lazy-loaded only when entering the shootout and uses one compressed WebP; arcade geometry remains shared.
