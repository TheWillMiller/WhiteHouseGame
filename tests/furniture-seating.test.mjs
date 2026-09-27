// Actual built scene geometry and Game camera state; no browser or GPU required.
import assert from 'node:assert/strict';
import * as T from 'three';
globalThis.DOMRect??=class{};
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx})});
globalThis.window=Object.assign(new EventTarget(),{devicePixelRatio:1});
globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;}observe(){this.fn();}disconnect(){}};
globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
globalThis.__testRenderer=()=>({domElement:Object.assign(new EventTarget(),{setAttribute(){},focus(){},remove(){}}),shadowMap:{},setPixelRatio(){},setSize(){},dispose(){},render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}});
const {Game}=await import('../.qa/game.mjs');
const game=new Game({appendChild(){},clientWidth:1280,clientHeight:800},()=>{},()=>{},()=>{});
let samples=0,pieces=0;
for(const zone of ['west','state','ground','second','third']){
 game.change(zone,0,0);const world=game.world;world.group.updateMatrixWorld(true);
 world.group.traverse(o=>{const f=o.userData.furniture;if(!f)return;pieces++;
  assert(Number.isFinite(f.height)&&f.height>0,f.name+': finite assembly size');
  if(/Armchair|room seating|audience chair|President chair/.test(f.name))assert(f.height<1.4,f.name+': human-scale chair back');
  if(/sofa/.test(f.name))assert(f.height<1.2,f.name+': human-scale sofa');
 });
 if(zone==='west'){
  const desk=world.solids.find(o=>Math.abs(o.x-22)<.01&&Math.abs(o.z-18.85)<.01);
  assert(desk,'Resolute collision matches desk anchor');assert(Math.abs(desk.w-1.8288)<1e-6);assert(Math.abs(desk.d-1.2192)<1e-6);assert(Math.abs(desk.height-(.11+.8255))<1e-6);
 }
 for(const spot of world.spots.filter(s=>s.kind==='seat'))for(const aspect of [16/9,9/16])for(const arrival of [-Math.PI,0,Math.PI/2]){
  assert.equal(world.solids.filter(s=>s.seatId===spot.id).length,1,spot.id+': exactly one occupied-seat collision proxy');
  game.camera.aspect=aspect;game.camera.updateProjectionMatrix();game.yaw=arrival;game.pitch=-.3;
  game.player.position.set(spot.x,0,spot.z);game.nearby=spot;game.interact();game.loop(1000+(samples+1)*17);
  assert.equal(game.activePose.id,spot.id);assert.equal(game.player.scale.y*3,1.9);assert.equal(spot.hipHeight,.64);
  assert(Math.abs(game.yaw-(-spot.pose[2]-Math.PI*.75))<1e-8,'arrival direction does not choose seated camera');
  assert(game.camera.position.y>1.5,spot.id+': elevated seated view');assert(game.player.visible,spot.id+': avatar stays visible');
  const face=new T.Vector3(spot.pose[0],1.40,spot.pose[1]),delta=face.clone().sub(game.camera.position),distance=delta.length();
  const obstruction=new T.Raycaster(game.camera.position,delta.normalize(),.12,distance-.08).intersectObjects(world.group.children.filter(o=>o.isMesh),false)[0];
  assert(!obstruction,spot.id+': actual furniture does not obscure seated face (hit '+obstruction?.object.name+')');
  for(const y of [.64,1.60]){const ndc=new T.Vector3(spot.pose[0],y,spot.pose[1]).project(game.camera);assert(Math.abs(ndc.x)<.9&&Math.abs(ndc.y)<.9,spot.id+': seated body framed');}
  game.toggleCamera();game.loop(1020+(samples+1)*17);assert(Math.abs(game.yaw+spot.pose[2])<1e-8,'first person faces the desk or room');assert(!game.player.visible);
  game.toggleCamera();game.interact();assert(!game.activePose,'can stand up');samples++;
 }
}
game.dispose();console.log(`PASS: ${pieces} sized furniture assemblies; ${samples} seated views from three arrival directions at desktop/mobile aspect ratios, visible faces through real geometry, eye-level toggle and stand-up.`);
