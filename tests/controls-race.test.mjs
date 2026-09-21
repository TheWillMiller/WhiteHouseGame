import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'meshoptimizer';
globalThis.DOMRect??=class{};const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx})});
globalThis.window=Object.assign(new EventTarget(),{devicePixelRatio:1,location:{pathname:'/'}});
globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;}observe(){this.fn();}disconnect(){}};
globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
T.TextureLoader.prototype.load=()=>new T.Texture();
globalThis.__testRenderer=()=>({domElement:Object.assign(new EventTarget(),{setAttribute(){},focus(){},remove(){},setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:1280,height:800};}}),shadowMap:{},setPixelRatio(){},setSize(){},dispose(){},render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}});
const {Game}=await import('../.qa/game.mjs'),{FollowCamera}=await import('../.qa/follow-camera.mjs'),{racePoint,raceHeading,RACERS}=await import('../.qa/cart-race.mjs'),{GolfCart}=await import('../.qa/golf-cart.mjs'),{teleportRayTarget}=await import('../.qa/teleport.mjs');
let state;const game=new Game({appendChild(){},clientWidth:1280,clientHeight:800},s=>state=s,()=>{},()=>{});let now=1000;const frame=(n=1)=>{for(let i=0;i<n;i++)game.loop(now+=25);};frame();
game.change('grounds',0,78);game.key('KeyS',true);frame(120);assert.equal(game.yaw,0,'walking 180 degrees away never rotates the view');assert(game.player.position.z>82);game.keys.clear();
// Actual camera-controls solver stays continuous on both crossings of +/-PI.
const rig=new FollowCamera(),target=new T.Vector3(0,2,0);let previous;
for(const sign of [-1,1]){rig.reset();previous=null;for(let i=0;i<80;i++){const angle=sign*(Math.PI-.12+i*.003),desired=target.clone().add(new T.Vector3(Math.sin(angle)*5,1,Math.cos(angle)*5)),p=rig.solve(target,desired,[],.016).position;if(previous)assert(p.distanceTo(previous)<.1,'camera must not orbit through a wrapped angle');previous=p;}}rig.dispose();
game.change('grounds',0,80);game.moveStick(1,0);frame(20);assert(game.motor.x>3.5,'outer joystick automatically runs');game.jump();frame(3);const start=game.player.position.clone();game.moveStick(0,0);frame(5);assert(game.player.position.x>start.x+.25,'jump keeps momentum after stick release');game.moveStick(-1,0);frame(8);assert(game.motor.x<0,'deliberate steering works mid-jump');game.moveStick(0,0);frame(50);
// Teleport validation rejects masonry, water, occupied positions and non-finite input.
game.change('grounds',0,80);const before=game.player.position.clone();assert(!game.teleportTo('grounds',0,-27));assert(game.player.position.equals(before));assert(!game.teleportTo('grounds',-72,50));assert(!game.teleportTo('grounds',NaN,0));assert(game.teleportTo('grounds',-50,-20.4));assert.equal(game.player.position.y,.17);assert(game.teleportTo('west',-5.5,-18));assert.equal(game.zone,'west');assert.equal(game.velocityY,0);
const floor=new T.Group(),plane=new T.Mesh(new T.PlaneGeometry(20,20),new T.MeshBasicMaterial({side:T.DoubleSide}));plane.rotation.x=-Math.PI/2;floor.add(plane);const camera=new T.PerspectiveCamera(60,1,.1,100);camera.position.set(0,5,5);camera.lookAt(0,0,0);camera.updateMatrixWorld();assert(teleportRayTarget(camera,new T.Vector2(0,0),floor),'actual floor ray resolves a landing');const wall=new T.Mesh(new T.BoxGeometry(10,8,.3),new T.MeshBasicMaterial());wall.position.set(0,2,2);floor.add(wall);assert.equal(teleportRayTarget(camera,new T.Vector2(0,0),floor),null,'wall cannot teleport through to floor behind it');
game.startArcade('flight');game.moveStick(0,1);for(let i=0;i<4500&&!game.arcade.finished;i++)frame();assert(game.arcade.finished,`guided flight completes all eight rings: stopped at ${game.arcade.ringIndex}, ${game.player.position.toArray()}`);assert(state.arcade.guided);console.log('Guided course:',game.arcade.seconds.toFixed(1),'seconds');
game.startArcade('off');
// Use shipped GLBs and independent Rocketbox skeletons for all three drivers.
await MeshoptDecoder.ready;const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);loader.register(()=>({name:'OFFLINE_TEXTURE',loadTexture:()=>Promise.resolve(new T.Texture())}));const parsed=new Map();async function load(path){const bytes=readFileSync(path);return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');}
const cart=await load('public/models/gold-golf-cart.glb');game.cart=new GolfCart(cart.scene);game.world.group.add(game.cart.object);
for(const file of ['business_male_03','business_male_04','business_male_07'])parsed.set(file,await load('public/models/staff/'+file+'-v1.glb'));
const original=GLTFLoader.prototype.loadAsync;GLTFLoader.prototype.loadAsync=async url=>{const found=[...parsed].find(([key])=>url.includes(key));assert(found,'only expected cabinet assets load');return found[1];};
game.startArcade('race');await game.raceLoad;await Promise.resolve();assert(game.race&&game.cart.driving);assert.equal(game.race.rivals.length,3);assert.deepEqual(game.race.rivals.map(r=>r.name),RACERS.map(r=>r.name));
for(const r of game.race.rivals){r.cart.object.updateMatrixWorld(true);const hip=r.cart.object.worldToLocal(r.actor.object.getObjectByName('Bip01_Pelvis').getWorldPosition(new T.Vector3()));assert(Math.abs(hip.y-.78)<.01,'cabinet driver hips align with seat');for(const side of ['L','R']){const knee=r.cart.object.worldToLocal(r.actor.object.getObjectByName(`Bip01_${side}_Calf`).getWorldPosition(new T.Vector3()));assert(Math.abs(knee.y-hip.y)<.15,'driver thighs are seated');assert(knee.z<hip.z-.35,'driver knees face forward');}}
const grid=game.cart.object.position.clone();game.key('KeyW',true);frame(80);assert(game.cart.object.position.equals(grid),'countdown holds the grid');game.pause(true);const countdown=game.race.countdown;frame(40);assert.equal(game.race.countdown,countdown);game.pause(false);frame(45);assert(game.race.ready());assert(!game.teleportTo('grounds',50,90),'teleport cannot skip race gates');
// No skipped checkpoint can award a lap.
game.cart.placeOnCourse(racePoint(Math.PI),raceHeading(Math.PI),0);frame();assert.equal(game.race.passed,0);game.recoverRace();assert(game.race.seconds>=3);assert.equal(game.cart.motor.speed,0);
// Drive the actual cart motor around the route with a bounded steering controller.
game.race.reset();game.cart.placeOnCourse(racePoint(0),raceHeading(0),0);frame(122);game.key('KeyW',true);let lane=1.1,stalled=0;
for(let i=0;i<6000&&!game.race.finished;i++){
 const p=game.cart.object.position,a=Math.atan2(p.x/49.5,(p.z-56)/43.5);for(const r of game.race.rivals){const delta=r.cart.object.position.clone().sub(p);if(delta.length()<10&&delta.dot(new T.Vector3(Math.sin(game.cart.motor.heading),0,-Math.cos(game.cart.motor.heading)))>0)lane=r.lane>0?-1.1:1.1;}
 const target=racePoint(a+.10,lane),heading=Math.atan2(target.x-p.x,-(target.z-p.z)),error=Math.atan2(Math.sin(heading-game.cart.motor.heading),Math.cos(heading-game.cart.motor.heading));game.moveStick(T.MathUtils.clamp(error*2.4,-1,1),0);frame();stalled=game.cart.motor.speed<.01?stalled+1:0;if(stalled>50){console.log('STALLED',game.race.rivals.map(r=>[r.name,r.angle,r.cart.object.position.toArray()]),game.world.solids.filter(o=>Math.abs(o.x-p.x)<o.w/2+5&&Math.abs(o.z-p.z)<o.d/2+5));break;}
}
assert(game.race.finished,`two playable laps: gates ${game.race.passed}, position ${game.cart.object.position.toArray()}, speed ${game.cart.motor.speed}`);assert.equal(game.race.passed,16);assert(state.race.rank>=1&&state.race.rank<=4);console.log('Race complete:',game.race.seconds.toFixed(1),'seconds, place',game.race.rank);
game.startArcade('off');assert(!game.race.group.visible&&!game.cart.driving);assert.equal(game.player.position.y,0);game.dispose();GLTFLoader.prototype.loadAsync=original;
console.log('PASS: reverse-view stability, both camera angle wraps, auto-run and air control, valid/invalid teleport and occlusion, complete guided flight, actual cabinet driver poses, countdown/pause/recovery/anti-skip, two driven race laps and cleanup.');
