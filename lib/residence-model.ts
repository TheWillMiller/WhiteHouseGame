import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

export const RESIDENCE_MODEL_FILE='models/white-house-residence-v2.glb';
export function residenceModelUrl(pathname:string){return(pathname==='/trumpgame'||pathname.startsWith('/trumpgame/')?'/trumpgame/':'/')+RESIDENCE_MODEL_FILE;}

export function disposeResidence(object:T.Object3D){
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
 object.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);for(const material of Array.isArray(o.material)?o.material:[o.material]){materials.add(material);for(const value of Object.values(material))if(value instanceof T.Texture)textures.add(value);}}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}

export async function loadResidenceModel(pathname:string){
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(residenceModelUrl(pathname));
 gltf.scene.name='Sketchfab White House residence';
 gltf.scene.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;for(const material of Array.isArray(o.material)?o.material:[o.material])if(material instanceof T.MeshStandardMaterial){material.side=T.FrontSide;material.normalScale.set(.55,.55);for(const texture of [material.map,material.normalMap,material.roughnessMap,material.metalnessMap])if(texture)texture.anisotropy=4;}}});
 return gltf.scene;
}
