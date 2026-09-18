// Adapt the credited Sketchfab archive. Run with the extracted archive directory.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {join,weld,simplify,prune,compactPrimitive,meshopt} from '@gltf-transform/functions';
import {MeshoptSimplifier,MeshoptEncoder} from 'meshoptimizer';
import sharp from 'sharp';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const source=process.argv[2];if(!source)throw Error('Pass the extracted Sketchfab glTF folder');
await Promise.all([MeshoptSimplifier.ready,MeshoptEncoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const doc=await io.read(path.join(source,'scene.gltf')),root=doc.getRoot(),scene=root.listScenes()[0];
for(const node of root.listNodes()){node.setTranslation([0,0,0]).setRotation([0,0,0,1]).setScale([1,1,1]);if(node.getMesh())scene.addChild(node);}
for(const mesh of root.listMeshes())for(const p of mesh.listPrimitives()){
 const positions=p.getAttribute('POSITION').getArray(),indices=p.getIndices(),sourceIndices=indices.getArray(),kept=[];
 // Keep the residence, preserving original texture coordinates and facade details.
 // Wings are retained in the source archive for later adaptation.
 for(let i=0;i<sourceIndices.length;i+=3){const tri=sourceIndices.subarray(i,i+3);if([...tri].every(v=>Math.abs(positions[v*3])<2600))kept.push(...tri);}
 indices.setArray(new Uint32Array(kept));
 for(let i=0;i<positions.length;i+=3){positions[i]*=-.0097;positions[i+1]=positions[i+1]*.0097+.01;positions[i+2]=-positions[i+2]*.0097-22;}
 for(const semantic of ['NORMAL','TANGENT']){const a=p.getAttribute(semantic);if(a){const values=a.getArray(),stride=a.getElementSize();for(let i=0;i<values.length;i+=stride){values[i]*=-1;values[i+2]*=-1;}}}
 compactPrimitive(p);
}
await doc.transform(join(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:.65,error:.00006}),prune());
for(const tex of root.listTextures()){
 const base=tex.getURI().includes('baseColor'),normal=tex.getURI().includes('normal');
 const image=sharp(tex.getImage()).resize(base?2048:normal?1024:512,base?2048:normal?1024:512,{fit:'inside',withoutEnlargement:true});
 const bytes=base?await image.jpeg({quality:88}).toBuffer():await image.png().toBuffer();
 tex.setImage(bytes).setMimeType(base?'image/jpeg':'image/png').setURI(base?'residence-color.jpg':normal?'residence-normal.png':'residence-surface.png');
}
let triangles=0;for(const m of root.listMeshes())for(const p of m.listPrimitives())triangles+=p.getIndices().getCount()/3;
scene.setName('White House residence • Void • CC BY 4.0');
scene.setExtras({source:'https://sketchfab.com/3d-models/the-white-house-dbdb320ba4c6427ca4f2b2c2438034f9',author:'Void',license:'CC-BY-4.0',adaptation:'Residence extracted, upright, scaled and oriented for the game, mesh simplified, textures optimized.'});
await doc.transform(meshopt({encoder:MeshoptEncoder,level:'high'}),prune());
await mkdir('public/models',{recursive:true});await io.write('public/models/white-house-residence-v2.glb',doc);
await writeFile('.qa/residence-build.json',JSON.stringify({triangles},null,2));console.log({triangles});
