// Run after world.test.cjs. Regression rays use the actual batched scene meshes.
import assert from 'node:assert/strict';
import * as T from 'three';
globalThis.DOMRect ??= class DOMRect {};
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
const {grounds}=await import('../.qa/game.mjs');
const {openDoor,colonnadeGallery,exteriorGallery,EXTERIOR_GALLERY_OFFSET,corridorFace}=await import('../.qa/interior-details.mjs');
const {buildOvalOffice,OVAL}=await import('../.qa/oval-office.mjs');
const {NodeIO}=await import('@gltf-transform/core');const {ALL_EXTENSIONS}=await import('@gltf-transform/extensions');const {MeshoptDecoder}=await import('meshoptimizer');const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');await MeshoptDecoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});const doc=await io.read('public/models/white-house-west-v1.glb');for(const t of doc.getRoot().listTextures())t.dispose();for(const e of doc.getRoot().listExtensionsUsed())if(e.extensionName==='EXT_meshopt_compression')e.dispose();const bytes=await io.writeBinary(doc),model=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');const exterior=grounds().group;exterior.add(model.scene);exterior.updateMatrixWorld(true);const facadeMeshes=[];exterior.traverse(o=>{if(o.isMesh)facadeMeshes.push(o);});
for(const [x,z,dir]of [[-89,-20.2,-1],[-57,-22.15,1]])for(const dx of [-.85,0,.85])for(const y of [.6,1.6,2.8]){
 const ray=new T.Raycaster(new T.Vector3(x+dx,y,z+dir*.65),new T.Vector3(0,0,-dir),0,1.15);
 assert.equal(ray.intersectObjects(facadeMeshes,false).length,0,'no masonry or window behind entrance '+[x,z,dx,y]);
}
const gallery=new T.Group();colonnadeGallery(gallery);assert.equal(gallery.children.filter(o=>o.name.startsWith('Gallery portrait:')).length,47);
// The visible facade, rather than its simplified collision box, must clear every
// portrait and the lower plaque. Previously the facade hid their lower halves.
const placedGallery=new T.Group();exteriorGallery(placedGallery);placedGallery.position.set(...EXTERIOR_GALLERY_OFFSET);placedGallery.updateMatrixWorld(true);const outsidePortraits=[];placedGallery.traverse(o=>{if(o.name.startsWith('Gallery portrait:'))outsidePortraits.push(o);});
assert.equal(outsidePortraits.length,8);
for(const portrait of outsidePortraits){const p=portrait.getWorldPosition(new T.Vector3());for(const dx of [-.58,0,.58])for(const dy of [-1.05,-.7,0,.7]){
 const origin=new T.Vector3(p.x+dx,p.y+dy,p.z+1),ray=new T.Raycaster(origin,new T.Vector3(0,0,-1),0,1.08);
 assert.equal(ray.intersectObject(model.scene,true).length,0,'complete exterior frame and plaque in front of imported facade: '+portrait.name);
}}
const {residenceHeight}=await import('../.qa/residence-terrain.mjs');
const floorSamples=[];for(let x=-58;x<=-28;x+=1)floorSamples.push([x,-20.4]);for(let z=-15;z<=9;z+=1)floorSamples.push([-61,z]);
for(const [x,z]of floorSamples){const ray=new T.Raycaster(new T.Vector3(x,2,z),new T.Vector3(0,-1,0),0,2),hit=ray.intersectObject(model.scene,true)[0];assert(Math.abs(residenceHeight(x,z)-(hit?.point.y??0))<.015,'feet follow actual imported paving at '+[x,z]);}
const preview=new T.Group();exteriorGallery(preview);assert.equal(preview.children.filter(o=>o.name.startsWith('Gallery portrait:')).length,8);
const doors=new T.Group();openDoor(doors,36,-25);openDoor(doors,36,-25);assert.equal(doors.children.length,1,'shared press/colonnade doorway created once');
const hall=new T.Group();corridorFace(hall,-18,4,5,true,-1);assert(hall.children.length>8,'circulation-facing walls receive finish and art');
const room=new T.Group();buildOvalOffice(room,0,0);room.updateMatrixWorld(true);
for(const [start,end]of [OVAL.door,OVAL.studyDoor])for(let a=start+.055;a<end-.055;a+=.025)for(const y of [.7,1.5,2.8]){
 const p=new T.Vector3(OVAL.rx*Math.cos(a),y,OVAL.rz*Math.sin(a)),dir=new T.Vector3(Math.cos(a),0,Math.sin(a));
 const ray=new T.Raycaster(p.clone().addScaledVector(dir,-.55),dir,0,1.1);
 assert.equal(ray.intersectObject(room,true).length,0,'Oval doorway free from decorative doors, frames and portraits '+[a,y]);
}
console.log('PASS: both exterior doorway openings, 47 gallery portraits, 8 exterior preview portraits, shared door deduplication, corridor surfaces, and clear Oval doorway mesh rays.');
