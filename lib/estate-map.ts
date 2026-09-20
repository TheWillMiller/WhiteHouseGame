import * as T from 'three';
export const ESTATE_MAP={x:-108,z:-103,width:216,depth:242};
/** Render the actual estate once. The HUD reuses the bitmap; never a second live renderer. */
export function renderEstateMap(renderer:T.WebGLRenderer,scene:T.Scene,hidden:T.Object3D[]):string{
 const width=640,height=Math.round(width*242/216),target=new T.WebGLRenderTarget(width,height,{depthBuffer:true});target.texture.colorSpace=T.SRGBColorSpace;
 const camera=new T.OrthographicCamera(-108,108,121,-121,1,500);camera.position.set(0,280,18);camera.up.set(0,0,-1);camera.lookAt(0,0,18);camera.updateMatrixWorld();
 const previous=renderer.getRenderTarget(),fog=scene.fog,shadows=renderer.shadowMap.enabled,visibility=hidden.map(o=>o.visible),viewport=renderer.getViewport(new T.Vector4()),scissor=renderer.getScissor(new T.Vector4()),scissorTest=renderer.getScissorTest();
 try{hidden.forEach(o=>o.visible=false);scene.fog=null;renderer.shadowMap.enabled=false;renderer.setRenderTarget(target);renderer.setViewport(0,0,width,height);renderer.setScissorTest(false);renderer.render(scene,camera);
 const pixels=new Uint8Array(width*height*4);renderer.readRenderTargetPixels(target,0,0,width,height,pixels);const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d')!;const data=ctx.createImageData(width,height);for(let y=0;y<height;y++)data.data.set(pixels.subarray((height-y-1)*width*4,(height-y)*width*4),y*width*4);ctx.putImageData(data,0,0);return canvas.toDataURL('image/webp',.86);
 }finally{hidden.forEach((o,i)=>o.visible=visibility[i]);scene.fog=fog;renderer.shadowMap.enabled=shadows;renderer.setRenderTarget(previous);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);target.dispose();}
}
