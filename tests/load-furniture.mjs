// Decode the shipped GLBs for geometry tests without browser image APIs or WebGL.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const cache=new Map();
export function localFurniture(asset){
 if(!cache.has(asset))cache.set(asset,(async()=>{
  const doc=await io.read('public/models/furniture/'+asset+'.glb');
  for(const texture of doc.getRoot().listTextures())texture.dispose();
  for(const ext of doc.getRoot().listExtensionsUsed())if(ext.extensionName==='EXT_meshopt_compression')ext.dispose();
  const bytes=await io.writeBinary(doc);
  return (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
 })());
 return cache.get(asset);
}
