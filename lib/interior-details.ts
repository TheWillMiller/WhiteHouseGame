import * as T from 'three';
import {material, lamp} from './visuals';
import {COLONNADE_PEOPLE} from './colonnade-people';
import type {Destination} from './world-data';

function box(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,c:number){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(c));m.position.set(x,y,z);g.add(m);return m;}
const resources:T.Material[]=[];
let gallery:T.MeshStandardMaterial|undefined;
function galleryMaterial(){if(!gallery){gallery=new T.MeshStandardMaterial({color:0xffffff,roughness:.8,alphaTest:.15});resources.push(gallery);if(typeof document.createElementNS==='function'){const base=window.location.pathname.startsWith('/trumpgame')?'/trumpgame/':'/';new T.TextureLoader().load(base+'art/colonnade-portraits.webp',tx=>{if(!gallery){tx.dispose();return;}tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;gallery.map=tx;gallery.needsUpdate=true;});}}return gallery;}
let labels:{canvas:HTMLCanvasElement;material:T.MeshStandardMaterial;used:number}|undefined;
export function textPanel(g:T.Group,text:string,x:number,y:number,z:number,w:number,h:number,rot=0){
 if(!labels||labels.used===64){const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;const material=new T.MeshStandardMaterial({map:tx,roughness:.85});resources.push(material);labels={canvas,material,used:0};}
 const i=labels.used++,cx=(i%8)*256,cy=Math.floor(i/8)*128,ctx=labels.canvas.getContext('2d')!;ctx.fillStyle='#202b2c';ctx.fillRect(cx,cy,256,128);ctx.strokeStyle='#b39759';ctx.lineWidth=3;ctx.strokeRect(cx+3,cy+3,250,122);ctx.fillStyle='#e2cf9d';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='20px Georgia';const lines=text.split('\n');lines.forEach((line,j)=>ctx.fillText(line,cx+128,cy+(lines.length>1?43+j*43:64),235));labels.material.map!.needsUpdate=true;
 const geo=new T.PlaneGeometry(w,h),uv=geo.getAttribute('uv');for(let j=0;j<uv.count;j++)uv.setXY(j,((i%8)+uv.getX(j))/8,1-(Math.floor(i/8)+1-uv.getY(j))/8);const mesh=new T.Mesh(geo,labels.material);mesh.position.set(x,y,z);mesh.rotation.y=rot;g.add(mesh);return mesh;
}
export function fanlight(g:T.Group,x:number,y:number,z:number,r=.9,rotation=0){const group=new T.Group();group.position.set(x,y,z);group.rotation.y=rotation;g.add(group);const shape=new T.Shape();shape.moveTo(-r,0);shape.absarc(0,0,r,Math.PI,0,true);shape.closePath();const glass=new T.Mesh(new T.ShapeGeometry(shape,24),material(0x4d686c));group.add(glass);
 const arc=new T.EllipseCurve(0,0,r,r,0,Math.PI,false,0).getPoints(32).map(p=>new T.Vector3(p.x,p.y,.04));group.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(arc),32,.07,6,false),material(0xf5f0df)));
 box(group,0,0,.04,r*2,.09,.09,0xf5f0df);for(let i=1;i<9;i++){const a=i*Math.PI/9,spoke=box(group,Math.cos(a)*r/2,Math.sin(a)*r/2,.05,.028,r,.03,0xeeeade);spoke.rotation.z=a-Math.PI/2;}return group;
}
export function openDoor(g:T.Group,x:number,z:number,rotation=0){const door=new T.Group();door.name='Open doorway';door.position.set(x,0,z);door.rotation.y=rotation;g.add(door);
 for(const side of [-1,1]){box(door,side*1.56,1.8,0,.14,3.6,.3,0xf5f0df);const leaf=new T.Group();leaf.position.set(side*1.45,0,0);leaf.rotation.y=side*Math.PI/2;door.add(leaf);box(leaf,-side*.68,1.75,0,1.36,3.5,.11,0xf5f0df);for(const y of [.85,2.4]){box(leaf,-side*.68,y,-.068,1.03,1.15,.03,0xd7d3c9);box(leaf,-side*.68,y,.068,1.03,1.15,.03,0xd7d3c9);}box(leaf,-side*1.16,1.55,-.12,.05,.24,.07,0xb99c50);}
 box(door,0,3.62,0,3.3,.17,.32,0xf5f0df);box(door,0,.06,0,3,.04,.5,0xc1baa8);return door;
}
export function colonnadeGallery(g:T.Group){
 // South-facing wall: verified official 2026 gallery photographs, a single atlas.
 const doors=[25,36,48,64,78],slots:number[]=[];for(let x=19;x<83;x+=.2)if(!doors.some(d=>Math.abs(x-d)<2))slots.push(x);
 for(let i=0;i<47;i++){const x=slots[Math.floor((i+.5)*slots.length/47)],p=COLONNADE_PEOPLE[i];const geo=new T.PlaneGeometry(.84,1.08),uv=geo.getAttribute('uv');for(let j=0;j<uv.count;j++)uv.setXY(j,((i%8)+uv.getX(j))/8,1-(Math.floor(i/8)+1-uv.getY(j))/6);const frame=new T.Mesh(geo,galleryMaterial());frame.position.set(x,2.4,-24.75);g.add(frame);textPanel(g,p.name+'\n'+p.years,x,1.57,-24.71,.82,.45);
   const crest=box(g,x,3.14,-24.72,.12,.2,.09,0xd9b458);crest.rotation.z=Math.PI/4;
 }
 for(let x=21;x<83;x+=5.5)if(!doors.some(d=>Math.abs(x-d)<2.7))fanlight(g,x,3.45,-24.72,1.0);
 for(let x=19;x<84;x+=4.5){const col=new T.Mesh(new T.CylinderGeometry(.23,.29,4.2,12),material(0xf5f0df));col.position.set(x,2.1,-17.25);g.add(col);box(g,x,.12,-17.25,.73,.24,.73,0xf5f0df);box(g,x,4.2,-17.25,.72,.22,.72,0xf5f0df);}
 box(g,51,4.42,-17.25,66,.3,.75,0xf5f0df);
 // Garden outlook beyond the open colonnade; portal takes the visitor into the full estate.
 box(g,51,-.1,-8,66,.2,17,0x698644);box(g,51,.025,-15,66,.05,2.2,0xc6bfa8);
 for(const x of doors)openDoor(g,x,-25);
 textPanel(g,'THE PRESIDENTIAL WALK OF FAME',54,4.12,-24.69,10,.38);
}
let landscape:T.MeshStandardMaterial|undefined;
function landscapeMaterial(){if(!landscape){const mat=new T.MeshStandardMaterial({color:0xffffff,roughness:.85});landscape=mat;resources.push(mat);if(typeof document.createElementNS==='function'){const base=window.location.pathname.startsWith('/trumpgame')?'/trumpgame/':'/';new T.TextureLoader().load(base+'art/washington-crossing.webp',tx=>{if(!resources.includes(mat)){tx.dispose();return;}tx.colorSpace=T.SRGBColorSpace;mat.map=tx;mat.needsUpdate=true;});}}return landscape;}
export function hallDetails(g:T.Group,d:Destination){const r=d.room!,rx=r.w/2,rz=r.d/2;
 if(d.id==='colonnade'){colonnadeGallery(g);return;}
 // Shallow objects are mounted against uninterrupted wall segments, outside door passages.
 const northDoors=r.doors?.north??[],southDoors=r.doors?.south??[];
 for(const side of [-1,1]){const doors=side<0?northDoors:southDoors;for(let x=d.x-rx+1.2;x<d.x+rx-1;x+=3.2){if(doors.some(v=>Math.abs(v-x)<2.5))continue;const z=d.z+side*(rz-.25);box(g,x,2.55,z,1.8,1.16,.09,0xc8a75b);const art=new T.Mesh(new T.PlaneGeometry(1.63,1),landscapeMaterial());art.position.set(x,2.55,z-side*.07);if(side>0)art.rotation.y=Math.PI;g.add(art);}}
 if(d.id==='west-lobby'){box(g,-11.85,1.2,-8,.55,2.4,3.0,0x69412d);for(let y=.5;y<2.4;y+=.55)for(let z=-9.2;z<-6.8;z+=.28)box(g,-11.52,y,z,.1,.4,.18,0x647062);const clock=new T.Mesh(new T.CircleGeometry(.48,32),material(0xe2d8b6));clock.rotation.y=Math.PI/2;clock.position.set(-11.48,3.15,-8);g.add(clock);box(g,-11.45,3.3,-8,.03,.3,.025,0x33352f);box(g,-11.44,3.15,-7.83,.025,.03,.34,0x33352f);}
 if(d.id==='cross-hall'){for(const x of [-4.5,4.5]){box(g,x,.8,-2.45,1.8,1.6,.45,0x78563b);lamp(g,x,1.64,-2.45);} }
}
export function clearInteriorDetails(){for(const m of resources){(m as T.MeshStandardMaterial).map?.dispose();m.dispose();}resources.length=0;gallery=undefined;labels=undefined;landscape=undefined;}
