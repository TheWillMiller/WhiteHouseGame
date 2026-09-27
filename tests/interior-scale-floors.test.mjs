// Run after world.test.cjs. Inspect built, batched floor geometry without WebGL.
import assert from 'node:assert/strict';
import * as T from 'three';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const {interior}=await import('../.qa/game.mjs');
const {destinations}=await import('../.qa/world-data.mjs');
const {BLUE_ROOM}=await import('../.qa/residence-layout.mjs');
const {HUMAN_SCALE}=await import('../.qa/residence-terrain.mjs');
assert.equal(HUMAN_SCALE*3,1.9);
assert(Math.abs(BLUE_ROOM.w-12.1412)<1e-6&&Math.abs(BLUE_ROOM.d-9.0424)<1e-6,'Blue Room footprint uses the curator dimensions');
const blue=destinations.find(d=>d.id==='blue'),green=destinations.find(d=>d.id==='green'),red=destinations.find(d=>d.id==='red');
assert(Math.abs(green.x-green.room.w/2-blue.room.w/2)<1e-8);assert(Math.abs(red.x+red.room.w/2+blue.room.w/2)<1e-8);
let samples=0;
for(const zone of ['west','state','ground','second','third']){
 const w=interior(zone);w.group.updateMatrixWorld(true);const faces=[];
 w.group.traverse(o=>{if(!o.isMesh||!o.material.name.startsWith('Interior floor: '))return;const p=o.geometry.attributes.position,idx=o.geometry.index;
  for(let i=0;i<(idx?.count??p.count);i+=3){const v=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i+k):i+k).applyMatrix4(o.matrixWorld));const normal=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0]));if(normal.y>0)faces.push({v,mat:o.material.uuid,y:v[0].y});}
 });
 const rooms=destinations.filter(d=>d.zone===zone&&d.room&&d.room.style!=='oval');
 for(const room of rooms)for(const dx of [-.24,.17])for(const dz of [-.19,.23]){
  const p=new T.Vector3(room.x+room.room.w*dx,.055,room.z+room.room.d*dz),hits=faces.filter(f=>{const q=p.clone();q.y=f.y;return T.Triangle.containsPoint(q,...f.v);});
  assert(hits.some(f=>Math.abs(f.y-.055)<1e-5),room.id+': room finish remains present');
  for(let i=0;i<hits.length;i++)for(let j=i+1;j<hits.length;j++)if(hits[i].mat!==hits[j].mat)assert(Math.abs(hits[i].y-hits[j].y)>.02,room.id+': different floor finishes must not fight for the same depth');
  samples++;
 }
}
console.log(`PASS: ${samples} floor samples across five interior zones have separated finishes; consistent 1.9 m human scale and connected, measured Blue Room footprint.`);
