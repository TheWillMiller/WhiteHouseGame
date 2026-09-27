import {stateRoomVoid} from './state-rooms';
import {insideEstate} from './grounds-layout';
import * as T from 'three';
import {residenceHeight} from './residence-terrain';
import {insideWest} from './west-layout';
import type {Place} from './world-data';

export function teleportLanding(zone:Place,x:number,z:number,solids:{x:number;z:number;w:number;d:number}[],people:{x:number;z:number}[],occupied?:(x:number,z:number)=>boolean){
 if(zone==='state'&&stateRoomVoid(x,z))return null;
 if(!Number.isFinite(x)||!Number.isFinite(z))return null;
 if(zone==='grounds'?(!insideEstate(x,z)):zone==='west'?!insideWest(x,z):(Math.abs(x)>28.7||Math.abs(z)>18.7))return null;
 const radius=.3;
 if(solids.some(o=>Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius)||people.some(p=>Math.hypot(x-p.x,z-p.z)<.9)||occupied?.(x,z))return null;
 return new T.Vector3(x,zone==='grounds'?residenceHeight(x,z):0,z);
}

export function teleportRayTarget(camera:T.Camera,ndc:T.Vector2,group:T.Group){
 const meshes:T.Mesh[]=[];group.updateMatrixWorld(true);camera.updateMatrixWorld();group.traverse(o=>{if(!(o instanceof T.Mesh)||o instanceof T.SkinnedMesh)return;for(let p:T.Object3D|null=o;p;p=p.parent)if(!p.visible)return;meshes.push(o);});
 const ray=new T.Raycaster();ray.setFromCamera(ndc,camera);ray.far=180;const hit=ray.intersectObjects(meshes,false)[0];if(!hit?.face)return null;
 const normal=hit.face.normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(hit.object.matrixWorld));return normal.y>.7?hit.point:null;
}
