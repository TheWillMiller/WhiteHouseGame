import * as T from 'three';
import type {NPC} from './world-data';
import {material} from './visuals';
export function makeStaff(options:Partial<NPC>,merge:(g:T.Group)=>void){
 const g=new T.Group();g.name=options.name??'White House staff';
 const skin=options.skin??0xd0a185,suit=options.suit??0x293744,hair=options.hair??0x5a493a;
 const shape=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number)=>{const m=new T.Mesh(new T.SphereGeometry(1,10,8),material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);g.add(m);return m;};
 const block=(x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(c));m.position.set(x,y,z);g.add(m);return m;};
 // Human proportions: smaller head, longer legs, relaxed bent elbows.
 shape(0,1.91,0,.33,.49,.21,suit);block(0,1.61,0,.59,.44,.40,suit);
 block(0,2.10,-.219,.27,.49,.025,0xf0efeb);
 for(const side of [-1,1]){const lapel=block(side*.15,2.09,-.24,.10,.51,.035,suit);lapel.rotation.z=side*-.31;}
 block(0,2.05,-.245,.063,.41,.025,options.female?0xc4b07c:0x526a7d);
 shape(0,2.40,0,.11,.16,.10,skin);
 shape(0,2.67,-.006,.205,.28,.185,skin);shape(0,2.54,-.10,.145,.13,.105,skin);
 shape(0,2.87,.025,.21,.10,.18,hair);shape(0,2.74,.115,.198,.19,.093,hair);
 if(options.female)for(const side of [-1,1])shape(side*.18,2.64,.06,.055,.23,.14,hair);
 for(const side of [-1,1]){
  shape(side*.21,2.64,.015,.037,.073,.035,skin);
  block(side*.083,2.70,-.18,.041,.012,.012,0x484644);block(side*.084,2.74,-.173,.075,.012,.013,hair);
  const leg=new T.Mesh(new T.CylinderGeometry(.13,.108,1.21,8),material(suit));leg.position.set(side*.16,.76,0);leg.scale.z=1.2;g.add(leg);shape(side*.16,.13,-.07,.16,.12,.26,0x292b2d);
  const upper=shape(side*.35,2.02,.02,.115,.29,.13,suit);upper.rotation.z=side*.13;
  const lower=shape(side*.38,1.62,-.045,.095,.27,.11,suit);lower.rotation.x=-.17;
  block(side*.38,1.37,-.09,.16,.06,.18,0xeeece7);shape(side*.38,1.26,-.12,.075,.12,.065,skin);
 }
 shape(0,2.64,-.19,.034,.066,.048,skin);block(0,2.54,-.192,.074,.009,.009,0x885e52);
 if(options.beard)shape(0,2.51,-.067,.15,.07,.126,hair);
 if(options.hat){shape(0,2.93,.01,.25,.13,.21,options.suit===0xf6f2df?0xf5f0e3:0xd0a047);block(0,2.90,-.13,.48,.03,.35,options.suit===0xf6f2df?0xf5f0e3:0xd0a047);}
 block(-.20,2.21,-.226,.048,.045,.016,0xb6a077);merge(g);return g;
}
