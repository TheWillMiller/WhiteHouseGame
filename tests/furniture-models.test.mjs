import assert from 'node:assert/strict';
import {statSync} from 'node:fs';
import {localFurniture} from './load-furniture.mjs';
globalThis.DOMRect??=class{};
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({getContext:()=>ctx})};
const {interior}=await import('../.qa/game.mjs');
const {FurnitureModels}=await import('../.qa/furniture-models.mjs');
const assets=new Set();let count=0;
for(const zone of ['west','situation','state','ground','second','third']){
 const w=interior(zone),loader=new FurnitureModels(),sockets=[];loader.load=localFurniture;
 w.group.traverse(o=>{if(o.userData.modelFurniture){sockets.push(o);const f=o.userData.modelFurniture;assets.add(f.asset);const budget=f.asset==='resolute-desk'?2_000_000:1_200_000;assert(statSync('public/models/furniture/'+f.asset+'.glb').size<budget,'bounded download: '+f.asset);}});
 await loader.populate(w.group,'/',()=>{});
 assert(sockets.every(o=>o.userData.furnitureReady&&o.children.every(c=>c.userData.furnitureProp)),'all old furniture replaced on '+zone);
 const draws=w.group.children.filter(o=>o.userData.importedFurniture);
 assert(draws.every(o=>o.isInstancedMesh&&o.userData.distanceCull===34),'spatial batches have distance culling');
 const before=draws.length;await loader.populate(w.group,'/',()=>{});assert.equal(w.group.children.filter(o=>o.userData.importedFurniture).length,before,'re-entry does not duplicate meshes');count+=sockets.length;
}
const w=interior('west'),loader=new FurnitureModels();let failed=false;
loader.load=asset=>{if(asset==='ArmChair_01'&&!failed){failed=true;throw Error('Test transient download failure');}return localFurniture(asset);};
const warn=console.warn;console.warn=()=>{};try{await loader.populate(w.group,'/',()=>{});}finally{console.warn=warn;}
const installed=new Set(w.group.children.filter(o=>o.userData.importedFurniture));
await loader.populate(w.group,'/',()=>{});
assert([...installed].every(o=>w.group.children.includes(o)),'retry retains successful batches');
assert(w.group.children.filter(o=>o.userData.importedFurniture&&!installed.has(o)).every(o=>o.name==='Furniture model: ArmChair_01'),'retry installs only failed asset');
console.log(`PASS: ${count} replacement sockets, ${assets.size} shipped models, bounded downloads, spatial instancing, repeat entry and partial-download recovery.`);
