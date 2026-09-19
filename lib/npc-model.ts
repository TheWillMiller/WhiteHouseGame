import * as T from 'three';
import {synchronizeSkin} from './skinning';
import {GLTFLoader,type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {disposeResidence} from './residence-model';

// Generic adult representations from Microsoft's MIT-licensed Rocketbox library.
export const STAFF_ASSETS:Record<string,string>={usher:'business_male_02',susie:'business_female_02',vance:'business_male_01',marco:'business_male_03',bessent:'business_male_04',burgum:'business_male_07',duffy:'business_male_01',collins:'business_male_02',leavitt:'business_female_03',foreman:'construction_male_02',gardener:'male_adult_14',chef:'chef_female_01','florist-npc':'business_female_04',docent:'business_male_05'};
export function staffModelUrl(pathname:string,id:string){const file=STAFF_ASSETS[id];if(!file)throw new Error(`No staff asset for ${id}`);return(pathname==='/trumpgame'||pathname.startsWith('/trumpgame/')?'/trumpgame/':'/')+`models/staff/${file}-v1.glb`;}
export type StaffActor={object:T.Group;animate:(dt:number)=>void;dispose:()=>void};
export class StaffModels {
 private assets=new Map<string,Promise<GLTF>>();private disposed=false;
 async create(pathname:string,id:string):Promise<StaffActor|null>{
  const url=staffModelUrl(pathname,id);let pending=this.assets.get(url);
  if(!pending){pending=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);this.assets.set(url,pending);pending.catch(()=>{this.assets.delete(url);});}
  const asset=await pending;if(this.disposed)return null;
  const object=clone(asset.scene) as T.Group;object.name=`Staff model: ${id}`;
  object.traverse(o=>{if(o instanceof T.SkinnedMesh)synchronizeSkin(o);if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;/* A conservative fixed bound covers the small idle movement. */o.frustumCulled=false;}});
  const mixer=new T.AnimationMixer(object);const clip=asset.animations[0];if(clip)mixer.clipAction(clip).play();mixer.setTime(id.length*.31);
  let accumulated=0;
  return{object,animate(dt){accumulated+=dt;if(accumulated>=1/20){mixer.update(accumulated);accumulated=0;}},dispose(){mixer.stopAllAction();mixer.uncacheRoot(object);object.traverse(o=>{if(o instanceof T.SkinnedMesh)o.skeleton.dispose();});}};
 }
 dispose(){this.disposed=true;for(const asset of this.assets.values())void asset.then(a=>{disposeResidence(a.scene);a.scene.traverse(o=>{if(o instanceof T.SkinnedMesh)o.skeleton.dispose();});},()=>{});this.assets.clear();}
}
