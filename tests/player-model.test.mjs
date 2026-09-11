import assert from 'node:assert/strict';
import { NodeIO } from '@gltf-transform/core';
import * as T from 'three';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';
mkdirSync('.qa',{recursive:true});

writeFileSync('.qa/player-model.mjs',ts.transpileModule(readFileSync('lib/player-model.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const {fitPlayerMesh,playerModelUrl}=await import('../.qa/player-model.mjs');
assert.equal(playerModelUrl('/trumpgame/'),'/trumpgame/models/trump-meshy-v1.glb');
assert.equal(playerModelUrl('/'),'/models/trump-meshy-v1.glb');
const doc=await new NodeIO().read('public/models/trump-meshy-v1.glb');
const p=doc.getRoot().listMeshes()[0].listPrimitives()[0];
const geometry=new T.BufferGeometry();
geometry.setAttribute('position',new T.BufferAttribute(p.getAttribute('POSITION').getArray(),3));
geometry.setAttribute('normal',new T.BufferAttribute(p.getAttribute('NORMAL').getArray(),3));
geometry.setAttribute('uv',new T.BufferAttribute(p.getAttribute('TEXCOORD_0').getArray(),2));
geometry.setIndex(new T.BufferAttribute(p.getIndices().getArray(),1));
const source=new T.Mesh(geometry,new T.MeshStandardMaterial());
const model=fitPlayerMesh(source),skin=model.object.children[0],pos=skin.geometry.getAttribute('position'),weights=skin.geometry.getAttribute('skinWeight');
assert.equal(skin.geometry.index.count/3,60000);
assert(Math.abs(skin.geometry.boundingBox.min.y)<.0001);
assert(Math.abs(skin.geometry.boundingBox.max.y-3)<.0001);
for(let i=0;i<weights.count;i++)assert(Math.abs(weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i)-1)<.0001);
const original=new T.Vector3(),deformed=new T.Vector3();
for(const [label,distance,airborne] of [['idle',0,false],['walking',.27,false],['jumping',0,true]]){
  for(let i=0;i<20;i++)model.animate(distance/20,.016,airborne);
  model.object.updateMatrixWorld(true);skin.skeleton.update();
  const out=new Float32Array(pos.count*3);
  for(let i=0;i<pos.count;i++){
    original.fromBufferAttribute(pos,i);deformed.copy(original);skin.applyBoneTransform(i,deformed);
    assert([deformed.x,deformed.y,deformed.z].every(Number.isFinite));
    if(original.y>2.6)assert(original.distanceTo(deformed)<.0001,'face and hair must not deform');
    assert(original.distanceTo(deformed)<.7,'limb displacement remains bounded');
    deformed.toArray(out,i*3);
  }
  writeFileSync('.qa/player-'+label+'.bin',Buffer.from(out.buffer));
}
writeFileSync('.qa/player-uv.bin',Buffer.from(skin.geometry.getAttribute('uv').array.buffer));
writeFileSync('.qa/player-indices.bin',Buffer.from(Uint32Array.from(skin.geometry.index.array).buffer));
writeFileSync('.qa/player-texture.jpg',doc.getRoot().listMaterials()[0].getBaseColorTexture().getImage());
model.dispose();source.geometry.dispose();source.material.dispose();
console.log('PASS: optimized GLB, root/subpath URLs, scale, normalized rig weights, finite idle/walk/jump poses, stable face and bounded deformation.');
