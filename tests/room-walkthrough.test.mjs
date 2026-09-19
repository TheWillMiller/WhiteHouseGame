// Run after world.test.cjs. Actual room geometry, no browser or WebGL mock images.
import assert from 'node:assert/strict';
import * as T from 'three';
import {writeFileSync} from 'node:fs';
globalThis.DOMRect ??= class DOMRect {};
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
const {interior}=await import('../.qa/game.mjs');
const {destinations}=await import('../.qa/world-data.mjs');
const {CameraObstacles}=await import('../.qa/render-budget.mjs');
const {FollowCamera}=await import('../.qa/follow-camera.mjs');
const {floorFinish}=await import('../.qa/room-finishes.mjs');
const worlds=new Map(), report=[];let samples=0;
for(const d of destinations.filter(d=>d.room)){
 if(!worlds.has(d.zone))worlds.set(d.zone,interior(d.zone));
 const world=worlds.get(d.zone),r=d.room;
 const obstacles=new CameraObstacles(world.solids,false,world.cameraOnly);
 assert(!world.group.children.some(o=>o.isSprite),d.id+': no oversized room banners');
 if(r.style!=='oval'){
  const group=new T.Group();floorFinish(group,d);const mesh=group.children[0],p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv;
  for(let i=0;i<p.count;i++)assert(Math.abs(uv.getX(i)-(p.getX(i)+d.x)/4.8)<1e-5,d.id+': world-scaled floor');
 }
 let count=0;
 for(const [dx,dz]of [[0,0],[-r.w/2+.65,0],[r.w/2-.65,0],[0,-r.d/2+.65],[0,r.d/2-.65]]){
  const x=d.x+dx,z=d.z+dz;
  if(world.solids.some(o=>Math.abs(x-o.x)<o.w/2+.36&&Math.abs(z-o.z)<o.d/2+.36))continue;
  if(r.style==='oval'&&((x-d.x)/8)**2+((z-d.z)/8.6)**2>=.99)continue;
  const surfaces=obstacles.nearby(x,z,r.style==='oval'),target=new T.Vector3(x,2.05,z),follow=new FollowCamera();
  for(const aspect of [9/16,16/9])for(let i=0;i<24;i++){
   const angle=i*Math.PI/12,desired=target.clone().add(new T.Vector3(Math.sin(angle)*4.7,.75,Math.cos(angle)*4.7));
   const view=new T.PerspectiveCamera(66,aspect,.1,420),result=follow.solve(target,desired,surfaces,1/60,view);
   assert(result.position.y<4.1,d.id+': camera remains below the cornice');
   const delta=result.position.clone().sub(target),length=delta.length();
   const hit=new T.Raycaster(target,delta.normalize(),.01,length-.07).intersectObjects(surfaces,false)[0];
   assert(!hit,d.id+': camera cannot cross a solid wall');
   if(length<2)assert(!result.showPlayer,d.id+': hide avatar before clipping into its face');
   count++;samples++;
  }
  follow.dispose();
 }
 obstacles.dispose();report.push({id:d.id,room:d.name,cameraSamples:count,continuousFloor:true});
}
const west=worlds.get('west');west.group.updateMatrixWorld(true);
const ceilings=west.group.children.filter(o=>o.name.includes('ceiling')||o.name==='Ceiling');
const roof=new T.Raycaster(new T.Vector3(22,4.7,15.6),new T.Vector3(0,1,0)).intersectObjects(ceilings,false)[0];
assert(roof&&Math.abs(roof.point.y-5.42)<.01,'Oval Office keeps its taller ceiling and crown molding');
writeFileSync('.qa/room-audit.json',JSON.stringify(report,null,2));
console.log(`PASS: ${report.length} rooms, ${samples} desktop/mobile-aspect camera samples, physical floor scale, removed room banners, and raised Oval ceiling. Geometry checks; not visual browser QA.`);
