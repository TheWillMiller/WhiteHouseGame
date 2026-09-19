// Run after downloading the attributed Rocketbox FBX/TGA sources into .qa/rocketbox.
// Models retain their skeletons; only a compact idle clip and diffuse maps ship.
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {weld,dedup,prune,meshopt,resample} from '@gltf-transform/functions';
import {MeshoptEncoder} from 'meshoptimizer';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}};
const fakeLoader={setPath(){return this;},load(name){const t=new T.Texture();t.userData.source=name;return t;}};
const manager=new T.LoadingManager();manager.addHandler(/\.(tga|png|jpg)$/i,fakeLoader);
T.TextureLoader.prototype.load=function(n){return fakeLoader.load(n);};
const parse=file=>{const b=readFileSync(file);return new FBXLoader(manager).parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const base='.qa/rocketbox/Assets',out='public/models/staff';mkdirSync(out,{recursive:true});
const names=['Business_Male_01','Business_Male_02','Business_Male_03','Business_Male_04','Business_Male_05','Business_Male_07','Business_Female_02','Business_Female_03','Business_Female_04','Chef_Female_01','Construction_Male_02','Male_Adult_14'];
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
for(const name of names.filter(n=>!process.argv[2]||n===process.argv[2])){
 const folder=path.join(base,'Avatars',name==='Male_Adult_14'?'Adults':'Professions',name),g=parse(path.join(folder,'Export',name+'.fbx'));
 const idle=parse(path.join(base,'Animations/all_animations_max_motextr_static',`${name.includes('Female')?'f':'m'}_idle_breathe_01.max.fbx`)).animations[0];
 const tracks=idle.tracks.filter(t=>t.name.endsWith('.quaternion')&&g.getObjectByName(t.name.split('.')[0])).map(t=>t.clone());
 const clip=new T.AnimationClip('Relaxed standing',idle.duration,tracks),mixer=new T.AnimationMixer(g);mixer.clipAction(clip).play();mixer.setTime(0);
 g.updateMatrixWorld(true);g.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.computeBoundingBox();}});
 const bounds=new T.Box3().setFromObject(g),scale=3/(bounds.max.y-bounds.min.y);
 const wrapper=new T.Group();wrapper.name=name;wrapper.add(g);wrapper.scale.setScalar(scale);wrapper.rotation.y=Math.PI;g.position.y-=bounds.min.y;wrapper.updateMatrixWorld(true);
 for(const light of [...g.children].filter(o=>o.isLight))g.remove(light);
 const textures=new Map();
 g.traverse(o=>{if(!o.isMesh)return;const uv=o.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,1-uv.getY(i));const convert=m=>{const tex=m.map?.userData.source;if(tex)textures.set(m.name,path.join(folder,'Textures',path.basename(tex)));return new T.MeshStandardMaterial({name:m.name,color:0xffffff,roughness:.88,metalness:0,side:T.DoubleSide});};o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);});
 const binary=await new GLTFExporter().parseAsync(wrapper,{binary:true,animations:[clip],onlyVisible:true});
 const doc=await io.readBinary(new Uint8Array(binary));
 for(const mat of doc.getRoot().listMaterials()){
  const src=textures.get(mat.getName());if(!src)continue;
  const alpha=src.includes('opacity'),size=src.includes('head')?1024:alpha?512:768,dest=path.join('.qa/rocketbox',path.basename(src,'.tga')+(alpha?'.png':'.jpg'));
  if(!existsSync(dest))execFileSync('python',['-c',`from PIL import Image\nim=Image.open(${JSON.stringify(src)}).convert('${alpha?'RGBA':'RGB'}')\nim.thumbnail((${size},${size}),Image.Resampling.LANCZOS)\nim.save(${JSON.stringify(dest)}${alpha?'':',quality=85,optimize=True'})`]);
  const tex=doc.createTexture(mat.getName()).setImage(readFileSync(dest)).setMimeType(alpha?'image/png':'image/jpeg');
  mat.setBaseColorTexture(tex).setBaseColorFactor([1,1,1,1]).setRoughnessFactor(.88).setMetallicFactor(0).setDoubleSided(alpha);
  if(alpha)mat.setAlphaMode('MASK').setAlphaCutoff(.4);
 }
 await doc.transform(weld(),dedup(),resample(),prune(),meshopt({encoder:MeshoptEncoder,level:'medium'}));
 const file=path.join(out,name.toLowerCase()+'-v1.glb');await io.write(file,doc);
 console.log(name,Math.round(readFileSync(file).length/1024)+' KB',tracks.length+' idle tracks','bounds',bounds.getSize(new T.Vector3()).multiplyScalar(scale).toArray());
}
