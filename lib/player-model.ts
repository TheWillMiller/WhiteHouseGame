import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export const TRUMP_MODEL_FILE='models/trump-animated-v2.glb';
export function playerModelUrl(pathname:string){return(pathname==='/trumpgame'||pathname.startsWith('/trumpgame/')?'/trumpgame/':'/')+TRUMP_MODEL_FILE;}
export type Emote='dance'|'ymca'|'victory'|'backflip';
export type Locomotion='walk'|'stroll'|'run'|'sprint';
export type PlayerModel={object:T.Group;animate:(distance:number,dt:number,airborne:boolean,mode?:Locomotion)=>void;emote:(name:Emote|null)=>void;dispose:()=>void};

export function createAnimatedPlayer(scene:T.Group,clips:T.AnimationClip[]):PlayerModel{
  const object=new T.Group();object.name='Animated Meshy Trump';object.add(scene);
  const meshes:T.SkinnedMesh[]=[];
  scene.traverse(o=>{if(o instanceof T.SkinnedMesh){meshes.push(o);o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
  if(!meshes.length)throw Error('Trump export has no skinned mesh');
  // Keep the supplied skeleton and inverse bind matrices intact.
  const bounds=new T.Box3();for(const mesh of meshes){mesh.geometry.computeBoundingBox();bounds.union(mesh.geometry.boundingBox!);}
  const scale=3/(bounds.max.y-bounds.min.y);if(!Number.isFinite(scale)||scale<=0)throw Error('Invalid character bounds');
  scene.scale.setScalar(scale);scene.position.y=-bounds.min.y*scale;object.rotation.y=Math.PI;
  const mixer=new T.AnimationMixer(scene),actions=new Map<string,T.AnimationAction>();
  const victory=clips.find(c=>c.name==='victory');if(!victory)throw Error('Missing standing pose');
  // No idle clip was supplied: hold the relaxed opening pose of the victory clip.
  const idle=new T.AnimationClip('idle',2,victory.tracks.map(track=>{
    const t=track.clone(),n=t.getValueSize();t.times=new Float32Array([0,2]);t.values=new Float32Array([...track.values.slice(0,n),...track.values.slice(0,n)]);return t;
  }));
  for(const clip of [...clips,idle]){const a=mixer.clipAction(clip);if(clip.name==='victory'||clip.name==='backflip'){a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true;}a.setEffectiveWeight(0).play();actions.set(clip.name,a);}
  for(const key of ['walk','stroll','run','sprint','dance','ymca','victory','backflip'])if(!actions.has(key))throw Error('Missing animation '+key);
  let current='idle',gesture:Emote|null=null,gestureTime=0;
  actions.get('idle')!.setEffectiveWeight(1);mixer.update(0);
  function select(name:string){if(current===name)return;const next=actions.get(name)!,weight=next.getEffectiveWeight();next.reset().play();next.setEffectiveWeight(weight);current=name;}
  const emote=(name:Emote|null)=>{gesture=name;gestureTime=0;if(name){select(name);actions.get(name)!.reset().play();}};
  const animate=(distance:number,dt:number,airborne:boolean,mode:Locomotion='walk')=>{
    const moving=distance>.0001;
    if(moving||airborne)gesture=null;
    if(gesture){gestureTime+=dt;const duration=actions.get(gesture)!.getClip().duration;if((gesture==='victory'||gesture==='backflip')&&gestureTime>=duration)gesture=null;}
    // Normal jumping uses a bent-leg running pose while game physics owns height.
    const desired=airborne?'run':gesture??(moving?mode:'idle');select(desired);
    for(const [name,action] of actions){action.setEffectiveWeight(T.MathUtils.damp(action.getEffectiveWeight(),name===desired?1:0,14,dt));action.setEffectiveTimeScale(1);}
    const selected=actions.get(desired)!;
    if(airborne){selected.time=selected.getClip().duration*.20;selected.setEffectiveTimeScale(0);}
    if(moving&&!airborne){const nominal={walk:3.2,stroll:1.6,run:6.5,sprint:9}[mode];selected.setEffectiveTimeScale(T.MathUtils.clamp(distance/Math.max(dt,.001)/nominal,.35,1.5));}
    mixer.update(dt);
  };
  return {object,animate,emote,dispose(){
    mixer.stopAllAction();mixer.uncacheRoot(scene);
    const geos=new Set<T.BufferGeometry>(),mats=new Set<T.Material>(),textures=new Set<T.Texture>(),skeletons=new Set<T.Skeleton>();
    scene.traverse(o=>{if(o instanceof T.Mesh){geos.add(o.geometry);if(o instanceof T.SkinnedMesh)skeletons.add(o.skeleton);for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);for(const value of Object.values(m))if(value instanceof T.Texture)textures.add(value);}}});
    geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());skeletons.forEach(s=>s.dispose());textures.forEach(t=>{t.dispose();(t.image as {close?:()=>void}|undefined)?.close?.();});
  }};
}
export async function loadPlayerModel(url:string){const gltf=await new GLTFLoader().loadAsync(url);return createAnimatedPlayer(gltf.scene,gltf.animations);}
