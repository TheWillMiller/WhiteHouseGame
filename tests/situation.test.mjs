import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {SituationChallenge,SCENARIOS,AGENCIES} from '../.qa/situation-game.mjs';
import {buildSituationRoom,insideSituation} from '../.qa/situation-room.mjs';
import {localFurniture} from './load-furniture.mjs';
import {FurnitureModels} from '../.qa/furniture-models.mjs';
const agencies=Object.keys(AGENCIES);
const slowFrame=new SituationChallenge();slowFrame.start();slowFrame.update(5);assert(Math.abs(slowFrame.state.elapsed-5.001)<.00001,'foreground stalls retain elapsed time');
for(const scenario of SCENARIOS){
 const game=new SituationChallenge(scenario.id);
 assert(!game.dispatch('harbor','rescue'),'orders before briefing rejected');
 game.start();let calls=0;
 for(let t=0;t<scenario.duration*10&&game.state.phase==='running';t++){
  const active=game.state.incidents.filter(i=>i.status==='active').sort((a,b)=>(100-a.severity)/a.rate-(100-b.severity)/b.rate);
  for(const i of active)for(const a of agencies)if(game.dispatch(i.id,a))calls++;
  if(active.length>2&&game.state.surges&&game.state.surgeTime<=0)game.surge();
  game.update(.1);
 }
 assert.equal(game.state.phase,'won',scenario.title+' can be completed with urgency-based dispatch');
 assert.equal(game.state.resolved,scenario.plans.length);assert(game.state.score>1500);
 assert(game.state.elapsed>50,'scenario unfolds over time');assert(calls>=scenario.plans.length);
 const finished=JSON.stringify(game.snapshot());game.update(.8);assert.equal(JSON.stringify(game.snapshot()),finished,'finished timer frozen');
 console.log(`${scenario.title}: ${game.state.resolved} contained, ${game.state.elapsed.toFixed(1)}s, ${game.state.score} points`);
}
const noResponse=new SituationChallenge('cascade');noResponse.start();for(let i=0;i<1700;i++)noResponse.update(.1);assert.equal(noResponse.state.phase,'lost','ignoring reports has a real failure condition');
const limited=new SituationChallenge();limited.start();assert(limited.dispatch('harbor','rescue'));assert(!limited.dispatch('harbor','rescue'),'cannot double-book same incident');assert(!limited.dispatch('harbor','power'),'wrong agency rejected');assert(!limited.dispatch('missing','rescue'));assert(limited.surge());assert(!limited.surge(),'cannot stack surge');for(let t=0;t<130;t++)limited.update(.1);assert(limited.surge());for(let t=0;t<130;t++)limited.update(.1);assert(!limited.surge(),'only two surges');
const copy=limited.snapshot();copy.teams[0].incident='mutated';copy.incidents[0].remaining.rescue=999;assert.notEqual(limited.state.teams[0].incident,'mutated');assert.notEqual(limited.state.incidents[0].remaining.rescue,999,'UI snapshots detached');limited.reset('blackout');assert.equal(limited.state.phase,'briefing');assert.equal(limited.state.elapsed,0);assert.equal(limited.state.surges,2);
// Model geometry, walkable access and physical door opening without browser/GPU.
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const world={group:new T.Group(),solids:[],spots:[]};const displays=buildSituationRoom(world);displays.update(limited.snapshot());
const blocked=(x,z)=>!insideSituation(x,z)||world.solids.some(s=>Math.abs(x-s.x)<s.w/2+.27&&Math.abs(z-s.z)<s.d/2+.27);
for(const [x,z]of [[0,6.6],[0,8],[0,9],[0,10.1],[-3.4,6.5],[0,4],[1.05,-6.2]])assert(!blocked(x,z),'clear access '+x+','+z);
assert(blocked(0,-1),'table blocks walking');assert(blocked(5.9,0));assert(!insideSituation(12,2));
const step=.25,reached=new Set(),queue=[[0,6.5]],key=(x,z)=>x.toFixed(2)+','+z.toFixed(2);reached.add(key(...queue[0]));
for(let n=0;n<queue.length;n++){const [x,z]=queue[n];for(const [dx,dz]of [[step,0],[-step,0],[0,step],[0,-step]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(reached.has(k)||blocked(nx,nz))continue;reached.add(k);queue.push([nx,nz]);}}
for(const spot of world.spots)assert(queue.some(([x,z])=>Math.hypot(x-spot.x,z-spot.z)<.7),'walkable route to '+spot.id);
const loader=new FurnitureModels();loader.load=localFurniture;await loader.populate(world.group,'/',()=>{});world.group.updateMatrixWorld(true);
const sockets=[];world.group.traverse(o=>{if(o.userData.modelFurniture)sockets.push(o);});assert.equal(sockets.length,25);assert(sockets.every(o=>o.userData.furnitureReady),'detailed models installed');
const screens=[];world.group.traverse(o=>{if(o.name==='Live situation display')screens.push(o);});assert.equal(screens.length,4);assert(screens.every(o=>o.userData.dynamic),'screens survive world batching');
for(const screen of screens){const p=screen.position;const hit=new T.Raycaster(new T.Vector3(0,p.y,p.z),p.clone().sub(new T.Vector3(0,p.y,p.z)).normalize()).intersectObject(world.group,true)[0];assert.equal(hit?.object,screen,'display faces room with no wall covering');}
assert(fs.statSync('public/models/furniture/executive-chair.glb').size<500000);assert(fs.statSync('public/models/furniture/situation-table.glb').size<250000);
console.log(`PASS: 3 playable scenarios, team contention, invalid orders, surge limits, replay, loss, ${queue.length} clear walking cells, 25 modeled furnishings, four unobstructed live displays.`);
