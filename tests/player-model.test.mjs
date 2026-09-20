import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as T from 'three';
import {WebGLObjects} from 'three/src/renderers/webgl/WebGLObjects.js';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
mkdirSync('.qa',{recursive:true});
writeFileSync('.qa/skinning.mjs',ts.transpileModule(readFileSync('lib/skinning.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
writeFileSync('.qa/player-model.mjs',ts.transpileModule(readFileSync('lib/player-model.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("from './skinning'","from './skinning.mjs'"));
const {createAnimatedPlayer,playerModelUrl}=await import('../.qa/player-model.mjs');
assert.equal(playerModelUrl('/trumpgame/'),'/trumpgame/models/trump-detailed-v3.glb');assert.equal(playerModelUrl('/'),'/models/trump-detailed-v3.glb');
const io=new NodeIO(),doc=await io.read('public/models/trump-detailed-v3.glb');
const texture=doc.getRoot().listMaterials()[0].getBaseColorTexture().getImage();writeFileSync('.qa/player-texture.jpg',texture);
assert.equal(doc.getRoot().listSkins()[0].listJoints().length,28);assert.equal(doc.getRoot().listAnimations().length,8);
for(const a of doc.getRoot().listAnimations())for(const c of a.listChannels())if(c.getTargetNode().getName()==='Hips'&&c.getTargetPath()==='translation'){const v=c.getSampler().getOutput().getArray();for(let i=0;i<v.length;i+=3){assert.equal(v[i],v[0]);assert.equal(v[i+2],v[2]);}}
// Exercise the real GLTFLoader and AnimationMixer without a browser/image decoder.
for(const t of doc.getRoot().listTextures())t.dispose();
const bytes=await io.writeBinary(doc);const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const model=createAnimatedPlayer(gltf.scene,gltf.animations);let skin;model.object.traverse(o=>{if(o instanceof T.SkinnedMesh)skin=o;});
assert(skin);const weights=skin.geometry.getAttribute('skinWeight');for(let i=0;i<weights.count;i++)assert(Math.abs(weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i)-1)<.002);
// Regression: holding C must keep alternating the feet even at slow travel speed.
const foot=model.object.getObjectByName('LeftFoot'),footPath=[];assert(foot);
for(let i=0;i<90;i++){model.animate(1.6/60,1/60,false,'stroll');model.object.updateMatrixWorld(true);footPath.push(foot.getWorldPosition(new T.Vector3()));}
assert(Math.max(...footPath.map(p=>p.distanceTo(footPath[0])))>.3,'C movement must animate a stride rather than slide in a held pose');
model.emote(null);for(let i=0;i<60;i++)model.animate(0,1/60,false);
model.pose('sit');for(let i=0;i<60;i++)model.animate(0,1/60,false);model.object.updateMatrixWorld(true);
for(const side of ['Left','Right']){
 const hip=model.object.getObjectByName(side+'UpLeg').getWorldPosition(new T.Vector3()),knee=model.object.getObjectByName(side+'Leg').getWorldPosition(new T.Vector3()),ankle=model.object.getObjectByName(side+'Foot').getWorldPosition(new T.Vector3());
 assert(Math.abs(hip.y-.96)<.06,'Seated hips match chair cushion height');
 assert(Math.abs(knee.y-hip.y)<.06,'Seated thighs are horizontal');
 assert(ankle.y<knee.y-.45&&ankle.y>.05,'Seated shins point down and feet stay above floor');
 assert(knee.z<hip.z-.5,'Seated knees face the front of the chair');
 console.log('Seated '+side,hip.toArray(),knee.toArray(),ankle.toArray());
}
model.pose(null);assert.equal(model.object.position.y,0,'Standing removes sitting height offset');
model.pose('briefing');for(let i=0;i<120;i++)model.animate(0,1/60,false);model.object.updateMatrixWorld(true);
assert(model.object.getObjectByName('RightHand').getWorldPosition(new T.Vector3()).y>1,'Briefing hand remains above lectern level');
model.pose(null);for(let i=0;i<60;i++)model.animate(0,1/60,false);
let frames=0;const vertex=new T.Vector3();
for(const [label,mode,distance,airborne,gesture] of [['idle','walk',0,false,null],['walking','walk',3.2/60,false,null],['running','run',6.5/60,false,null],['sprint','sprint',9/60,false,null],['stroll','stroll',1.6/60,false,null],['dance','walk',0,false,'dance'],['ymca','walk',0,false,'ymca'],['victory','walk',0,false,'victory'],['backflip','walk',0,false,'backflip'],['jumping','walk',0,true,null]]){
  model.emote(gesture);const limits=new T.Box3();
  for(let frame=0;frame<60;frame++){
    model.animate(distance,1/60,airborne,mode);model.object.updateMatrixWorld(true);skin.skeleton.update();
    const positions=new Float32Array(skin.geometry.getAttribute('position').count*3);
    for(let i=0;i<positions.length/3;i+=(frame===35?1:53)){skin.getVertexPosition(i,vertex).applyMatrix4(skin.matrixWorld);assert([vertex.x,vertex.y,vertex.z].every(Number.isFinite));assert(vertex.length()<8,'Animation exploded');limits.expandByPoint(vertex);vertex.toArray(positions,i*3);}
    if(frame===35)writeFileSync('.qa/player-'+label+'.bin',Buffer.from(positions.buffer));frames++;
  }
  console.log(label,limits.min.toArray().map(v=>v.toFixed(2)),limits.max.toArray().map(v=>v.toFixed(2)));
}
// Walking must cancel an emote and converge to the same pose as fresh locomotion.
model.emote('dance');model.animate(0,.5,false);model.animate(.05,.016,false,'walk');assert.equal(model.object.position.length(),0);
const uv=skin.geometry.getAttribute('uv'),uvs=new Float32Array(uv.count*2);for(let i=0;i<uv.count;i++){uvs[i*2]=uv.getX(i);uvs[i*2+1]=uv.getY(i);}
writeFileSync('.qa/player-uv.bin',Buffer.from(uvs.buffer));writeFileSync('.qa/player-indices.bin',Buffer.from(Uint32Array.from(skin.geometry.index.array).buffer));
// Reproduce r186's real skeleton cache, including the frame-counter increment
// between scene collection and the intermittent shadow pass. CPU bone positions
// alone miss this bug: the shader consumes skeleton.boneMatrices instead.
const parent=new T.Group();parent.add(model.object);
const gpuVertex=(index)=>{
  const p=new T.Vector3().fromBufferAttribute(skin.geometry.attributes.position,index).applyMatrix4(skin.bindMatrix);
  const result=new T.Vector3(),joints=skin.geometry.attributes.skinIndex,weights=skin.geometry.attributes.skinWeight;
  for(let k=0;k<4;k++)result.addScaledVector(p.clone().applyMatrix4(new T.Matrix4().fromArray(skin.skeleton.boneMatrices,joints.getComponent(index,k)*16)),weights.getComponent(index,k));
  return result.applyMatrix4(skin.bindMatrixInverse).applyMatrix4(skin.matrixWorld);
};
const headIndex=Array.from({length:skin.geometry.attributes.position.count},(_,i)=>i).reduce((best,i)=>skin.geometry.attributes.position.getY(i)>skin.geometry.attributes.position.getY(best)?i:best,0);
let reproduced=0,maxFixedError=0;
for(const sync of [false,true])for(const [dx,dz] of [[1,0],[-1,0],[1,-1],[0,1],[0,-1]]){
  const info={render:{frame:0}},objects=new WebGLObjects({}, {get:(_o,g)=>g,update(){}},{},{},info);
  const direction=new T.Vector3(dx,0,dz).normalize();parent.position.set(0,0,0);parent.rotation.y=-Math.atan2(dx,-dz);
  for(let frame=0;frame<90;frame++){
    const dt=[1/60,1/45,1/90][frame%3];parent.position.addScaledVector(direction,3.2*dt);model.animate(3.2*dt,dt,false,'walk');parent.updateMatrixWorld(true);
    objects.update(skin);info.render.frame++;if(frame%4===0)objects.update(skin);
    if(sync)skin.onBeforeRender();
    const expected=skin.getVertexPosition(headIndex,new T.Vector3()).applyMatrix4(skin.matrixWorld),error=gpuVertex(headIndex).distanceTo(expected);
    if(sync){maxFixedError=Math.max(maxFixedError,error);assert(error<.00003,'GPU skeleton and camera must use the same frame in every travel direction');}
    else reproduced=Math.max(reproduced,error);
  }
  objects.dispose();
}
assert(reproduced>.05,'Regression must reproduce the stale GPU pose before the fix');
console.log(`GPU pose regression: before ${reproduced.toFixed(4)} world-unit lag; after ${maxFixedError.toExponential(2)}. Five directions, variable frame times, real renderer cache.`);
model.dispose();console.log('PASS: all 8 clips, 28-joint skin, in-place root tracks, actual loader/mixer, '+frames+' finite posed frames and deployment URLs.');
