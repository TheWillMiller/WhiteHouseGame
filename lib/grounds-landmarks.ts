import * as T from 'three';
import {HELIPAD,SOUTH_FLAG,PRESS_TENTS} from './grounds-layout';

type Solid={x:number;z:number;w:number;d:number;height?:number};
export type GroundsLandmarks={update:(dt:number,player:T.Vector3)=>void};

/** Photo-led detail built at human scale, batched with the rest of the estate. */
export function buildGroundsLandmarks(parent:T.Group,solids:Solid[]):GroundsLandmarks{
 const stone=new T.MeshStandardMaterial({color:0xe2e0d7,roughness:.79});
 const aluminum=new T.MeshStandardMaterial({color:0xb8c2c5,metalness:.78,roughness:.32});
 const black=new T.MeshStandardMaterial({color:0x252c30,roughness:.82});
 const cloth=new T.MeshStandardMaterial({color:0xe9e8dd,roughness:1,side:T.DoubleSide});
 const glass=new T.MeshStandardMaterial({color:0x183e4c,metalness:.25,roughness:.12});
 const plant=new T.MeshStandardMaterial({color:0x4d6548,roughness:1});
 const diffuser=new T.MeshStandardMaterial({color:0xfff5df,emissive:0xfff5df,emissiveIntensity:.22});
 const mesh=(g:T.Group,geo:T.BufferGeometry,m:T.Material,x=0,y=0,z=0)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;};
 const box=(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>mesh(g,new T.BoxGeometry(w,h,d),m,x,y,z);
 const rod=(g:T.Group,a:number[],b:number[],r:number,m:T.Material)=>{const from=new T.Vector3(...a),to=new T.Vector3(...b),o=mesh(g,new T.CylinderGeometry(r,r,from.distanceTo(to),6),m);o.position.copy(from).add(to).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),to.sub(from).normalize());return o;};
 const pad=new T.Group();pad.name='South Lawn granite helipad';pad.position.set(HELIPAD.x,0,HELIPAD.z);parent.add(pad);
 mesh(pad,new T.CylinderGeometry(HELIPAD.radius,HELIPAD.radius,.07,128),stone,0,.009,0);
 const seal=new T.MeshStandardMaterial({color:0xffffff,roughness:.66,metalness:.04});
 // Load one bounded 1024 px vector texture; no new model or per-frame texture work.
 if(typeof document!=='undefined'&&typeof document.createElementNS==='function'){
  const base=window.location.pathname.startsWith('/trumpgame')?'/trumpgame/':'/';
  const tx=new T.TextureLoader().load(base+'textures/helipad-seal-v1.svg',()=>{parent.userData.landmarksReady=true;});tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;seal.map=tx;
 }
 const grain=new Uint8Array(128*128*4);let seed=73;for(let i=0;i<grain.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;grain[i]=grain[i+1]=grain[i+2]=228+seed%28;grain[i+3]=255;}
 const stoneGrain=new T.DataTexture(grain,128,128);stoneGrain.wrapS=stoneGrain.wrapT=T.RepeatWrapping;stoneGrain.repeat.set(32,32);stoneGrain.minFilter=T.LinearMipmapLinearFilter;stoneGrain.magFilter=T.LinearFilter;stoneGrain.generateMipmaps=true;stoneGrain.needsUpdate=true;stone.map=stoneGrain;seal.bumpMap=stoneGrain;seal.bumpScale=.025;
 const face=mesh(pad,new T.CircleGeometry(HELIPAD.radius-.08,128),seal,0,.045,0);face.rotation.x=-Math.PI/2;face.castShadow=false;
 // Hairline expansion joints cross the stone without fragmenting the mesh.
 const joint=new T.MeshStandardMaterial({color:0x7c8581,transparent:true,opacity:.2,depthWrite:false,roughness:1});
 for(let n=-4;n<=4;n++){const offset=n*3.1,half=Math.sqrt(HELIPAD.radius**2-offset**2);box(pad,offset,.048,0,.014,.002,half*2,joint);box(pad,0,.048,offset,half*2,.002,.014,joint);}
 const approachStart=-4.7,approachEnd=HELIPAD.z-HELIPAD.radius+.15;
 box(parent,0,.017,(approachStart+approachEnd)/2,3.4,.032,approachEnd-approachStart,stone);
 for(let z=approachStart+1.2;z<approachEnd;z+=1.2)box(parent,0,.035,z,3.4,.003,.012,joint);

 const pole=new T.Group();pole.name='South Lawn 88-foot flagpole';pole.position.set(SOUTH_FLAG.x,0,SOUTH_FLAG.z);parent.add(pole);
 const h=SOUTH_FLAG.height;
 mesh(pole,new T.CylinderGeometry(.105,.245,h,20),aluminum,0,h/2,0);
 mesh(pole,new T.CylinderGeometry(.44,.56,.34,24),aluminum,0,.17,0);
 mesh(pole,new T.SphereGeometry(.18,14,10),new T.MeshStandardMaterial({color:0xd0ae61,metalness:.8,roughness:.26}),0,h+.15,0);
 rod(pole,[.15,1.2,0],[.12,h-.1,0],.018,stone);box(pole,.25,1.25,0,.09,.36,.10,aluminum);
 const bed=mesh(pole,new T.CylinderGeometry(2.9,2.9,.025,64),new T.MeshStandardMaterial({color:0x55483a,roughness:1}),0,.015,0);bed.castShadow=false;
 const edge=mesh(pole,new T.TorusGeometry(2.9,.10,6,64),stone,0,.07,0);edge.rotation.x=Math.PI/2;
 for(let i=0;i<24;i++){const a=i*Math.PI/12;const bush=mesh(pole,new T.IcosahedronGeometry(.44,1),plant,Math.cos(a)*2.25,.30,Math.sin(a)*2.25);bush.scale.set(1.1,.7,1);}
 for(let i=0;i<72;i++){const a=i*Math.PI/36,r=2.68+(i%2)*.07;mesh(pole,new T.SphereGeometry(.075,5,4),cloth,Math.cos(a)*r,.21+(i%3)*.025,Math.sin(a)*r);}
 solids.push({x:SOUTH_FLAG.x,z:SOUTH_FLAG.z,w:.55,d:.55,height:h});
 const flagCanvas=document.createElement('canvas');flagCanvas.width=760;flagCanvas.height=400;const ctx=flagCanvas.getContext('2d')!;
 ctx.fillStyle='#eeeae1';ctx.fillRect(0,0,760,400);ctx.fillStyle='#a7353b';for(let i=0;i<13;i+=2)ctx.fillRect(0,i*400/13,760,400/13);ctx.fillStyle='#20385c';ctx.fillRect(0,0,304,400*7/13);ctx.fillStyle='#fff9e7';
 for(let row=0;row<9;row++)for(let col=0;col<(row%2?5:6);col++){const x=25+col*50+(row%2?25:0),y=13+row*24;ctx.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?3:7;k?ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();ctx.fill();}
 const flagTexture=new T.CanvasTexture(flagCanvas);flagTexture.colorSpace=T.SRGBColorSpace;
 const flagGeo=new T.PlaneGeometry(7.62,4.01,28,16),positions=flagGeo.getAttribute('position'),rest=Float32Array.from(positions.array);
 const flag=mesh(pole,flagGeo,new T.MeshStandardMaterial({map:flagTexture,roughness:.92,side:T.DoubleSide}),3.85,h-2.28,0);flag.userData.dynamic=true;

 for(const [index,[x,z]]of PRESS_TENTS.entries()){
  const tent=new T.Group();tent.name='Press live-shot canopy '+(index+1);tent.position.set(x,0,z);parent.add(tent);
  box(tent,0,.025,0,5.3,.05,4.8,stone);
  // Tensioned hip roof with sag between the ridge and eaves, not a solid pyramid.
  const roof=new T.BufferGeometry(),v:number[]=[];
  const corners=[[-2.5,2.55,-2.15],[2.5,2.55,-2.15],[2.5,2.55,2.15],[-2.5,2.55,2.15]];
  for(let side=0;side<4;side++){const a=new T.Vector3(...corners[side]),b=new T.Vector3(...corners[(side+1)%4]),peak=new T.Vector3(0,3.68,0);for(let i=0;i<10;i++){const p=a.clone().lerp(b,i/10),q=a.clone().lerp(b,(i+1)/10),m=p.clone().lerp(peak,.5),n=q.clone().lerp(peak,.5);m.y-=.08;n.y-=.08;for(const t of [p,q,m,q,n,m,m,n,peak])v.push(t.x,t.y,t.z);}}
  roof.setAttribute('position',new T.Float32BufferAttribute(v,3));roof.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(v.length/3*2),2));roof.computeVertexNormals();mesh(tent,roof,cloth);
  for(const sx of [-2.4,2.4])for(const sz of [-2.05,2.05]){rod(tent,[sx,.03,sz],[sx,2.65,sz],.027,aluminum);box(tent,sx,.18,sz,.34,.34,.34,black);solids.push({x:x+sx,z:z+sz,w:.34,d:.34,height:2.65});rod(tent,[sx,2.6,sz],[0,3.6,0],.017,aluminum);}
  for(const sz of [-2.16,2.16]){box(tent,0,2.43,sz,5,.25,.015,cloth);for(const sign of [-1,1])rod(tent,[-2.4,2.43+sign*.15,sz],[2.4,2.43-sign*.15,sz],.014,aluminum);}
  for(const sx of [-2.5,2.5])box(tent,sx,2.43,0,.015,.25,4.3,cloth);
  // Folded side drape and rear weather curtain leave a usable front opening.
  const curtain=mesh(tent,new T.PlaneGeometry(5,2.28,32,1),cloth,0,1.28,-2.1);const cp=curtain.geometry.getAttribute('position');for(let i=0;i<cp.count;i++)cp.setZ(i,Math.sin(cp.getX(i)*15)*.035);curtain.geometry.computeVertexNormals();
  solids.push({x,z:z-2.1,w:5,d:.08,height:2.5});
  // Camera points back toward the residence; a lens, hood, viewfinder, and pan bar.
  const camera=new T.Group();camera.position.set(-.9,0,.3);camera.rotation.y=-2.0;tent.add(camera);
  for(let leg=0;leg<3;leg++){const a=leg*Math.PI*2/3;rod(camera,[0,1.4,0],[Math.sin(a)*.55,.06,Math.cos(a)*.55],.023,black);}
  box(camera,0,1.6,0,.32,.26,.51,black);box(camera,0,1.60,-.33,.42,.31,.16,black);box(camera,0,1.60,-.42,.30,.20,.012,glass);box(camera,.23,1.75,.1,.14,.13,.22,black);rod(camera,[0,1.48,.05],[.25,1.42,.55],.02,black);
  solids.push({x:x-.9,z:z+.3,w:.8,d:.8,height:1.9});
  // Light stand and softbox; visible emitter without another shadow-casting light.
  rod(tent,[1.5,.05,.8],[1.5,2.1,.8],.022,aluminum);for(let leg=0;leg<3;leg++){const a=leg*Math.PI*2/3;rod(tent,[1.5,.4,.8],[1.5+Math.sin(a)*.45,.04,.8+Math.cos(a)*.45],.018,black);}
  box(tent,1.5,2.02,.8,.6,.43,.08,black);box(tent,1.5,2.02,.855,.52,.35,.025,diffuser);
  box(tent,1.6,.38,-1.1,1,.65,.55,black);for(const dx of [-.45,.45])box(tent,1.6+dx,.4,-1.39,.04,.58,.025,aluminum);box(tent,1.6,.45,-1.40,.18,.08,.026,aluminum);
  solids.push({x:x+1.6,z:z-1.1,w:1,d:.6,height:.8});
  const cablePoints=[new T.Vector3(-.9,.055,.3),new T.Vector3(-.7,.055,-.8),new T.Vector3(.3,.055,-1.6),new T.Vector3(1.6,.055,-1.3)];mesh(tent,new T.TubeGeometry(new T.CatmullRomCurve3(cablePoints),18,.018,4,false),black);
 }
 // Low-cost deformation: only one flag, updated at 20 Hz when the lawn is in range.
 let time=0,acc=0;const poleWorld=new T.Vector3(SOUTH_FLAG.x,h/2,SOUTH_FLAG.z);
 return {update(dt,player){time+=dt;acc+=dt;if(acc<.05||player.distanceTo(poleWorld)>180)return;acc=0;for(let i=0;i<positions.count;i++){const x=rest[i*3],y=rest[i*3+1],u=(x+3.81)/7.62;positions.setXYZ(i,x,y-.38*u+Math.sin(u*8-time*2)*.10*u,(Math.sin(u*10-time*3)*.36+Math.sin(y*2.2+u*5-time*1.8)*.12)*u);}positions.needsUpdate=true;flagGeo.computeVertexNormals();}};
}
