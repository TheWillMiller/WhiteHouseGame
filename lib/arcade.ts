import * as T from 'three';

export type ArcadeMode='off'|'flight'|'blaster';
export type ArcadeState={mode:ArcadeMode;score:number;shots:number;seconds:number;finished:boolean;started:boolean;rings:number;totalRings:number;altitude:number;nextDistance:number;hit:boolean};
export const SKY_ROUTE=[new T.Vector3(0,14,65),new T.Vector3(22,19,40),new T.Vector3(30,28,5),new T.Vector3(5,33,-34),new T.Vector3(-34,28,-35),new T.Vector3(-60,23,0),new T.Vector3(-42,16,40),new T.Vector3(0,12,82)];
const gold=new T.Color(0xe5b84c),cyan=new T.Color(0x65e9ee);

// Modes allocate a small, shared set of geometry only when first selected.
export class Arcade {
 readonly world=new T.Group();readonly jetpack=new T.Group();readonly blaster=new T.Group();
 readonly targets:{mesh:T.Mesh;home:T.Vector3;cooldown:number}[]=[];
 readonly rings:T.Mesh[]=[];readonly velocity=new T.Vector3();
 private beams:{mesh:T.Mesh;life:number}[]=[];private flames:T.Mesh[]=[];
 private muzzle:T.Mesh;private hitFlash=0;private cooldown=0;private recoil=0;private clock=0;
 mode:ArcadeMode='off';score=0;shots=0;seconds=60;finished=false;started=false;ringIndex=0;
 constructor(){
  this.world.name='Sandbox challenges';this.world.userData.mapExclude=true;
  this.jetpack.name='Gold jetpack';this.blaster.name='Gold pulse blaster';
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
  const targetGeometry=new T.SphereGeometry(.85,16,10),haloGeometry=new T.TorusGeometry(1.05,.045,5,32);
  for(let i=0;i<5;i++){const home=new T.Vector3((i-2)*5,3+(2-Math.abs(i-2))*1.7,64-Math.abs(i-2)*-2),mesh=new T.Mesh(targetGeometry,new T.MeshStandardMaterial({color:0x173c4b,metalness:.55,roughness:.3,emissive:cyan,emissiveIntensity:.12}));mesh.position.copy(home);const halo=new T.Mesh(haloGeometry,light);mesh.add(halo);const bull=new T.Mesh(new T.SphereGeometry(.3,10,8),metal);bull.position.z=.78;mesh.add(bull);this.world.add(mesh);this.targets.push({mesh,home,cooldown:0});}
  const ringGeometry=new T.TorusGeometry(3,.10,6,48);
  for(const [i,p]of SKY_ROUTE.entries()){const mesh=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:gold,transparent:true,opacity:1}));mesh.position.copy(p);mesh.lookAt(i?SKY_ROUTE[i-1]:new T.Vector3(0,12,82));this.rings.push(mesh);this.world.add(mesh);}
  const beamGeometry=new T.CylinderGeometry(.024,.024,1,5);for(let i=0;i<4;i++){const mesh=new T.Mesh(beamGeometry,light);mesh.visible=false;this.beams.push({mesh,life:0});this.world.add(mesh);}
  this.setMode('off');
 }
 setMode(mode:ArcadeMode){this.mode=mode;this.score=0;this.shots=0;this.seconds=mode==='flight'?0:60;this.finished=false;this.started=false;this.ringIndex=0;this.clock=0;this.cooldown=0;this.hitFlash=0;this.velocity.set(0,0,0);this.world.visible=mode!=='off';this.jetpack.visible=mode==='flight';this.blaster.visible=mode==='blaster';this.muzzle.visible=false;for(const b of this.beams){b.life=0;b.mesh.visible=false;}for(const t of this.targets){t.cooldown=0;t.mesh.position.copy(t.home);t.mesh.visible=mode==='blaster';}this.updateRings();}
 private updateRings(){this.rings.forEach((r,i)=>{r.visible=this.mode==='flight'&&i>=this.ringIndex;(r.material as T.MeshBasicMaterial).color.copy(i===this.ringIndex?cyan:gold);(r.material as T.MeshBasicMaterial).opacity=i===this.ringIndex?1:.25;});}
 snapshot(p:T.Vector3):ArcadeState{return {mode:this.mode,score:this.score,shots:this.shots,seconds:this.seconds,finished:this.finished,started:this.started,rings:this.ringIndex,totalRings:SKY_ROUTE.length,altitude:Math.round(p.y),nextDistance:this.ringIndex<SKY_ROUTE.length?Math.round(p.distanceTo(SKY_ROUTE[this.ringIndex])):0,hit:this.hitFlash>0};}
 flight(dt:number,p:T.Vector3,yaw:number,right:number,forward:number,vertical:number,boost:boolean,blocked:(p:T.Vector3)=>boolean){
  const length=Math.max(1,Math.hypot(right,forward)),speed=boost?24:12,desired=new T.Vector3((Math.sin(yaw)*forward+Math.cos(yaw)*right)/length*speed,vertical*(boost?13:8),(-Math.cos(yaw)*forward+Math.sin(yaw)*right)/length*speed);
  this.velocity.lerp(desired,1-Math.exp(-dt*6));const delta=this.velocity.clone().multiplyScalar(dt),before=p.clone(),steps=Math.max(1,Math.ceil(delta.length()/.2));
  for(let i=0;i<steps;i++)for(const axis of ['y','x','z'] as const){const candidate=p.clone();candidate[axis]+=delta[axis]/steps;candidate.y=T.MathUtils.clamp(candidate.y,0,60);candidate.x=T.MathUtils.clamp(candidate.x,-120,120);candidate.z=T.MathUtils.clamp(candidate.z,-93,124);if(!blocked(candidate))p.copy(candidate);else this.velocity[axis]=0;}
  if(!this.finished){this.seconds+=dt;const next=SKY_ROUTE[this.ringIndex];const closest=new T.Line3(before,p).closestPointToPoint(next,true,new T.Vector3());if(closest.distanceTo(next)<2.65){this.ringIndex++;this.score+=100;this.hitFlash=.3;this.finished=this.ringIndex===SKY_ROUTE.length;this.updateRings();}}
 }
 get canFire(){return this.mode==='blaster'&&!this.finished&&this.cooldown<=0;}
 fire(origin:T.Vector3,direction:T.Vector3,occlusion:number=120){
  if(this.mode!=='blaster'||this.finished||this.cooldown>0)return false;this.started=true;this.shots++;this.cooldown=.22;this.recoil=1;
  const ray=new T.Ray(origin,direction.clone().normalize());let winner:typeof this.targets[number]|undefined,nearest=Math.min(120,occlusion);
  for(const t of this.targets){if(t.cooldown>0)continue;const point=ray.intersectSphere(new T.Sphere(t.mesh.position,.9),new T.Vector3());if(point&&point.distanceTo(origin)<nearest){nearest=point.distanceTo(origin);winner=t;}}
  if(winner){winner.cooldown=.8;winner.mesh.visible=false;this.score+=100;this.hitFlash=.15;}
  const beam=this.beams.find(b=>b.life<=0)??this.beams[0],end=origin.clone().addScaledVector(ray.direction,nearest),start=this.muzzle.getWorldPosition(new T.Vector3()),vector=end.clone().sub(start);beam.mesh.position.copy(start).addScaledVector(vector,.5);beam.mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vector.clone().normalize());beam.mesh.scale.set(1,vector.length(),1);beam.mesh.visible=true;beam.life=.09;return !!winner;
 }
 update(dt:number){if(this.mode==='off')return;this.clock+=dt;this.hitFlash=Math.max(0,this.hitFlash-dt);this.cooldown=Math.max(0,this.cooldown-dt);this.recoil=Math.max(0,this.recoil-dt*10);this.blaster.position.z=-.62+this.recoil*.07;this.muzzle.visible=this.recoil>.55;
  for(const b of this.beams){b.life-=dt;b.mesh.visible=b.life>0;}
  if(this.mode==='blaster'){if(this.started&&!this.finished){this.seconds=Math.max(0,this.seconds-dt);this.finished=this.seconds===0;}for(const [i,t]of this.targets.entries()){t.cooldown=Math.max(0,t.cooldown-dt);t.mesh.visible=t.cooldown===0;t.mesh.position.x=t.home.x+Math.sin(this.clock*.85+i*1.4)*1.8;t.mesh.position.y=t.home.y+Math.sin(this.clock*1.3+i)*.55;}}
  for(const [i,f]of this.flames.entries())f.scale.y=.55+Math.min(1,this.velocity.length()/20)*.6+Math.sin(this.clock*22+i)*.07;
 }
 dispose(){this.world.removeFromParent();this.jetpack.removeFromParent();this.blaster.removeFromParent();const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();for(const group of [this.world,this.jetpack,this.blaster])group.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
}
