import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const TRUMP_MODEL_FILE = 'models/trump-meshy-v1.glb';
export function playerModelUrl(pathname: string) {
  return (pathname === '/trumpgame' || pathname.startsWith('/trumpgame/') ? '/trumpgame/' : '/') + TRUMP_MODEL_FILE;
}

export type PlayerModel = {
  object: T.Group;
  animate: (distance: number, dt: number, airborne: boolean) => void;
  dispose: () => void;
};

// The supplied Meshy export is a single unrigged A-pose mesh. These joints and
// soft weights are fitted to this specific model, not a generic auto-rigger.
export function fitPlayerMesh(source: T.Mesh): PlayerModel {
  const geo = source.geometry.clone();
  source.updateWorldMatrix(true, false);
  geo.applyMatrix4(source.matrixWorld);
  geo.computeBoundingBox();
  const bounds = geo.boundingBox!;
  const height = bounds.max.y - bounds.min.y;
  if (!Number.isFinite(height) || height <= 0) throw new Error('Invalid player model bounds');
  const center = bounds.getCenter(new T.Vector3());
  geo.translate(-center.x, -bounds.min.y, -center.z);
  geo.scale(3 / height, 3 / height, 3 / height);
  geo.rotateY(Math.PI); // Meshy faces +Z; the game faces -Z.
  geo.computeBoundingBox();
  geo.computeBoundingSphere();

  const root = new T.Bone(); root.name = 'PlayerRoot';
  const bones: T.Bone[] = [root];
  const add = (name: string, position: number[], parent = root) => {
    const bone = new T.Bone(); bone.name = name;
    bone.position.set(position[0], position[1], position[2]);
    parent.add(bone); bones.push(bone); return bone;
  };
  const hips: T.Bone[] = [], knees: T.Bone[] = [], shoulders: T.Bone[] = [], elbows: T.Bone[] = [];
  const indices: {hip:number;knee:number;shoulder:number;elbow:number}[] = [];
  for (const side of [-1, 1]) {
    const hip = add(`Hip${side}`, [side * .235, 1.24, 0]); const hi = bones.length-1;
    const knee = add(`Knee${side}`, [side * .055, -.59, 0], hip); const ki = bones.length-1;
    const shoulder = add(`Shoulder${side}`, [side * .43, 2.40, 0]); const si = bones.length-1;
    const elbow = add(`Elbow${side}`, [side * .18, -.53, 0], shoulder); const ei = bones.length-1;
    hips.push(hip); knees.push(knee); shoulders.push(shoulder); elbows.push(elbow);
    indices.push({hip:hi,knee:ki,shoulder:si,elbow:ei});
  }
  const position=geo.getAttribute('position');
  const skinIndices=new Uint16Array(position.count*4), weights=new Float32Array(position.count*4);
  const smooth = T.MathUtils.smoothstep;
  for(let i=0;i<position.count;i++) {
    const x=position.getX(i), y=position.getY(i), side=indices[x<0?0:1];
    const armBoundary=.47+(2-y)*.17;
    const arm=smooth(Math.abs(x),armBoundary-.035,armBoundary+.04)*(1-smooth(y,2.40,2.59));
    const leg=(1-arm)*(1-smooth(y,1.11,1.29));
    const o=i*4;
    if(arm>.001) {
      const lower=1-smooth(y,1.75,1.99);
      skinIndices.set([0,side.shoulder,side.elbow,0],o);
      weights.set([1-arm,arm*(1-lower),arm*lower,0],o);
    } else if(leg>.001) {
      const lower=1-smooth(y,.53,.78);
      skinIndices.set([0,side.hip,side.knee,0],o);
      weights.set([1-leg,leg*(1-lower),leg*lower,0],o);
    } else { weights[o]=1; }
  }
  geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndices,4));
  geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
  const original=Array.isArray(source.material)?source.material:[source.material];
  const mats=original.map(m=>{
    const copy=m.clone();
    if(copy instanceof T.MeshStandardMaterial){copy.roughness=Math.max(copy.roughness,.7);copy.normalScale.setScalar(.6);}
    return copy;
  });
  const skin=new T.SkinnedMesh(geo,Array.isArray(source.material)?mats:mats[0]);
  skin.name='Meshy Donald Trump'; skin.castShadow=true;skin.receiveShadow=true;skin.frustumCulled=false;
  skin.add(root);skin.bind(new T.Skeleton(bones));skin.normalizeSkinWeights();
  const object=new T.Group();object.name='Meshy player';object.add(skin);
  let phase=0,walk=0;
  const animate=(distance:number,dt:number,airborne:boolean)=>{
    const moving=distance>.0001;
    walk=T.MathUtils.damp(walk,moving?1:0,12,dt);
    phase+=distance*5.3;
    const stride=airborne?0:walk*.37;
    for(let i=0;i<2;i++){
      const side=i===0?-1:1,swing=Math.sin(phase+i*Math.PI);
      hips[i].rotation.x=swing*stride-(airborne?.18:0);
      knees[i].rotation.x=Math.max(0,-swing)*stride*.9+(airborne?.25:0);
      shoulders[i].rotation.set(-swing*stride*.7,0,-side*.22);
      elbows[i].rotation.x=-.10-Math.max(0,swing)*stride*.3;
    }
    object.position.y=airborne?0:Math.abs(Math.sin(phase))*walk*.022;
  };
  return {object,animate,dispose(){skin.skeleton.dispose();geo.dispose();mats.forEach(m=>m.dispose());}};
}

export async function loadPlayerModel(url: string): Promise<PlayerModel> {
  const gltf=await new GLTFLoader().loadAsync(url);
  let source:T.Mesh|undefined;
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o=>{if(o instanceof T.Mesh&&!source)source=o;});
  if(!source)throw new Error('The character file contains no mesh');
  const model=fitPlayerMesh(source);
  // Geometry is copied for skinning, but textures remain shared with the import.
  const textures=new Set<T.Texture>();
  gltf.scene.traverse(o=>{
    if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){
      for(const value of Object.values(m))if(value instanceof T.Texture)textures.add(value);
      m.dispose();
    }}
  });
  const dispose=model.dispose;
  model.dispose=()=>{dispose();textures.forEach(t=>{t.dispose();const bitmap=t.image as {close?:()=>void}|undefined;bitmap?.close?.();});};
  model.animate(0,0,false);
  return model;
}
