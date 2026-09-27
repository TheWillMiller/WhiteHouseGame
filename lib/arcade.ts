import * as T from 'three';

export type ArcadeMode='off'|'flight'|'blaster'|'race';
export type ArcadeState={mode:ArcadeMode;score:number;shots:number;hits:number;combo:number;bestCombo:number;seconds:number;finished:boolean;started:boolean;rings:number;cleared:number;missed:number;totalRings:number;altitude:number;nextDistance:number;hit:boolean;guided:boolean;message:string;countdown:number;progress:number;wave:number;next?:{x:number;y:number;behind:boolean}};
const gold=new T.Color(0xe5b84c),cyan=new T.Color(0x65e9ee);
// A scenic course above the roofline. Pilot inputs move within its flight corridor.
export const SKY_PATH=new T.CatmullRomCurve3([[0,34,94],[56,39,53],[62,42,-32],[0,42,-76],[-76,37,-34],[-88,33,34],[-42,35,89],[0,34,94]].map(p=>new T.Vector3(...p)),false,'centripetal');
SKY_PATH.arcLengthDivisions=1024;
export const SKY_LENGTH=SKY_PATH.getLength();
export const SKY_GATES=Array.from({length:12},(_,i)=>(i+1)/13);
export const SKY_OFFSETS=SKY_GATES.map((_,i)=>new T.Vector2([0,3.8,-3.8,0,-4,4,0,3.5,-3.5,0,4,0][i],[0,2,-2,3,0,-3,2,-2,3,0,-2,0][i]));
export function skyFrame(u:number){const point=SKY_PATH.getPointAt(T.MathUtils.clamp(u,0,1)),tangent=SKY_PATH.getTangentAt(T.MathUtils.clamp(u,0,1)),side=new T.Vector3(-tangent.z,0,tangent.x).normalize();return {point,tangent,side};}
export const SKY_ROUTE=SKY_GATES.map((u,i)=>{const f=skyFrame(u);return f.point.addScaledVector(f.side,SKY_OFFSETS[i].x).add(new T.Vector3(0,SKY_OFFSETS[i].y,0));});
const TARGETS=[{name:'TAX ATTACK',points:100,color:0xffd374},{name:'RED TAPE',points:125,color:0xff6876},{name:'INFLATION',points:150,color:0xffa6d4},{name:'REGIME BOSS',points:200,color:0xbfa5ff}];
export class Arcade {
 readonly world=new T.Group();readonly jetpack=new T.Group();readonly blaster=new T.Group();readonly gallery=new T.Group();readonly sky=new T.Group();
 readonly targets:{mesh:T.Mesh;home:T.Vector3;cooldown:number;kind:number;label:T.Sprite}[]=[];
 readonly rings:T.Mesh[]=[];readonly velocity=new T.Vector3();
 private beams:{mesh:T.Mesh;life:number}[]=[];private flames:T.Mesh[]=[];private textures=new Set<T.Texture>();private targetMaterials:T.MeshBasicMaterial[]=[];private disposed=false;private artLoading=false;
 private muzzle:T.Mesh;private hitFlash=0;private cooldown=0;private recoil=0;private clock=0;private feedbackTime=0;
 private burst:T.Points;private burstLife=0;private burstOrigin=new T.Vector3();
 mode:ArcadeMode='off';score=0;shots=0;hits=0;combo=0;bestCombo=0;seconds=60;finished=false;started=false;ringIndex=0;cleared=0;missed=0;guided=true;message='';countdown=3;progress=0;flightHeading=0;offset=new T.Vector2();
 constructor(){
  this.world.name='Estate arcade';this.world.userData.mapExclude=true;this.world.add(this.gallery,this.sky);
  const metal=new T.MeshStandardMaterial({color:gold,metalness:.7,roughness:.3}),dark=new T.MeshStandardMaterial({color:0x132a32,metalness:.45,roughness:.4}),light=new T.MeshBasicMaterial({color:cyan}),white=new T.MeshBasicMaterial({color:0xfff4c9});
  const box=new T.BoxGeometry(1,1,1),tank=new T.CylinderGeometry(.23,.23,1,12),cone=new T.ConeGeometry(.18,1,10);
  const part=(parent:T.Group,geometry:T.BufferGeometry,material:T.Material,p:number[],s:number[])=>{const m=new T.Mesh(geometry,material);m.position.fromArray(p);m.scale.fromArray(s);parent.add(m);return m;};
  part(this.jetpack,box,dark,[0,1.9,.38],[.85,.95,.27]);
  for(const x of [-.39,.39]){part(this.jetpack,tank,metal,[x,1.92,.55],[1,1.12,1]);part(this.jetpack,tank,dark,[x,1.29,.55],[.85,.16,.85]);const flame=part(this.jetpack,cone,light,[x,.92,.55],[1,.6,1]);flame.rotation.z=Math.PI;this.flames.push(flame);}
  part(this.jetpack,box,light,[0,2,.56],[.22,.35,.08]);
  part(this.blaster,box,metal,[0,0,-.15],[.17,.16,.48]);part(this.blaster,box,dark,[0,-.15,.02],[.12,.25,.13]);
  part(this.blaster,box,dark,[0,.105,-.15],[.06,.05,.23]);part(this.blaster,box,light,[.09,0,-.14],[.02,.055,.22]);
  this.muzzle=part(this.blaster,new T.SphereGeometry(.075,8,6),white,[0,0,-.43],[1,1,1]);this.muzzle.visible=false;
  this.blaster.position.set(.31,-.26,-.62);this.blaster.rotation.y=.08;
  const targetGeometry=new T.PlaneGeometry(4.6,4.6);
  const cards=TARGETS.map((t,i)=>{const m=new T.MeshBasicMaterial({color:t.color,side:T.DoubleSide,alphaTest:.25});this.targetMaterials.push(m);return m;});
  const places=[[-5.8,2.6],[-2.9,6.1],[0,2.6],[2.9,6.1],[5.8,2.6]];
  for(let i=0;i<5;i++){const kind=i%4,home=new T.Vector3(places[i][0],places[i][1],90),mesh=new T.Mesh(targetGeometry,cards[kind]);mesh.position.copy(home);mesh.name=TARGETS[kind].name;
   const label=this.label(TARGETS[kind].name+' · '+TARGETS[kind].points,3.2,.44);label.position.set(0,-1.88,.08);mesh.add(label);this.gallery.add(mesh);this.targets.push({mesh,home,cooldown:0,kind,label});}
  // A freestanding carnival range, with silhouettes readable against a dark backboard.
  part(this.gallery,box,new T.MeshStandardMaterial({color:0x103a42,roughness:.85}),[0,4.5,89.6],[17.7,9,.22]);
  for(const x of [-9,9])part(this.gallery,box,metal,[x,4.8,90],[.22,9.6,.3]);
  for(const y of [.2,9.4])part(this.gallery,box,metal,[0,y,90],[18,.16,.3]);
  const title=this.label('THE BIG BEAUTIFUL SHOOTOUT',15,.9);title.position.set(0,10.2,90);this.gallery.add(title);
  const subtitle=this.label('TAXES · RED TAPE · INFLATION · FICTIONAL REGIME BOSSES',15,.48);subtitle.position.set(0,9.5,90.1);this.gallery.add(subtitle);
  const ringGeometry=new T.TorusGeometry(4.8,.22,8,56),bullGeometry=new T.TorusGeometry(.7,.035,4,24);
  for(const [i,p]of SKY_ROUTE.entries()){const mesh=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:gold,transparent:true,opacity:1}));mesh.position.copy(p);mesh.lookAt(p.clone().add(skyFrame(SKY_GATES[i]).tangent));
   const number=this.label(String(i+1).padStart(2,'0'),1.4,.8);number.position.y=5.9;mesh.add(number);
   const bull=new T.Mesh(bullGeometry,light);mesh.add(bull);this.rings.push(mesh);this.sky.add(mesh);}
  const line=new T.Line(new T.BufferGeometry().setFromPoints(SKY_PATH.getSpacedPoints(180)),new T.LineDashedMaterial({color:0xb5ecf0,dashSize:1.4,gapSize:2.5,transparent:true,opacity:.45}));line.computeLineDistances();this.sky.add(line);
  const beamGeometry=new T.CylinderGeometry(.024,.024,1,5);for(let i=0;i<4;i++){const mesh=new T.Mesh(beamGeometry,light);mesh.visible=false;this.beams.push({mesh,life:0});this.world.add(mesh);}
  const burstGeometry=new T.BufferGeometry();burstGeometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(48*3),3));const colors=[];for(let i=0;i<48;i++){const c=new T.Color([0xffcd4e,0x70ffee,0xff7092][i%3]);colors.push(c.r,c.g,c.b);}burstGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  this.burst=new T.Points(burstGeometry,new T.PointsMaterial({size:.14,vertexColors:true,transparent:true,depthWrite:false}));this.burst.frustumCulled=false;this.world.add(this.burst);
  this.setMode('off');
 }
 private label(text:string,w:number,h:number){const c=document.createElement('canvas');c.width=1024;c.height=96;const ctx=c.getContext('2d')!;ctx.fillStyle='#0d2734';ctx.fillRect(0,0,1024,96);ctx.fillStyle='#fff1c7';ctx.font='bold 48px Arial';ctx.textAlign='center';ctx.fillText(text,512,65,990);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;this.textures.add(texture);const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthWrite:false}));sprite.scale.set(w,h,1);return sprite;}
 private loadArt(){if(this.artLoading||this.targetMaterials[0].map||typeof document.createElementNS!=='function')return;this.artLoading=true;const base=window.location.pathname.startsWith('/trumpgame')?'/trumpgame/':'/';
  new T.TextureLoader().load(base+'textures/arcade-target-atlas.webp',texture=>{if(this.disposed){texture.dispose();return;}texture.colorSpace=T.SRGBColorSpace;this.textures.add(texture);for(let i=0;i<4;i++){const tx=texture.clone();tx.repeat.set(.5,.5);tx.offset.set((i%2)*.5,i<2?.5:0);tx.needsUpdate=true;this.textures.add(tx);const m=this.targetMaterials[i];m.map=tx;m.color.setHex(0xffffff);m.needsUpdate=true;}});
 }
 setMode(mode:ArcadeMode){this.mode=mode;this.score=0;this.shots=0;this.hits=0;this.combo=0;this.bestCombo=0;this.seconds=mode==='flight'?0:60;this.finished=false;this.started=false;this.ringIndex=0;this.cleared=0;this.missed=0;this.clock=0;this.cooldown=0;this.hitFlash=0;this.message='';this.feedbackTime=0;this.countdown=3;this.progress=0;this.offset.set(0,0);this.guided=true;this.flightHeading=Math.atan2(skyFrame(0).tangent.x,-skyFrame(0).tangent.z);this.velocity.set(0,0,0);this.world.visible=mode!=='off';this.gallery.visible=mode==='blaster';this.sky.visible=mode==='flight';this.jetpack.visible=mode==='flight';this.blaster.visible=mode==='blaster';this.muzzle.visible=false;this.burstLife=0;this.burst.visible=false;for(const b of this.beams){b.life=0;b.mesh.visible=false;}for(const t of this.targets){t.cooldown=0;t.mesh.scale.setScalar(1);t.mesh.rotation.set(0,0,0);t.mesh.position.copy(t.home);t.mesh.visible=mode==='blaster';}if(mode==='blaster')this.loadArt();this.updateRings();}
 private feedback(message:string){this.message=message;this.feedbackTime=1.5;}
 private updateRings(){this.rings.forEach((r,i)=>{r.visible=this.mode==='flight'&&i>=this.ringIndex&&i<=this.ringIndex+3;const m=r.material as T.MeshBasicMaterial;m.color.setHex(i===this.ringIndex?0x5effe4:0xffcf58);m.opacity=i===this.ringIndex?1:.45;});}
 snapshot(p:T.Vector3,camera?:T.Camera):ArcadeState{let next:ArcadeState['next'];if(camera&&this.mode==='flight'&&!this.finished){const point=SKY_ROUTE[this.ringIndex].clone(),behind=point.clone().applyMatrix4(camera.matrixWorldInverse).z>0,ndc=point.project(camera);next={x:T.MathUtils.clamp((ndc.x*(behind?-1:1)+1)*50,12,88),y:T.MathUtils.clamp((1-ndc.y*(behind?-1:1))*50,25,70),behind};}return {mode:this.mode,score:this.score,shots:this.shots,hits:this.hits,combo:this.combo,bestCombo:this.bestCombo,seconds:this.seconds,finished:this.finished,started:this.started,rings:this.ringIndex,cleared:this.cleared,missed:this.missed,totalRings:SKY_ROUTE.length,altitude:Math.round(p.y),nextDistance:this.ringIndex<SKY_ROUTE.length?Math.round(p.distanceTo(SKY_ROUTE[this.ringIndex])):0,hit:this.hitFlash>0,guided:this.guided,message:this.message,countdown:Math.ceil(this.countdown),progress:this.progress,wave:1+Math.min(2,Math.floor((60-this.seconds)/20)),next};}
 flight(dt:number,p:T.Vector3,yaw:number,right:number,forward:number,vertical:number,boost:boolean,blocked:(p:T.Vector3)=>boolean){
  if(this.guided){
   if(this.finished){this.velocity.set(0,0,0);return;}
   if(!this.started){if(Math.abs(right)+Math.abs(forward)+Math.abs(vertical)>0||boost)this.started=true;else return;}
   if(this.countdown>0){this.countdown=Math.max(0,this.countdown-dt);return;}
   this.seconds+=dt;const previous=this.progress,before=p.clone();this.progress=Math.min(1,this.progress+(boost?13:9)/SKY_LENGTH*dt);
   // Inputs set an offset, rather than a velocity, so release always recenters.
   this.offset.x=T.MathUtils.damp(this.offset.x,T.MathUtils.clamp(right,-1,1)*7,5,dt);
   this.offset.y=T.MathUtils.damp(this.offset.y,T.MathUtils.clamp(forward+vertical,-1,1)*5,5,dt);
   const frame=skyFrame(this.progress),candidate=frame.point.clone().addScaledVector(frame.side,this.offset.x).add(new T.Vector3(0,this.offset.y,0));
   if(blocked(candidate)){this.progress=previous;this.offset.multiplyScalar(.8);this.feedback('Obstacle · release the stick to recenter');this.velocity.set(0,0,0);return;}
   p.copy(candidate);this.velocity.copy(p).sub(before).divideScalar(Math.max(.001,dt));this.flightHeading=Math.atan2(frame.tangent.x,-frame.tangent.z);
   while(this.ringIndex<SKY_GATES.length&&this.progress>=SKY_GATES[this.ringIndex]){const miss=p.distanceTo(SKY_ROUTE[this.ringIndex]);if(miss<4.55){this.cleared++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);const perfect=miss<1.45,points=(perfect?200:100)+Math.min(5,this.combo-1)*25;this.score+=points;this.hitFlash=.5;this.feedback((perfect?'PERFECT':'GATE CLEARED')+' +'+points);this.pop(SKY_ROUTE[this.ringIndex]);}else{this.missed++;this.combo=0;this.feedback('Missed gate · next one ahead');}this.ringIndex++;this.updateRings();}
   if(this.ringIndex===SKY_GATES.length){this.finished=true;this.velocity.set(0,0,0);}return;
  }
  const length=Math.max(1,Math.hypot(right,forward)),speed=boost?14:8,desired=new T.Vector3((Math.sin(yaw)*forward+Math.cos(yaw)*right)/length*speed,vertical*7,(-Math.cos(yaw)*forward+Math.sin(yaw)*right)/length*speed);
  this.velocity.lerp(desired,1-Math.exp(-dt*(desired.lengthSq()>.01?14:24)));const delta=this.velocity.clone().multiplyScalar(dt),before=p.clone(),steps=Math.max(1,Math.ceil(delta.length()/.2));
  for(let i=0;i<steps;i++)for(const axis of ['y','x','z'] as const){const candidate=p.clone();candidate[axis]+=delta[axis]/steps;candidate.y=T.MathUtils.clamp(candidate.y,0,60);candidate.x=T.MathUtils.clamp(candidate.x,-120,120);candidate.z=T.MathUtils.clamp(candidate.z,-93,124);if(!blocked(candidate))p.copy(candidate);else this.velocity[axis]=0;}
  if(!this.finished){if(desired.lengthSq()>.01)this.started=true;if(this.started)this.seconds+=dt;const next=SKY_ROUTE[this.ringIndex],closest=new T.Line3(before,p).closestPointToPoint(next,true,new T.Vector3());if(closest.distanceTo(next)<4.55){this.ringIndex++;this.cleared++;this.score+=100;this.hitFlash=.5;this.finished=this.ringIndex===SKY_ROUTE.length;this.updateRings();}}
 }
 toggleGuide(p:T.Vector3){if(this.guided){this.guided=false;this.velocity.set(0,0,0);this.feedback('Free flight · Space up / C down');}else{this.guided=true;const f=skyFrame(this.progress);p.copy(f.point);this.offset.set(0,0);this.velocity.set(0,0,0);this.feedback('Back on the sky course');}}
 get canFire(){return this.mode==='blaster'&&!this.finished&&this.cooldown<=0;}
 fire(origin:T.Vector3,direction:T.Vector3,occlusion:number=120){
  if(!this.canFire)return false;this.started=true;this.shots++;this.cooldown=.2;this.recoil=1;
  const ray=new T.Ray(origin,direction.clone().normalize());let winner:typeof this.targets[number]|undefined,nearest=Math.min(120,occlusion);
  // Broad cutout rectangles favor thumbs without hitting through the backboard.
  for(const t of this.targets){if(t.cooldown>0)continue;const dz=ray.direction.z;if(Math.abs(dz)<.001)continue;const d=(t.mesh.position.z-origin.z)/dz;if(d<0||d>=nearest)continue;const point=ray.at(d,new T.Vector3());if(Math.abs(point.x-t.mesh.position.x)<1.65&&Math.abs(point.y-t.mesh.position.y)<1.7){nearest=d;winner=t;}}
  if(winner){this.hits++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);const multiplier=1+Math.min(4,Math.floor((this.combo-1)/3)),points=TARGETS[winner.kind].points*multiplier;this.score+=points;winner.cooldown=.95;this.hitFlash=.22;this.pop(winner.mesh.position);this.feedback(TARGETS[winner.kind].name+' +'+points+(multiplier>1?' · ×'+multiplier:''));}else{this.combo=0;this.feedback('Miss · line up the next shot');}
  const beam=this.beams.find(b=>b.life<=0)??this.beams[0],end=origin.clone().addScaledVector(ray.direction,nearest),start=this.muzzle.getWorldPosition(new T.Vector3()),vector=end.clone().sub(start);beam.mesh.position.copy(start).addScaledVector(vector,.5);beam.mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vector.clone().normalize());beam.mesh.scale.set(1,vector.length(),1);beam.mesh.visible=true;beam.life=.09;return !!winner;
 }
 private pop(p:T.Vector3){this.burstOrigin.copy(p);this.burstLife=.65;this.burst.visible=true;}
 update(dt:number,_camera?:T.Camera){if(this.mode==='off')return;this.clock+=dt;this.hitFlash=Math.max(0,this.hitFlash-dt);this.cooldown=Math.max(0,this.cooldown-dt);this.feedbackTime=Math.max(0,this.feedbackTime-dt);if(!this.feedbackTime)this.message='';this.recoil=Math.max(0,this.recoil-dt*10);this.blaster.position.z=-.62+this.recoil*.07;this.muzzle.visible=this.recoil>.55;
  for(const b of this.beams){b.life-=dt;b.mesh.visible=b.life>0;}
  this.burstLife=Math.max(0,this.burstLife-dt);this.burst.visible=this.burstLife>0;const a=this.burst.geometry.attributes.position as T.BufferAttribute,t=.65-this.burstLife;for(let i=0;i<a.count;i++){const angle=i*2.39996,velocity=2+(i%7)*.5;a.setXYZ(i,this.burstOrigin.x+Math.cos(angle)*velocity*t,this.burstOrigin.y+Math.sin(angle)*velocity*t+1.5*t-5*t*t,this.burstOrigin.z+.2+Math.sin(i*7)*t);}a.needsUpdate=true;(this.burst.material as T.PointsMaterial).opacity=this.burstLife/.65;
  if(this.mode==='blaster'){if(this.started&&!this.finished){this.seconds=Math.max(0,this.seconds-dt);this.finished=this.seconds===0;}const wave=1+Math.min(2,Math.floor((60-this.seconds)/20));for(const [i,target]of this.targets.entries()){target.cooldown=Math.max(0,target.cooldown-dt);target.mesh.visible=target.cooldown===0&&!this.finished;target.mesh.position.x=target.home.x+Math.sin(this.clock*(.4+wave*.14)+i*1.4)*(.18+wave*.12);target.mesh.position.y=target.home.y+Math.sin(this.clock+i)*.13;target.mesh.rotation.z=Math.sin(this.clock*.8+i)*.035;}}
  for(const [i,f]of this.flames.entries())f.scale.y=.55+Math.min(1,this.velocity.length()/20)*.6+Math.sin(this.clock*22+i)*.07;
 }
 dispose(){this.disposed=true;this.world.removeFromParent();this.jetpack.removeFromParent();this.blaster.removeFromParent();const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();for(const group of [this.world,this.jetpack,this.blaster])group.traverse(o=>{const render=o as T.Mesh;if(render.geometry)geometries.add(render.geometry);if(render.material)for(const m of Array.isArray(render.material)?render.material:[render.material])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.textures.forEach(t=>t.dispose());}
}
