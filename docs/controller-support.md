# Browser controller support

Standard-mapped browser gamepads are polled once per game frame. Analog movement,
look, triggers, jumping, interactions, cart driving, flight, blaster, race boost
and items share the existing motors. Controller-held actions are separate from
keyboard/touch keys. Sticks use a radial deadzone and normalized diagonals.

Menu/Options opens Play and pauses immediately. View/Share opens travel. D-pad or
left stick cycles visible dialog controls, A/Cross selects, and B/Circle closes.
Opening/closing menus, reconnecting, and restoring focus require neutral controls
before gameplay resumes. Disconnect clears controller input and stops the motors.

The field guide includes detection status and live axes/buttons. Unknown mappings
are reported rather than guessed. No car-specific integration or vehicle API is
used. Tesla's built-in wheel and pedals are not supported. A connected controller
must be exposed by the Tesla browser through navigator.getGamepads; Arcade support
alone is insufficient evidence. Touch and keyboard controls remain available.

References:
- https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
- https://www.tesla.com/ownersmanual/modely/en_us/GUID-79A49D40-A028-435B-A7F6-8E48846AB9E9.html

Validation: simulated browser pads drive the actual game loop through combined
run/look/jump, trigger acceleration/steering/reverse/handbrake, boost/item bindings,
pause/focus/disconnect handling, input isolation and dialog navigation. Existing
world and full race tests also run. No physical controller or Tesla was available
for hardware verification.
