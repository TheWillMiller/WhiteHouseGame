// Run world.test.cjs first. Exercise the real game loop without a browser renderer.
import assert from 'node:assert/strict';
import * as T from 'three';
globalThis.DOMRect??=class{};
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx})});
globalThis.window=Object.assign(new EventTarget(),{devicePixelRatio:1});
globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;}observe(){this.fn();}disconnect(){}};
globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
globalThis.__testRenderer=()=>({domElement:Object.assign(new EventTarget(),{setAttribute(){},focus(){},remove(){},setPointerCapture(){}}),shadowMap:{},setPixelRatio(){},setSize(){},dispose(){},render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}});
const {Game}=await import('../.qa/game.mjs'),{Arcade,SKY_ROUTE}=await import('../.qa/arcade.mjs');
let snapshot;const game=new Game({appendChild(){},clientWidth:390,clientHeight:844},s=>snapshot=s,()=>{},()=>{});
let now=1000;const frames=(n=1)=>{for(let i=0;i<n;i++)game.loop(now+=1000/60);};frames();assert.equal(game.arcade,null,'normal game does not allocate mode objects');
game.startArcade('flight');const arcade=game.arcade;assert(arcade.jetpack.visible);assert(!arcade.blaster.visible);assert.equal(game.player.position.y,12);assert(!game.firstPerson);
game.moveStick(.5,.8);game.key('Space',true);game.key('ShiftLeft',true);const start=game.player.position.clone();frames(30);assert(game.player.position.y>start.y+3,'ascend and move together');assert(Math.hypot(game.player.position.x-start.x,game.player.position.z-start.z)>5,'boost has useful speed');
const heading=game.yaw;game.key('KeyR',true);frames(15);assert(game.yaw>heading+.3,'turn while moving and rising');game.pause(true);const stopped=game.player.position.clone(),time=arcade.seconds;frames(60);assert(game.player.position.equals(stopped));assert.equal(arcade.seconds,time,'menus pause the race clock');assert.equal(arcade.velocity.length(),0);game.pause(false);
// Sweep a fast approach into the actual building collision volumes.
game.player.position.set(0,7,0);game.yaw=0;game.moveStick(0,1);game.key('ShiftLeft',true);frames(180);assert(game.player.position.z> -7.2,'low flight cannot pass through the residence');game.moveStick(0,0);game.keys.clear();arcade.velocity.set(0,0,0);
game.player.position.set(0,35,-27);game.key('KeyC',true);frames(180);assert(game.player.position.y>=21.95,'descending cannot fall through the residence roof');game.keys.clear();
game.player.position.set(119.9,59.9,123.9);game.moveStick(1,-1);game.key('Space',true);game.key('ShiftLeft',true);frames(120);assert(game.player.position.y<=60&&game.player.position.x<=120&&game.player.position.z<=124,'estate and altitude limits');
// Only the active ring scores; the full course can be completed in order.
arcade.setMode('flight');let p=SKY_ROUTE[2].clone();arcade.flight(.016,p,0,0,0,0,false,()=>false);assert.equal(arcade.ringIndex,0);
for(const ring of SKY_ROUTE){p.copy(ring);arcade.velocity.set(0,0,0);arcade.flight(.016,p,0,0,0,0,false,()=>false);}assert.equal(arcade.score,800);assert(arcade.finished);assert(arcade.rings.every(r=>!r.visible));
game.startArcade('blaster');assert.equal(game.arcade,arcade,'reuse mode resources');assert(game.firstPerson);assert(!arcade.jetpack.visible);frames();
const origin=game.camera.position.clone(),target=arcade.targets[2].mesh.position.clone(),direction=target.sub(origin).normalize();
assert(arcade.fire(origin,direction),'centered shot hits actual target sphere');assert.equal(arcade.score,100);assert.equal(arcade.shots,1);assert(!arcade.fire(origin,direction),'cooldown prevents duplicate shots');assert.equal(arcade.shots,1);arcade.update(.23);
assert(!arcade.fire(origin,direction,2),'nearer masonry blocks target');assert.equal(arcade.score,100);arcade.update(1);assert(arcade.targets.every(t=>t.mesh.visible),'hit targets respawn');
game.pause(true);const seconds=arcade.seconds;frames(60);assert.equal(arcade.seconds,seconds);game.pause(false);
// Aim the real first-person camera and fire through the held input path.
arcade.setMode('blaster');const aim=arcade.targets[2].mesh.position.clone().sub(game.camera.position);game.yaw=Math.atan2(aim.x,-aim.z);game.pitch=-Math.atan2(aim.y,Math.hypot(aim.x,aim.z));game.key('KeyX',true);frames(2);assert.equal(arcade.shots,1);assert.equal(arcade.score,100);game.key('KeyX',false);
arcade.update(61);assert(arcade.finished);assert.equal(arcade.seconds,0);const shots=arcade.shots;game.key('KeyX',true);frames(10);assert.equal(arcade.shots,shots,'no firing after round ends');
game.travel('oval');assert.equal(arcade.mode,'off');assert(!arcade.world.visible&&!arcade.blaster.visible&&!arcade.jetpack.visible,'map travel clears mode geometry');assert(!game.firstPerson,'previous camera restored');
game.startArcade('flight');game.startArcade('off');assert.equal(game.zone,'grounds');assert.equal(game.player.position.y,0);assert.equal(game.player.position.z,38);assert.equal(game.stick.y,0);
let triangles=0;const geos=new Set();for(const g of [arcade.world,arcade.jetpack,arcade.blaster])g.traverse(o=>{if(o.isMesh&&!geos.has(o.geometry)){geos.add(o.geometry);triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});assert(triangles<4000,'shared arcade geometry stays small');
game.dispose();assert(!arcade.world.parent&&!arcade.blaster.parent&&!arcade.jetpack.parent);console.log(`PASS: flight/turn/boost, swept building collision, roof descent, bounds, pause, eight rings, target hits/occlusion/respawn, held fire, timer, mode reset/travel, disposal; ${triangles} shared triangles.`);
