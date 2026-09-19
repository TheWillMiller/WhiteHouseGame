globalThis.DOMRect ??= class DOMRect { constructor(x=0,y=0,width=0,height=0){Object.assign(this,{x,y,width,height});} };
// Run after world.test.cjs, which transpiles the production modules into .qa.
import assert from 'node:assert/strict';
import * as T from 'three';
import { OVAL, OVAL_SEATS, ovalDoor, buildOvalOffice } from '../.qa/oval-office.mjs';
import { FollowCamera } from '../.qa/follow-camera.mjs';
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
for (const x of [-1.95, 1.95]) for (let z = -3; z < .8; z += .1) assert(!blocked(x, z), 'clear sofa aisle');
assert(blocked(0, 3.25), 'desk is solid'); assert(blocked(0, -.75), 'coffee table is solid');
assert(!blocked(-3.2, -3.5), 'travel spawn clear');
// Walk continuously from the meeting area around either desk end and behind the president's chair.
for (const side of [-1, 1]) {
 const waypoints = [[side * 3.15, 1], [side * 3.15, 6.7], [0, 6.7]];
 for (let i = 1; i < waypoints.length; i++) { const [ax, az] = waypoints[i - 1], [bx, bz] = waypoints[i]; for (let t = 0; t <= 1; t += .01) assert(!blocked(ax + (bx - ax) * t, az + (bz - az) * t), 'continuous route behind desk and chair'); }
}
// Verify full navigation from the actual northwest entry, not just isolated empty points.
const reached = new Set(), queue = [[-5, -4.8]], step = .2, key = (x,z) => Math.round(x/step)+','+Math.round(z/step);
reached.add(key(...queue[0]));
for (let i=0;i<queue.length;i++) { const [x,z]=queue[i];for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if((nx/OVAL.rx)**2+(nz/OVAL.rz)**2>=1||reached.has(k)||blocked(nx,nz))continue;reached.add(k);queue.push([nx,nz]);} }
for (const [x,z] of [[0,6.8],[-3.2,4],[3.2,4],[0,7.2]]) assert(reached.has(key(x,z)), 'rear desk area reachable from entry');
const surfaces=[];room.traverse(o=>{if(o.isMesh&&o.userData.cameraBlocker)surfaces.push(o);});
const follow=new FollowCamera();
for(const [x,z] of [[0,6.8],[-3.2,4],[3.2,4],[7.3,0],[0,7.9]]){
 const target=new T.Vector3(x,2.15,z);follow.reset();
 for(let i=0;i<72;i++){const a=i*Math.PI/36,desired=target.clone().add(new T.Vector3(Math.sin(a)*5.1,1.7,Math.cos(a)*5.1));const r=follow.solve(target,desired,surfaces,1/60);assert((r.position.x/OVAL.rx)**2+(r.position.z/OVAL.rz)**2<1,'orbit stays inside the office');if(r.position.distanceTo(target)<2)assert(!r.showPlayer,'close camera cannot show inside the avatar');}
}
// Sudden obstruction must retract in the same frame; release must ease out.
const wall=new T.Mesh(new T.BoxGeometry(10,10,.2),new T.MeshBasicMaterial());wall.position.z=1;wall.updateMatrixWorld(true);
const target=new T.Vector3(),desired=new T.Vector3(0,0,5);follow.reset();follow.solve(target,desired,[],1/60);const close=follow.solve(target,desired,[wall],1/60);assert(close.position.z<.9&&!close.showPlayer);const released=follow.solve(target,desired,[],1/60);assert(released.position.z>close.position.z&&released.position.z<2,'gentle camera recovery');
console.log('PASS: continuous walls, entry navigation, both routes behind desk/chair, seat orientation, 360 camera orbit positions, close-avatar hiding, immediate retraction and smooth recovery.');
