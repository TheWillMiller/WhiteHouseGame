// Run after world.test.cjs, which transpiles the production modules into .qa.
import assert from 'node:assert/strict';
import * as T from 'three';
import { OVAL, OVAL_SEATS, ovalDoor, buildOvalOffice } from '../.qa/oval-office.mjs';
const ctx = new Proxy({}, { get: () => () => {}, set: () => true });
Object.assign(globalThis, { document: { createElement: () => ({ getContext: () => ctx }) } });
const room = new T.Group(), solids = buildOvalOffice(room, 0, 0); room.updateMatrixWorld(true);
const blocked = (x, z) => solids.some(s => Math.abs(x - s.x) < s.w / 2 + .36 && Math.abs(z - s.z) < s.d / 2 + .36);
// A person cannot escape through former seams, including under any window.
for (let i = 0; i < 1440; i++) {
 const a = i * Math.PI * 2 / 1440;
 if (!ovalDoor(a)) assert(blocked(OVAL.rx * Math.cos(a), OVAL.rz * Math.sin(a)), 'continuous wall collision at ' + a);
}
// The camera sees the inward-facing shell around the room, through a full turn.
for (let i = 0; i < 360; i++) {
 const a = i * Math.PI * 2 / 360; if (ovalDoor(a)) continue;
 const direction = new T.Vector3(OVAL.rx * Math.cos(a), 0, OVAL.rz * Math.sin(a));
 const hits = new T.Raycaster(new T.Vector3(0, 2.2, 0), direction.clone().normalize(), .1, direction.length() + .4).intersectObject(room, true);
 assert(hits.length, 'camera ray cannot pass through wall at ' + a);
}
const entryAngle = (OVAL.door[0] + OVAL.door[1]) / 2;
for (let offset = -1; offset <= 1; offset += .1) assert(!blocked((OVAL.rx + offset) * Math.cos(entryAngle), (OVAL.rz + offset) * Math.sin(entryAngle)), 'entry has clearance');
for (const seat of OVAL_SEATS) {
 const obj = room.getObjectByName(seat.name); assert(obj);
 const front = new T.Vector3(0, 0, -1).applyQuaternion(obj.getWorldQuaternion(new T.Quaternion()));
 const target = seat.kind === 'sofa' ? new T.Vector3(-seat.x, 0, 0) : new T.Vector3(0, 0, seat.kind === 'president' ? -1 : 1);
 assert(front.dot(target.normalize()) > .99, seat.name + ' faces its intended seating area');
 assert(blocked(seat.x, seat.z), seat.name + ' has collision');
}
// Both aisles between couches and coffee table stay walkable.
for (const x of [-1.65, 1.65]) for (let z = -2.4; z < .8; z += .1) assert(!blocked(x, z), 'clear sofa aisle');
assert(blocked(0, 3.25), 'desk is solid'); assert(blocked(0, -.75), 'coffee table is solid');
assert(!blocked(-3.2, -3.5), 'travel spawn clear');
console.log('PASS: 1,440 wall collision samples, 334 camera directions, entry clearance, seat orientation, furniture collision, and both sofa aisles.');
