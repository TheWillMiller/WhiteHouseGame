import { NodeIO } from '@gltf-transform/core';
import { weld, simplify, prune, dedup, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const source = process.argv[2];
if (!source) throw new Error('Pass the original Meshy GLB path. The original is never modified.');
await MeshoptSimplifier.ready;
const io = new NodeIO();
const doc = await io.read(source);
const triangleCount = () => doc.getRoot().listMeshes().reduce((sum,m) => sum+m.listPrimitives().reduce((n,p)=>n+(p.getIndices()?.getCount()||0)/3,0),0);
const inputTriangles=triangleCount();
await doc.transform(weld(), simplify({simplifier:MeshoptSimplifier,ratio:60000/inputTriangles,error:.001}), dedup(), prune());
await doc.transform(textureCompress({encoder:sharp,targetFormat:'jpeg',resize:[2048,2048],quality:88}));
for (const material of doc.getRoot().listMaterials()) {
  material.setName('Meshy Trump textured suit and face');
  material.setDoubleSided(false);
}
await mkdir('public/models',{recursive:true});
await mkdir('assets/models',{recursive:true});
const output='public/models/trump-meshy-v1.glb';
await io.write(output,doc);
const report={sourceName:source.split(/[\\/]/).pop(),sourceSha256:createHash('sha256').update(await readFile(source)).digest('hex'),sourceBytes:(await stat(source)).size,inputTriangles,output,outputBytes:(await stat(output)).size,outputTriangles:triangleCount(),textureSizes:doc.getRoot().listTextures().map(t=>t.getSize()),rigged:doc.getRoot().listSkins().length>0,animations:doc.getRoot().listAnimations().length};
await writeFile('assets/models/trump-source.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
