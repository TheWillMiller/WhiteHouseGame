import * as T from 'three';
import {material} from './visuals';
let bushMaterial:T.MeshStandardMaterial|undefined;
const pendingPlants=new Set<T.InstancedMesh>();
export function clearPlanting(){bushMaterial=undefined;pendingPlants.clear();}

/** Reusable cutout bushes, one instanced draw per bed rather than hundreds of petal meshes. */
export function roseBed(g:T.Group,x:number,z:number,w:number,d:number){
 const soil=new T.Mesh(new T.BoxGeometry(w,.09,d),material(0x4a4336));soil.position.set(x,.055,z);soil.receiveShadow=true;g.add(soil);
 let m=bushMaterial;if(!m){m=new T.MeshStandardMaterial({color:0xffffff,roughness:.96,side:T.DoubleSide,alphaTest:.48});bushMaterial=m;
 if(typeof document!=='undefined'&&typeof document.createElementNS==='function'){
  const base=window.location.pathname.startsWith('/trumpgame')?'/trumpgame/':'/';
  const target=m;new T.TextureLoader().load(base+'textures/rose-bush-v1.webp',tx=>{if(bushMaterial!==target){tx.dispose();return;}tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=2;target.map=tx;target.needsUpdate=true;pendingPlants.forEach(o=>o.visible=true);pendingPlants.clear();g.userData.landmarksReady=true;});
 }}
 const nx=Math.max(1,Math.round(w/.92)),nz=Math.max(1,Math.round(d/.92)),plants=new T.InstancedMesh(new T.PlaneGeometry(1,1),m,nx*nz*3),dummy=new T.Object3D();
 plants.name='Layered white and blush rose bushes';plants.userData.dynamic=true;plants.userData.rosePlant=true;plants.visible=!!m.map;plants.castShadow=true;plants.receiveShadow=true;
 if(!m.map)pendingPlants.add(plants);
 for(let i=0;i<nx*nz;i++){
  const px=x-w/2+(i%nx+.5)*w/nx,pz=z-d/2+(Math.floor(i/nx)+.5)*d/nz,h=.66+(Math.sin(i*19+x)*.5+.5)*.25;
  for(let j=0;j<3;j++){dummy.position.set(px,.08+h/2,pz);dummy.rotation.set(0,j*Math.PI/3+i*2.4,0);dummy.scale.set(h*1.18,h,1);dummy.updateMatrix();plants.setMatrixAt(i*3+j,dummy.matrix);plants.setColorAt(i*3+j,new T.Color().setScalar(.84+(i%5)*.035));}
 }plants.computeBoundingSphere();g.add(plants);
}

/** Public NPS description: diamond-pattern pavers with the perimeter planting retained. */
export function roseTerrace(g:T.Group,x:number,z:number,w:number,d:number,y=.105){
 const n=256,data=new Uint8Array(n*n*4);for(let py=0;py<n;py++)for(let px=0;px<n;px++){
  const u=(px+py)%128,v=(px-py+512)%128,joint=u<2||v<2,noise=((Math.imul(px+py*n,1103515245)>>>0)%13)-6;
  for(let c=0;c<3;c++)data[(py*n+px)*4+c]=(joint?181:[231,230,220][c])+noise*.5;data[(py*n+px)*4+3]=255;
 }
 const tx=new T.DataTexture(data,n,n);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(w/3,d/3);tx.generateMipmaps=true;tx.minFilter=T.LinearMipmapLinearFilter;tx.anisotropy=4;tx.needsUpdate=true;
 const geo=new T.PlaneGeometry(w,d);geo.rotateX(-Math.PI/2);const floor=new T.Mesh(geo,new T.MeshStandardMaterial({map:tx,roughness:.66}));floor.name='Rose Garden diamond-paver terrace';floor.position.set(x,y,z);floor.receiveShadow=true;g.add(floor);
 const border=material(0xe0dccb);for(const side of [-1,1]){const a=new T.Mesh(new T.BoxGeometry(w+.36,.08,.18),border);a.position.set(x,y-.02,z+side*(d/2+.09));g.add(a);const b=new T.Mesh(new T.BoxGeometry(.18,.08,d),border);b.position.set(x+side*(w/2+.09),y-.02,z);g.add(b);}return floor;
}
