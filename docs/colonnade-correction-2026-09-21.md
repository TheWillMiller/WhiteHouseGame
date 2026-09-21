# Colonnade integration correction

The outdoor gallery preview was mounted behind the imported West Wing facade, so only parts within window recesses remained visible. Its shared placement now puts the complete frames and plaques in front of the south wall. The indoor gallery still contains all 47 portraits.

The baked outdoor floor data previously covered the residence stairs and West Wing north entrance only. The West Wing bake now also samples the long colonnade and its return using upward-facing triangles below two metres from the shipped model. The character and camera use this compact height field; no per-frame mesh raycasting was added. Areas without source paving retain ground height.

Validation: actual imported-mesh rays across eight frames and plaques, 56 paving samples compared against the rendered model, four raised-floor jump/landing simulations, existing residence staircase routes, doorway clearance, world connectivity, camera/render-budget checks, and TypeScript. Rendering was stubbed in simulation tests; this is not a device FPS measurement or browser visual review.
