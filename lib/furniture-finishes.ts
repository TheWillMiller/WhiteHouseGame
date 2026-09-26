import * as T from 'three';
import {material} from './visuals';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const add=(g:T.Group,geo:T.BufferGeometry,color:number,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
const box=(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>add(g,new RoundedBoxGeometry(w,h,d,1,Math.min(.025,w/4,h/4,d/4)),c,x,y,z);
export function estateBench(parent:T.Group,x:number,z:number,rotation=0){
 const g=new T.Group();g.name='Slatted teak garden bench';g.position.set(x,0,z);g.rotation.y=rotation;parent.add(g);
 for(let i=0;i<5;i++){box(g,0,.48,-.29+i*.135,2,.045,.11,0x8b7653);const back=box(g,0,.72+i*.11,.34+i*.028,2,.075,.042,0x8b7653);back.rotation.x=.12;}
 for(const side of [-1,1]){for(const zz of [-.24,.32]){const leg=box(g,side*.84,.24,zz,.075,.48,.075,0x263a35);leg.rotation.x=zz>0?.12:-.12;}box(g,side*.96,.7,0,.07,.06,.72,0x263a35);box(g,side*.96,.58,-.26,.05,.25,.05,0x263a35);box(g,side*.86,.81,.38,.055,.76,.065,0x263a35);}
}
export function pottedPalm(parent:T.Group,x:number,y:number,z:number){
 const g=new T.Group();g.name='Glazed planter and foliage';g.position.set(x,y,z);parent.add(g);
 add(g,new T.LatheGeometry([new T.Vector2(.25,0),new T.Vector2(.29,.05),new T.Vector2(.31,.12),new T.Vector2(.40,.55),new T.Vector2(.42,.63),new T.Vector2(.36,.65)],20),0xc9c6b6);
 add(g,new T.CylinderGeometry(.355,.355,.025,20),0x4a4336,0,.61);
 for(let i=0;i<14;i++){const angle=i*2.399,h=.75+(i%4)*.18,r=.44+(i%3)*.10,points=[new T.Vector3(0,.6,0),new T.Vector3(Math.cos(angle)*r*.3,h,Math.sin(angle)*r*.3),new T.Vector3(Math.cos(angle)*r,h-.1,Math.sin(angle)*r)];
  add(g,new T.TubeGeometry(new T.CatmullRomCurve3(points),6,.012,4,false),0x526947);
  const leaf=add(g,new T.SphereGeometry(1,8,6),i%2?0x45664a:0x607957,Math.cos(angle)*r*.74,h-.05,Math.sin(angle)*r*.74);leaf.scale.set(.13,.022,.40);leaf.rotation.set(.26,angle-Math.PI/2,.12);
 }
}
export function ceilingFixture(g:T.Group,x:number,z:number){
 add(g,new T.CylinderGeometry(.3,.34,.06,20),0xb99c50,x,4.5,z);
 add(g,new T.SphereGeometry(.29,16,8,0,Math.PI*2,Math.PI/2,Math.PI/2),0xfff1d1,x,4.46,z);
}
