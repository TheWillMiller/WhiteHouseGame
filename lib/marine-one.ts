import * as T from 'three';
import {HELIPAD} from './grounds-layout';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Lightweight VH-92-inspired scenery, animated only during the race. */
export class MarineOne{
 readonly group=new T.Group();private aircraft=new T.Group();private main=new T.Group();private tail=new T.Group();private wash:T.Mesh;private age=0;private launched=false;private wasRacing=false;
 constructor(parent:T.Group){
  const g=this.aircraft;this.group.name='Marine One race departure';this.group.userData.mapExclude=true;this.group.visible=false;this.group.add(g);parent.add(this.group);
  const green=new T.MeshStandardMaterial({color:0x163e35,roughness:.32,metalness:.45}),white=new T.MeshStandardMaterial({color:0xe7e9e3,roughness:.38,metalness:.2}),black=new T.MeshStandardMaterial({color:0x17232a,roughness:.35}),glass=new T.MeshStandardMaterial({color:0x284b5c,roughness:.12,metalness:.65}),silver=new T.MeshStandardMaterial({color:0xabb8b5,roughness:.3,metalness:.8});
  const mesh=(geo:T.BufferGeometry,m:T.Material,x=0,y=0,z=0,owner:T.Group=g)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;owner.add(o);return o;};
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,owner:T.Group=g)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,owner);
  const ellipsoid=(x:number,y:number,z:number,a:number,b:number,c:number,m:T.Material)=>{const o=mesh(new T.SphereGeometry(1,24,14),m,x,y,z);o.scale.set(a,b,c);return o;};
  // Long cabin with tapered nose and tail, white crown and presidential green belly.
  const sections=[[-7.5,.08,.12],[-6.7,1.1,1.1],[-5.2,1.55,1.6],[-3,1.65,1.72],[2.4,1.6,1.65],[4,1.25,1.3],[5,.75,.85]];
  for(const upper of [false,true]){const vertices:number[]=[];
   const point=(i:number,j:number)=>{const [z,rx,ry]=sections[i],a=(upper?0:Math.PI)+j*Math.PI/16;return [Math.cos(a)*rx,2.65+Math.sin(a)*ry,z];};
   for(let i=0;i<sections.length-1;i++)for(let j=0;j<16;j++)for(const [a,b]of [[i,j],[i+1,j],[i,j+1],[i,j+1],[i+1,j],[i+1,j+1]])vertices.push(...point(a,b));
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2));geo.computeVertexNormals();const body=mesh(geo,upper?white:green);(body.material as T.MeshStandardMaterial).side=T.DoubleSide;
  }
  const boom=mesh(new T.CylinderGeometry(.22,.77,7.9,12),green,0,3.45,8.1);boom.rotation.x=Math.PI/2-.13;
  const fin=box(0,5,11.4,.25,3.5,1.7,white);fin.rotation.x=-.22;box(0,3.6,9.4,5,.12,1.2,green);
  for(const side of [-1,1]){
   ellipsoid(side*1.05,4.25,.3,.59,.59,2.5,white);const exhaust=mesh(new T.CylinderGeometry(.38,.38,1,16),black,side*1.05,4.3,2.55);exhaust.rotation.x=Math.PI/2;
   for(const z of [-4.2,-2.6,-1,.6,2.2]){box(side*1.64,3.08,z,.035,.77,1.04,black);box(side*1.663,3.08,z,.022,.64,.89,glass);}
   // Cockpit panes lean into the rounded nose.
   const pane=box(side*.8,3.2,-6.35,1.30,1.13,.08,glass);pane.rotation.y=side*-.42;pane.rotation.x=-.30;
   box(side*1.67,2.08,.4,.028,.038,10.2,white);
   box(side*1.68,2.69,2.55,.04,2.05,.045,silver);box(side*1.68,2.69,3.8,.04,2.05,.045,silver);
   box(side*1.69,3.7,3.17,.04,.04,1.25,silver);box(side*1.72,2.6,3.45,.045,.06,.25,silver);
   ellipsoid(side*1.77,1.25,2.5,.68,.4,2.05,green);
   for(const z of [-4.65,2.5]){const axle=mesh(new T.CylinderGeometry(.095,.095,1.0,8),silver,side*(z<0?.7:1.95),.8,z);axle.rotation.z=side*.22;const wheel=mesh(new T.CylinderGeometry(.39,.39,.28,16),black,side*(z<0?.76:2.07),.4,z);wheel.rotation.z=Math.PI/2;}
  }
  // Lettering is a tiny shared canvas; geometry stays below a small model budget.
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,1024,128);ctx.fillStyle='#f3eee0';ctx.font='48px Georgia';ctx.textAlign='center';ctx.fillText('UNITED STATES OF AMERICA',512,82,1000);const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;
  const decal=new T.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,side:T.DoubleSide});for(const side of [-1,1]){const sign=mesh(new T.PlaneGeometry(7.4,.75),decal,side*1.68,2.2,-.45);sign.rotation.y=side*Math.PI/2;}
  mesh(new T.CylinderGeometry(.16,.22,1.3,12),silver,0,4.8,0);g.add(this.main);this.main.position.set(0,5.48,0);
  for(let i=0;i<4;i++){const blade=box(0,0,-4.5,.32,.055,8.5,black,this.main);const pivot=new T.Group();this.main.remove(blade);pivot.rotation.y=i*Math.PI/2;pivot.add(blade);this.main.add(pivot);}
  g.add(this.tail);this.tail.position.set(.35,5.9,11.35);for(let i=0;i<4;i++){const blade=box(0,0,.82,.045,.17,1.65,black,this.tail);const pivot=new T.Group();this.tail.remove(blade);pivot.rotation.x=i*Math.PI/2;pivot.add(blade);this.tail.add(pivot);}
  const blur=new T.Mesh(new T.CircleGeometry(8.5,48),new T.MeshBasicMaterial({color:0x64736e,transparent:true,opacity:.055,depthWrite:false,side:T.DoubleSide}));blur.rotation.x=-Math.PI/2;blur.position.y=5.49;g.add(blur);
  this.wash=new T.Mesh(new T.RingGeometry(4,11,64),new T.MeshBasicMaterial({color:0xd1cfad,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));this.wash.rotation.x=-Math.PI/2;this.wash.position.set(HELIPAD.x,.15,HELIPAD.z);this.group.add(this.wash);
  // Batch the airframe, keeping only the two rotor assemblies separate.
  g.updateMatrixWorld(true);const batches=new Map<T.Material,T.BufferGeometry[]>();
  for(const o of [...g.children])if(o instanceof T.Mesh){o.updateMatrix();const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrix);const list=batches.get(o.material as T.Material)??[];list.push(geo);batches.set(o.material as T.Material,list);g.remove(o);o.geometry.dispose();}
  for(const [m,parts]of batches){const geo=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());const o=new T.Mesh(geo,m);o.castShadow=true;g.add(o);}
  this.group.traverse(o=>o.userData.dynamic=true);this.reset();
 }
 private reset(){this.age=0;this.launched=false;this.aircraft.position.set(HELIPAD.x,.12,HELIPAD.z);this.aircraft.rotation.set(0,Math.PI,0);this.wash.scale.setScalar(1);}
 update(dt:number,p:T.Vector3,racing:boolean){
  if(!racing){this.group.visible=false;this.wasRacing=false;return;}
  if(!this.wasRacing)this.reset();this.wasRacing=true;this.group.visible=true;
  // Wait until the player approaches the South Lawn rather than departing off-screen.
  if(!this.launched&&Math.hypot(p.x-HELIPAD.x,p.z-HELIPAD.z)<75)this.launched=true;
  if(this.launched)this.age+=dt;
  const t=this.age,speed=T.MathUtils.smoothstep(t,0,4);this.main.rotation.y+=dt*(5+speed*28);this.tail.rotation.x+=dt*(8+speed*40);
  const rise=T.MathUtils.smoothstep(t,4,13),depart=Math.max(0,t-13);
  this.aircraft.position.set(HELIPAD.x+depart*1.1,.12+rise*17+depart*3.3,HELIPAD.z+depart*8);
  this.aircraft.rotation.x=-Math.min(.12,depart*.035);this.aircraft.rotation.z=Math.sin(t*.8)*.006*speed;
  this.wash.visible=t<15&&t>1;this.wash.scale.setScalar(1+(t%2)*.3);(this.wash.material as T.MeshBasicMaterial).opacity=.08*speed*(1-rise);
  if(t>38)this.group.visible=false;
 }
}
