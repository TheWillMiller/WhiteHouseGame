import * as T from 'three';
import {material} from './visuals';
let bushMaterial:T.MeshStandardMaterial|undefined;
const pendingPlants=new Set<T.InstancedMesh>();
export function clearPlanting(){bushMaterial=undefined;pendingPlants.clear();}

/** Small five-petal annuals and foliage rooted in a continuous mulched bed. */
export function annualFlowerRing(parent:T.Group,inner:number,outer:number){
 const bed=new T.Mesh(new T.RingGeometry(inner,outer,128),material(0x453d30));bed.rotation.x=-Math.PI/2;bed.position.y=.025;bed.receiveShadow=true;parent.add(bed);
 const vertices:number[]=[];
 for(let k=0;k<5;k++){const angle=k*Math.PI*2/5;for(let j=0;j<5;j++){const a=j*Math.PI*2/5,b=(j+1)*Math.PI*2/5;for(const [u,v]of [[0,0],[Math.cos(a),Math.sin(a)],[Math.cos(b),Math.sin(b)]]){const along=.033+u*.036,across=v*.027;vertices.push(Math.cos(angle)*along-Math.sin(angle)*across,Math.abs(u)*.008,Math.sin(angle)*along+Math.cos(angle)*across);}}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();
 const count=Math.round((inner+outer)*Math.PI*9),petal=material(0xffffff).clone();petal.side=T.DoubleSide;
 const flowers=new T.InstancedMesh(geo,petal,count),leaves=new T.InstancedMesh(new T.CircleGeometry(1,6),new T.MeshStandardMaterial({color:0xffffff,roughness:1,side:T.DoubleSide}),count*3),dummy=new T.Object3D();
 flowers.name='Small five-petal annual flowers';leaves.name='Annual bed foliage';flowers.userData.dynamic=leaves.userData.dynamic=true;flowers.userData.flowerBed=true;leaves.userData.flowerBed=true;
 for(let i=0;i<count;i++){const angle=i*2.399963,r=inner+.07+((i*37)%101)/101*(outer-inner-.14),x=Math.cos(angle)*r,z=Math.sin(angle)*r,h=.14+(i%7)*.017;
  dummy.position.set(x,h,z);dummy.rotation.set(Math.sin(i)*.25,angle,Math.cos(i)*.25);dummy.scale.setScalar(.70+(i%5)*.10);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);flowers.setColorAt(i,new T.Color([0xb83e51,0xa62b42,0xcd5860,0xd7757c][i%4]));
  for(let j=0;j<3;j++){const a=angle+j*2.094;dummy.position.set(x+Math.cos(a)*.055,h*.48,z+Math.sin(a)*.055);dummy.rotation.set(-Math.PI/2+.22,a,.1);dummy.scale.set(.072,.035,1);dummy.updateMatrix();leaves.setMatrixAt(i*3+j,dummy.matrix);leaves.setColorAt(i*3+j,new T.Color([0x375239,0x426445,0x527448][(i+j)%3]));}
 }
 flowers.computeBoundingSphere();leaves.computeBoundingSphere();flowers.receiveShadow=leaves.receiveShadow=true;parent.add(leaves,flowers);
}

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
