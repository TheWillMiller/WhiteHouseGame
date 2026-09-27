import {BLUE_ROOM} from './residence-layout';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { material } from './visuals';
import type { Destination } from './world-data';

type Solid={x:number;z:number;w:number;d:number;height?:number};
type World={group:T.Group;solids:Solid[];cameraOnly?:{x:number;z:number;w:number;d:number;height:number;y:number}[];spots:{id:string;label:string;kind:'seat'|'npc'|'door'|'lectern'|'equipment'|'vehicle';x:number;z:number;pose?:[number,number,number];hipHeight?:number}[]};
const WHITE=0xf5f0df,GOLD=0xd9b458,WOOD=0x69412d,CREAM=0xe0cf9e;
export const STATE_ROOM_IDS=['east-room','green','blue','red','dining'];
export const isStateRoom=(d:Destination)=>d.zone==='state'&&STATE_ROOM_IDS.includes(d.id);
// The space outside the curved shell is not a hidden room or a teleport destination.
export function stateRoomVoid(x:number,z:number){const rx=BLUE_ROOM.w/2,rz=BLUE_ROOM.d/2,north=BLUE_ROOM.z-rz;return Math.abs(x)<rx&&z>north&&(x/rx)**2+((z-BLUE_ROOM.z)/rz)**2>1&&!(Math.abs(x)>rx-1.2&&Math.abs(z-BLUE_ROOM.sideDoorZ)<1.35)&&!(Math.abs(x)<1.35&&z<north+.65);}
const mesh=(g:T.Group,geo:T.BufferGeometry,color:number,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
const box=(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>mesh(g,new T.BoxGeometry(w,h,d),c,x,y,z);
const cyl=(g:T.Group,x:number,y:number,z:number,r:number,h:number,c:number,top=r)=>mesh(g,new T.CylinderGeometry(top,r,h,16),c,x,y,z);
const soft=(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>mesh(g,new RoundedBoxGeometry(w,h,d,1,.045),c,x,y,z);
function anchor(g:T.Group,x:number,z:number,yaw=0){const a=new T.Group();a.position.set(x,0,z);a.rotation.y=yaw;g.add(a);return a;}
function footprint(w:World,x:number,z:number,width:number,depth:number,yaw=0,height=1.6){w.solids.push({x,z,w:Math.abs(Math.cos(yaw))*width+Math.abs(Math.sin(yaw))*depth,d:Math.abs(Math.sin(yaw))*width+Math.abs(Math.cos(yaw))*depth,height});}
function mark(g:T.Group,kind:string,x:number,z:number){const a=new T.Group();a.name=kind;a.position.set(x,0,z);g.add(a);}

/** Furniture faces local -Z, matching the character's seated heading. */
function settee(w:World,x:number,z:number,yaw:number,color:number,width=2.5,gilt=false){
 const g=anchor(w.group,x,z,yaw),frame=gilt?GOLD:WOOD;
 box(g,0,.42,0,width,.13,.85,frame);soft(g,0,.60,0,width-.10,.24,.82,color);
 soft(g,0,1.08,.38,width-.08,.86,.16,color);box(g,0,1.53,.39,width+.04,.065,.19,frame);
 for(const s of [-1,1]){box(g,s*(width/2-.03),.89,0,.09,.09,.82,frame);cyl(g,s*(width/2-.06),.7,-.30,.042,.40,frame);for(const end of [-.3,.3])cyl(g,s*(width/2-.16),.25,end,.045,.45,frame,.055);}
 for(let i=0;i<Math.floor(width/.55);i++){const px=-width/2+.28+i*.55;box(g,px,1.05,.28,.028,.72,.025,gilt?GOLD:CREAM);}
 footprint(w,x,z,width+.1,.94,yaw,1.58);mark(w.group,'State room settee',x,z);
}
function chair(w:World,x:number,z:number,yaw:number,color:number,gilt=false){settee(w,x,z,yaw,color,.72,gilt);}
function table(w:World,x:number,z:number,r=.65){const g=w.group;cyl(g,x,1.02,z,r,.11,WOOD);cyl(g,x,.57,z,.13,.88,WOOD,.19);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const foot=box(g,x+Math.cos(a)*.22,.18,z+Math.sin(a)*.22,.58,.12,.12,WOOD);foot.rotation.y=-a;}footprint(w,x,z,r*2,r*2,0,1.08);}
function bouquet(g:T.Group,x:number,y:number,z:number){cyl(g,x,y+.15,z,.16,.30,WHITE,.22);for(let i=0;i<9;i++){const a=i*2.4,r=.12+Math.sin(i)*.08,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;const stem=cyl(g,px,y+.4,pz,.012,.35,0x46623c);stem.rotation.z=Math.sin(a)*.3;for(let p=0;p<5;p++){const flower=mesh(g,new T.SphereGeometry(.075,6,4),i%3?0xf2e6d0:0x9eafc7,px+Math.cos(p*1.256)*.055,y+.57,pz+Math.sin(p*1.256)*.055);flower.scale.y=.35;}}}
function rug(g:T.Group,x:number,z:number,w:number,d:number,color:number,oval=false){
 for(const [inset,y,c]of [[0,.079,0xbea377],[.12,.084,CREAM],[.23,.089,color]] as const){if(oval){const m=cyl(g,x,y,z,w/2-inset,.012,c);m.geometry.dispose();m.geometry=new T.CylinderGeometry(w/2-inset,w/2-inset,.012,96);m.scale.z=(d/2-inset)/(w/2-inset);}else box(g,x,y,z,w-inset*2,.012,d-inset*2,c);}
 // Small woven rosettes, kept flat rather than raised ornaments underfoot.
 for(let i=0;i<24;i++){const a=i*Math.PI*2/24,px=x+Math.cos(a)*(w/2-.38),pz=z+Math.sin(a)*(d/2-.38);if(!oval&&Math.abs(Math.cos(a))<.7&&Math.abs(Math.sin(a))<.7)continue;for(let j=0;j<5;j++)cyl(g,px+Math.cos(j*1.256)*.055,.099,pz+Math.sin(j*1.256)*.055,.045,.004,CREAM);}
}
function chandelier(g:T.Group,x:number,z:number,r=.72){
 mark(g,'State room chandelier',x,z);cyl(g,x,4.1,z,.045,.93,GOLD);cyl(g,x,3.71,z,.19,.12,GOLD,.27);
 for(let tier=0;tier<2;tier++){const rr=r*(tier?.62:1),yy=3.68+tier*.32;const ring=mesh(g,new T.TorusGeometry(rr,.035,5,24),GOLD,x,yy,z);ring.rotation.x=Math.PI/2;for(let i=0;i<10;i++){const a=i*Math.PI/5,px=x+Math.cos(a)*rr,pz=z+Math.sin(a)*rr;cyl(g,px,yy+.13,pz,.028,.23,WHITE);for(let j=0;j<3;j++){const drop=mesh(g,new T.OctahedronGeometry(.065,0),0xe5e4d9,px,yy-.1-j*.105,pz);drop.scale.y=1.7;}}}
}
/** Wall detail anchor uses +Z toward the room, so glazing never shares a doorway. */
function windowBay(g:T.Group,x:number,z:number,yaw:number,color:number,width=1.35){
 const a=anchor(g,x,z,yaw);mark(g,'State room window',x,z);
 box(a,0,2.28,0,width+.23,3.66,.13,WHITE);box(a,0,2.28,.085,width,3.42,.025,0x76918d);
 for(const dx of [-width/2,0,width/2])box(a,dx,2.28,.13,.042,3.44,.035,WHITE);
 for(let j=0;j<6;j++)box(a,0,.58+j*.68,.13,width,.032,.035,WHITE);
 box(a,0,.46,.16,width+.36,.12,.28,WHITE);box(a,0,4.14,.17,width+.66,.13,.25,GOLD);
 for(const side of [-1,1])for(let fold=0;fold<4;fold++){const curtain=cyl(a,side*(width/2+.11+fold*.068),2.18,.20+Math.sin(fold)*.035,.065,3.76,color);curtain.scale.z=.8;}
 // Fabric swags are short curved folds across the head, with a clear glazed center.
 for(let j=0;j<12;j++){const u=j/11,px=(u-.5)*width;soft(a,px,3.97-Math.sin(u*Math.PI)*.21,.22,width/10,.33,.12,color);}
}
function frame(g:T.Group,x:number,y:number,z:number,w:number,h:number,art?:string){
 box(g,x,y,z,w+.15,h+.15,.12,GOLD);box(g,x,y,z+.075,w,h,.028,0x493e2f);
 const m=new T.MeshStandardMaterial({color:art?0xffffff:0x96a5a0,roughness:art?.83:.16,metalness:art?0:.72});
 if(art&&typeof window!=='undefined'&&window.location){const prefix=window.location.pathname.startsWith('/trumpgame')?'/trumpgame':'';const tx=new T.TextureLoader().load(prefix+'/art/'+art+'.jpg');tx.colorSpace=T.SRGBColorSpace;m.map=tx;}
 const p=new T.Mesh(new T.PlaneGeometry(w-.13,h-.13),m);p.position.set(x,y,z+.096);g.add(p);
 for(const s of [-1,1]){box(g,x+s*(w/2-.015),y,z+.11,.045,h+.05,.04,GOLD);box(g,x,y+s*(h/2-.015),z+.11,w+.05,.045,.04,GOLD);}
}
function mantel(w:World,x:number,z:number,yaw:number,dark=false,art?:string,width=2.2){
 const a=anchor(w.group,x,z,yaw),stone=dark?0x303332:WHITE;mark(w.group,'State room mantel',x,z);
 box(a,0,.69,.15,width,1.30,.27,0x272e2d);for(const s of [-1,1]){box(a,s*(width/2-.16),.73,.34,.30,1.38,.43,stone);box(a,s*(width/2-.16),.15,.35,.37,.15,.47,stone);}box(a,0,1.33,.33,width,.32,.48,stone);box(a,0,1.56,.35,width+.22,.13,.59,stone);
 for(let i=0;i<7;i++)cyl(a,(i-3)*.16,.40,.44,.018,.42,0x525652);box(a,0,.52,.44,1.02,.028,.035,GOLD);
 frame(a,0,2.87,.12,art?1.55:width-.25,2.1,art);footprint(w,x+Math.sin(yaw)*.31,z+Math.cos(yaw)*.31,width+.22,.65,yaw,1.62);
}
function cabinet(w:World,x:number,z:number){const a=anchor(w.group,x,z,Math.PI);box(a,0,1.2,0,.91,2.25,.45,WOOD);box(a,0,1.34,.24,.73,1.79,.028,0x36463f);for(const side of [-1,1])box(a,side*.39,1.35,.28,.065,1.9,.09,GOLD);for(let i=0;i<3;i++){box(a,0,.69+i*.53,.28,.80,.045,.13,WOOD);for(const dx of [-.21,.21]){cyl(a,dx,.85+i*.53,.3,.10,.20,WHITE,.055);}}box(a,0,2.39,0,1.06,.12,.58,WOOD);footprint(w,x,z,1.06,.58,0,2.5);}

/** A continuous oval shell, with three genuinely open passages to the hall and salons. */
export function blueRoomShell(w:World,d:Destination){
 const {x,z}=d,rx=d.room!.w/2,rz=d.room!.d/2;
 const sideAngle=Math.asin((BLUE_ROOM.sideDoorZ-z)/rz),openings=[{a:Math.PI*1.5,half:Math.asin(1.6/rx)},{a:sideAngle,half:Math.asin(1.6/rz)},{a:Math.PI-sideAngle,half:Math.asin(1.6/rz)}];
 const delta=(a:number,b:number)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
 const steps=128;
 for(let i=0;i<steps;i++){
  const a=i*Math.PI*2/steps,b=(i+1)*Math.PI*2/steps,mid=(a+b)/2;
  const door=openings.some(o=>Math.abs(delta(mid,o.a))<o.half),ax=x+Math.cos(a)*rx,az=z+Math.sin(a)*rz,bx=x+Math.cos(b)*rx,bz=z+Math.sin(b)*rz,cx=(ax+bx)/2,cz=(az+bz)/2,len=Math.hypot(bx-ax,bz-az)+.012,yaw=-Math.atan2(bz-az,bx-ax);
  const g=anchor(w.group,cx,cz,yaw),wall=box(g,0,door?4.1:2.3,0,len,door?1:4.6,.22,WHITE);wall.userData.cameraBlocker=true;
  if(door)(w.cameraOnly??=[]).push({x:cx,z:cz,w:Math.abs(Math.cos(yaw))*len+Math.abs(Math.sin(yaw))*.22,d:Math.abs(Math.sin(yaw))*len+Math.abs(Math.cos(yaw))*.22,height:1,y:3.6});
  if(!door){footprint(w,cx,cz,len,.22,yaw,4.6);box(g,0,.67,0,len,1.22,.28,WHITE);box(g,0,1.31,0,len,.075,.33,0xe0dccb);box(g,0,.14,0,len,.16,.34,0xe0dccb);}
  for(const [y,depth,height]of [[4.43,.37,.16],[4.56,.46,.08]])box(g,0,y,0,len,height,depth,WHITE);
 }
 // Trim the three portals along the actual curved edge; no rectangular wall behind them.
 for(const o of openings)for(const s of [-1,1]){const a=o.a+s*o.half,cx=x+Math.cos(a)*rx,cz=z+Math.sin(a)*rz;const post=box(w.group,cx,1.8,cz,.12,3.6,.12,WHITE);post.userData.cameraBlocker=true;footprint(w,cx,cz,.12,.12,0,3.6);}
 w.group.userData.blueRoom={x,z,rx,rz,openings};
}

/** Public tour reference: Google Arts & Culture / White House, October 2023.
 * Room treatments and relationships are referenced; these are playable adaptations, not a measured survey.
 */
export function furnishStateRoom(w:World,d:Destination){
 const g=w.group,{x,z}=d;
 if(d.id==='east-room'){
  for(const dz of [-9,0,9]){rug(g,x,dz,9,6.9,0xd8ceb6);chandelier(g,x,dz,1.05);}
  for(const dz of [-11.9,-6,0,6,11.9])windowBay(g,x+6.24,dz,-Math.PI/2,0xc9a146,1.75);
  for(const end of [-1,1])for(const px of [x-2.6,x+2.6])windowBay(g,px,end*14.74,end>0?Math.PI:0,0xc9a146,1.65);
  for(const dz of [-7,7])mantel(w,x-6.23,dz,Math.PI/2,true,undefined,2.45);
  for(const dz of [-11.4,11.4])settee(w,x-5.64,dz,-Math.PI/2,CREAM,2.8,true);
  for(const dz of [-3.2,3.2]){const a=anchor(g,x-6.24,dz,Math.PI/2);frame(a,0,2.8,.05,1.65,2.2,dz<0?'washington':undefined);}
  return;
 }
 if(d.id==='blue'){
  const rx=d.room!.w/2,rz=d.room!.d/2;
  rug(g,x,z,d.room!.w-1,d.room!.d-1,0x41627a,true);chandelier(g,x,z,.72);
  // The blue is in the textiles; the tour shows cream upper walls and white lower panels.
  for(const a of [Math.PI/2-.47,Math.PI/2,Math.PI/2+.47]){const px=Math.cos(a)*(rx-.25),pz=z+Math.sin(a)*(rz-.25);windowBay(g,px,pz,Math.atan2(-px/rx**2,-(pz-z)/rz**2),0x41627a,1.17);}
  table(w,0,7.55,.61);bouquet(g,0,1.08,7.55);
  chair(w,3.3,6.1,Math.PI/2,0x41627a,true);chair(w,-3,10.6,0,0x41627a,true);
  const ma=4;mantel(w,Math.cos(ma)*(rx-.45),z+Math.sin(ma)*(rz-.45),Math.atan2(-Math.cos(ma)/rx,-Math.sin(ma)/rz),false,undefined,1.5);
  w.spots.push({id:'sit-blue',label:'Sit in the Blue Room',kind:'seat',hipHeight:.8,x:2.1,z:6.1,pose:[3.3,6.1,Math.PI/2]});
  return;
 }
 if(d.id==='green'||d.id==='red'){
  const green=d.id==='green',side=green?1:-1,color=green?0x7e9b72:0x953a39;
  rug(g,x,9,5.65,10.3,green?0xc9c0a2:0xd8c2ae);chandelier(g,x,9);
  for(const dx of [-1.65,1.65])windowBay(g,x+dx,14.73,Math.PI,green?0xc9a146:0xe0cf9e,1.4);
  cabinet(w,x,14.32);settee(w,x+side*2.55,11.8,side*Math.PI/2,color,2.4);
  chair(w,x-side*2.05,12.1,-side*Math.PI/2,green?0xa76545:0x953a39);
  table(w,x,11.7,.62);bouquet(g,x,1.08,11.7);
  mantel(w,x-side*3.23,5.75,side*Math.PI/2,false,undefined,1.85);
  w.spots.push({id:'sit-'+d.id,label:'Sit in the '+d.name,kind:'seat',hipHeight:.8,x:x+side*1.3,z:11.8,pose:[x+side*2.55,11.8,side*Math.PI/2]});
  return;
 }
 // State Dining: west-wall fireplace and Healy's Lincoln, rather than an office table and flag.
 rug(g,x,z,10.2,12.7,0xc7c6b8);chandelier(g,x,z,1.0);
 mantel(w,x-6.22,7.5,Math.PI/2,false,'lincoln',3.2);
 for(const dz of [3.05,11.95])windowBay(g,x-6.23,dz,Math.PI/2,0xd2bd81,1.65);
 const top=soft(g,x,1.07,z,2.65,.16,8.5,WOOD);top.name='State Dining banquet table';
 for(const dz of [-2.9,2.9]){box(g,x,.55,z+dz,1.7,1.0,.38,WOOD);box(g,x,.15,z+dz,2.05,.13,.64,WOOD);}footprint(w,x,z,2.65,8.5,0,1.16);
 for(let i=0;i<5;i++)for(const side of [-1,1]){const pz=z-3.3+i*1.65;chair(w,x+side*2.05,pz,side*Math.PI/2,0xb7b19b);cyl(g,x+side*.79,1.166,pz,.21,.018,WHITE);cyl(g,x+side*1.01,1.25,pz-.35,.055,.16,0xc7d2ce);}
 for(const dz of [-2,0,2])bouquet(g,x,1.16,z+dz);
 // Three eagle-base pier tables, placed against walls clear of both door approaches.
 for(const [px,pz,yaw]of [[x-4.1,.65,0],[x+3.9,.65,0],[x,14.25,Math.PI]]){const a=anchor(g,px,pz,yaw);box(a,0,1.03,0,1.95,.13,.69,WHITE);cyl(a,0,.5,0,.13,.8,GOLD,.2);for(const s of [-1,1]){const wing=mesh(a,new T.SphereGeometry(1,10,6),GOLD,s*.35,.68,0);wing.scale.set(.44,.11,.12);wing.rotation.z=s*.4;}cyl(a,0,.90,.13,.09,.19,GOLD);box(a,0,.15,0,1.18,.12,.51,WOOD);footprint(w,px,pz,1.95,.69,yaw,1.1);mark(g,'Eagle pier table',px,pz);}
}
