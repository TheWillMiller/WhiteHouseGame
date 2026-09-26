// Run after world.test.cjs. Validate architecture, water geometry and race scenery.
import assert from 'node:assert/strict';
import * as T from 'three';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const {interior,grounds}=await import('../.qa/game.mjs');
const {destinations}=await import('../.qa/world-data.mjs');
const {MarineOne}=await import('../.qa/marine-one.mjs');
const {assembleWalls}=await import('../.qa/interior-walls.mjs');
const worlds=new Map();let openings=0;
for(const d of destinations.filter(d=>d.room&&d.room.style!=='oval')){
 if(!worlds.has(d.zone))worlds.set(d.zone,interior(d.zone));const r=d.room;
 for(const side of ['north','south','west','east']){
  const vertical=['west','east'].includes(side),sign=['north','west'].includes(side)?-1:1,edge=vertical?d.x+sign*r.w/2:d.z+sign*r.d/2,center=vertical?d.z:d.x,len=vertical?r.d:r.w;
  for(const along of (r.doors?r.doors[side]??[]:vertical?[-10,0,10]:[d.x])){
   if(Math.abs(along-center)>=len/2-1.2)continue;
   // Entire center approach, with a walking capsule radius, must be clear.
   for(const inset of [.45,.9,1.3]){const x=vertical?edge-sign*inset:along,z=vertical?along:edge-sign*inset;
    assert(!worlds.get(d.zone).solids.some(s=>Math.abs(x-s.x)<s.w/2+.36&&Math.abs(z-s.z)<s.d/2+.36),`${d.id} ${side} doorway blocked at ${x}, ${z}`);
   }openings++;
  }
 }
}
// Opposite faces of the same partition must produce one structural wall and one shared doorway.
const sample={group:new T.Group(),solids:[]};assembleWalls(sample,[{x:0,z:0,length:10,vertical:false,color:0xffffff,doors:[0],inward:1},{x:0,z:0,length:10,vertical:false,color:0xffffff,doors:[],inward:-1}]);
assert.equal(sample.solids.length,2);assert.equal(sample.cameraOnly.length,1);assert(sample.solids.every(s=>Math.abs(s.x)>1.6));
const estate=grounds();estate.group.updateMatrixWorld(true);
const ray=new T.Raycaster(new T.Vector3(-72,3,50),new T.Vector3(0,-1,0));
const meshes=[];estate.group.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});
const hits=ray.intersectObjects(meshes,false).filter(h=>h.point.y<1);
assert(hits.some(h=>Math.abs(h.point.y+.19)<.02),'pool water below deck');
assert(hits.some(h=>h.point.y<-1.7),'basin has real depth');
assert(!hits.some(h=>h.point.y>-.1&&h.point.y<.2),'no lawn/slab covering pool opening');
const spray=estate.group.getObjectByName('Animated fountain droplets');assert(spray?.isPoints);estate.water.update(.05,new T.Vector3(0,0,-60));const before=spray.geometry.attributes.position.array.slice();estate.water.update(.1,new T.Vector3(0,0,-60));assert(spray.geometry.attributes.position.array.some((v,i)=>v!==before[i]));
assert.equal(spray.geometry.attributes.position.count,780,'fixed particle budget');
const parent=new T.Group(),marine=new MarineOne(parent),player=new T.Vector3(0,0,106);
marine.update(1,player,false);assert(!marine.group.visible);
marine.update(1,player,true);assert(marine.group.visible);const aircraft=marine.group.children[0],start=aircraft.position.clone();for(let i=0;i<15;i++)marine.update(1,player,true);assert(aircraft.position.y>start.y+15&&aircraft.position.z>start.z,'rise then depart');
marine.update(1,player,false);marine.update(.01,player,true);assert(aircraft.position.y<1,'new race resets departure');
let draws=0;marine.group.traverse(o=>{if(o.isMesh)draws++;});assert(draws<=20,'batched airframe remains inexpensive');
console.log(`PASS: ${openings} clear doorway approaches, shared partitions, recessed pool, animated 780-point fountain, Marine One takeoff/reset (${draws} meshes). Geometry checks, not browser visual QA.`);
