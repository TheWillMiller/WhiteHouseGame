// Run after world.test.cjs to use the production modules compiled into .qa.
import assert from 'node:assert/strict';
import * as T from 'three';
globalThis.DOMRect ??= class DOMRect {};
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx})});
globalThis.window=Object.assign(new EventTarget(),{devicePixelRatio:1});
globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;}observe(){this.fn();}disconnect(){}};
globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
globalThis.__testRenderer=()=>({domElement:Object.assign(new EventTarget(),{setAttribute(){},focus(){},remove(){}}),shadowMap:{},setPixelRatio(){},setSize(){},dispose(){},render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}});
const {grounds,Game}=await import('../.qa/game.mjs');
const {ThirdPersonOrbit}=await import('../.qa/follow-camera.mjs');
const {residenceHeight,OUTDOOR_HUMAN_SCALE}=await import('../.qa/residence-terrain.mjs');
const world=grounds(),guard={zone:'grounds',world,player:{position:{y:0}}};
const paths=[];
for(const side of [-1,1])for(const north of [false,true]){
 const start=north?[side*90,-550]:[side*40,-27],queue=[start],key=(x,z)=>x+','+z,seen=new Set([key(...start)]),parents=new Map();let end;
 for(let i=0;i<queue.length;i++){
  const [ix,iz]=queue[i],x=ix/10,z=iz/10,h=residenceHeight(x,z);
  if(north?Math.abs(x-side*10.5)<1&&z> -42&&h>=3.2:Math.abs(x-side*6)<.5&&Math.abs(z+12.6)<.5&&h>3.7){end=[ix,iz];break;}
  guard.player.position.y=h;
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=ix+dx,nz=iz+dz,k=key(nx,nz);if(Math.abs(nx)>130||nz<(north?-551:-142)||nz>(north?-405:-25)||seen.has(k)||Game.prototype.blocked.call(guard,nx/10,nz/10))continue;seen.add(k);parents.set(k,[ix,iz]);queue.push([nx,nz]);}
 }
 assert(end,`${north?'North':'South'} ${side}: staircase has a complete walking route`);
 const path=[];for(let p=end;p;p=parents.get(key(...p)))path.push([p[0]/10,p[1]/10,residenceHeight(p[0]/10,p[1]/10)]);path.reverse();paths.push(path);
 for(let i=1;i<path.length;i++)assert(path[i][2]-path[i-1][2]<=.300001,'ordinary step rise');
 console.log(`${north?'North':'South'} ${side}: ${path.length} samples, landing ${path.at(-1)[2]} m`);
}
guard.player.position.y=0;assert(Game.prototype.blocked.call(guard,9,-8),'cannot walk sideways through raised stair mass');
const game=new Game({appendChild(){},clientWidth:1280,clientHeight:800},()=>{},()=>{},()=>{});
assert.equal(game.player.scale.y*3,1.9,'outdoor player uses human scale');
assert(game.world.actors.every(a=>a.group.scale.y===OUTDOOR_HUMAN_SCALE),'outdoor staff share player scale');
// Advance the real simulation along every tread, then descend and jump from a landing.
let now=1000;game.loop(now);
for(const path of paths){game.change('grounds',path[0][0],path[0][1]);for(const [x,z,h]of [...path,...path.slice().reverse()]){game.player.position.x=x;game.player.position.z=z;game.loop(now+=40);assert(game.player.position.y>=h-1e-6,'feet never fall through the visible stair');}const [x,z,h]=path.at(-1);game.change('grounds',x,z);game.jump();game.loop(now+=16);assert(game.player.position.y>h,'jump works on an elevated landing');for(let i=0;i<90;i++)game.loop(now+=16);assert.equal(game.player.position.y,h,'jump lands on the same stair, not ground zero');}
const rig=new ThirdPersonOrbit();let yaw=0;const initial=rig.movementBasis('0,1',yaw);
for(let i=0;i<240;i++){assert.equal(rig.movementBasis('0,1',yaw),initial,'camera recenter cannot steer a held side-step into a circle');yaw=rig.follow(yaw,Math.PI/2,true,1/60);}
assert(Math.abs(yaw-Math.PI/2)<.002,'camera settles behind travel direction');
rig.manualLook();assert.equal(rig.follow(1,-1,true,.1),1,'manual look gets priority');
rig.looking=true;assert.equal(rig.follow(1,-1,true,2),1,'camera does not fight dragging');rig.looking=false;
assert.equal(rig.follow(1,-1,false,2),1,'standing free look remains where placed');
rig.reset();const wrap=rig.follow(Math.PI-.02,-Math.PI+.02,true,.1);assert(wrap>Math.PI-.02&&wrap<Math.PI+.02,'shortest-path recenter across angle wrap');
game.dispose();console.log('PASS: four stair routes, physical outdoor scale, elevated landing/jumping, free look and stable third-person recenter.');
