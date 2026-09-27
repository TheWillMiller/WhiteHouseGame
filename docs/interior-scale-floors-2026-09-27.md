# Interior scale and flashing floors — 27 September 2026

## Causes and changes

- The character asset is normalized to three units. Outside, its parent used `1.9 / 3`; inside, the parent reverted to one. Trump and staff therefore grew from 1.9 m to 3 m on entry. Every zone now uses the same human scale. Movement, stride timing, collision radius, jump impulse, eye height and follow-camera target agree with that scale.
- The indoor follow camera is closer (3.1 m default) and its clipping range is 0.12–150 m. The camera-controls collision camera copies that clipping range. Explicit world-space seating and lectern heights preserve interactions after the scale correction; the cart's existing driver offset is unchanged.
- Residence circulation stone and individual room finishes were both at `y = .055`. The broad circulation surface is now `.015`, below the room finishes at `.055`. This removes the exact overlapping surfaces that caused depth fighting when walking. Textures and their physical repeat scale are preserved.
- The Blue Room was only 9 × 6.75 m. Its footprint now uses approximately 12.1 × 9.0 m, with its rug, curved shell, windows, openings and furniture repositioned together. The adjacent salons and outer State Rooms move outward, keeping their partitions and doorways connected. Shared constants drive room data and the curved-room movement/teleport boundary.

## Reference and limits

The White House Curator's room-measurement table records the Blue Room as 39 ft 10 in × 29 ft 8 in (12.1412 × 9.0424 m): [Ford Presidential Library, curator records, PDF page 35](https://www.fordlibrarymuseum.gov/library/document/0018/81556669.pdf). This is an archival building-dimension reference, not a statement about current decor. Room furniture references remain the 2023 public virtual tour documented separately.

Only the Blue Room footprint was dimensionally revised in this patch. Other rooms remain public-plan adaptations; many were already generously sized in metres and felt cramped because the indoor character and viewpoint were oversized. Wall thickness, simplified furniture, upper-floor arrangements and all other room measurements are not claimed to be survey accurate.

## Verification

- TypeScript check.
- All 66 travel destinations and 14 NPCs: connected walking routes, stable 1.9 m human scale, valid interaction positions, movement and jumping.
- 212 floor samples across five interior zones: room finishes present, different overlapping finishes vertically separated.
- State Floor: Blue Room north and side passages, seat approaches, furniture containment, curved-room teleport exclusion and 124 camera angles.
- Actual skinned player asset: all eight animation clips, 600 finite posed frames, sitting at explicit heights, unchanged cart seating, lectern offset and renderer skeleton synchronization.
- Existing doorway, walkthrough, exterior stairs, camera and movement/race regressions.

These are geometry, state and animation checks with a stubbed renderer; they do not constitute browser visual QA or physical-device frame-rate measurement.
