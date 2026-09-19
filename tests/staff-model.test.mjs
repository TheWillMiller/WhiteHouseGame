// Decode the actual shipped assets and exercise their skeletons without WebGL.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp';
import {STAFF_ASSETS,StaffModels,staffModelUrl} from '../.qa/npc-model.mjs';
await MeshoptDecoder.ready;
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
loader.register(()=>({name:'OFFLINE_TEXTURE',loadTexture:()=>Promise.resolve(new T.Texture())}));
let bytes=0,triangles=0,example;
for(const name of new Set(Object.values(STAFF_ASSETS))){
 const data=readFileSync(`public/models/staff/${name}-v1.glb`);bytes+=data.length;assert(data.length<1.2*1024**2);
 const gltf=await loader.parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.length),'');example=gltf;
 assert.equal(gltf.animations.length,1);assert(gltf.animations[0].duration>2);
 const mixer=new T.AnimationMixer(gltf.scene);mixer.clipAction(gltf.animations[0]).play();
 for(const time of [0,.5,1.4,2.4]){
  mixer.setTime(time);gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o=>{if(o instanceof T.SkinnedMesh){o.skeleton.update();o.computeBoundingBox();assert(o.skeleton.bones.length>20);assert(o.geometry.attributes.skinWeight);if(time===0)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
  const bounds=new T.Box3().setFromObject(gltf.scene),size=bounds.getSize(new T.Vector3());
  assert([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite));
  assert(size.y>2.9&&size.y<3.1,`${name}: human standing height`);assert(size.x<1.2,`${name}: arms relaxed at sides`);assert(Math.abs(bounds.min.y)<.06,`${name}: grounded idle`);
 }
 const j=JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12))),offset=28+data.readUInt32LE(12);
 for(const image of j.images){const v=j.bufferViews[image.bufferView];const meta=await sharp(data.subarray(offset+(v.byteOffset||0),offset+(v.byteOffset||0)+v.byteLength)).metadata();assert(meta.width<=1024&&meta.height<=1024);}
}
assert.equal(Object.keys(STAFF_ASSETS).length,14);
assert(staffModelUrl('/trumpgame/','burgum').startsWith('/trumpgame/models/staff/'));
assert(staffModelUrl('/','burgum').startsWith('/models/staff/'));
// Shared downloads, separate skeletons, independently advancing animation clocks.
const original=GLTFLoader.prototype.loadAsync;let calls=0;
GLTFLoader.prototype.loadAsync=async()=>{calls++;return example;};
const models=new StaffModels(),[a,b]=await Promise.all([models.create('/','duffy'),models.create('/','vance')]);
assert.equal(calls,1);assert.notEqual(a.object,b.object);
const ab=a.object.getObjectByName('Bip01_Spine'),bb=b.object.getObjectByName('Bip01_Spine');assert.notEqual(ab,bb);
const before=bb.quaternion.clone();a.animate(.8);assert.deepEqual(bb.quaternion.toArray(),before.toArray());
a.dispose();b.dispose();models.dispose();GLTFLoader.prototype.loadAsync=original;
console.log(`PASS: 12 real rigged assets, 14 cast mappings, relaxed grounded idle poses, texture limits, shared loading and independent skeletons. ${triangles} total triangles; ${(bytes/1024**2).toFixed(2)} MiB for the entire cast (loaded by area).`);
