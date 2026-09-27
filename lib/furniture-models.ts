import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {disposeResidence} from './residence-model';

export type FurnitureSpec={asset:string;width:number;height:number;depth:number;yaw:number};
/** An explicit visual socket. Physics and interaction sockets remain in the room. */
export function furnitureModel(group:T.Group,spec:FurnitureSpec){group.userData.modelFurniture=spec;return group;}
export function modelAssembly(parent:T.Group,x:number,z:number,spec:FurnitureSpec,build:()=>void,base=.11){
 const first=parent.children.length;build();const children=parent.children.slice(first),group=new T.Group();group.position.set(x,base,z);group.name='Furnishing: '+spec.asset;
 for(const child of children){child.position.x-=x;child.position.y-=base;child.position.z-=z;group.add(child);}parent.add(group);return furnitureModel(group,spec);
}

/** Load once per asset, instance repeated pieces, and never fetch unused floors. */
export class FurnitureModels{
 private cache=new Map<string,Promise<T.Group>>();
 private loaded=new Set<T.Group>();
 private worlds=new WeakSet<T.Group>();
 private disposed=false;
 private reflection:T.WebGLRenderTarget|null=null;
 prepare(renderer:T.WebGLRenderer){
  if(this.reflection||this.disposed)return;
  const generator=new T.PMREMGenerator(renderer),room=new RoomEnvironment();
  this.reflection=generator.fromScene(room,.06);room.dispose();generator.dispose();
 }
 private async load(asset:string,pathname:string){
  if(!this.cache.has(asset))this.cache.set(asset,new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync((pathname.startsWith('/trumpgame')?'/trumpgame/':'/')+'models/furniture/'+asset+'.glb').then(gltf=>{if(this.disposed){disposeResidence(gltf.scene);throw Error('Furniture loader closed');}this.loaded.add(gltf.scene);return gltf.scene;}).catch(e=>{this.cache.delete(asset);throw e;}));
  return this.cache.get(asset)!;
 }
 async populate(world:T.Group,pathname:string,onReady:()=>void){
  if(this.worlds.has(world)||this.disposed)return;this.worlds.add(world);
  if(this.reflection)world.traverse(o=>{if(o.userData.environmentSheen&&o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial){o.material.envMap=this.reflection!.texture;o.material.envMapIntensity=.6;o.material.needsUpdate=true;}});
  const sockets:T.Group[]=[];world.traverse(o=>{if(o.userData.modelFurniture&&!o.userData.furnitureReady)sockets.push(o as T.Group);});
  const assets=[...new Set(sockets.map(o=>(o.userData.modelFurniture as FurnitureSpec).asset))];
  // Two decodes at a time keeps first-room entry from saturating mobile memory.
  let next=0,failed=false;await Promise.all(Array.from({length:2},async()=>{while(next<assets.length){const asset=assets[next++];try{
   const source=await this.load(asset,pathname);if(this.disposed)return;source.updateMatrixWorld(true);
   source.traverse(o=>{if(o instanceof T.Mesh)for(const material of Array.isArray(o.material)?o.material:[o.material])if(material instanceof T.MeshStandardMaterial){if(this.reflection){material.envMap=this.reflection.texture;material.envMapIntensity=.45;material.needsUpdate=true;}for(const texture of [material.map,material.normalMap,material.roughnessMap])if(texture)texture.anisotropy=2;}});
   const bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
   const matching=sockets.filter(o=>o.userData.modelFurniture.asset===asset),rootInverse=world.matrixWorld.clone().invert();
   const placed=matching.map(socket=>{const spec=socket.userData.modelFurniture as FurnitureSpec;socket.updateWorldMatrix(true,false);const position=socket.getWorldPosition(new T.Vector3());const local=new T.Matrix4().compose(position,new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),spec.yaw),new T.Vector3(spec.width/size.x,spec.height/size.y,spec.depth/size.z));return rootInverse.clone().multiply(local).multiply(new T.Matrix4().makeTranslation(-center.x,-bounds.min.y,-center.z));});
   // Spatial batches let the renderer cull distant rooms. One floor-wide batch
   // would draw every chair even when only a single office was in the view.
   const clusters=new Map<string,T.Matrix4[]>();
   for(const matrix of placed){const p=new T.Vector3().setFromMatrixPosition(matrix),key=Math.floor(p.x/16)+','+Math.floor(p.z/16),batch=clusters.get(key)??[];batch.push(matrix);clusters.set(key,batch);}
   for(const batch of clusters.values()){
    const origin=new T.Vector3();for(const matrix of batch)origin.add(new T.Vector3().setFromMatrixPosition(matrix));origin.multiplyScalar(1/batch.length);origin.y=0;
    const offset=new T.Matrix4().makeTranslation(-origin.x,0,-origin.z);
    source.traverse(o=>{if(!(o instanceof T.Mesh))return;const mesh=new T.InstancedMesh(o.geometry,o.material,batch.length);mesh.name='Furniture model: '+asset;mesh.position.copy(origin);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.importedFurniture=true;mesh.userData.distanceCull=34;batch.forEach((m,i)=>mesh.setMatrixAt(i,offset.clone().multiply(m).multiply(o.matrixWorld)));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();world.add(mesh);});
   }
   for(const socket of matching){for(const child of socket.children.slice()){if(child.userData.furnitureProp)continue;child.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});socket.remove(child);}socket.userData.furnitureReady=true;}
   onReady();
  }catch(error){console.warn('Furniture model unavailable:',asset,error);failed=true;}}}));
  if(failed)this.worlds.delete(world);
 }
 dispose(){this.disposed=true;this.loaded.forEach(disposeResidence);this.loaded.clear();this.cache.clear();this.reflection?.dispose();this.reflection=null;}
}
