import * as T from 'three';
import {GolfCart} from './golf-cart';
import type {StaffActor} from './npc-model';
import {racePoint,raceHeading,raceDeviation,courseMap,projectCourse,courseGround,buildTrackSurface,rampAt,COURSE_LENGTH,TAU,CHECKPOINTS,RAMPS,BOOST_PADS,ITEM_BOXES} from './race-course';
export {racePoint,raceHeading,raceDeviation} from './race-course';
export const RACERS=[{id:'marco',name:'Marco Rubio',color:0x538bab,speed:13.1},{id:'bessent',name:'Scott Bessent',color:0xbd6354,speed:12.7},{id:'burgum',name:'Doug Burgum',color:0x5b9276,speed:13.5}];
export const RACE_LAPS=2;
const SECTOR=TAU/CHECKPOINTS,MAP_PATH=courseMap.map(p=>p.join(',')).join(' ');
export const POWERUPS={
 gold:{name:'Gold Rush',detail:'Four seconds of full boost',color:0xffcc43},
 shield:{name:'Executive Shield',detail:'Six seconds of bump protection',color:0x64fbd2},
 deal:{name:'Art of the Deal',detail:'Slow nearby rivals for four seconds',color:0xcfa6ff}
} as const;
export type Powerup=keyof typeof POWERUPS;
export type RaceState={countdown:number;seconds:number;lap:number;gates:number;rank:number;finished:boolean;offRoad:boolean;standings:{name:string;progress:number;color:number}[];next:{x:number;z:number};message:string;boost:number;boosting:boolean;item:Powerup|null;effect:string;airborne:boolean;speed:number;length:number;route:string;itemName:string;itemDescription:string};
/** Pose the existing Rocketbox skeleton in the seat, preserving shared assets. */
export function seatRaceDriver(actor:StaffActor,cart:T.Group){
 const root=actor.object;cart.add(root);root.scale.multiplyScalar(1.9/3);cart.updateMatrixWorld(true);
 const aim=(boneName:string,childName:string,dir:T.Vector3)=>{const bone=root.getObjectByName(boneName),child=root.getObjectByName(childName);if(!bone?.parent||!child)return;cart.updateMatrixWorld(true);const a=bone.getWorldPosition(new T.Vector3()),b=child.getWorldPosition(new T.Vector3()),target=dir.applyQuaternion(cart.getWorldQuaternion(new T.Quaternion())).normalize(),delta=new T.Quaternion().setFromUnitVectors(b.sub(a).normalize(),target),world=bone.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(bone.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(delta.multiply(world)));};
 for(const side of ['L','R']){aim(`Bip01_${side}_Thigh`,`Bip01_${side}_Calf`,new T.Vector3(0,0,-1));aim(`Bip01_${side}_Calf`,`Bip01_${side}_Foot`,new T.Vector3(0,-1,.03));aim(`Bip01_${side}_UpperArm`,`Bip01_${side}_Forearm`,new T.Vector3(0,-1,-.35));aim(`Bip01_${side}_Forearm`,`Bip01_${side}_Hand`,new T.Vector3(0,.1,-1));}
 cart.updateMatrixWorld(true);const hip=root.getObjectByName('Bip01_Pelvis');if(hip){const p=cart.worldToLocal(hip.getWorldPosition(new T.Vector3()));root.position.add(new T.Vector3(-.27-p.x,.78-p.y,.12-p.z));}cart.updateMatrixWorld(true);
}

export class CartRace {
 readonly group=new T.Group();
 readonly rivals:{cart:GolfCart;actor:StaffActor;angle:number;lane:number;name:string;color:number;speed:number;slow:number}[]=[];
 private gates:T.Group[]=[];
 private ownGeometries=new Set<T.BufferGeometry>();private ownMaterials=new Set<T.Material>();private ownTextures=new Set<T.Texture>();
 private pickups:{object:T.Group;angle:number;cooldown:number}[]=[];
 private shieldMesh:T.Mesh;private flames:T.Group;private pulse:T.Mesh;
 private padCooldown=0;private vy=0;private lastRamp=false;private itemHeld=false;private effectTime=0;private speed=0;
 private turbo=0;private shield=0;private pulseTime=0;
 countdown=3;seconds=0;passed=0;finished=false;rank=4;message='';boost=100;boosting=false;item:Powerup|null=null;airborne=false;
 constructor(template:T.Group,actors:StaffActor[]){
  this.group.name='Cabinet Grand Prix';this.group.userData.mapExclude=true;
  for(const [i,data]of RACERS.entries()){
   const clone=template.clone(true),materials=new Map<T.Material,T.Material>();
   clone.traverse(o=>{if(o instanceof T.Mesh){const convert=(m:T.Material)=>{if(m.name!=='Champagne gold body')return m;if(!materials.has(m)){const copy=m.clone() as T.MeshStandardMaterial;copy.color.setHex(data.color);materials.set(m,copy);this.ownMaterials.add(copy);}return materials.get(m)!;};o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);}});
   const cart=new GolfCart(clone);this.group.add(cart.object);seatRaceDriver(actors[i],cart.object);
   this.rivals.push({cart,actor:actors[i],angle:0,lane:i===1?1.25:-1.25,slow:0,...data});
   const tag=this.sign(data.name,2.5,.42);tag.position.set(0,2.55,0);cart.object.add(tag);
  }
  const road=this.mesh(buildTrackSurface(),this.material(0x39474a));road.receiveShadow=true;this.group.add(road);
  const coneGeo=this.geometry(new T.ConeGeometry(.18,.55,6)),coneMat=this.material(0xffb849),cones=new T.InstancedMesh(coneGeo,coneMat,384),matrix=new T.Matrix4();
  for(let i=0;i<384;i++){const p=racePoint(Math.floor(i/2)*TAU/192,i%2?3.45:-3.45);matrix.makeTranslation(p.x,p.y+.275,p.z);cones.setMatrixAt(i,matrix);}this.group.add(cones);
  // Shared geometry and instancing keep this temporary course inexpensive.
  const curbGeo=this.geometry(new T.BoxGeometry(.16,.07,2.2)),curbs=new T.InstancedMesh(curbGeo,this.material(0xffdb77),512),dummy=new T.Object3D();
  for(let i=0;i<512;i++){const angle=Math.floor(i/2)/256*TAU;dummy.position.copy(racePoint(angle,i%2?3.12:-3.12));dummy.position.y+=.055;dummy.rotation.y=-raceHeading(angle);dummy.updateMatrix();curbs.setMatrixAt(i,dummy.matrix);}this.group.add(curbs);
  const post=this.geometry(new T.BoxGeometry(.14,3.4,.14)),bar=this.geometry(new T.BoxGeometry(6.8,.16,.16));
  for(let i=0;i<CHECKPOINTS;i++){const gate=new T.Group(),material=this.material(0xd2af5d,true);for(const x of [-3.4,3.4]){const m=this.mesh(post,material);m.position.set(x,1.7,0);gate.add(m);}const m=this.mesh(bar,material);m.position.y=3.4;gate.add(m);gate.position.copy(racePoint(i*SECTOR));gate.rotation.y=-raceHeading(i*SECTOR);this.group.add(gate);this.gates.push(gate);}
  const start=this.sign('CABINET GRAND PRIX · START / FINISH',7,.6);start.position.copy(racePoint(0));start.position.y+=3.9;this.group.add(start);
  for(const r of RAMPS){
   const g=new T.BufferGeometry(),w=3.05,l=r.length/2,h=r.height;
   g.setAttribute('position',new T.Float32BufferAttribute([-w,0,l,w,0,l,-w,h,-l,w,0,l,w,h,-l,-w,h,-l,-w,0,l,-w,h,-l,-w,0,-l,w,0,l,w,0,-l,w,h,-l,-w,h,-l,w,h,-l,-w,0,-l,w,h,-l,w,0,-l,-w,0,-l],3));g.computeVertexNormals();
   const ramp=this.mesh(this.geometry(g),this.material(0xe6b94f));ramp.position.copy(racePoint(r.angle));ramp.rotation.y=-raceHeading(r.angle);ramp.receiveShadow=true;this.group.add(ramp);
   const sign=this.sign('JUMP ↑',2.2,.6);sign.position.copy(racePoint(r.angle,-4.2));sign.position.y+=1.8;this.group.add(sign);
  }
  const padGeo=this.geometry(new T.PlaneGeometry(5.8,4)),padMat=this.material(0x18dbb1,true);
  for(const a of BOOST_PADS){const pad=this.mesh(padGeo,padMat);pad.rotation.x=-Math.PI/2;pad.rotation.z=raceHeading(a);pad.position.copy(racePoint(a));pad.position.y+=.05;this.group.add(pad);const label=this.sign('BOOST »',2,.5);label.position.copy(racePoint(a,-4.2));label.position.y+=1.3;this.group.add(label);}
  const boxGeo=this.geometry(new T.BoxGeometry(.9,.9,.9)),boxMat=this.material(0xffca49,true);
  for(const angle of ITEM_BOXES){const object=new T.Group(),box=this.mesh(boxGeo,boxMat);box.rotation.z=Math.PI/4;object.add(box);const symbol=this.sign('?',.85,.85);symbol.position.y=.1;object.add(symbol);object.position.copy(racePoint(angle));object.position.y+=1.3;this.group.add(object);this.pickups.push({object,angle,cooldown:0});}
  const bubbleMat=new T.MeshBasicMaterial({color:0x60ffcf,transparent:true,opacity:.18,depthWrite:false});this.ownMaterials.add(bubbleMat);
  this.shieldMesh=this.mesh(this.geometry(new T.SphereGeometry(2,16,10)),bubbleMat);this.group.add(this.shieldMesh);
  this.flames=new T.Group();const flameGeo=this.geometry(new T.ConeGeometry(.22,1.7,7)),flameMat=this.material(0x75fff0,true);
  for(const x of [-.55,.55]){const flame=this.mesh(flameGeo,flameMat);flame.rotation.x=Math.PI/2;flame.position.set(x,.4,1.9);this.flames.add(flame);}this.group.add(this.flames);
  const pulseMat=new T.MeshBasicMaterial({color:0xcda0ff,transparent:true,opacity:.8,depthWrite:false});this.ownMaterials.add(pulseMat);
  this.pulse=this.mesh(this.geometry(new T.TorusGeometry(1,.04,4,40)),pulseMat);this.pulse.rotation.x=-Math.PI/2;this.group.add(this.pulse);
  this.reset();
 }
 private geometry<G extends T.BufferGeometry>(g:G){this.ownGeometries.add(g);return g;}
 private material(color:number,basic=false){const m=basic?new T.MeshBasicMaterial({color,side:T.DoubleSide}):new T.MeshStandardMaterial({color,roughness:.85,side:T.DoubleSide});this.ownMaterials.add(m);return m;}
 private mesh(g:T.BufferGeometry,m:T.Material){return new T.Mesh(g,m);}
 private sign(text:string,w:number,h:number){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#102d36ee';ctx.fillRect(0,0,512,96);ctx.fillStyle='#fff1c7';ctx.font='bold 32px Arial';ctx.textAlign='center';ctx.fillText(text,256,61,495);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;this.ownTextures.add(texture);const material=new T.SpriteMaterial({map:texture});this.ownMaterials.add(material);const tag=new T.Sprite(material);tag.scale.set(w,h,1);return tag;}
 reset(){this.countdown=3;this.seconds=0;this.passed=0;this.finished=false;this.rank=4;this.message='';this.boost=100;this.boosting=false;this.item=null;this.airborne=false;this.vy=0;this.lastRamp=false;this.itemHeld=false;this.turbo=0;this.shield=0;this.padCooldown=0;this.effectTime=0;this.pulseTime=0;this.group.visible=true;this.shieldMesh.visible=false;this.flames.visible=false;this.pulse.visible=false;this.pickups.forEach(p=>{p.cooldown=0;p.object.visible=true;});this.rivals.forEach((r,i)=>{r.angle=(3.5+i*3.5)/COURSE_LENGTH*TAU;r.slow=0;r.cart.motor.reset();r.cart.placeOnCourse(racePoint(r.angle,r.lane),raceHeading(r.angle),0);});this.colorGates();}
 private colorGates(){this.gates.forEach((g,i)=>g.children.forEach(o=>((o as T.Mesh).material as T.MeshBasicMaterial).color.setHex(i===(this.passed+1)%CHECKPOINTS?0x35ffd2:0xb9a46f)));}
 ready(){return this.countdown<=0&&!this.finished;}
 private announce(message:string){this.message=message;this.effectTime=3;}
 useItem(cart:GolfCart){if(!this.ready()||!this.item)return false;const item=this.item;this.item=null;if(item==='gold'){this.turbo=4;this.announce('Gold Rush!');}else if(item==='shield'){this.shield=6;this.announce('Executive Shield up');}else{let count=0;for(const r of this.rivals)if(r.cart.object.position.distanceTo(cart.object.position)<22){r.slow=4;count++;}this.pulseTime=.8;this.pulse.position.copy(cart.object.position);this.pulse.position.y+=.4;this.announce(count?'Deal struck · rivals slowed!':'No rivals close enough');}return true;}
 beforeDrive(dt:number,cart:GolfCart,boostHeld:boolean,itemHeld:boolean){
  if(itemHeld&&!this.itemHeld)this.useItem(cart);this.itemHeld=itemHeld;
  if(!this.ready()){this.boosting=false;cart.motor.maxForwardSpeed=14;return;}
  this.turbo=Math.max(0,this.turbo-dt);this.shield=Math.max(0,this.shield-dt);this.padCooldown=Math.max(0,this.padCooldown-dt);this.effectTime=Math.max(0,this.effectTime-dt);if(!this.effectTime)this.message='';
  this.boosting=this.turbo>0||(boostHeld&&this.boost>1&&cart.motor.speed>1);
  this.boost=T.MathUtils.clamp(this.boost+(this.boosting&&this.turbo<=0?-34:16)*dt,0,100);
  cart.motor.maxForwardSpeed=this.boosting?22:14;
  // Boost builds speed quickly without teleporting the vehicle.
  if(this.boosting&&cart.motor.speed>0)cart.motor.speed=Math.min(22,cart.motor.speed+12*dt);
 }
 afterDrive(dt:number,cart:GolfCart){
  if(!this.ready())return;
  const p=cart.object.position,ground=courseGround(p.x,p.z),ramp=rampAt(p),wasRamp=this.lastRamp;
  if(!this.airborne&&ramp){p.y=ground+ramp.height;cart.object.rotation.x=Math.atan(ramp.ramp.height/ramp.ramp.length);this.lastRamp=true;}
  else{
   if(wasRamp&&!this.airborne&&cart.motor.speed>5){this.airborne=true;this.vy=4.4+Math.abs(cart.motor.speed)*.13;this.announce('Air time!');}
   this.lastRamp=false;
   if(this.airborne){this.vy-=12*dt;p.y+=this.vy*dt;cart.object.rotation.x=T.MathUtils.damp(cart.object.rotation.x,this.vy*.035,7,dt);if(p.y<=ground){p.y=ground;this.airborne=false;this.vy=0;cart.object.rotation.x=0;this.boost=Math.min(100,this.boost+15);}}
   else{p.y=ground;cart.object.rotation.x=T.MathUtils.damp(cart.object.rotation.x,0,10,dt);}
  }
  if(!this.airborne&&this.padCooldown<=0&&BOOST_PADS.some(a=>{const c=racePoint(a);return Math.hypot(p.x-c.x,p.z-c.z)<3;})){this.turbo=Math.max(this.turbo,1.8);this.padCooldown=3;this.announce('Boost pad!');}
  for(const [i,pickup]of this.pickups.entries()){
   pickup.cooldown=Math.max(0,pickup.cooldown-dt);pickup.object.visible=pickup.cooldown===0;pickup.object.rotation.y+=dt;pickup.object.position.y=courseGround(pickup.object.position.x,pickup.object.position.z)+1.3+Math.sin(this.seconds*3+i)*.15;
   if(!this.item&&!pickup.cooldown&&Math.hypot(p.x-pickup.object.position.x,p.z-pickup.object.position.z)<3&&p.y<2){this.item=(['gold','shield','deal'] as const)[(i+Math.floor(this.passed/CHECKPOINTS))%3];pickup.cooldown=8;pickup.object.visible=false;this.announce(POWERUPS[this.item].name+' ready');}
  }
  this.shieldMesh.visible=this.shield>0;this.shieldMesh.position.copy(p).add(new T.Vector3(0,1,0));
  this.flames.visible=this.boosting;this.flames.position.copy(p);this.flames.rotation.copy(cart.object.rotation);
  this.pulseTime=Math.max(0,this.pulseTime-dt);this.pulse.visible=this.pulseTime>0;this.pulse.scale.setScalar(1+(1-this.pulseTime/.8)*22);
  this.speed=Math.round(Math.abs(cart.motor.speed)*3.6);
 }
 resolveContacts(cart:GolfCart,clear:(x:number,z:number)=>boolean){if(this.airborne||this.shield>0)return;for(const r of this.rivals){const away=cart.object.position.clone().sub(r.cart.object.position);away.y=0;const distance=away.length();if(distance>=2.5)continue;if(distance<.01)away.set(Math.cos(cart.motor.heading),0,Math.sin(cart.motor.heading));else away.divideScalar(distance);const next=cart.object.position.clone().addScaledVector(away,Math.min(.18,2.5-distance));if(clear(next.x,next.z))cart.object.position.copy(next);cart.motor.speed*=.94;}}
 snapshot(p:T.Vector3):RaceState{const theta=projectCourse(p).angle,previous=(this.passed%CHECKPOINTS)*SECTOR,part=T.MathUtils.clamp(((theta-previous+TAU)%TAU)/SECTOR,0,1),progress=this.finished?CHECKPOINTS*RACE_LAPS:this.passed+part;const standings=[{name:'Donald Trump',progress,color:0xe5b84c},...this.rivals.map(r=>({name:r.name,progress:r.angle/SECTOR,color:r.color}))].sort((a,b)=>b.progress-a.progress);if(!this.finished)this.rank=standings.findIndex(s=>s.name==='Donald Trump')+1;const next=racePoint(((this.passed+1)%CHECKPOINTS)*SECTOR);return {countdown:Math.ceil(this.countdown),seconds:this.seconds,lap:Math.min(RACE_LAPS,Math.floor(this.passed/CHECKPOINTS)+1),gates:this.passed,rank:this.rank,finished:this.finished,offRoad:raceDeviation(p)>4.5,standings,next:{x:next.x,z:next.z},message:this.message,boost:Math.round(this.boost),boosting:this.boosting,item:this.item,effect:this.shield>0?'Shield':this.turbo>0?'Boost':'',airborne:this.airborne,speed:this.speed,length:Math.round(COURSE_LENGTH),route:MAP_PATH,itemName:this.item?POWERUPS[this.item].name:"Item",itemDescription:this.item?POWERUPS[this.item].detail:"Collect a gold mystery box"};}
 update(dt:number,p:T.Vector3){if(this.finished)return;if(this.countdown>0){this.countdown=Math.max(0,this.countdown-dt);return;}this.seconds+=dt;
  for(const r of this.rivals){if(r.angle>=TAU*RACE_LAPS)continue;r.slow=Math.max(0,r.slow-dt);const toPlayer=p.clone().sub(r.cart.object.position),heading=raceHeading(r.angle),forward=new T.Vector3(Math.sin(heading),0,-Math.cos(heading));if(toPlayer.length()<9&&toPlayer.dot(forward)>0){const side=p.clone().sub(racePoint(r.angle)).dot(new T.Vector3(Math.cos(heading),0,Math.sin(heading)));r.lane=T.MathUtils.damp(r.lane,side>0?-1.25:1.25,2,dt);}
   const pad=BOOST_PADS.some(a=>Math.abs(((r.angle-a)%TAU+TAU)%TAU)<.045),speed=r.speed*(r.slow>0?.45:pad?1.4:1),da=speed*dt/COURSE_LENGTH*TAU,next=racePoint(r.angle+da,r.lane);if(Math.hypot(next.x-p.x,next.z-p.z)<2.2&&p.y<2)continue;r.angle+=da;
   const ramp=rampAt(next);if(ramp)next.y+=ramp.height;else{for(const j of RAMPS){const distance=((r.angle-j.angle+TAU)%TAU)/TAU*COURSE_LENGTH-j.length/2;if(distance>=0&&distance<speed*.9){const t=distance/speed;next.y+=Math.max(0,j.height+4.4*t-6*t*t);break;}}}
   r.cart.motor.speed=speed;r.cart.placeOnCourse(next,raceHeading(r.angle),speed*dt);r.cart.object.rotation.x=ramp?Math.atan(ramp.ramp.height/ramp.ramp.length):0;
  }
  const next=racePoint(((this.passed+1)%CHECKPOINTS)*SECTOR);if(Math.hypot(p.x-next.x,p.z-next.z)<6){this.passed++;this.colorGates();if(this.passed===CHECKPOINTS*RACE_LAPS){this.snapshot(p);this.finished=true;this.boosting=false;this.flames.visible=false;this.message=this.rank===1?'You won the Cabinet Grand Prix!':'Finished '+this.rank+' of 4. Race again for first place.';}}
 }
 recover(cart:GolfCart){const angle=(this.passed%CHECKPOINTS)*SECTOR+.025;cart.motor.reset();cart.placeOnCourse(racePoint(angle),raceHeading(angle),0);cart.object.rotation.x=0;this.airborne=false;this.vy=0;this.lastRamp=false;this.turbo=0;this.seconds+=3;this.announce('Back on course · +3s');}
 stop(){this.group.visible=false;}
 dispose(){this.group.removeFromParent();for(const r of this.rivals){r.actor.object.removeFromParent();r.actor.dispose();}this.group.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});this.ownGeometries.forEach(g=>g.dispose());this.ownMaterials.forEach(m=>m.dispose());this.ownTextures.forEach(t=>t.dispose());}
}
