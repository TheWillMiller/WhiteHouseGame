// Production movement, vehicle, loader and pose regression checks; no browser/WebGL.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
globalThis.DOMRect??=class{};
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx})});
globalThis.window=Object.assign(new EventTarget(),{devicePixelRatio:1});
globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;}observe(){this.fn();}disconnect(){}};
globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
globalThis.__testRenderer=()=>({domElement:Object.assign(new EventTarget(),{setAttribute(){},focus(){},remove(){},setPointerCapture(){}}),shadowMap:{},setPixelRatio(){},setSize(){},dispose(){},render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}});
const {Game}=await import('../.qa/game.mjs'),{GolfCart}=await import('../.qa/golf-cart.mjs'),{CartMotor,LocomotionMotor}=await import('../.qa/locomotion.mjs');
const bytes=readFileSync('public/models/gold-golf-cart.glb'),gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
assert.equal(['fl','fr','rl','rr'].filter(id=>gltf.scene.getObjectByName('wheel-'+id)).length,4,'four preserved wheel pivots');
let draws=0,triangles=0;gltf.scene.traverse(o=>{if(o.isMesh){draws++;triangles+=o.geometry.index.count/3;}});assert(draws<=24,'cart geometry batches within the mobile draw-call budget');assert(triangles<8000);
const game=new Game({appendChild(){},clientWidth:1280,clientHeight:800},()=>{},()=>{},()=>{});let now=1000;const frame=(n=1)=>{for(let i=0;i<n;i++)game.loop(now+=1000/60);};frame();
// Walking, jumping and looking can all remain active in the same frame.
game.moveStick(.5,.8);frame(18);const start=game.player.position.clone();game.jump();game.orbit.looking=true;game.orbit.manualLook();game.yaw+=.55;frame(8);
assert(game.player.position.y>.25,'moving jump takes off');assert(game.player.position.distanceTo(start)>.25,'horizontal travel continues during the jump');assert.deepEqual(game.stick,{x:.5,y:.8});game.orbit.looking=false;game.moveStick(0,0);frame(80);assert.equal(game.player.position.y,0);
// A second look finger must not steal the first pointer or cancel it on release.
const pointer=(type,id,x,y)=>{const e=new Event(type);Object.assign(e,{pointerId:id,clientX:x,clientY:y});game.renderer.domElement.dispatchEvent(e);};
pointer('pointerdown',10,100,100);const yaw=game.yaw;pointer('pointerdown',11,900,900);pointer('pointermove',11,950,950);assert.equal(game.yaw,yaw);pointer('pointerup',11,950,950);assert(game.orbit.looking);pointer('pointermove',10,130,100);assert(game.yaw>yaw);pointer('pointerup',10,130,100);assert(!game.orbit.looking);
game.cart=new GolfCart(gltf.scene);game.world.group.add(game.cart.object);game.change('grounds',3.5,35);game.enterCart();assert(game.cart.driving);game.key('KeyW',true);frame(60);assert(game.cart.motor.speed>3);const wheel=game.cart.object.getObjectByName('wheel-fl');assert(Math.abs(wheel.rotation.x)>.5,'wheels roll');
const before=game.cart.motor.heading;game.key('KeyD',true);frame(30);assert(game.cart.motor.heading>before+.05,'steering while accelerating changes heading');assert(!game.exitCart(),'cannot eject while moving');
game.key('KeyW',false);game.key('KeyD',false);game.key('Space',true);frame(60);assert.equal(game.cart.motor.speed,0);game.key('Space',false);game.key('KeyS',true);frame(60);assert(game.cart.motor.speed<0,'reverse works');game.key('KeyS',false);game.key('Space',true);frame(60);game.key('Space',false);
assert(game.exitCart(),'clear exit works');assert(!game.cart.contains(game.player.position.x,game.player.position.z),'exit places feet outside the cart');assert(!game.blocked(game.player.position.x,game.player.position.z),'exit is on a walkable surface');
// Cart cannot tunnel through a thin barrier even at maximum speed and coarse frame times.
game.cart.object.position.set(0,0,0);game.cart.motor.heading=0;game.cart.motor.speed=8;
for(let i=0;i<80;i++)game.cart.update(.04,1,0,false,(x,z)=>Math.abs(z+5)<.12);
assert(game.cart.object.position.z>-3.65,'swept footprint stays in front of the wall');
// Entering another area parks the cart and restores walking; pause clears throttle/stick.
game.change('grounds',2,0);game.enterCart();game.moveStick(0,1);game.pause(true);assert.equal(game.cart.motor.speed,0);assert.equal(game.stick.y,0);game.pause(false);game.travel('oval');assert(!game.cart.driving);assert.equal(game.zone,'west');
// Frame-rate independence and buffered landing jump.
const paths=[30,60,120].map(fps=>{const m=new CartMotor();let x=0,z=0;for(let i=0;i<fps*2;i++){const d=m.step(1,.3,false,1/fps);x+=d.x;z+=d.z;}return [x,z];});assert(Math.hypot(paths[0][0]-paths[2][0],paths[0][1]-paths[2][1])<.2);
const motor=new LocomotionMotor();motor.requestJump();assert(!motor.jump(false,.05));assert(motor.jump(true,.02),'buffered press launches on landing');assert(!motor.jump(true,.02),'one press launches only once');
game.dispose();console.log(`PASS: simultaneous move/jump/look; independent pointers; enter, drive, turn, brake, reverse, safe exit; swept collision; pause/travel; ${draws} cart draws, ${triangles} triangles.`);
