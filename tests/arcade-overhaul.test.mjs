// Gameplay regression tests against production classes and the real game loop.
import assert from 'node:assert/strict';
import * as T from 'three';
globalThis.DOMRect??=class{};
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx})});
globalThis.window=Object.assign(new EventTarget(),{devicePixelRatio:1,location:{pathname:'/'}});
globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;}observe(){this.fn();}disconnect(){}};
globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
let width=390,height=844;
globalThis.__testRenderer=()=>({domElement:Object.assign(new EventTarget(),{setAttribute(){},focus(){},remove(){},setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width,height};}}),shadowMap:{},setPixelRatio(){},setSize(){},dispose(){},render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}});
const {Game}=await import('../.qa/game.mjs'),{Arcade,SKY_PATH,SKY_ROUTE,SKY_OFFSETS,skyFrame}=await import('../.qa/arcade.mjs'),{CartMotor}=await import('../.qa/locomotion.mjs');
const game=new Game({appendChild(){},clientWidth:width,clientHeight:height},()=>{},()=>{},()=>{});
let now=1000;const frame=(n=1)=>{for(let i=0;i<n;i++)game.loop(now+=1000/60);};frame();
// Full corridor, including its extreme control offsets, clears actual architecture.
game.startArcade('flight');
for(let i=0;i<=250;i++)for(const x of [-7,0,7])for(const y of [-5,0,5]){
 const f=skyFrame(i/250),p=f.point.addScaledVector(f.side,x).add(new T.Vector3(0,y,0));
 const body=new T.Box3(p.clone().add(new T.Vector3(-.3,.04,-.3)),p.clone().add(new T.Vector3(.3,1.9,.3)));
 assert(!game.flightBoxes.some(b=>b.intersectsBox(body)),`sky corridor obstruction at ${p.toArray()}`);
}
// Gates remain aligned with the route rather than spinning toward the camera.
const rotation=game.arcade.rings[0].quaternion.clone();game.arcade.update(.016,new T.PerspectiveCamera());assert(rotation.equals(game.arcade.rings[0].quaternion));
const results=[];
for(const fps of [30,60,120]){
 const a=new Arcade(),p=SKY_PATH.getPointAt(0);a.setMode('flight');
 for(let i=0;i<fps*90&&!a.finished;i++){const offset=SKY_OFFSETS[a.ringIndex];a.flight(1/fps,p,0,offset.x/7,offset.y/5,0,i<fps,falseFn);if(!a.started)a.flight(1/fps,p,0,.01,0,0,false,falseFn);}
 assert(a.finished);assert.equal(a.cleared,12);assert.equal(a.missed,0);assert(a.score>=2400,'precise flying earns center bonuses');assert.equal(a.bestCombo,12);results.push(a.seconds);a.dispose();
}
assert(Math.max(...results)-Math.min(...results)<.15,'course timing is frame-rate independent');
const missed=new Arcade(),mp=SKY_PATH.getPointAt(0);missed.setMode('flight');
for(let i=0;i<4500&&!missed.finished;i++)missed.flight(.02,mp,0,1,1,0,false,falseFn);
assert(missed.finished&&missed.missed>5,'missed gates advance so the course never strands the player');missed.dispose();
// Backgrounding stops automatic modes, not merely their input.
game.moveStick(.2,.2);frame(240);window.dispatchEvent(new Event('blur'));const stopped=game.player.position.clone(),seconds=game.arcade.seconds;frame(90);assert(game.player.position.equals(stopped));assert.equal(game.arcade.seconds,seconds);window.dispatchEvent(new Event('focus'));
// Direct touch shots use screen rays, on both portrait and landscape displays.
for(const size of [[390,844],[1366,768]]){
 [width,height]=size;game.camera.aspect=width/height;game.camera.updateProjectionMatrix();game.startArcade('blaster');frame(20);
 const a=game.arcade;
 for(const t of a.targets){const projected=t.mesh.position.clone().project(game.camera);assert(Math.abs(projected.x)<.85&&Math.abs(projected.y)<.8,'target visible inside viewport');
  const clientX=(projected.x+1)*width/2,clientY=(1-projected.y)*height/2;
  const event=type=>{const e=new Event(type);Object.assign(e,{pointerId:11,clientX,clientY,pointerType:'touch',button:0});game.renderer.domElement.dispatchEvent(e);};
  const hits=a.hits;event('pointerdown');event('pointerup');assert.equal(a.hits,hits+1,'tap hits the selected cutout without dragging the camera');frame(14);
 }
 assert(a.score>500&&a.combo===6);const shots=a.shots;
 const cancel=new Event('pointercancel');Object.assign(cancel,{pointerId:99});game.renderer.domElement.dispatchEvent(cancel);assert.equal(a.shots,shots);
 const combo=a.combo;a.fire(game.camera.position,new T.Vector3(0,1,0));assert.equal(a.combo,0);assert(a.bestCombo>=combo);
 a.update(61);assert(a.finished);const old=a.score;assert(!a.fire(game.camera.position,new T.Vector3(0,0,-1)));assert.equal(a.score,old);
 game.startArcade('blaster');assert.equal(a.hits,0);assert.equal(a.combo,0);assert.equal(a.seconds,60);
}
// Continuous touch aim does not orbit the camera; losing capture stops firing.
game.startArcade('blaster');frame(15);const cameraPose=game.camera.quaternion.clone();
for(const [type,x,y]of [['pointerdown',200,300],['pointermove',700,350],['lostpointercapture',700,350]]){const e=new Event(type);Object.assign(e,{pointerId:12,clientX:x,clientY:y,pointerType:'touch',button:0});game.renderer.domElement.dispatchEvent(e);frame(2);}
assert(cameraPose.equals(game.camera.quaternion));assert(!game.keys.has('KeyX'));
// Reload prevents firing, completes automatically, and starts a fresh full magazine.
const range=new Arcade();range.setMode('blaster');const origin=new T.Vector3(0,5,195),miss=new T.Vector3(0,1,0);
for(let i=0;i<8;i++){range.fire(origin,miss);range.update(.17);}
assert.equal(range.ammo,0);assert(range.reloadTime>0);const dryShots=range.shots;range.fire(origin,miss);assert.equal(range.shots,dryShots);
range.update(1);assert.equal(range.ammo,8);assert.equal(range.reloadTime,0);
range.seconds=18;for(const t of range.targets)t.cooldown=.01;range.update(.02);range.update(.18);
const boss=range.targets.find(t=>t.kind===3);assert.equal(boss.health,3);
for(let i=0;i<3;i++){const direction=boss.mesh.position.clone().sub(origin).normalize();assert(range.fire(origin,direction));if(i<2){assert.equal(range.cleared,0);range.update(.17);}}
assert.equal(range.cleared,1);assert(boss.cooldown>0);
range.update(3.4);assert(range.missed>0,'expired targets count as escapes');range.dispose();
// Even a full steering slam while boosting cannot spin the cart in a fraction of a second.
for(const speed of [8,14,22]){const motor=new CartMotor();motor.speed=speed;motor.maxForwardSpeed=speed;for(let i=0;i<60;i++)motor.step(1,1,false,1/60);assert(motor.heading<1.4);for(let i=0;i<30;i++)motor.step(1,0,false,1/60);assert(Math.abs(motor.steer)<.002,'steering recenters quickly');for(let i=0;i<90;i++)motor.step(0,0,true,1/60);assert.equal(motor.speed,0,'braking is reliable at boost speed');}
game.dispose();console.log('PASS: clear sky corridor, 12 perfect gates at 30/60/120 fps, missed-gate recovery, fixed rings, background pause, portrait/landscape direct tap hits, combos/restart/results, capped cart steering and braking.');
function falseFn(){return false;}
