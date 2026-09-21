import * as T from 'three';
import {GolfCart} from './golf-cart';
import type {StaffActor} from './npc-model';

export const RACERS=[{id:'marco',name:'Marco Rubio',color:0x538bab,speed:7.05},{id:'bessent',name:'Scott Bessent',color:0xbd6354,speed:6.75},{id:'burgum',name:'Doug Burgum',color:0x5b9276,speed:7.3}];
const TAU=Math.PI*2,SECTOR=TAU/8;
export const RACE_LAPS=2;
export function racePoint(angle:number,lane=0){return new T.Vector3((49.5+lane)*Math.sin(angle),0,56+(43.5+lane)*Math.cos(angle));}
export function raceHeading(angle:number){return Math.atan2(49.5*Math.cos(angle),43.5*Math.sin(angle));}
export function raceDeviation(p:T.Vector3){const a=Math.atan2(p.x/49.5,(p.z-56)/43.5);return p.distanceTo(racePoint(a));}
export type RaceState={countdown:number;seconds:number;lap:number;gates:number;rank:number;finished:boolean;offRoad:boolean;standings:{name:string;progress:number;color:number}[];next:{x:number;z:number};message:string};

/** Pose the existing Rocketbox skeleton in the seat, preserving shared assets. */
export function seatRaceDriver(actor:StaffActor,cart:T.Group){
 const root=actor.object;cart.add(root);root.scale.multiplyScalar(1.9/3);cart.updateMatrixWorld(true);
 const aim=(boneName:string,childName:string,dir:T.Vector3)=>{const bone=root.getObjectByName(boneName),child=root.getObjectByName(childName);if(!bone?.parent||!child)return;cart.updateMatrixWorld(true);const a=bone.getWorldPosition(new T.Vector3()),b=child.getWorldPosition(new T.Vector3()),target=dir.applyQuaternion(cart.getWorldQuaternion(new T.Quaternion())).normalize(),delta=new T.Quaternion().setFromUnitVectors(b.sub(a).normalize(),target),world=bone.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(bone.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(delta.multiply(world)));};
 for(const side of ['L','R']){aim(`Bip01_${side}_Thigh`,`Bip01_${side}_Calf`,new T.Vector3(0,0,-1));aim(`Bip01_${side}_Calf`,`Bip01_${side}_Foot`,new T.Vector3(0,-1,.03));aim(`Bip01_${side}_UpperArm`,`Bip01_${side}_Forearm`,new T.Vector3(0,-1,-.35));aim(`Bip01_${side}_Forearm`,`Bip01_${side}_Hand`,new T.Vector3(0,.1,-1));}
 cart.updateMatrixWorld(true);const hip=root.getObjectByName('Bip01_Pelvis');if(hip){const p=cart.worldToLocal(hip.getWorldPosition(new T.Vector3()));root.position.add(new T.Vector3(-.27-p.x,.78-p.y,.12-p.z));}cart.updateMatrixWorld(true);
}

export class CartRace {
 readonly group=new T.Group();readonly rivals:{cart:GolfCart;actor:StaffActor;angle:number;lane:number;name:string;color:number;speed:number}[]=[];
 private gates:T.Group[]=[];private ownGeometries=new Set<T.BufferGeometry>();private ownMaterials=new Set<T.Material>();private ownTextures=new Set<T.Texture>();
 countdown=3;seconds=0;passed=0;finished=false;rank=4;message='';
 constructor(template:T.Group,actors:StaffActor[]){
  this.group.name='Cabinet Grand Prix';this.group.userData.mapExclude=true;
  for(const [i,data]of RACERS.entries()){
   const clone=template.clone(true),materials=new Map<T.Material,T.Material>();clone.traverse(o=>{if(o instanceof T.Mesh){const convert=(m:T.Material)=>{if(m.name!=='Champagne gold body')return m;if(!materials.has(m)){const copy=m.clone() as T.MeshStandardMaterial;copy.color.setHex(data.color);materials.set(m,copy);this.ownMaterials.add(copy);}return materials.get(m)!;};o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);}});
   const cart=new GolfCart(clone);this.group.add(cart.object);seatRaceDriver(actors[i],cart.object);
   this.rivals.push({cart,actor:actors[i],angle:0,lane:i===1?1.15:-1.15,...data});
   const canvas=document.createElement('canvas');canvas.width=384;canvas.height=64;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#102d36e8';ctx.fillRect(0,0,384,64);ctx.fillStyle='#fff1c7';ctx.font='26px Arial';ctx.textAlign='center';ctx.fillText(data.name,192,43);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;this.ownTextures.add(texture);const material=new T.SpriteMaterial({map:texture});this.ownMaterials.add(material);const tag=new T.Sprite(material);tag.position.set(0,2.55,0);tag.scale.set(2.5,.42,1);cart.object.add(tag);
  }
  const post=new T.BoxGeometry(.14,4.3,.14),crossbar=new T.BoxGeometry(8,.2,.2);this.ownGeometries.add(post);this.ownGeometries.add(crossbar);
  for(let i=0;i<8;i++){const gate=new T.Group(),material=new T.MeshBasicMaterial({color:i===1?0x4effd1:0xd2af5d});this.ownMaterials.add(material);for(const x of [-4,4]){const m=new T.Mesh(post,material);m.position.set(x,2.15,0);gate.add(m);}const bar=new T.Mesh(crossbar,material);bar.position.y=4.3;gate.add(bar);gate.position.copy(racePoint(i*SECTOR));gate.rotation.y=-raceHeading(i*SECTOR);this.group.add(gate);this.gates.push(gate);}
  const coneGeo=new T.ConeGeometry(.18,.55,6),coneMat=new T.MeshStandardMaterial({color:0xefb653,roughness:.8});this.ownGeometries.add(coneGeo);this.ownMaterials.add(coneMat);const cones=new T.InstancedMesh(coneGeo,coneMat,64),matrix=new T.Matrix4();for(let i=0;i<64;i++){const p=racePoint(Math.floor(i/2)*TAU/32,i%2?3:-3);matrix.makeTranslation(p.x,.275,p.z);cones.setMatrixAt(i,matrix);}this.group.add(cones);
  this.reset();
 }
 reset(){this.countdown=3;this.seconds=0;this.passed=0;this.finished=false;this.rank=4;this.message='';this.group.visible=true;this.rivals.forEach((r,i)=>{r.angle=.085+i*.09;r.cart.motor.reset();r.cart.placeOnCourse(racePoint(r.angle,r.lane),raceHeading(r.angle),0);});this.colorGates();}
 private colorGates(){this.gates.forEach((g,i)=>g.children.forEach(o=>((o as T.Mesh).material as T.MeshBasicMaterial).color.setHex(i===(this.passed+1)%8?0x35ffd2:0xb9a46f)));}
 ready(){return this.countdown<=0&&!this.finished;}
 resolveContacts(cart:GolfCart,clear:(x:number,z:number)=>boolean){for(const r of this.rivals){const away=cart.object.position.clone().sub(r.cart.object.position);away.y=0;const distance=away.length();if(distance>=2.5)continue;if(distance<.01)away.set(Math.cos(cart.motor.heading),0,Math.sin(cart.motor.heading));else away.divideScalar(distance);const next=cart.object.position.clone().addScaledVector(away,Math.min(.18,2.5-distance));if(clear(next.x,next.z))cart.object.position.copy(next);cart.motor.speed*=.92;}}
 snapshot(p:T.Vector3):RaceState{const theta=(Math.atan2(p.x/49.5,(p.z-56)/43.5)+TAU)%TAU,previous=(this.passed%8)*SECTOR,part=T.MathUtils.clamp(((theta-previous+TAU)%TAU)/SECTOR,0,1),progress=this.finished?16:this.passed+part;const standings=[{name:'Donald Trump',progress,color:0xe5b84c},...this.rivals.map(r=>({name:r.name,progress:r.angle/SECTOR,color:r.color}))].sort((a,b)=>b.progress-a.progress);if(!this.finished)this.rank=standings.findIndex(s=>s.name==='Donald Trump')+1;const next=racePoint(((this.passed+1)%8)*SECTOR);return {countdown:Math.ceil(this.countdown),seconds:this.seconds,lap:Math.min(2,Math.floor(this.passed/8)+1),gates:this.passed,rank:this.rank,finished:this.finished,offRoad:raceDeviation(p)>5,standings,next:{x:next.x,z:next.z},message:this.message};}
 update(dt:number,p:T.Vector3){if(this.finished)return;if(this.countdown>0){this.countdown=Math.max(0,this.countdown-dt);return;}this.seconds+=dt;
  for(const r of this.rivals){if(r.angle>=TAU*RACE_LAPS)continue;const toPlayer=p.clone().sub(r.cart.object.position),forward=new T.Vector3(Math.sin(raceHeading(r.angle)),0,-Math.cos(raceHeading(r.angle)));if(toPlayer.length()<6&&toPlayer.dot(forward)>0){const radial=new T.Vector3(Math.sin(r.angle),0,Math.cos(r.angle)),side=p.clone().sub(racePoint(r.angle)).dot(radial);r.lane=T.MathUtils.damp(r.lane,side>0?-1.2:1.2,2,dt);}const da=r.speed*dt/Math.hypot((49.5+r.lane)*Math.cos(r.angle),(43.5+r.lane)*Math.sin(r.angle)),next=racePoint(r.angle+da,r.lane);if(next.distanceTo(p)<2.2)continue;r.angle+=da;r.cart.motor.speed=r.speed;r.cart.placeOnCourse(next,raceHeading(r.angle),r.speed*dt);}
  const next=racePoint(((this.passed+1)%8)*SECTOR);if(p.distanceTo(next)<5.5){this.passed++;this.message='';this.colorGates();if(this.passed===16){this.snapshot(p);this.finished=true;this.message=this.rank===1?'You won the Cabinet Grand Prix!':`Finished ${this.rank} of 4. Race again for first place.`;}}
 }
 recover(cart:GolfCart){const angle=(this.passed%8)*SECTOR+.025;cart.motor.reset();cart.placeOnCourse(racePoint(angle),raceHeading(angle),0);this.seconds+=3;this.message='Back on course · 3 second penalty';}
 stop(){this.group.visible=false;}
 dispose(){this.group.removeFromParent();for(const r of this.rivals){r.actor.object.removeFromParent();r.actor.dispose();}this.group.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});this.ownGeometries.forEach(g=>g.dispose());this.ownMaterials.forEach(m=>m.dispose());this.ownTextures.forEach(t=>t.dispose());}
}
