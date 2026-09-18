import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { NPC, Destination } from './world-data';

// Small deterministic material tiles keep the whole game self-contained.
type Surface = 'stone' | 'wood' | 'cloth' | 'grass' | 'metal' | 'plain';
const textures = new Map<Surface,T.DataTexture>();
export const materials = new Map<number,T.MeshStandardMaterial>();
const wood = new Set([0x69412d,0x815434,0x6b452b,0x845d3c,0x94754e,0x6c6550,0x8b7653,0xb69b70,0xbea377,0x5a3826]);
const stone = new Set([0xf5f0df,0xe0dccb,0xe8e5d7,0xcac8b0,0xe9e2cd,0xe7e0c8,0xcec8b3,0xcfbf98,0xc9c6b6,0xb3b6a3]);
const grass = new Set([0x718e43,0x6c8745,0x748f46,0x779148,0x698644,0x5f883c,0x547249]);
const cloth = new Set([0x192840,0x315d78,0x345b73,0x41627a,0xe0cf9e,0xc9a146,0xcbb058,0x193957]);
function tile(kind:Surface){
  if(textures.has(kind))return textures.get(kind)!;
  const n=128,data=new Uint8Array(n*n*4);let seed=901;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=(seed/4294967296-.5);
    let value=240;
    if(kind==='wood')value=221+Math.sin(x*.46+Math.sin(y*.075)*1.5)*14+Math.sin(x*1.8+y*.06)*5+noise*16;
    if(kind==='stone')value=246+noise*6;
    if(kind==='cloth')value=238+((x+y)%2?8:-8)+noise*7;
    if(kind==='grass')value=239+noise*6+Math.sin(x*Math.PI/64)*2+Math.cos(y*Math.PI/64)*2;
    const i=(y*n+x)*4;data[i]=data[i+1]=data[i+2]=Math.max(0,Math.min(255,value));data[i+3]=255;
  }
  const tx=new T.DataTexture(data,n,n);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;
  tx.magFilter=T.LinearFilter;tx.minFilter=T.LinearMipmapLinearFilter;tx.generateMipmaps=true;tx.needsUpdate=true;
  if(kind==='grass')tx.repeat.set(36,36);if(kind==='cloth')tx.repeat.set(3,3);textures.set(kind,tx);return tx;
}
export function material(color:number){
  if(!materials.has(color)){
    const kind:Surface=wood.has(color)?'wood':stone.has(color)?'stone':grass.has(color)?'grass':cloth.has(color)?'cloth':'plain';
    const gold=[0xd9b458,0xd6ba70,0xc79b42].includes(color),water=[0x71b2bb,0x54aeb7,0x9ccbd2,0xb5d8d5].includes(color);
    materials.set(color,new T.MeshStandardMaterial({color,roughness:gold?.33:water?.24:kind==='wood'?.57:.86,metalness:gold?.68:water?.2:0,map:kind==='plain'?null:tile(kind),flatShading:false}));
  }
  return materials.get(color)!;
}
export function clearVisualResources(){textures.forEach(t=>t.dispose());textures.clear();materials.clear();}
function mesh(g:T.Group,geo:T.BufferGeometry,c:number,x=0,y=0,z=0){const m=new T.Mesh(geo,material(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function block(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,c:number,bevel=0){return mesh(g,bevel?new RoundedBoxGeometry(w,h,d,1,Math.min(bevel,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d),c,x,y,z);}
function orb(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,c:number){const m=mesh(g,new T.SphereGeometry(1,10,8),c,x,y,z);m.scale.set(w,h,d);return m;}
function cylinder(g:T.Group,x:number,y:number,z:number,r:number,h:number,c:number,rt=r){return mesh(g,new T.CylinderGeometry(rt,r,h,16),c,x,y,z);}
function panel(g:T.Group,points:number[][],depth:number,c:number,x=0,y=0,z=0){const s=new T.Shape();points.forEach(([px,py],i)=>i?s.lineTo(px,py):s.moveTo(px,py));s.closePath();const m=mesh(g,new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,steps:1}),c,x,y,z);return m;}

export function makeCharacter(options:Partial<NPC>,trump:boolean,merge:(g:T.Group)=>void){
  const g=new T.Group();g.name=trump?'Donald Trump':'Staff character';
  const skin=options.skin??(trump?0xe3a371:0xe6b28b),hair=trump?0xdca630:options.hair??0x664531,suit=options.suit??0x192840;
  const pale=new T.Color(skin).lerp(new T.Color(0xffe4bf),.17).getHex(),shade=new T.Color(skin).multiplyScalar(.87).getHex();
  const jacket=block(g,0,1.49,.015,.92,1.08,.57,suit,.10);jacket.scale.x=trump?1.08:options.female?.92:1;
  block(g,0,1.12,.015,.84,.25,.55,suit,.04);
  panel(g,[[-.27,1.98],[.27,1.98],[.17,1.48],[0,1.22],[-.17,1.48]],.035,0xf7f4e9,0,0,-.32);
  const lapel=new T.Color(suit).lerp(new T.Color(0x708295),.15).getHex();
  for(const side of [-1,1]){
    panel(g,[[side*.12,2.01],[side*.42,1.91],[side*.31,1.64],[side*.23,1.61],[0,1.24]],.025,lapel,0,0,-.37);
    panel(g,[[side*.03,1.84],[side*.21,1.73],[side*.24,1.98]],.022,0xfffbec,0,0,-.398);
  }
  const tie=trump?0xb41f29:options.female?0xd9b458:0x547694;
  panel(g,[[-.068,1.83],[.068,1.83],[.095,1.69],[0,1.62],[-.095,1.69]],.038,tie,0,0,-.43);
  panel(g,[[-.052,1.68],[.052,1.68],[.108,1.14],[0,1.01],[-.108,1.14]],.04,tie,0,0,-.41);
  for(const y of [1.22,1.4])orb(g,.16,y,-.303,.025,.025,.012,0x9c865f);
  block(g,.32,1.57,-.311,.18,.025,.028,lapel);block(g,.32,1.60,-.325,.13,.05,.018,0xf8eee1);
  block(g,-.30,1.87,-.40,.11,.07,.013,0xb52d32);block(g,-.32,1.89,-.414,.04,.035,.009,0x3c5174);
  cylinder(g,0,2.04,0,.18,.23,skin,.17);
  const head=block(g,0,2.43,-.02,.76,.79,.66,skin,.15);head.name='Sculpted face';
  orb(g,0,2.18,-.13,.30,.20,.27,pale);
  for(const side of [-1,1]){
    orb(g,side*.285,2.34,-.257,.145,.17,.105,skin);
    orb(g,side*.397,2.40,0,.09,.15,.088,skin);orb(g,side*.431,2.4,-.05,.023,.072,.035,shade);
    const eye=orb(g,side*.169,2.49,-.338,.113,.068,.028,0xf8f5eb);eye.rotation.z=side*.08;
    orb(g,side*.158,2.49,-.365,.041,.049,.013,trump?0x54778f:0x536767);
    orb(g,side*.158,2.49,-.379,.018,.036,.006,0x17232b);orb(g,side*.146,2.51,-.386,.009,.012,.004,0xffffff);
    const brow=block(g,side*.163,2.589,-.348,.224,.052,.045,hair,.012);brow.rotation.z=side*.16;
    block(g,side*.19,2.414,-.35,.17,.018,.018,shade,.006);
  }
  panel(g,[[-.058,2.52],[.059,2.52],[.099,2.31],[0,2.285],[-.082,2.325]],.105,pale,0,0,-.438);
  for(const x of [-.063,.063])orb(g,x,2.312,-.443,.035,.025,.018,shade);
  orb(g,0,2.22,-.367,.115,.033,.025,0xaf735c);block(g,0,2.223,-.391,.16,.012,.013,0x704b3f);
  orb(g,0,2.195,-.363,.096,.022,.018,pale);
  // Swept, layered hair with a silhouette visible from all camera angles.
  orb(g,0,2.77,.026,.41,.20,.34,hair);
  if(trump){
    panel(g,[[-.41,2.68],[-.40,2.91],[-.24,3.03],[.16,3.00],[.49,2.91],[.32,2.74],[.04,2.70]],.48,0xedbe43,0,0,-.31);
    panel(g,[[-.37,2.89],[-.17,3.015],[.23,2.97],[.44,2.91],[.10,2.89],[-.13,2.79]],.025,0xf6cf64,0,0,-.345);
    for(let i=0;i<5;i++){const m=block(g,-.24+i*.10,2.88+i*.009,-.368,.022,.115,.018,0xd7a233,.006);m.rotation.z=-.72;}
    block(g,-.365,2.64,.02,.14,.37,.48,hair,.05);block(g,.36,2.64,.10,.10,.3,.38,hair,.04);
  }else{
    block(g,0,2.73,.18,.76,.31,.42,hair,.10);
    panel(g,[[-.38,2.71],[-.35,2.91],[.18,2.91],[.38,2.81],[.26,2.68],[-.06,2.76]],.20,hair,0,0,-.33);
    if(options.female){for(const side of [-1,1])orb(g,side*.36,2.47,.13,.15,.42,.27,hair);block(g,0,2.4,.29,.68,.72,.21,hair,.08);}
  }
  if(options.beard){orb(g,0,2.2,-.18,.33,.22,.21,hair);orb(g,0,2.255,-.363,.12,.04,.025,shade);block(g,0,2.25,-.39,.17,.017,.01,0x704b3f);}
  if(options.hat){cylinder(g,0,2.93,0,.49,.07,options.suit===0xf6f2df?0xfffcef:0xe8b833);orb(g,0,3.0,0,.4,.22,.38,options.suit===0xf6f2df?0xfffcef:0xf5c951);}
  merge(g);
  const limbs:T.Group[]=[];
  for(const side of [-1,1]){
    const leg=new T.Group();leg.position.set(side*.235,1.04,0);
    block(leg,0,-.40,0,.37,.84,.44,suit,.06);block(leg,0,-.8,-.015,.38,.12,.46,suit,.035);
    block(leg,0,-.91,-.09,.40,.20,.64,0x242b34,.065);block(leg,0,-.995,-.09,.41,.045,.64,0x11181e,.01);
    block(leg,0,-.864,-.27,.27,.018,.17,0x38424b,.01);merge(leg);g.add(leg);limbs.push(leg);
    const arm=new T.Group();arm.position.set(side*.52,1.87,0);
    orb(arm,0,-.08,.015,.195,.21,.225,suit);block(arm,side*.015,-.39,0,.31,.73,.37,suit,.07);
    block(arm,side*.02,-.755,-.014,.29,.10,.33,0xf7f1df,.025);
    orb(arm,side*.03,-.88,-.015,.175,.19,.16,skin);
    for(let f=0;f<3;f++)block(arm,side*.03-.09+f*.074,-.94,-.11,.067,.17,.13,pale,.025);
    orb(arm,-side*.11,-.86,-.12,.075,.11,.075,skin);
    for(let i=0;i<3;i++)orb(arm,side*.17,-.63+i*.075,-.10,.023,.023,.012,0x9c865f);
    merge(arm);arm.rotation.z=side*.06;g.add(arm);limbs.push(arm);
  }
  g.userData.limbs=limbs;return g;
}

function star(g:T.Group,x:number,y:number,z:number,r:number,color:number){const points:number[][]=[];for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5;points.push([Math.cos(a)*r*(i%2?.43:1),Math.sin(a)*r*(i%2?.43:1)]);}return panel(g,points,.008,color,x,y,z);}
function eagle(g:T.Group,x:number,y:number,z:number,size=1,color=0xd9b458){
  const e=new T.Group();for(const side of [-1,1]){
    panel(e,[[0,.08],[side*.72,.55],[side*.95,.46],[side*.68,.18],[side*.34,-.11],[side*.10,-.15]],.035,color);
    for(let i=0;i<5;i++){const feather=block(e,side*(.28+i*.105),.21+i*.062,-.018,.035,.30-i*.025,.025,0xf0d591,.01);feather.rotation.z=-side*.75;}
  }
  panel(e,[[-.18,.16],[.18,.16],[.15,-.25],[0,-.40],[-.15,-.25]],.06,0xc39a48,0,0,-.07);
  block(e,0,.045,-.093,.30,.16,.025,0x294b71);for(let i=0;i<5;i++)block(e,-.12+i*.06,-.13,-.094,.025,.18,.022,i%2?0xb84a3b:0xf3e5bd);
  orb(e,.03,.28,-.045,.11,.17,.10,0xf5e8ba);panel(e,[[.06,.36],[.21,.28],[.05,.24]],.06,color,0,0,-.075);
  for(let i=0;i<3;i++){const tail=block(e,(i-1)*.10,-.36,.03,.08,.27,.03,color);tail.rotation.z=(i-1)*-.3;}
  e.scale.setScalar(size);e.position.set(x,y,z);g.add(e);return e;
}
export function detailedFlag(g:T.Group,x:number,y:number,z:number,scale=1,presidential=false){
  const p=new T.Group();p.position.set(x,y,z);p.scale.setScalar(scale);g.add(p);
  cylinder(p,0,.1,0,.34,.2,0x69412d);cylinder(p,0,3,0,.045,6,0xd9b458);orb(p,0,6.05,0,.11,.16,.11,0xd9b458);
  // Real draped mesh: folds affect both the silhouette and the light.
  const width=2.0,height=1.55,geo=new T.PlaneGeometry(width,height,20,13),positions=geo.getAttribute('position');
  for(let i=0;i<positions.count;i++){const u=(positions.getX(i)+width/2)/width;positions.setXYZ(i,positions.getX(i),positions.getY(i)-u*.22,Math.sin(u*16)*.105*u);}
  geo.computeVertexNormals();const canvas=document.createElement('canvas');canvas.width=520;canvas.height=400;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle=presidential?'#193957':'#f3eddb';ctx.fillRect(0,0,520,400);
  if(!presidential){for(let i=0;i<13;i+=2){ctx.fillStyle='#ac3437';ctx.fillRect(0,i*400/13,520,400/13);}ctx.fillStyle='#253e61';ctx.fillRect(0,0,215,216);ctx.fillStyle='#f7edce';for(let row=0;row<9;row++)for(let col=0;col<(row%2?5:6);col++){const cx=18+col*35+(row%2?17:0),cy=13+row*23;ctx.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?3:7;k?ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r):ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}ctx.closePath();ctx.fill();}}
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const flagMat=new T.MeshStandardMaterial({map:texture,roughness:.9,side:T.DoubleSide});const flag=new T.Mesh(geo,flagMat);flag.position.set(1,5.02,0);flag.castShadow=true;p.add(flag);
  if(presidential){eagle(p,1,4.92,-.12,.58);for(let i=0;i<20;i++){const a=i*Math.PI/10;star(p,1+Math.cos(a)*.62,4.96+Math.sin(a)*.61,-.12,.034,0xf1df9a);}}
}

export function lamp(g:T.Group,x:number,y:number,z:number){
  cylinder(g,x,y+.055,z,.28,.11,0xd9b458);cylinder(g,x,y+.37,z,.055,.64,0xd9b458);
  cylinder(g,x,y+.65,z,.34,.43,0xf5e0a3,.20);orb(g,x,y+.91,z,.05,.065,.05,0xd9b458);
  // Emissive shades suggest warm light without dozens of expensive point lights.
  const glow=material(0xf5e0a3);glow.emissive.setHex(0xffc875);glow.emissiveIntensity=.3;
}
export function deskDetails(g:T.Group,x:number,z:number,width:number,depth:number,hero=false){
  const face=z-depth/2-.07;
  block(g,x,1.04,face,width+.035,.10,.07,0x94754e);block(g,x,.13,face,width+.06,.15,.14,0x69412d);
  if(hero){
    block(g,x,.63,face,2.35,1.0,.08,0x69412d);
    for(const sx of [-1.08,1.08]){block(g,x+sx,.63,face-.05,.11,.97,.10,0x94754e);for(const sy of [.25,.98])block(g,x+sx,sy,face-.08,.17,.10,.10,0x845d3c);}
    for(const sy of [.2,1.06])block(g,x,sy,face-.05,2.2,.07,.07,0x94754e);
    eagle(g,x,.64,face-.11,.58,0xa17a4b);
    for(const side of [-1,1])for(let row=0;row<3;row++){const sx=x+side*(width/2-.55),sy=.3+row*.3;block(g,sx,sy,face-.05,.78,.18,.025,0x69412d);for(const dx of [-.34,.34])block(g,sx+dx,sy,face-.07,.022,.16,.027,0x94754e);}
  }
  block(g,x,1.317,z-.1,width*.40,.018,depth*.64,0x273c39,.006);
  for(const side of [-1,1]){const paper=block(g,x+side*.29,1.34,z-.18,.49,.012,.5,0xf7f2dd);paper.rotation.y=side*.06;for(let i=0;i<4;i++)block(g,x+side*.29,1.349,z-.31+i*.06,.3,.003,.006,0x9a9d92);}
  block(g,x+.92,1.40,z-.14,.38,.14,.26,0x1e2931,.05);const handset=block(g,x+.92,1.49,z-.13,.45,.08,.11,0x15212a,.035);handset.rotation.y=.15;
  cylinder(g,x-.8,1.46,z,.08,.27,0x69412d);for(let i=0;i<3;i++)cylinder(g,x-.84+i*.035,1.65,z,.012,.25,0xd9b458);
  if(hero){for(const side of [-1,1]){block(g,x+side*1.75,1.53,z+.38,.45,.43,.045,0xd9b458,.015);block(g,x+side*1.75,1.54,z+.35,.35,.32,.016,0x405c6c);} }
}
export function carpetDetail(g:T.Group,x:number,z:number,rx:number,rz:number,oval=false){
  // Geometry follows the carpet, so the border stays crisp at an oblique angle.
  for(const factor of [.91,.86]){const curve=new T.EllipseCurve(0,0,rx*factor,rz*factor,0,Math.PI*2,false,0);const points=curve.getPoints(96).map(p=>new T.Vector3(x+p.x,.126,z+p.y));g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),96,.022,4,false),material(0xd9b458)));}
  if(oval){const emblem=eagle(g,x,.21,z,Math.min(rx,rz)*.25);emblem.rotation.x=Math.PI/2;for(let i=0;i<24;i++){const a=i*Math.PI/12;const s=star(g,x+Math.cos(a)*rx*.72,.145,z+Math.sin(a)*rz*.72,.09,0xf3dfa1);s.rotation.x=Math.PI/2;}}
}
function windowDressing(g:T.Group,x:number,z:number,width:number,gold:boolean){
  const m=new T.Group();m.position.set(x,0,z);g.add(m);
  block(m,0,2.75,.02,width,3.08,.12,0x6f9cab);block(m,0,1.31,-.10,width+.22,.14,.32,0xf5f0df);
  for(const side of [-1,1])block(m,side*width/2,2.75,-.1,.12,3.18,.23,0xf5f0df);
  for(let i=0;i<4;i++)block(m,0,1.64+i*.73,-.11,width,.06,.21,0xf5f0df);block(m,0,2.75,-.13,.07,3.0,.2,0xf5f0df);
  for(const side of [-1,1]){
    for(let fold=0;fold<6;fold++){const px=side*(width/2+.08+fold*.10),geo=new T.CylinderGeometry(.075,.09,3.22,8,1,true);const c=mesh(m,geo,fold%2?0xc9a146:0xcbb058,px,2.59,-.16);c.scale.z=1.8;}
    block(m,side*(width/2+.32),1.83,-.30,.60,.11,.11,0xd9b458);cylinder(m,side*(width/2+.28),1.53,-.34,.035,.54,0xd9b458);
  }
  cylinder(m,0,4.28,-.15,.06,width+1.6,0xd9b458).rotation.z=Math.PI/2;
  for(let i=0;i<8;i++){const sw=orb(m,-width/2+i*width/7,4.02,-.17,width/6,.21,.09,gold?0xc9a146:0xcbb058);sw.rotation.z=(i<4?1:-1)*.10;}
}
export function roomDetails(g:T.Group,d:Destination){
  const {x,z}=d,r=d.room!,rx=r.w/2,rz=r.d/2,oval=r.style==='oval';
  if(oval){
    // Three tall windows form the recognizable gold-draped backdrop behind the desk.
    for(const offset of [-3.1,0,3.1])windowDressing(g,x+offset,z+rz-.72,1.65,true);
    for(const side of [-1,1]){
      const t=new T.Group();t.position.set(x+side*3.65,0,z+rz-2.0);block(t,0,.86,0,1.0,.12,.8,0x69412d,.025);for(const sx of [-.36,.36])for(const sz of [-.25,.25])block(t,sx,.42,sz,.07,.84,.07,0x69412d);lamp(t,0,.93,0);g.add(t);
    }
    // Fireplace at the opposite end, offset from the open center doorway.
    const f=new T.Group();f.position.set(x-3.8,0,z-rz+.72);f.rotation.y=Math.PI;fireplace(f);g.add(f);
  }else if(!['kitchen','flowers','press','games'].includes(r.style)){
    for(const side of [-1,1]){const wx=x+side*(rx-1.5),wz=z+(z>=0?rz:-rz)*.98;const drape=new T.Group();drape.position.set(wx,0,wz);if(z<0)drape.rotation.y=Math.PI;windowDressing(drape,0,0,1.4,false);g.add(drape);}
  }
  if(!oval){
    // Raised wall panels, picture rails and a continuous cornice give rooms depth.
    for(const side of [-1,1])for(let q=0;q<Math.floor((r.w-4)/2);q++){
      const px=x-rx+1.05+q*2;if(Math.abs(px-x)<2.2)continue;const pz=z+side*(rz-.17);
      for(const yy of [.23,1.08])block(g,px,yy,pz,1.35,.035,.055,0xd9b458);
      for(const dx of [-.675,.675])block(g,px+dx,.65,pz,.035,.86,.055,0xd9b458);
    }
  }
}
function fireplace(g:T.Group){
  block(g,0,.77,0,2.5,1.55,.5,0xf5f0df);block(g,0,.67,-.26,1.57,1.2,.035,0x25312f);
  for(const side of [-1,1]){block(g,side*1.04,.80,-.35,.35,1.6,.27,0xe0dccb);block(g,side*1.04,.14,-.4,.45,.2,.33,0xf5f0df);}
  block(g,0,1.62,-.11,2.85,.17,.86,0xf5f0df);block(g,0,2.7,.01,1.9,1.72,.14,0xd9b458);block(g,0,2.7,-.08,1.68,1.5,.025,0x69888b);
  for(const side of [-1,1]){cylinder(g,side*.95,1.93,-.1,.05,.51,0xd9b458);cylinder(g,side*.95,2.23,-.1,.06,.24,0xf6e8bf);}
}
export function groundsDetails(g:T.Group){
  // Iron garden lanterns, path edging and planted urns.
  for(const x of [-7.1,7.1])for(const z of [7,25,77,105]){
    cylinder(g,x,.10,z,.3,.2,0x243b36);cylinder(g,x,1.62,z,.075,3,0x263a35);block(g,x,3.26,z,.39,.61,.39,0xf0db9a,.03);
    for(const dx of [-.22,.22])for(const dz of [-.22,.22])block(g,x+dx,3.26,z+dz,.035,.69,.035,0x23352f);
    cylinder(g,x,3.68,z,.34,.21,0x243b36,.07);orb(g,x,3.86,z,.07,.13,.07,0xd9b458);
  }
  for(const side of [-1,1])for(let z=5;z<31;z+=1.0)block(g,side*5.65,.095,z,.32,.16,.94,0xe0dccb);
  // Tracks, slab joints and small equipment detail at the ballroom work site.
  for(let i=0;i<8;i++)block(g,62,.26,-36+i*4.2,33,.013,.028,0x929589);
  for(const x of [53.5,62,70.5])block(g,x,.26,-21,.025,.013,33,0x929589);
  for(let i=0;i<10;i++)for(const x of [67.45,70.55])block(g,x,.46,-48.8+i*.4,.13,.67,.20,0x727a6c);
  for(let i=0;i<7;i++){const x=47+i*4.8;block(g,x,.7,9.8,3.2,.19,.16,0xf2c55a);for(let j=0;j<4;j++){const stripe=block(g,x-1.2+j*.75,.7,9.70,.20,.21,.025,0x303d3a);stripe.rotation.z=-.3;}}
}
