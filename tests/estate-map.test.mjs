import assert from 'node:assert/strict';
import * as T from 'three';
import {renderEstateMap,ESTATE_MAP} from '../.qa/estate-map.mjs';
globalThis.document={createElement:()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}}),toDataURL:()=> 'data:image/webp;base64,test'})};
for(const ratio of [1,1.5,2,3]){
 let target=null,viewport=new T.Vector4(0,0,900,600),scissor=viewport.clone(),scissorTest=true,captured=false;
 const r={shadowMap:{enabled:true},getRenderTarget:()=>target,getViewport:v=>v.copy(viewport),getScissor:v=>v.copy(scissor),getScissorTest:()=>scissorTest,
 setRenderTarget:t=>{target=t;if(t)viewport.copy(t.viewport);},setViewport:(...args)=>{viewport.copy(args[0] instanceof T.Vector4?args[0]:new T.Vector4(...args)).multiplyScalar(ratio);},setScissor:v=>scissor.copy(v),setScissorTest:v=>scissorTest=v,
 render:(scene,camera)=>{assert.equal(viewport.z,target.width,'render-target viewport must not be multiplied by device pixel ratio '+ratio);assert.equal(viewport.w,target.height);const p=new T.Vector3(ESTATE_MAP.x,0,ESTATE_MAP.z).project(camera);assert(Math.abs(p.x+1)<1e-6&&Math.abs(p.y-1)<1e-6,'northwest corner maps to northwest pixel');assert(!scene.fog);captured=true;},readRenderTargetPixels(){}};
 const scene=new T.Scene();scene.fog=new T.Fog(0,1,100);const fog=scene.fog,hidden=new T.Group();scene.add(hidden);
 assert(renderEstateMap(r,scene,[hidden]).startsWith('data:image/webp'));assert(captured);assert.equal(scene.fog,fog);assert(hidden.visible);assert(r.shadowMap.enabled);assert(scissorTest);assert.equal(target,null);
}
console.log('PASS: complete estate bounds at DPR 1, 1.5, 2 and 3; capture restores scene and renderer state.');
