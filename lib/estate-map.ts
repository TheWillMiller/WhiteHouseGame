import * as T from 'three';
export const ESTATE_MAP={x:-132,z:-138,width:264,depth:370};
/** Render the actual estate once. The HUD reuses the bitmap; never a second live renderer. */
export function renderEstateMap(renderer:T.WebGLRenderer,scene:T.Scene,hidden:T.Object3D[]):string{
 const width=640,height=Math.round(width*ESTATE_MAP.depth/ESTATE_MAP.width),target=new T.WebGLRenderTarget(width,height,{depthBuffer:true});target.texture.colorSpace=T.SRGBColorSpace;
 const camera=new T.OrthographicCamera(-ESTATE_MAP.width/2,ESTATE_MAP.width/2,ESTATE_MAP.depth/2,-ESTATE_MAP.depth/2,1,500);camera.position.set(0,280,ESTATE_MAP.z+ESTATE_MAP.depth/2);camera.up.set(0,0,-1);camera.lookAt(0,0,ESTATE_MAP.z+ESTATE_MAP.depth/2);camera.updateMatrixWorld();
 const previous=renderer.getRenderTarget(),fog=scene.fog,shadows=renderer.shadowMap.enabled,visibility=hidden.map(o=>o.visible),viewport=renderer.getViewport(new T.Vector4()),scissor=renderer.getScissor(new T.Vector4()),scissorTest=renderer.getScissorTest();
 const scenery:{object:T.Object3D;visible:boolean;count?:number}[]=[];
 // A map must include the whole estate, even when distant trees are culled in play.
 scene.traverse(o=>{if(!o.userData.distanceCull)return;scenery.push({object:o,visible:o.visible});o.visible=true;for(const c of o.children){if(!c.userData.leafDetail&&!c.userData.foliageCore)continue;scenery.push({object:c,visible:c.visible,count:c instanceof T.InstancedMesh?c.count:undefined});c.visible=c.userData.leafDetail?!!o.parent?.userData.foliageReady:!o.parent?.userData.foliageReady;if(c instanceof T.InstancedMesh&&c.userData.leafDetail)c.count=64;}});
 // Render-target viewports are already physical pixels. setViewport() applies
 // the screen pixel ratio again, cropping the north/east sides on HiDPI screens.
 target.viewport.set(0,0,width,height);
 try{hidden.forEach(o=>o.visible=false);scene.fog=null;renderer.shadowMap.enabled=false;renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.render(scene,camera);
 const pixels=new Uint8Array(width*height*4);renderer.readRenderTargetPixels(target,0,0,width,height,pixels);const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d')!;const data=ctx.createImageData(width,height);for(let y=0;y<height;y++)data.data.set(pixels.subarray((height-y-1)*width*4,(height-y)*width*4),y*width*4);ctx.putImageData(data,0,0);return canvas.toDataURL('image/webp',.86);
 }finally{hidden.forEach((o,i)=>o.visible=visibility[i]);for(const s of scenery){s.object.visible=s.visible;if(s.count!==undefined&&(s.object instanceof T.InstancedMesh))s.object.count=s.count;}scene.fog=fog;renderer.shadowMap.enabled=shadows;renderer.setRenderTarget(previous);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);target.dispose();}
}
