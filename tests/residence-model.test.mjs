import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dequantize} from '@gltf-transform/functions';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import * as T from 'three';
import {FollowCamera} from '../.qa/follow-camera.mjs';
import {residenceModelUrl} from '../.qa/residence-model.mjs';
const filename='public/models/white-house-residence-v1.glb';
assert(statSync(filename).size<12_000_000,'bounded download size');
assert.equal(residenceModelUrl('/trumpgame/'),'/trumpgame/models/white-house-residence-v1.glb');
assert.equal(residenceModelUrl('/'),'/models/white-house-residence-v1.glb');
await MeshoptDecoder.ready;
const doc=await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder}).read(filename);
await doc.transform(dequantize());
const scene=new T.Group();let triangles=0;
for(const node of doc.getRoot().listNodes())for(const p of node.getMesh()?.listPrimitives()??[]){
 const positions=p.getAttribute('POSITION').getArray();assert([...positions].every(Number.isFinite));
 const geo=new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(positions,3));geo.setIndex(new T.BufferAttribute(p.getIndices().getArray(),1));geo.applyMatrix4(new T.Matrix4().fromArray(node.getWorldMatrix()));scene.add(new T.Mesh(geo,new T.MeshBasicMaterial({side:T.DoubleSide})));triangles+=p.getIndices().getCount()/3;
 assert(p.getMaterial().getBaseColorTexture(),'preserved albedo');assert(p.getMaterial().getNormalTexture(),'preserved normal detail');
}
assert(triangles<120_000&&triangles>20_000);scene.updateMatrixWorld(true);
const bounds=new T.Box3().setFromObject(scene);assert(bounds.min.y>=-.01&&bounds.max.y>20&&bounds.max.y<22,'upright scale');assert(bounds.min.x>-26&&bounds.max.x<26,'wings cleanly separated');
const ray=(origin,direction)=>new T.Raycaster(new T.Vector3(...origin),new T.Vector3(...direction)).intersectObject(scene,true)[0];
const south=ray([0,1.6,20],[0,0,-1]);assert(south&&south.point.z>-8&&south.point.z<-7,'South Portico faces the South Lawn');
const north=ray([0,1.6,-60],[0,0,1]);assert(north&&north.point.z<-51&&north.point.z>-53,'North Portico faces the North Lawn');
const roof=ray([0,50,-23],[0,-1,0]);assert(roof);console.log('Flagpole roof height:',roof.point.y);
const follow=new FollowCamera();let checks=0;
for(const [x,z]of [[0,-4.7],[0,-55],[27,-27],[-27,-27],[0,10]])for(let i=0;i<24;i++){
 follow.reset();const target=new T.Vector3(x,2.15,z),a=i*Math.PI/12,desired=target.clone().add(new T.Vector3(Math.sin(a)*8.2,2,Math.cos(a)*8.2));const result=follow.solve(target,desired,scene.children,.016);assert(result.position.toArray().every(Number.isFinite));
 const offset=result.position.clone().sub(target),hits=new T.Raycaster(target,offset.clone().normalize(),.01,offset.length()-.02).intersectObject(scene,true);assert(!hits.length,'camera never sits beyond an imported facade');checks++;
}
assert(readFileSync('public/models/credits.txt','utf8').includes('CC BY 4.0'));
console.log(`PASS: Meshopt decode, ${triangles} triangles, preserved textures, upright scale, north/south orientation, model URLs, ${checks} camera positions and attribution.`);
