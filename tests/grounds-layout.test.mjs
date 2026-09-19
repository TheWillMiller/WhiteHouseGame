import assert from 'node:assert/strict';
import * as T from 'three';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const {grounds,interior}=await import('../.qa/game.mjs');
const {GARDENS,GARDEN_EXIT,GARDEN_ENTRANCE}=await import('../.qa/grounds-layout.mjs');
const {gardenApproaches}=await import('../.qa/landscape.mjs');
const {destinations,npcs}=await import('../.qa/world-data.mjs');
const world=grounds(),garden=GARDENS[0];
assert(garden.x-garden.w/2>-42,'garden east of West Wing wall');
assert(garden.x+garden.w/2<-25,'garden west of residence wall');
assert(garden.z-garden.d/2>-27.25,'garden south of press connector');
assert(garden.z+garden.d/2<0,'garden lies alongside the buildings, not out on the South Lawn');
const rose=destinations.find(d=>d.id==='rose');assert.equal(rose.x,garden.x);assert.equal(rose.z,garden.z);
const person=npcs.find(n=>n.id==='burgum');assert(Math.abs(person.x-garden.x)<garden.w/2&&Math.abs(person.z-garden.z)<garden.d/2,'garden NPC moved with garden');
const blocked=(x,z)=>world.solids.some(s=>Math.abs(x-s.x)<s.w/2+.36&&Math.abs(z-s.z)<s.d/2+.36);
function route(points){for(let i=1;i<points.length;i++){const [ax,az]=points[i-1],[bx,bz]=points[i];for(let t=0;t<=1;t+=.005){const x=ax+(bx-ax)*t,z=az+(bz-az)*t;assert(!blocked(x,z),`walkable route at ${x},${z}`);}}}
route([[0,38],[-20,10],[-24,0],[-33.1,-2],[-33.1,-13.7],[-33.1,-23],GARDEN_ENTRANCE]);
route([[-33.1,-23],[-33.1,-25.5],[-26,-25.5]]);
route([[-86,-88],[-81,-71],[-70,-52],[-60,-44],[-60,-40]]);
assert(!blocked(...GARDEN_EXIT),'return spawn is clear');
const exit=interior('west').spots.find(s=>s.id==='exit-west');assert.deepEqual(exit.spawn,[...GARDEN_EXIT]);
const entry=world.spots.find(s=>s.id==='west-door');assert.deepEqual([entry.x,entry.z],[...GARDEN_ENTRANCE]);
const paths=new T.Group();gardenApproaches(paths);for(const mesh of paths.children){const normals=mesh.geometry.attributes.normal;for(let i=0;i<normals.count;i++)assert(normals.getY(i)>.99,'path faces upward');}
console.log('PASS: aerial-reference garden relationships, shared destination/NPC/map coordinates, lawn-to-colonnade and north-entrance routes, return spawn and visible path surfaces.');
