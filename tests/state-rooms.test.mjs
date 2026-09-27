// Run after world.test.cjs: actual room geometry, capsule routes and camera obstruction.
import assert from 'node:assert/strict';
import * as T from 'three';
globalThis.DOMRect??=class DOMRect{};
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const {interior,Game}=await import('../.qa/game.mjs');
const {teleportLanding}=await import('../.qa/teleport.mjs');
const {stateRoomVoid}=await import('../.qa/state-rooms.mjs');
const {CameraObstacles}=await import('../.qa/render-budget.mjs');
const {FollowCamera}=await import('../.qa/follow-camera.mjs');
const w=interior('state');
const {STATE_SALON_X}=await import('../.qa/residence-layout.mjs');
const named=name=>{const a=[];w.group.traverse(o=>{if(o.name===name)a.push(o);});return a;};
assert.equal(named('State room chandelier').length,7,'three East Room chandeliers, one per other room');
assert.equal(named('State room window').length,18,'all five rooms have explicitly positioned window bays');
assert.equal(named('State room mantel').length,6,'room-specific mantels replace generic salon furniture');
assert.equal(named('Eagle pier table').length,3,'State Dining has its three eagle pier tables');
const blocked=(x,z)=>Game.prototype.blocked.call({zone:'state',world:w},x,z);
for(let x=11.5;x<=23;x+=.15)assert(!blocked(x,0),'East Room entrance crosses an open floor');
for(let x=-STATE_SALON_X;x<=STATE_SALON_X;x+=.12)assert(!blocked(x,9),'Red–Blue–Green passage stays clear');
for(const x of [-1.15,0,1.15])for(let z=0;z<=5.5;z+=.10)assert(!blocked(x,z),'Cross Hall into Blue Room is clear');
assert(stateRoomVoid(0,16));assert(blocked(0,16));assert.equal(teleportLanding('state',0,16,w.solids,[]),null,'cannot teleport into the void behind oval walls');
for(const p of [[0,5.6],[-3.4,9],[3.4,9]])assert(teleportLanding('state',...p,w.solids,[]),'valid Blue Room arrivals remain available');
// Sample all curved wall portions, including angles missed by a rectangular-room test.
const camera=new FollowCamera(),obstacles=new CameraObstacles(w.solids,false,w.cameraOnly),blue=w.group.userData.blueRoom;
let samples=0;
for(const scale of [.6,.72,.84])for(let i=0;i<96;i++){
 const a=i*Math.PI*2/96;if(blue.openings.some(o=>Math.abs(Math.atan2(Math.sin(a-o.a),Math.cos(a-o.a)))<o.half+.12))continue;
 const p=new T.Vector3(Math.cos(a)*blue.rx*scale,2.05,blue.z+Math.sin(a)*blue.rz*scale);if(blocked(p.x,p.z))continue;
 const desired=p.clone().add(new T.Vector3(Math.cos(a)*5,.7,Math.sin(a)*5)),surfaces=obstacles.nearby(p.x,p.z),result=camera.solve(p,desired,surfaces,1/60),delta=result.position.clone().sub(p),distance=delta.length();
 assert(!new T.Raycaster(p,delta.normalize(),.001,distance-.07).intersectObjects(surfaces,false).length,'camera remains inside curved wall');samples++;
}
assert(samples>25);obstacles.dispose();camera.dispose();
let draws=0,triangles=0;w.group.traverse(o=>{if(o.isMesh){draws++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
assert(draws<120,'room details remain statically batched');assert(triangles<200000,'bounded geometry budget');
console.log(`PASS: State Floor windows, mantels, seven chandeliers, clear East/Blue routes, curved-room teleport exclusion, ${samples} camera angles, ${draws} meshes / ${Math.round(triangles)} triangles. No browser or device FPS claim.`);
