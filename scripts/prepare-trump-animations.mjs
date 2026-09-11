import {NodeIO} from '@gltf-transform/core';
import {dedup, prune, textureCompress} from '@gltf-transform/functions';
import sharp from 'sharp';
import {readFile,writeFile,stat,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const directory=process.argv[2];
if(!directory)throw Error('Pass the directory containing the eight original Meshy animation exports.');
const entries=[['walk','Walking'],['run','Running'],['sprint','run_fast_10'],['stroll','Walk_Slowly_and_Look_Around'],['dance','01a09082-b846-716b-9b5f-0cd526c85349'],['ymca','ymca_dance'],['victory','Victory_Fist_Pump'],['backflip','Backflip_Jump']];
const io=new NodeIO(),sources=[];
let doc,targets,buffer;
for(const [name,suffix] of entries){
  const file=path.join(directory,`Meshy_AI_Low_Poly_Trump_biped_Animation_${suffix}_withSkin.glb`);
  const source=await io.read(file),clip=source.getRoot().listAnimations()[0];
  if(!doc){doc=await io.read(file);for(const a of doc.getRoot().listAnimations())a.dispose();targets=new Map(doc.getRoot().listNodes().map(n=>[n.getName(),n]));buffer=doc.getRoot().listBuffers()[0];}
  const joints=source.getRoot().listSkins()[0].listJoints().map(n=>n.getName());
  if(JSON.stringify(joints)!==JSON.stringify(doc.getRoot().listSkins()[0].listJoints().map(n=>n.getName())))throw Error('Incompatible skeleton: '+name);
  const bind=source.getRoot().listSkins()[0].getInverseBindMatrices().getArray();
  const targetBind=doc.getRoot().listSkins()[0].getInverseBindMatrices().getArray();
  if(bind.some((v,i)=>Math.abs(v-targetBind[i])>.0001))throw Error('Incompatible bind pose: '+name);
  const animation=doc.createAnimation(name),cache=new Map();
  function copy(accessor){if(!cache.has(accessor))cache.set(accessor,doc.createAccessor().setType(accessor.getType()).setArray(accessor.getArray().slice()).setBuffer(buffer));return cache.get(accessor);}
  for(const channel of clip.listChannels()){
    const target=targets.get(channel.getTargetNode().getName());if(!target)throw Error('Missing target');
    const s=channel.getSampler(),input=copy(s.getInput()),output=copy(s.getOutput());
    // Freeze horizontal root travel, retaining the source's vertical weight shifts.
    // Navigation and collisions own X/Z; no animation can move the collision body.
    if(target.getName()==='Hips'&&channel.getTargetPath()==='translation'){
      const values=output.getArray(),rest=target.getTranslation();for(let i=0;i<values.length;i+=3){values[i]=rest[0];values[i+2]=rest[2];}
    }
    const sampler=doc.createAnimationSampler().setInput(input).setOutput(output).setInterpolation(s.getInterpolation());
    animation.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(target).setTargetPath(channel.getTargetPath()).setSampler(sampler));
  }
  sources.push({name,file:path.basename(file),sha256:createHash('sha256').update(await readFile(file)).digest('hex'),bytes:(await stat(file)).size,duration:Math.max(...clip.listSamplers().map(s=>s.getInput().getMax([])[0]))});
}
await doc.transform(dedup(),prune(),textureCompress({encoder:sharp,targetFormat:'jpeg',resize:[2048,2048],quality:90}));
await mkdir('public/models',{recursive:true});
await io.write('public/models/trump-animated-v2.glb',doc);
const report={sources,output:'public/models/trump-animated-v2.glb',bytes:(await stat('public/models/trump-animated-v2.glb')).size,joints:doc.getRoot().listSkins()[0].listJoints().length,triangles:doc.getRoot().listMeshes().reduce((v,m)=>v+m.listPrimitives().reduce((n,p)=>n+p.getIndices().getCount()/3,0),0),textures:doc.getRoot().listTextures().map(t=>t.getSize()),horizontalRootMotion:'Removed; vertical animation preserved'};
await writeFile('assets/models/trump-animations.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
