import * as T from 'three';
import {material} from './visuals';
import {SOUTH_FOUNTAIN,NORTH_FOUNTAIN} from './grounds-layout';
import {annualFlowerRing} from './garden-planting';

export const POOL={x:-88,z:36,w:6.706,d:16.459,depth:1.85};
type Solid={x:number;z:number;w:number;d:number;height?:number};
const add=(g:T.Group,geo:T.BufferGeometry,m:T.Material,x=0,y=0,z=0)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.receiveShadow=true;g.add(o);return o;};
const box=(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>add(g,new T.BoxGeometry(w,h,d),m,x,y,z);

/** Physical opening in both ground layers, rather than blue paint over the grass. */
export function lawnWithPoolOpening(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,color:number){
 const left=POOL.x-POOL.w/2,right=POOL.x+POOL.w/2,north=POOL.z-POOL.d/2,south=POOL.z+POOL.d/2;
 const rect=(a:number,b:number,c:number,e:number)=>box(g,(a+b)/2,y,(c+e)/2,b-a,h,e-c,material(color));
 rect(x-w/2,left,z-d/2,z+d/2);rect(right,x+w/2,z-d/2,z+d/2);rect(left,right,z-d/2,north);rect(left,right,south,z+d/2);
}

export class GardenWater{
 private time={value:0};private spray:T.Points;private southSpray:T.Points;private acc=0;
 private drops=new Float32Array(780*3);
 constructor(g:T.Group,solids:Solid[]){
  this.pool(g);this.spray=this.fountain(g,NORTH_FOUNTAIN.x,NORTH_FOUNTAIN.z,NORTH_FOUNTAIN.radius);this.southSpray=this.fountain(g,SOUTH_FOUNTAIN.x,SOUTH_FOUNTAIN.z,SOUTH_FOUNTAIN.radius);this.southSpray.parent!.name='South Lawn fountain beyond the helipad';this.southSpray.geometry=this.southSpray.geometry.clone();
  solids.push({x:POOL.x,z:POOL.z,w:POOL.w,d:POOL.d,height:.18},{x:NORTH_FOUNTAIN.x,z:NORTH_FOUNTAIN.z,w:10,d:10,height:.6},{x:SOUTH_FOUNTAIN.x,z:SOUTH_FOUNTAIN.z,w:14,d:14,height:.6});
 }
 private water(){
  const m=new T.MeshStandardMaterial({color:0x619b9e,roughness:.19,metalness:.24,transparent:true,opacity:.68,depthWrite:false});
  m.onBeforeCompile=shader=>{shader.uniforms.waterTime=this.time;shader.vertexShader='varying vec3 waterPoint;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nwaterPoint = position;');shader.fragmentShader='uniform float waterTime; varying vec3 waterPoint;\n'+shader.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
    float a=waterPoint.x*8.0+waterPoint.z*6.0+waterTime*1.3;
    float b=waterPoint.x*13.0-waterPoint.z*9.0-waterTime*.9;
    normal=normalize(normal+vec3(cos(a)*.06, sin(b)*.06,0.0));`).replace('#include <color_fragment>',`#include <color_fragment>
    float ripple=sin(waterPoint.x*5.0+waterTime)*sin(waterPoint.z*7.0-waterTime*.7);
    diffuseColor.rgb+=vec3(.035,.06,.06)*ripple;`);};
  m.customProgramCacheKey=()=> 'garden-water-v1';return m;
 }
 private pool(parent:T.Group){
  const g=new T.Group();g.name='Recessed swimming pool';parent.add(g);const {x,z,w,d,depth}=POOL;
  const plaster=new T.MeshStandardMaterial({color:0xc0d6cf,roughness:.72}),stone=material(0xe0dccb),tile=material(0x37676e),steel=new T.MeshStandardMaterial({color:0xcad4d5,roughness:.24,metalness:.85});
  box(g,x,-depth,z,w,.12,d,plaster);
  for(const side of [-1,1]){
   box(g,x+side*w/2,-depth/2,z,.14,depth,d,plaster);box(g,x,-depth/2,z+side*d/2,w,depth,.14,plaster);
   box(g,x+side*(w/2+.4),.08,z,.8,.2,d+1.6,stone);box(g,x,.08,z+side*(d/2+.4),w,.2,.8,stone);
   box(g,x+side*(w/2-.09),-.32,z,.025,.35,d,tile);box(g,x,-.32,z+side*(d/2-.09),w,.35,.025,tile);
   // Deck slabs remain outside the basin; fine joints read at a human scale.
   box(g,x+side*(w/2+1.9),.015,z,2.2,.10,d+6,stone);box(g,x,.015,z+side*(d/2+1.9),w+1.6,.10,2.2,stone);
   for(let i=-d/2;i<=d/2;i+=1.5)box(g,x+side*(w/2+1.9),.071,z+i,2.2,.006,.016,material(0xb6b7ac));
  }
  for(let row=-d/2+.5;row<d/2;row+=.5)box(g,x,-depth+.063,z+row,w,.006,.012,material(0xa9c8c2));
  for(let col=-w/2+.5;col<w/2;col+=.5)box(g,x+col,-depth+.064,z,.012,.007,d,material(0xa9c8c2));
  // Entry stairs visible through the water, with stainless handrails.
  for(let i=0;i<4;i++)box(g,x,-.25-i*.39,z-d/2+.45+i*.4,3,.18,.8,plaster);
  for(const side of [-1,1]){
   const curve=new T.CatmullRomCurve3([new T.Vector3(x+side*1.55,.12,z-d/2-1),new T.Vector3(x+side*1.55,.95,z-d/2-.8),new T.Vector3(x+side*1.55,1.0,z-d/2+.2),new T.Vector3(x+side*1.55,-.85,z-d/2+1.8)]);
   add(g,new T.TubeGeometry(curve,20,.035,6,false),steel);
  }
  const geo=new T.PlaneGeometry(w-.18,d-.18);geo.rotateX(-Math.PI/2);const surface=add(g,geo,this.water(),x,-.19,z);surface.name='Pool water below coping';surface.userData.dynamic=true;
  // Canvas chaises with separate seat/back and slender frames, not park benches.
  for(const zz of [z-5,z,z+5]){const chaise=new T.Group();chaise.position.set(x-w/2-1.8,0,zz);parent.add(chaise);const cloth=material(0xe5dfce);box(chaise,0,.4,0,1,.10,1.75,cloth);const back=box(chaise,0,.78,.92,1,.10,1.1,cloth);back.rotation.x=-.62;for(const xx of [-.48,.48])for(const dz of [-.6,.65])box(chaise,xx,.22,dz,.045,.44,.045,steel);}
 }
 private fountain(parent:T.Group,x:number,z:number,r:number){
  const g=new T.Group();g.name='North Lawn spray fountain';g.position.set(x,0,z);parent.add(g);
  const stone=material(0xd3d0c3),dark=material(0x48696b);
  add(g,new T.CylinderGeometry(r,r,.30,72),stone,0,.12);
  add(g,new T.CylinderGeometry(r-.33,r-.33,.04,72),dark,0,.29);
  const rim=add(g,new T.TorusGeometry(r-.16,.18,10,72),stone,0,.38);rim.rotation.x=Math.PI/2;
  const geo=new T.CircleGeometry(r-.35,72);geo.rotateX(-Math.PI/2);const water=add(g,geo,this.water(),0,.36);water.userData.dynamic=true;
  for(let i=0;i<16;i++){const a=i*Math.PI/8;add(g,new T.CylinderGeometry(.055,.065,.18,8),material(0x818b86),Math.cos(a)*2,.40,Math.sin(a)*2);}
  annualFlowerRing(g,r+.20,r+1.05);
  // Real ballistic droplets: no opaque tubular arcs or ornamental tiered pedestal.
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(this.drops,3));geometry.boundingSphere=new T.Sphere(new T.Vector3(0,2,0),6);
  const m=new T.PointsMaterial({color:0xe4f1ed,size:.055,transparent:true,opacity:.64,depthWrite:false,sizeAttenuation:true});
  m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(length(gl_PointCoord-vec2(.5))>.5)discard;');};
  const spray=new T.Points(geometry,m);spray.name='Animated fountain droplets';spray.userData.dynamic=true;g.add(spray);return spray;
 }
 update(dt:number,p:T.Vector3){this.time.value+=dt;this.acc+=dt;if(this.acc<1/30)return;this.acc=0;this.spray.visible=Math.hypot(p.x,p.z-NORTH_FOUNTAIN.z)<120;this.southSpray.visible=Math.hypot(p.x,p.z-SOUTH_FOUNTAIN.z)<120;if(!this.spray.visible&&!this.southSpray.visible)return;
  const t=this.time.value;
  for(let i=0;i<this.drops.length/3;i++){
   const jet=i%17,phase=(t*.72+i*.61803398875)%1,a=jet*Math.PI/8,central=jet===16;
   const radius=central?.18*Math.sin(i*7):2-1.75*phase,height=.45+(central?4.7:3.0)*4*phase*(1-phase),j=i*3;
   this.drops[j]=Math.cos(a)*radius+Math.sin(i*17+t)*.045;this.drops[j+1]=height;this.drops[j+2]=Math.sin(a)*radius+Math.cos(i*11+t)*.045;
  }this.spray.geometry.attributes.position.needsUpdate=true;const south=this.southSpray.geometry.attributes.position as T.BufferAttribute;for(let i=0;i<south.count;i++)south.setXYZ(i,this.drops[i*3]*1.4,this.drops[i*3+1]*.72,this.drops[i*3+2]*1.4);south.needsUpdate=true;
 }
}
