import assert from 'node:assert/strict';
import * as T from 'three';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const {grounds,interior}=await import('../.qa/game.mjs');
const {GARDENS,GARDEN_EXIT,GARDEN_ENTRANCE,SOUTH_FOUNTAIN,SOUTH_DRIVE,ESTATE_BENCHES}=await import('../.qa/grounds-layout.mjs');
const {gardenApproaches,estateDrives,pathClearance,ESTATE_ROUTES}=await import('../.qa/landscape.mjs');
const drives=new T.Group();estateDrives(drives);drives.updateMatrixWorld(true);
for(const m of drives.children){const n=m.geometry.attributes.normal;for(let i=0;i<n.count;i++)assert(n.getY(i)>.95,'drive surfaces face upward and render from above');}
assert(new T.Raycaster(new T.Vector3(.4,10,2.4),new T.Vector3(0,-1,0)).intersectObject(drives,true).length>0,'front approach has visible roadway');
const {destinations,npcs}=await import('../.qa/world-data.mjs');
const world=grounds(),garden=GARDENS[0];
assert(SOUTH_FOUNTAIN.z-SOUTH_FOUNTAIN.radius>Math.max(...SOUTH_DRIVE.map(p=>p[1]))+4,'fountain is beyond the transverse drive, matching current aerial photographs');
assert.equal(world.group.userData.benches.length,4,'only planned garden benches remain');
for(const {x,z}of ESTATE_BENCHES){assert(pathClearance(x,z)>.8,'bench clear of circulation');assert(!(x>55&&x<101&&z>-38&&z<60),'no benches on construction slab');assert(Math.hypot(x-SOUTH_FOUNTAIN.x,z-SOUTH_FOUNTAIN.z)>SOUTH_FOUNTAIN.radius+2);}
for(const {x,z}of world.group.userData.trees)assert(pathClearance(x,z)>1.19,'tree trunk and roots clear pavement at '+[x,z]);
assert(!world.group.getObjectByName('Red annual flower border'),'no spherical flowers');
const flowers=[];world.group.traverse(o=>{if(o.name==='Small five-petal annual flowers')flowers.push(o);});assert.equal(flowers.length,2);assert(flowers.every(f=>f.isInstancedMesh&&f.geometry.type==='BufferGeometry'),'petal geometry replaces balls');
assert(garden.x-garden.w/2>-62.5,'garden east of West Wing wall');
assert(garden.x+garden.w/2<-25,'garden west of residence wall');
assert(garden.z-garden.d/2>-20.35,'garden south of press connector');
assert(garden.z+garden.d/2<11,'garden lies alongside the buildings, not out on the South Lawn');
const rose=destinations.find(d=>d.id==='rose');assert.equal(rose.x,garden.x);assert.equal(rose.z,garden.z);
const person=npcs.find(n=>n.id==='burgum');assert(Math.abs(person.x-garden.x)<garden.w/2&&Math.abs(person.z-garden.z)<garden.d/2,'garden NPC moved with garden');
const blocked=(x,z)=>world.solids.some(s=>Math.abs(x-s.x)<s.w/2+.36&&Math.abs(z-s.z)<s.d/2+.36);
// Exercise the actual curved routes against independently assembled architecture,
// furniture and planting collisions, including room for a walking capsule.
for(const route of ESTATE_ROUTES){
 const curve=new T.CatmullRomCurve3(route.points.map(([x,z])=>new T.Vector3(x,0,z)),!!route.closed,'centripetal');
 for(let i=0;i<=300;i++){const p=curve.getPoint(i/300),t=curve.getTangent(i/300);for(const offset of [-.45,0,.45])assert(!blocked(p.x-t.z*offset,p.z+t.x*offset),'clear paved route: '+route.name+' at '+[p.x,p.z]);}
}
function route(points){for(let i=1;i<points.length;i++){const [ax,az]=points[i-1],[bx,bz]=points[i];for(let t=0;t<=1;t+=.005){const x=ax+(bx-ax)*t,z=az+(bz-az)*t;assert(!blocked(x,z),`walkable route at ${x},${z}`);}}}
route([[0,38],[-20,15],[-27,10],[-43.5,10],[-43.5,-5.8],[-43.5,-18],[-56.5,-18],GARDEN_ENTRANCE]);
route([[-57,-18],[-43.5,-18],[-27,-18]]);
route([[-114,-88],[-106,-67],[-92,-42],[-89,-30],[-89,-29]]);
assert(!blocked(...GARDEN_EXIT),'return spawn is clear');
const exit=interior('west').spots.find(s=>s.id==='exit-west');assert.deepEqual(exit.spawn,[...GARDEN_EXIT]);
const entry=world.spots.find(s=>s.id==='west-door');assert.deepEqual([entry.x,entry.z],[...GARDEN_ENTRANCE]);
const paths=new T.Group();gardenApproaches(paths);for(const mesh of paths.children){const normals=mesh.geometry.attributes.normal;for(let i=0;i<normals.count;i++)assert(normals.getY(i)>.99,'path faces upward');}
console.log('PASS: aerial-reference garden relationships, shared destination/NPC/map coordinates, lawn-to-colonnade and north-entrance routes, return spawn and visible path surfaces.');
