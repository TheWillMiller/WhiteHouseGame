import {modelAssembly} from './furniture-models';
import * as T from 'three';
import {material, lamp} from './visuals';
import {COLONNADE_PEOPLE} from './colonnade-people';
import type {Destination} from './world-data';
import {insideWest,westDestinations} from './west-layout';
import {wallPanels} from './room-finishes';

function box(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,c:number){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(c));m.position.set(x,y,z);g.add(m);return m;}

/** The exterior GLB is a shell. Close each carved entrance with a shallow foyer. */
export function exteriorVestibules(parent:T.Group){
 for(const [x,z,direction]of [[-89,-20.8,1],[-57,-21.3,-1]]){
  const g=new T.Group();g.name='West Wing entrance vestibule';g.position.set(x,.18,z);if(direction<0)g.rotation.y=Math.PI;parent.add(g);
  const depth=3.8,w=3.6,h=3.22;
  box(g,0,h/2,depth,w,h,.18,0xaba99f);
  for(const side of [-1,1]){box(g,side*(w/2-.09),h/2,depth/2,.18,h,depth+.2,0xd8d5c9);box(g,side*(w/2-.19),.16,depth/2,.05,.25,depth,0xeeeadd);}
  box(g,0,-.02,depth/2,w,.04,depth+.2,0xb8b5a8);box(g,0,h+.03,depth/2,w,.16,depth+.2,0xe7e2d6);
  box(g,0,.008,depth/2,1.55,.014,depth-.24,0x314b51);
  // Closed inner door and side panel create architectural depth behind the portal.
  box(g,.55,1.22,depth-.12,1.18,2.44,.10,0x604b37);
  for(const sx of [-.1,1.2])box(g,sx,1.25,depth-.21,.10,2.58,.12,0xeae5d8);
  box(g,.55,2.53,depth-.21,1.4,.11,.12,0xeae5d8);
  for(const yy of [.6,1.65])box(g,.55,yy,depth-.19,.90,.78,.035,0x715c43);
  box(g,.99,1.12,depth-.26,.07,.12,.04,0xbda671);
  box(g,-.88,1.82,depth-.16,.7,.93,.08,0xb89d62);box(g,-.88,1.82,depth-.21,.59,.82,.04,0x394f54);
  const light=box(g,0,h-.05,depth/2,.52,.035,.52,0xf2e5c5);light.material=new T.MeshStandardMaterial({color:0xf2e5c5,emissive:0xffebbc,emissiveIntensity:.35});
 }
}
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
export function openDoor(g:T.Group,x:number,z:number,rotation=0){const key=`${x},${z},${rotation}`;const existing=g.children.find(o=>o.userData.doorKey===key);if(existing)return existing;const door=new T.Group();door.name='Open doorway';door.userData.doorKey=key;door.position.set(x,0,z);door.rotation.y=rotation;g.add(door);
 for(const side of [-1,1]){box(door,side*1.56,1.8,0,.14,3.6,.3,0xf5f0df);const leaf=new T.Group();leaf.position.set(side*1.45,0,0);leaf.rotation.y=side*Math.PI/2;door.add(leaf);box(leaf,-side*.68,1.75,0,1.36,3.5,.11,0xf5f0df);for(const y of [.85,2.4]){box(leaf,-side*.68,y,-.068,1.03,1.15,.03,0xd7d3c9);box(leaf,-side*.68,y,.068,1.03,1.15,.03,0xd7d3c9);}box(leaf,-side*1.16,1.55,-.12,.05,.24,.07,0xb99c50);}
 box(door,0,3.62,0,3.3,.17,.32,0xf5f0df);box(door,0,.06,0,3,.04,.5,0xc1baa8);return door;
}
export function portraitTile(g:T.Group,i:number,x:number,y:number,z:number,width=.84){const p=COLONNADE_PEOPLE[i],h=width*1.286;const geo=new T.PlaneGeometry(width,h),uv=geo.getAttribute('uv');for(let j=0;j<uv.count;j++)uv.setXY(j,((i%8)+uv.getX(j))/8,1-(Math.floor(i/8)+1-uv.getY(j))/6);const frame=new T.Mesh(geo,galleryMaterial());frame.name='Gallery portrait: '+p.name;frame.position.set(x,y,z);g.add(frame);textPanel(g,p.name+'\n'+p.years,x,y-h*.77,z+.025,width,.43);return frame;}
// One physical gallery on the garden-facing north wall of the West Colonnade.
// East (Residence) to west (West Wing): Washington first, increasing term numbers.
// Dimensions are photo-calibrated estimates; the passage is not a survey drawing.
export const EXTERIOR_GALLERY_OFFSET=[0,0,0] as const;
export const GALLERY_PLACEMENTS=Array.from({length:47},(_,i)=>({index:i,x:i<40?-30.4-i*(24.82/39):-58.78-(i-40)*.58,y:1.75,z:-21.72,width:.55}));
export function exteriorGallery(g:T.Group){
 g.name='Presidential Walk of Fame — West Colonnade';
 g.userData.gallery={count:47,length:34.2,width:2.4,order:'east-to-west',outdoor:true};
 // Replace the low window recesses with one connected exhibition wall. The
 // doorway remains an actual opening; new fanlights sit above the portrait row.
 for(const [left,right]of [[-64.25,-58.4],[-55.6,-29.9]])box(g,(left+right)/2,1.635,-21.795,right-left,2.93,.11,0xf2f0e8);
 for(const p of GALLERY_PLACEMENTS)portraitTile(g,p.index,p.x,p.y,p.z,p.width);
 for(const x of [-61,-53.7,-50.2,-46.7,-43.2,-39.7,-36.2,-32.7])fanlight(g,x,2.25,-21.72,.70);
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#b49343';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='86px Georgia';ctx.fillText('THE PRESIDENTIAL WALK OF FAME',1024,64,2000);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const material=new T.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.1,roughness:.55});resources.push(material);
 const title=new T.Mesh(new T.PlaneGeometry(4.8,.24),material);title.position.set(-44,3.00,-21.69);g.add(title);
}

let historicalPhotos:T.MeshStandardMaterial|undefined;
function historyMaterial(){if(!historicalPhotos){const m=new T.MeshStandardMaterial({color:0xffffff,roughness:.88});historicalPhotos=m;resources.push(m);if(typeof document.createElementNS==='function'){const base=window.location.pathname.startsWith('/trumpgame')?'/trumpgame/':'/';new T.TextureLoader().load(base+'art/west-wing-history.webp',tx=>{if(!resources.includes(m)){tx.dispose();return;}tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;m.map=tx;m.needsUpdate=true;});}}return historicalPhotos;}
function historicalPicture(g:T.Group,i:number){box(g,0,2.55,0,1.4,1.05,.07,0x69412d);box(g,0,2.55,.043,1.29,.94,.025,0xf5f0df);const geo=new T.PlaneGeometry(1.14,.713),uv=geo.getAttribute('uv');for(let j=0;j<uv.count;j++)uv.setXY(j,((i%2)+uv.getX(j))/2,1-(Math.floor(i/2)+1-uv.getY(j))/2);const picture=new T.Mesh(geo,historyMaterial());picture.position.set(0,2.55,.061);picture.name='Historical White House photograph';g.add(picture);}
/** Finish only exposed circulation faces; never decorate through an adjoining room. */
export function corridorFace(g:T.Group,x:number,z:number,length:number,vertical:boolean,inward:number){
 const exposed=(along:number)=>{const px=x+(vertical?-inward*.5:along),pz=z+(vertical?along:-inward*.5);return insideWest(px,pz)&&!westDestinations.some(d=>{const r=d.room!;return r.style==='oval'?((px-d.x)/(r.w/2))**2+((pz-d.z)/(r.d/2))**2<1:Math.abs(px-d.x)<r.w/2&&Math.abs(pz-d.z)<r.d/2;});};
 const count=Math.ceil(length/.2),step=length/count;let start:number|null=null;
 const finish=(end:number)=>{if(start===null)return;const len=end-start,a=(end+start)/2,px=x+(vertical?0:a),pz=z+(vertical?a:0);wallPanels(g,px,pz,len,vertical,-inward,0xe8e3d8);if(len>2.3){const n=Math.floor(len/2.6);for(let i=0;i<n;i++){const offset=(i-(n-1)/2)*2.6,part=new T.Group();part.position.set(px+(vertical?-inward*.22:offset),0,pz+(vertical?offset:-inward*.22));part.rotation.y=vertical?-inward*Math.PI/2:inward>0?Math.PI:0;historicalPicture(part,(Math.abs(Math.round(px+pz))+i)%4);g.add(part);}}start=null;};
 for(let i=0;i<count;i++){const a=-length/2+i*step;if(exposed(a+step/2)){if(start===null)start=a;}else finish(a);}finish(length/2);
}
export function corridorRoomSigns(g:T.Group,d:Destination){const r=d.room!;for(const side of ['north','south','west','east'] as const){const vertical=side==='west'||side==='east',outward=side==='north'||side==='west'?-1:1,edge=vertical?d.x+outward*r.w/2:d.z+outward*r.d/2;for(const door of r.doors?.[side]??[]){for(const delta of [-2.3,2.3]){const along=door+delta,center=vertical?d.z:d.x,len=vertical?r.d:r.w;if(Math.abs(along-center)>len/2-.7||(r.doors?.[side]??[]).some(v=>Math.abs(along-v)<2.2))continue;const x=vertical?edge+outward*.4:along,z=vertical?along:edge+outward*.4;if(!insideWest(x,z)||westDestinations.some(other=>other.id!==d.id&&Math.abs(x-other.x)<other.room!.w/2&&Math.abs(z-other.z)<other.room!.d/2))continue;textPanel(g,d.short??d.name,x,1.67,z,1.22,.29,vertical?outward*Math.PI/2:outward<0?Math.PI:0);break;}}}}

let landscape:T.MeshStandardMaterial|undefined;
function landscapeMaterial(){if(!landscape){const mat=new T.MeshStandardMaterial({color:0xffffff,roughness:.85});landscape=mat;resources.push(mat);if(typeof document.createElementNS==='function'){const base=window.location.pathname.startsWith('/trumpgame')?'/trumpgame/':'/';new T.TextureLoader().load(base+'art/washington-crossing.webp',tx=>{if(!resources.includes(mat)){tx.dispose();return;}tx.colorSpace=T.SRGBColorSpace;mat.map=tx;mat.needsUpdate=true;});}}return landscape;}
export function hallDetails(g:T.Group,d:Destination){const r=d.room!,rx=r.w/2,rz=r.d/2;
 // Historical photographs in office corridors; a larger landscape in the lobby.
 const northDoors=r.doors?.north??[],southDoors=r.doors?.south??[];
 for(const side of [-1,1]){const doors=side<0?northDoors:southDoors;for(let x=d.x-rx+1.2;x<d.x+rx-1;x+=3.2){if(doors.some(v=>Math.abs(v-x)<2.5))continue;const z=d.z+side*(rz-.27);const mount=new T.Group();mount.position.set(x,0,z);mount.rotation.y=side>0?Math.PI:0;g.add(mount);if(d.id==='west-lobby'){box(mount,0,2.55,0,1.8,1.16,.09,0xc8a75b);const art=new T.Mesh(new T.PlaneGeometry(1.63,1),landscapeMaterial());art.position.set(0,2.55,.06);mount.add(art);}else historicalPicture(mount,Math.abs(Math.round(x))%4);}}
 if(d.id==='west-lobby'){modelAssembly(g,-11.85,-8,{asset:'bookcase',width:3,height:2.4,depth:.55,yaw:-Math.PI/2},()=>{box(g,-11.85,1.2,-8,.55,2.4,3.0,0x69412d);for(let y=.5;y<2.4;y+=.55)for(let z=-9.2;z<-6.8;z+=.28)box(g,-11.52,y,z,.1,.4,.18,0x647062);});const clock=new T.Mesh(new T.CircleGeometry(.48,32),material(0xe2d8b6));clock.rotation.y=Math.PI/2;clock.position.set(-11.48,3.15,-8);g.add(clock);box(g,-11.45,3.3,-8,.03,.3,.025,0x33352f);box(g,-11.44,3.15,-7.83,.025,.03,.34,0x33352f);}
 if(d.id==='cross-hall'){for(const x of [-4.5,4.5]){modelAssembly(g,x,-2.45,{asset:'ClassicConsole_01',width:1.4,height:.84,depth:.4,yaw:Math.PI},()=>{box(g,x,.53,-2.45,1.4,.84,.40,0x78563b);});lamp(g,x,.95,-2.45);} }
}
export function clearInteriorDetails(){for(const m of resources){(m as T.MeshStandardMaterial).map?.dispose();m.dispose();}resources.length=0;gallery=undefined;labels=undefined;landscape=undefined;historicalPhotos=undefined;}
