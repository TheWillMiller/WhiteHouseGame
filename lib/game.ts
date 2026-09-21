import {CartRace,RACERS,racePoint,raceHeading,raceDeviation,type RaceState} from './cart-race';
import {teleportLanding,teleportRayTarget} from './teleport';
import {Arcade,type ArcadeMode,type ArcadeState} from './arcade';
import {LocomotionMotor} from './locomotion';
import {GolfCart,loadGolfCart} from './golf-cart';
import {fanlight,openDoor,hallDetails,textPanel,corridorFace,corridorRoomSigns,exteriorGallery,EXTERIOR_GALLERY_OFFSET,clearInteriorDetails} from './interior-details';
import {buildWorksite,type Worksite} from './worksite';
import {renderEstateMap} from './estate-map';
import {GARDENS,GARDEN_EXIT,GARDEN_ENTRANCE} from './grounds-layout';
import {floorFinish,circulationFloor,ceiling,wallPanels,clearRoomFinishes} from './room-finishes';
import {insideWest,WEST_FOOTPRINT} from './west-layout';
import * as T from 'three';
import { residenceExterior } from './architecture';
import { loadResidenceModel, loadWestWingModel, disposeResidence } from './residence-model';
import { buildOvalOffice, OVAL_SEATS } from './oval-office';
import { FollowCamera, ThirdPersonOrbit } from './follow-camera';
import {OUTDOOR_HUMAN_SCALE,residenceHeight,residenceStepBlocked,residenceStepCamera} from './residence-terrain';
import {CameraObstacles,RenderBudget} from './render-budget';
import {gardenTree,gardenFinishes,gardenApproaches} from './landscape';
import {StaffModels,type StaffActor} from './npc-model';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { loadPlayerModel, playerModelUrl, type PlayerModel, type Emote, type Locomotion } from './player-model';
import { destinations, npcs, floors, type Place, type NPC, type Destination } from './world-data';
import { material as mat, clearVisualResources, detailedFlag, deskDetails, carpetDetail, roomDetails, groundsDetails, lamp } from './visuals';

type Obstacle={x:number;z:number;w:number;d:number;height?:number};
type Hotspot={id:string;label:string;kind:'npc'|'door'|'seat'|'lectern'|'equipment'|'vehicle';pose?:[number,number,number];x:number;y?:number;z:number;target?:string;zone?:Place;spawn?:[number,number]};
export type GameState={race?:RaceState;raceLoading?:boolean;teleportArmed?:boolean;notice?:string;arcade?:ArcadeState;driving?:boolean;speed?:number;estateMap?:string;activity?:string;firstPerson?:boolean;location:string;zone:Place;x:number;z:number;heading:number;nearby:Hotspot|null;visited:string[];met:string[]};
type World={worksite?:Worksite;cameraOnly?:({x:number;z:number;w:number;d:number;height:number;y:number})[];cameraObstacles?:CameraObstacles;group:T.Group;solids:Obstacle[];spots:Hotspot[];actors:{group:T.Group;data:NPC;staff?:StaffActor;loading?:Promise<void>}[];rings:T.Mesh[]};
const C={white:0xf5f0df,trim:0xe0dccb,window:0x355466,grass:0x718e43,path:0xcac8b0,gold:0xd9b458,wood:0x69412d,navy:0x192840};
function box(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,color:number){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function cyl(g:T.Group,x:number,y:number,z:number,r:number,h:number,color:number,segments=12,top=r){const m=new T.Mesh(new T.CylinderGeometry(top,r,h,segments),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function ball(g:T.Group,x:number,y:number,z:number,r:number,color:number,detail=0){const m=new T.Mesh(new T.IcosahedronGeometry(r,detail),mat(color));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;}
function label(g:T.Group,text:string,x:number,y:number,z:number,size=3){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#142f32dd';ctx.beginPath();ctx.roundRect(3,3,506,88,15);ctx.fill();ctx.strokeStyle='#cbbb7c99';ctx.lineWidth=2;ctx.stroke();ctx.font='500 29px Arial';ctx.fillStyle='#f6ecd1';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,47,476);const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:tx,depthTest:true}));s.position.set(x,y,z);s.scale.set(size,size*96/512,1);g.add(s);return s;}
function mergeStatic(g:T.Group){
 g.updateMatrixWorld(true);const batches=new Map<string,{material:T.Material;geos:T.BufferGeometry[];cameraBlocker:boolean}>(),meshes:T.Mesh[]=[];const inverse=g.matrixWorld.clone().invert();
 g.traverse(child=>{if(child instanceof T.Mesh&&!child.userData.dynamic)meshes.push(child);});
 for(const child of meshes){const geo=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();geo.applyMatrix4(inverse.clone().multiply(child.matrixWorld));const material=child.material as T.Material,cameraBlocker=!!child.userData.cameraBlocker,key=material.uuid+':'+cameraBlocker;const batch=batches.get(key)||{material,geos:[],cameraBlocker};batch.geos.push(geo);batches.set(key,batch);child.parent?.remove(child);child.geometry.dispose();}
 for(const {material,geos,cameraBlocker}of batches.values()){const merged=mergeGeometries(geos,false);geos.forEach(geo=>geo.dispose());if(!merged)throw new Error('Unable to assemble world geometry');const m=new T.Mesh(merged,material);m.castShadow=true;m.receiveShadow=true;m.userData.cameraBlocker=cameraBlocker;g.add(m);}
}
function solid(w:World,x:number,z:number,width:number,depth:number,height?:number){w.solids.push({x,z,w:width,d:depth,height});}
function tree(w:World,x:number,z:number,seed:number){gardenTree(w.group,x,z,seed);solid(w,x,z,.9,.9);}
function flowers(g:T.Group,x:number,z:number,w:number,d:number){box(g,x,.14,z,w,.28,d,0x3e5634);for(let i=0;i<Math.floor(w*d*1.3);i++){const px=x-w/2+((i*1.37)%w),pz=z-d/2+((i*.73)%d),h=.55+(i%3)*.09;cyl(g,px,h/2,pz,.02,h,0x526d37,4);for(let leaf=0;leaf<2;leaf++){const l=ball(g,px+(leaf?-.06:.06),h*.65,pz,.13,0x608343);l.scale.set(1,.22,.5);l.rotation.z=leaf?.5:-.5;}for(let petal=0;petal<5;petal++){const a=petal*Math.PI*2/5,b=ball(g,px+Math.cos(a)*.11,h,pz+Math.sin(a)*.11,.105,[0xefedcf,0xcc7379,0xf1bc9c,0xfff1e2][i%4]);b.scale.y=.5;}ball(g,px,h+.045,pz,.055,0xe7bf59);}}
function bench(g:T.Group,x:number,z:number,rot=0){const b=new T.Group();box(b,0,.6,0,2,.16,.65,0x6c6550);box(b,0,1.05,.3,2,.65,.14,0x6c6550);for(const sx of [-.8,.8]){box(b,sx,.3,0,.14,.6,.55,0x344846);}b.position.set(x,0,z);b.rotation.y=rot;g.add(b);}
function flag(g:T.Group,x:number,y:number,z:number,scale=1,presidential=false){detailedFlag(g,x,y,z,scale,presidential);}
function fountain(w:World,x:number,z:number,r:number){const g=w.group;cyl(g,x,.25,z,r,.5,0xb3b6a3,48);cyl(g,x,.53,z,r-.4,.12,0x71b2bb,48);const rim=new T.Mesh(new T.TorusGeometry(r-.15,.25,6,48),mat(0xe2dfc9));rim.rotation.x=Math.PI/2;rim.position.set(x,.56,z);g.add(rim);cyl(g,x,1.05,z,.75,1.6,0xc7c9b3,12,.4);cyl(g,x,1.85,z,1.7,.3,0xd7d8c2,24,1.9);cyl(g,x,2.75,z,.12,1.7,0x9ccbd2,8,.05);for(let i=0;i<10;i++){const a=i*Math.PI/5;const points=[];for(let j=0;j<=10;j++){const t=j/10;points.push(new T.Vector3(x+Math.cos(a)*t*(r-1),1.75+3*t-4.8*t*t,z+Math.sin(a)*t*(r-1)));}g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),12,.04,4,false),mat(0xb5d8d5)));}solid(w,x,z,r*1.45,r*1.45);}
function ring(w:World,spot:Hotspot){w.spots.push(spot);const m=new T.Mesh(new T.TorusGeometry(1.0,.055,6,32),new T.MeshBasicMaterial({color:spot.kind==='npc'?0xe7cf8c:0x99dacf,transparent:true,opacity:.85}));m.rotation.x=Math.PI/2;m.position.set(spot.x,(spot.y??0)+.10,spot.z);m.userData.dynamic=true;w.group.add(m);w.rings.push(m);}

export function grounds():World{const w:World={group:new T.Group(),solids:[],spots:[],actors:[],rings:[]},g=w.group;
 box(g,0,-.35,14,450,.6,450,0x6c8745);box(g,-5,-.035,16,240,.06,225,0x547249);
 // One continuous lawn surface avoids mismatched repeating texture tiles.

 // Public-plan arrangement: north is -Z, east is +X. Gameplay dimensions are approximate.
 const ellipse=(cx:number,cz:number,rx:number,rz:number,width:number)=>{const shape=new T.Shape();shape.absellipse(cx,cz,rx,rz,0,Math.PI*2,false,0);const hole=new T.Path();hole.absellipse(cx,cz,rx-width,rz-width,0,Math.PI*2,true,0);shape.holes.push(hole);const m=new T.Mesh(new T.ShapeGeometry(shape,80),mat(C.path));m.rotation.x=Math.PI/2;m.position.y=.04; // Shape Y becomes world Z.
 m.material.side=T.DoubleSide;g.add(m);};ellipse(0,56,52,46,5);ellipse(0,-63,38,22,5);
 box(g,0,.03,15,11,.04,45,C.path);box(g,0,.025,-48,10,.05,24,C.path);box(g,0,.025,112,8,.05,24,C.path);box(g,-114,.025,16,5,.05,175,C.path);box(g,108,.025,16,5,.05,175,C.path);box(g,-3,.025,-88,227,.05,5,C.path);box(g,-3,.025,111,227,.05,5,C.path);box(g,-82,.025,19,60,.05,6,C.path);box(g,105,.025,65,14,.05,5,C.path);
 const fallback=new T.Group();fallback.name='Residence loading fallback';residenceExterior(fallback);fallback.traverse(o=>{o.userData.dynamic=true;});g.add(fallback);
 // Ground-level footprint of the imported residence, measured from its mesh.
 solid(w,0,-27.2,50,25.7);solid(w,0,-11.3,6.4,7.7);
 // Stair treads and sidewalls come from the imported model height field.
 w.cameraOnly=residenceStepCamera();w.cameraOnly.push({x:-89,z:-23.5,w:9,d:7,height:.8,y:4.5});
 // North steps/landing remain walkable; the residence body stays solid.
 for(const side of [-1,1])ring(w,{id:side<0?'south-stairs-west':'south-stairs-east',label:'South Portico: enter the State Floor',kind:'door',x:side*6,y:3.98,z:-12.6,target:'blue'});
 // Imported West Wing uses the same metre scale and origin as the residence.
 // Ground footprints, not roof overhangs: main block, Oval Office and press connector.
 solid(w,-88,-5.1,29,29.7,10.5);solid(w,-70.7,4.7,11.3,10.9,5.6);solid(w,-49.1,-26.15,48,8.3,5.6);
 openDoor(g,-89,-20.3,Math.PI);openDoor(g,-57,-22.1);const gallery=new T.Group();exteriorGallery(gallery);gallery.position.set(...EXTERIOR_GALLERY_OFFSET);g.add(gallery);
 // Full source colonnade posts also collide at human and vehicle height.
 for(let x=-60;x<-26;x+=2.72)solid(w,x,-19.75,.32,.32,4.5);
 for(let z=-17;z<10;z+=2.72)solid(w,-62.5,z,.32,.32,4.5);

 flag(g,0,18.53,-23,1.2);
 // Gardens and trees.
 for(const garden of GARDENS){const {x,z,w:width,d:depth,lawnW,lawnD}=garden;
   box(g,x,.03,z,width,.08,depth,0xb7b99b);box(g,x,.09,z,lawnW,.1,lawnD,0x698644);
   if(garden.id==='rose'){
     // An uninterrupted rectangular lawn, with planting and walking routes around it.
     for(const side of [-1,1]){
       flowers(g,x+side*(lawnW/2+.55),z,.9,lawnD);
       flowers(g,x,z+side*(lawnD/2+.55),lawnW+.2,.9);
       bench(g,x+side*(width/2-1.1),z,side<0?-Math.PI/2:Math.PI/2);
       solid(w,x+side*(width/2-1.1),z,.75,2.1,1.5);
     }
   }else{
     flowers(g,x,z-7,23,1.4);flowers(g,x,z+7,23,1.4);flowers(g,x-11,z,1.5,11);flowers(g,x+11,z,1.5,11);
     box(g,x,.15,z,3,.08,14,C.path);bench(g,x-7,z,-Math.PI/2);bench(g,x+7,z,Math.PI/2);
   }
 }
 gardenApproaches(g);
 for(let i=0;i<28;i++){const z=-80+i*7.2;tree(w,-122+(i%3)*2,z,i);tree(w,119-(i%3)*2,z,i+30);}for(let i=0;i<16;i++){const x=-77+i*10;tree(w,x,-92,i+70);if(Math.abs(x)>22)tree(w,x,122,i+100);}for(const [x,z,s]of [[-62,78,34],[65,80,37],[-38,97,23],[38,95,18],[-54,43,16],[103,87,17],[-43,-63,2],[46,-67,5]])tree(w,x,z,s);
 fountain(w,0,48,5.5);fountain(w,0,-63,5);
 // Pool, putting green, benches and garden path details.
 box(g,-72,.02,50,19,.1,30,C.path);box(g,-72,.09,50,12,.1,24,0x54aeb7);for(let i=0;i<6;i++)box(g,-72,.15,42+i*3.5,10,.01,.08,0xb3e1d7);for(let i=0;i<4;i++)bench(g,-81,40+i*6,Math.PI/2);cyl(g,-53,.07,66,8,.1,0x5f883c,28);cyl(g,-53,.12,66,.25,.08,0x263924);flag(g,-53,.1,66,.45);
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x=Math.cos(a)*65,z=56+Math.sin(a)*49;bench(g,x,z,-a+Math.PI/2);}
 for(let i=0;i<61;i++){const x=-124+i*4.1;for(const z of [-97,128]){box(g,x,1.05,z,.13,2.1,.13,0x2e4140);}box(g,x,1.6,-97,4.1,.09,.1,0x2e4140);box(g,x,1.6,128,4.1,.09,.1,0x2e4140);}for(let i=0;i<55;i++){for(const x of [-125,125]){const z=-97+i*4.1;box(g,x,1.05,z,.13,2.1,.13,0x2e4140);box(g,x,1.6,z,.1,.09,4.1,0x2e4140);}}
 // NCPC March 2026 illustrative plan: long north-south hall and east connector.
 // Outer works 42 x 94 m; the 36 x 57 m central event area is about 22,000 sq ft.
 // This is an illustrative construction stage, not a claim of live site progress.
 box(g,78,.015,11,46,.06,98,0xb5a48d);box(g,78,.12,11,42,.22,94,0xc8c7bf);
 const steel=0x747e80;for(const x of [57,67.5,78,88.5,99])for(const z of [-36,-20,-4,12,28,44,58]){
   // Centre columns stop at the event-floor level; the hall above is column-free.
   const height=x===57||x===99||z<=-4?18:4.6;
   box(g,x,height/2+.2,z,.24,height,.48,steel);for(const side of [-1,1])box(g,x+side*.15,height/2+.2,z,.09,height,.65,steel);solid(w,x,z,.55,.7,height);
   box(g,x,.37,z,1,.45,1,0xadaea6);
 }
 for(const z of [-36,-20,-4,12,28,44,58]){box(g,78,4.65,z,42,.55,.3,steel);box(g,78,18.3,z,42,.65,.35,steel);}
 for(const x of [57,67.5,78,88.5,99])box(g,x,4.65,11,.3,.55,94,steel);
 for(const x of [57,99])box(g,x,18.3,11,.35,.65,94,steel);
 // Partial upper deck and facade panels make the construction sequence readable.
 box(g,78,4.7,-20,41.5,.18,31,0xc4c5bf);w.cameraOnly!.push({x:78,z:-20,w:41.5,d:31,height:.18,y:4.61});
 for(const z of [-28,-12,4,20]){box(g,99.1,2.5,z,.28,4.4,12,0xe3e0d2);solid(w,99.1,z,.3,12,4.7);}
 // Enclosed ceremonial connection starts at the residence State Floor.
 box(g,41,4.7,-27.2,32,.3,14.5,0xc4c5bf);
 for(const x of [26,34,42,50,56])for(const z of [-34.2,-20.2]){box(g,x,6,z,.35,12,.35,steel);solid(w,x,z,.45,.45,12);}
 for(const z of [-34.2,-20.2])box(g,41,12.1,z,32,.4,.4,steel);
 w.worksite=buildWorksite(g);solid(w,106,-8,2,2,32);solid(w,106,48,3,5,5);
 for(let i=0;i<5;i++)box(g,105,.35+i*.36,30,7,.3,1.7,0x8b7653);
 for(let i=0;i<7;i++){cyl(g,55+i*8,.55,64,.30,1,0xe28e38,8,.07);box(g,55+i*8,.09,64,.7,.12,.7,0x414844);}
 for(let z=-32;z<58;z+=8)box(g,78,.24,z,41,.015,.026,0x8e948d);
 const spoil=ball(g,106,.1,56,2.5,0x867355,1);spoil.scale.y=.4;
 ring(w,{id:'signal-crane',label:'Signal the next steel lift',kind:'equipment',x:109,z:-13});textPanel(g,'CRANE LIFT CONTROL',109,1.3,-14,2,.6);
 label(g,'BALLROOM · UNDER CONSTRUCTION',77,3,65,7);

 for(const side of [-1,1])ring(w,{id:side<0?'north-stairs-west':'north-stairs-east',label:'North Portico: enter the Entrance Hall',kind:'door',x:side*10.5,y:3.22,z:-42,target:'entrance'});
 ring(w,{id:'south-door',label:'Enter the residence',kind:'door',x:0,z:-4.7,target:'diplomatic'});ring(w,{id:'north-door',label:'Enter the Entrance Hall',kind:'door',x:0,z:-55,target:'entrance'});ring(w,{id:'west-door',label:'Enter the West Wing',kind:'door',x:GARDEN_ENTRANCE[0],z:GARDEN_ENTRANCE[1],zone:'west',spawn:[40,-21]});ring(w,{id:'west-front',label:'West Wing north entrance',kind:'door',x:-89,y:residenceHeight(-89,-22.2),z:-22.2,zone:'west',spawn:[-5.5,-18]});
 groundsDetails(g);gardenFinishes(g);for(const [x,z]of [[GARDENS[1].x,GARDENS[1].z]])for(const dx of [-9,9])for(const dz of [-5.5,5.5])solid(w,x+dx,z+dz,1.1,1.1,1.7);const sky=new Sky();sky.scale.setScalar(10000);sky.userData.dynamic=true;sky.userData.mapExclude=true;sky.frustumCulled=false;sky.material.uniforms.turbidity.value=3.2;sky.material.uniforms.rayleigh.value=1.5;sky.material.uniforms.mieCoefficient.value=.004;sky.material.uniforms.mieDirectionalG.value=.8;sky.material.uniforms.sunPosition.value.set(-35,60,28);g.add(sky);mergeStatic(g);return w;
}

export class Game{
 race:CartRace|null=null;raceLoading=false;private raceLoad:Promise<void>|null=null;teleportArmed=false;notice='';private noticeTime=0;
 arcade:Arcade|null=null;private preArcadeCamera=false;private flightBoxes:T.Box3[]=[];private flightNear:T.Box3[]=[];
 cart:GolfCart|null=null;motor=new LocomotionMotor();stick={x:0,y:0};stickRunning=false;
 crew:{staff:StaffActor;arm:T.Object3D|undefined;base:T.Quaternion;time:number}[]=[];crewStarted=false;
 westExterior:T.Group|null=null;residence:T.Group|null=null;estateMap='';activity='';activityTime=0;activePose:Hotspot|null=null;returnPosition=new T.Vector3();
 followCamera=new FollowCamera();orbit=new ThirdPersonOrbit();firstPerson=false;zoom=1;cameraFeetY=0;
 budget=new RenderBudget(Math.min(typeof window!=='undefined'&&window.matchMedia?.('(pointer: coarse)').matches?1:1.5,window.devicePixelRatio||1));
 shadowTick=0;staffModels=new StaffModels();staffEnabled=false;
 renderer:T.WebGLRenderer;scene=new T.Scene();camera=new T.PerspectiveCamera(60,1,.1,420);player=new T.Group();playerModel:PlayerModel|null=null;worlds=new Map<Place,World>();world:World;zone:Place='grounds';keys=new Set<string>();yaw=0;pitch=.25;velocityY=0;paused=false;disposed=false;nearby:Hotspot|null=null;visited=new Set<string>();met=new Set<string>();last=0;frame=0;tick=0;walkTime=0;audio:T.AudioListener|null=null;audioContext:AudioContext|null=null;ambient:AudioBufferSourceNode|null=null;gain:GainNode|null=null;cleanup:(()=>void)[]=[];sun=new T.DirectionalLight(0xfff4e4,2.15);hemi=new T.HemisphereLight(0xd9e9fa,0x77836b,1.85);
 constructor(public mount:HTMLElement,public update:(s:GameState)=>void,public talk:(id:string)=>void,public map:()=>void){this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(this.budget.ratio);this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.needsUpdate=true;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.02;this.renderer.domElement.tabIndex=0;this.renderer.domElement.setAttribute('aria-label','Game view. WASD or arrows to move; drag to look; E to interact.');mount.appendChild(this.renderer.domElement);this.scene.background=new T.Color(0xa4cee0);this.scene.fog=new T.Fog(0xa4cee0,140,360);this.scene.add(this.hemi);this.sun.position.set(-55,85,45);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:1,far:250});this.sun.shadow.bias=-.0007;this.sun.shadow.normalBias=.045;this.scene.add(this.sun);this.scene.add(this.sun.target);this.world=grounds();this.worlds.set('grounds',this.world);this.addNPCs(this.world,'grounds');this.scene.add(this.world.group);this.player.position.set(0,0,38);this.player.scale.setScalar(OUTDOOR_HUMAN_SCALE);this.scene.add(this.player);this.camera.position.set(0,5.2,49);this.camera.lookAt(0,2,22);this.scene.add(this.camera);this.events();this.publish();this.frame=requestAnimationFrame(this.loop);}
 async loadCart(){const cart=await loadGolfCart(window.location.pathname,this.renderer);if(this.disposed){cart.dispose();return;}this.cart=cart;this.worlds.get('grounds')!.group.add(cart.object);this.worlds.get('grounds')!.spots.push({id:'gold-cart',label:'Drive the gold golf cart',kind:'vehicle',x:5,z:35});this.renderer.shadowMap.needsUpdate=true;}
 async loadPlayer(){const model=await loadPlayerModel(playerModelUrl(window.location.pathname));if(this.disposed){model.dispose();return;}this.playerModel=model;this.player.add(model.object);}
 async loadArchitecture(){const [model,west]=await Promise.all([loadResidenceModel(window.location.pathname),loadWestWingModel(window.location.pathname)]);if(this.disposed){disposeResidence(model);disposeResidence(west);return;}this.westExterior=west;this.worlds.get('grounds')!.group.add(west);const grounds=this.worlds.get('grounds')!,fallback=grounds.group.getObjectByName('Residence loading fallback');if(fallback){grounds.group.remove(fallback);fallback.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});}this.residence=model;grounds.group.add(model);this.renderer.shadowMap.needsUpdate=true;}
 events(){const canvas=this.renderer.domElement;const listen=(el:EventTarget,type:string,fn:EventListener,options?:AddEventListenerOptions)=>{el.addEventListener(type,fn,options);this.cleanup.push(()=>el.removeEventListener(type,fn,options));};
 listen(window,'keydown',((e:KeyboardEvent)=>{const target=e.target as HTMLElement;if(target.matches('input,textarea,select')||target.isContentEditable||target.closest('[role=dialog]')||(e.code==='Space'&&target.tagName==='BUTTON'))return;if(e.code==='KeyM'&&!e.repeat){e.preventDefault();this.map();return;}if(this.paused)return;if(e.code==='KeyT'&&!e.repeat){e.preventDefault();this.armTeleport();return;}if(e.code==='KeyF'&&!e.repeat){e.preventDefault();this.toggleCamera();return;}if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','ControlLeft','ControlRight'].includes(e.code))e.preventDefault();this.keys.add(e.code);if(e.code==='KeyE'&&!e.repeat)this.interact();if(e.code==='Space'&&!e.repeat)this.jump();if(!e.repeat){const moves:Record<string,Emote>={KeyG:'dance',KeyY:'ymca',KeyV:'victory',KeyB:'backflip'};if(moves[e.code])this.emote(moves[e.code]);if(e.code==='Escape'){if(this.teleportArmed)this.armTeleport();else this.emote(null);}}}) as EventListener);
 listen(window,'keyup',((e:KeyboardEvent)=>{this.keys.delete(e.code);}) as EventListener);listen(window,'blur',()=>{this.keys.clear();this.stick={x:0,y:0};this.stickRunning=false;this.motor.reset();if(this.cart)this.cart.motor.reset();});listen(document,'visibilitychange',()=>{this.keys.clear();this.stick={x:0,y:0};this.stickRunning=false;this.motor.reset();if(this.cart)this.cart.motor.reset();if(document.hidden)void this.audioContext?.suspend();else if(this.gain&&this.gain.gain.value>0)void this.audioContext?.resume();});
 let lookPointer:number|null=null,px=0,py=0,startX=0,startY=0,travel=0;listen(canvas,'pointerdown',((e:PointerEvent)=>{if(this.paused||lookPointer!==null)return;lookPointer=e.pointerId;startX=e.clientX;startY=e.clientY;travel=0;if(this.arcade?.mode==='blaster'&&e.pointerType==='mouse'&&e.button===0)this.keys.add('KeyX');this.orbit.looking=true;this.orbit.manualLook();px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.focus();}) as EventListener);listen(canvas,'pointermove',((e:PointerEvent)=>{if(e.pointerId!==lookPointer||this.paused)return;travel=Math.max(travel,Math.hypot(e.clientX-startX,e.clientY-startY));this.orbit.manualLook();this.yaw+=(e.clientX-px)*.0045;this.pitch=T.MathUtils.clamp(this.pitch+(e.clientY-py)*.003,this.firstPerson?-.75:-.45,this.firstPerson?.75:.72);px=e.clientX;py=e.clientY;}) as EventListener);for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(canvas,type,((e:PointerEvent)=>{if(e.pointerId!==lookPointer)return;const tapped=type==='pointerup'&&travel<8;lookPointer=null;if(tapped&&this.teleportArmed)this.teleportScreen(e.clientX,e.clientY);this.keys.delete('KeyX');this.orbit.looking=false;this.orbit.manualLook();}) as EventListener);listen(canvas,'contextmenu',e=>e.preventDefault());listen(canvas,'wheel',((e:WheelEvent)=>{if(this.paused)return;e.preventDefault();this.zoom=T.MathUtils.clamp(this.zoom+e.deltaY*.001,.65,1.35);}) as EventListener,{passive:false});const resize=()=>{this.camera.aspect=this.mount.clientWidth/this.mount.clientHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(this.mount.clientWidth,this.mount.clientHeight);};const ro=new ResizeObserver(resize);ro.observe(this.mount);this.cleanup.push(()=>ro.disconnect());resize();
 }
 addNPCs(w:World,zone:Place){for(const data of npcs.filter(n=>n.zone===zone)){const actor=new T.Group();actor.name=data.name;actor.position.set(data.x,0,data.z);actor.scale.setScalar(zone==='grounds'?OUTDOOR_HUMAN_SCALE:1);w.group.add(actor);const tag=label(actor,data.name,0,3.35,0,2.4);tag.userData.npcLabel=true;w.actors.push({group:actor,data});ring(w,{id:data.id,label:data.name,kind:'npc',x:data.x,z:data.z});}}
 async loadStaff(){this.staffEnabled=true;if(this.zone==='grounds'&&!this.crewStarted){this.crewStarted=true;void this.loadCrew().catch(error=>console.warn('Crew could not load',error));}const w=this.world;await Promise.all(w.actors.map(actor=>{if(actor.staff)return Promise.resolve();if(actor.loading)return actor.loading;actor.loading=this.staffModels.create(window.location.pathname,actor.data.id).then(model=>{if(!model)return;actor.staff=model;actor.group.add(model.object);this.renderer.shadowMap.needsUpdate=true;}).finally(()=>{actor.loading=undefined;});return actor.loading;}));}
 async loadCrew(){for(const [i,x,z]of [[0,54,48],[1,104,15]]){const staff=await this.staffModels.create(window.location.pathname,'foreman');if(!staff)return;if(this.disposed){staff.dispose();return;}staff.object.position.set(x,0,z);staff.object.scale.multiplyScalar(OUTDOOR_HUMAN_SCALE);staff.object.rotation.y=i?-.6:2.2;this.worlds.get('grounds')!.group.add(staff.object);const arm=staff.object.getObjectByName('Bip01_R_Forearm');this.crew.push({staff,arm,base:arm?.quaternion.clone()??new T.Quaternion(),time:i*2});}}
 captureMap(){if(this.zone!=='grounds'||this.disposed)return;const hidden:T.Object3D[]=[this.player,...this.world.actors.map(a=>a.group),...this.world.rings,...this.crew.map(c=>c.staff.object)];this.world.group.traverse(o=>{if(o instanceof T.Sprite||o.userData.mapExclude)hidden.push(o);});try{this.estateMap=renderEstateMap(this.renderer,this.scene,hidden);}catch(error){console.warn('Estate map could not render',error);}this.publish();}
 stopActivity(){if(this.activePose){this.player.position.copy(this.returnPosition);this.activePose=null;this.playerModel?.pose(null);this.followCamera.reset();}this.activity='';}
 emote(name:Emote|null){if(this.cart?.driving||this.arcade?.mode==='flight')return;this.stopActivity();if(this.player.position.y<=this.floorAt(this.player.position.x,this.player.position.z)+.01){this.keys.clear();this.playerModel?.emote(name);}}
 moveStick(x:number,y:number){if(this.paused){this.stick={x:0,y:0};this.stickRunning=false;return;}this.stick={x,y};const strength=Math.hypot(x,y);this.stickRunning=strength>(this.stickRunning?.72:.92);}
 key(code:string,on:boolean){if(on&&!this.paused)this.keys.add(code);else this.keys.delete(code);}
 toggleCamera(){if(this.arcade?.mode==='blaster')return;this.firstPerson=!this.firstPerson;this.pitch=this.firstPerson?0:.16;this.orbit.reset(this.yaw);this.followCamera.reset();this.publish();}
 focus(){this.renderer.domElement.focus();}
 pause(value:boolean){this.paused=value;this.keys.clear();this.stick={x:0,y:0};this.stickRunning=false;this.motor.reset();this.arcade?.velocity.set(0,0,0);if(value&&this.cart)this.cart.motor.reset();}
 jump(){if(this.paused||this.cart?.driving||this.arcade?.mode==='flight')return;this.stopActivity();this.playerModel?.emote(null);this.motor.requestJump();if(this.player.position.y<=this.floorAt(this.player.position.x,this.player.position.z)+.01&&this.motor.jump(true,0))this.velocityY=this.zone==='grounds'?4.6:6.5;}
 enterCart(){if(this.arcade&&this.arcade.mode!=='off'&&this.arcade.mode!=='race')return;const cart=this.cart;if(!cart||this.zone!=='grounds')return;this.stopActivity();this.motor.reset();this.velocityY=0;cart.driving=true;cart.motor.reset();this.playerModel?.emote(null);this.playerModel?.pose('drive');this.player.position.copy(cart.driverPosition());this.player.rotation.y=-cart.motor.heading;this.yaw=cart.motor.heading;this.orbit.reset(this.yaw);this.followCamera.reset();this.activity='Driving the gold golf cart';this.publish();}
 exitCart(){if(this.arcade?.mode==='race'){this.notify('Use Exit race to return to free roam.');return false;}const cart=this.cart;if(!cart?.driving)return true;if(Math.abs(cart.motor.speed)>.4){this.activity='Brake to a stop before stepping out';return false;}for(const [x,z]of [[-1.5,.2],[1.5,.2],[-1.5,1.8],[1.5,1.8],[0,2.2]]){const p=cart.local(x,0,z);if(!this.blocked(p.x,p.z)&&this.floorAt(p.x,p.z)<.2){cart.driving=false;cart.motor.reset();this.playerModel?.pose(null);this.player.position.copy(p);this.player.position.y=this.floorAt(p.x,p.z);this.motor.reset();this.activity='';this.followCamera.reset();this.publish();return true;}}this.activity='Move the cart to a clearer place to get out';return false;}

 startArcade(mode:ArcadeMode){
  const saved=this.arcade?.mode&&this.arcade.mode!=='off'?this.preArcadeCamera:this.firstPerson;
  this.change('grounds',0,mode==='off'?38:88);this.preArcadeCamera=saved;
  if(!this.arcade){this.arcade=new Arcade();this.worlds.get('grounds')!.group.add(this.arcade.world);this.player.add(this.arcade.jetpack);this.camera.add(this.arcade.blaster);}
  this.arcade.setMode(mode);this.teleportArmed=false;this.race?.stop();this.firstPerson=mode==='blaster'?true:mode==='flight'?false:saved;
  if(mode==='flight'){this.player.position.set(0,12,82);this.playerModel?.pose('flight');this.pitch=.2;}
  else {this.playerModel?.pose(null);this.pitch=mode==='blaster'?-.1:.16;}
  this.cameraFeetY=this.player.position.y;this.followCamera.reset();this.orbit.reset();
  this.world.cameraObstacles??=new CameraObstacles(this.world.solids,true,this.world.cameraOnly);
  this.flightBoxes=this.world.cameraObstacles.meshes.map(m=>new T.Box3().setFromObject(m));
  if(mode==='race'){this.firstPerson=false;void this.loadRace();}
  this.publish();
 }
 notify(message:string){this.notice=message;this.noticeTime=4;this.publish();}
 toggleFlightGuide(){if(this.arcade?.mode==='flight'){this.arcade.guided=!this.arcade.guided;this.publish();}}
 armTeleport(){if(this.teleportArmed){this.teleportArmed=false;this.notice='';this.publish();return;}if(this.arcade&&this.arcade.mode!=='off')this.startArcade('off');if(this.cart?.driving)this.change('grounds',0,38);this.teleportArmed=true;this.keys.clear();this.stick={x:0,y:0};this.stickRunning=false;this.notify('Tap a floor or path to teleport. Drag still looks around.');}
 teleportTo(zone:Place,x:number,z:number){if(this.arcade&&this.arcade.mode!=='off'){this.notify('Exit the challenge before teleporting.');return false;}if(!this.worlds.has(zone)){const world=interior(zone);this.addNPCs(world,zone);this.worlds.set(zone,world);}const world=this.worlds.get(zone)!,landing=teleportLanding(zone,x,z,world.solids,world.actors.map(a=>({x:a.group.position.x,z:a.group.position.z})),zone==='grounds'&&this.cart?(x,z)=>this.cart!.contains(x,z):undefined);if(!landing){this.notify('Choose an open floor or path.');return false;}const yaw=this.yaw,pitch=this.pitch;this.change(zone,x,z);this.yaw=yaw;this.pitch=pitch;this.followCamera.reset();this.notify('Teleported');return true;}
 teleportScreen(clientX:number,clientY:number){if(this.paused||!this.teleportArmed)return false;const rect=this.renderer.domElement.getBoundingClientRect(),point=teleportRayTarget(this.camera,new T.Vector2((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2),this.world.group);if(!point||Math.abs(point.y-(this.zone==='grounds'?residenceHeight(point.x,point.z):0))>.25){this.notify('Choose an open floor or path.');return false;}return this.teleportTo(this.zone,point.x,point.z);}
 private async loadRace(){
  if(!this.cart){this.notify('The cart is still loading. Try again in a moment.');this.startArcade('off');return;}
  const begin=()=>{if(this.disposed||this.arcade?.mode!=='race'||!this.race||!this.cart)return;this.race.reset();this.cart.motor.reset();this.cart.placeOnCourse(racePoint(0),raceHeading(0),0);this.enterCart();this.pitch=.25;this.zoom=1;this.publish();};
  if(this.race){begin();return;}if(this.raceLoad){await this.raceLoad;begin();return;}
  this.raceLoading=true;this.publish();this.raceLoad=(async()=>{const loaded=await Promise.allSettled(RACERS.map(r=>this.staffModels.create(window.location.pathname,r.id)));const actors=loaded.flatMap(r=>r.status==='fulfilled'&&r.value?[r.value]:[]);if(this.disposed||actors.length!==RACERS.length){actors.forEach(a=>a.dispose());if(!this.disposed)throw Error('Could not load cabinet drivers');return;}this.race=new CartRace(this.cart!.object,actors);this.worlds.get('grounds')!.group.add(this.race.group);this.race.stop();})();
  try{await this.raceLoad;begin();}catch{this.startArcade('off');this.notify('Cabinet drivers could not load. Please try the race again.');}finally{this.raceLoading=false;this.raceLoad=null;if(!this.disposed)this.publish();}
 }
 recoverRace(){if(this.race&&this.cart&&this.arcade?.mode==='race'&&this.race.ready()){this.race.recover(this.cart);this.player.position.copy(this.cart.driverPosition());this.yaw=this.cart.motor.heading;this.followCamera.reset();this.publish();}}
 private flightBlocked(p:T.Vector3){if(p.y<this.floorAt(p.x,p.z))return true;const body=new T.Box3(new T.Vector3(p.x-.28,p.y+.04,p.z-.28),new T.Vector3(p.x+.28,p.y+1.9,p.z+.28));return this.flightNear.some(b=>b.intersectsBox(body));}
 private fireBlaster(){if(!this.arcade?.canFire||this.paused)return;this.camera.updateMatrixWorld();const origin=this.camera.getWorldPosition(new T.Vector3()),direction=this.camera.getWorldDirection(new T.Vector3()),ray=new T.Ray(origin,direction);let stop=120;for(const box of this.flightBoxes){const hit=ray.intersectBox(box,new T.Vector3());if(hit)stop=Math.min(stop,hit.distanceTo(origin));}this.arcade.fire(origin,direction,stop);}
 floorAt(x:number,z:number){return this.zone==='grounds'?residenceHeight(x,z):0;}
 blocked(x:number,z:number){if(this.zone==='grounds'&&(x<-123||x>123||z<-95||z>126))return true;if(this.zone==='west'&&!insideWest(x,z))return true;if(this.zone!=='grounds'&&this.zone!=='west'&&(x<-28.7||x>28.7||z<-18.7||z>18.7))return true;const radius=this.zone==='grounds'?.24:.36;if(this.zone==='grounds'&&this.cart&&!this.cart.driving&&this.cart.contains(x,z,radius))return true;if(this.zone==='grounds'&&this.player){const feet=this.player.position.y;if(residenceStepBlocked(x,z,feet))return true;}return this.world.solids.some(o=>Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius);}
 travel(id:string){const d=destinations.find(d=>d.id===id);if(!d)throw new Error('Unknown destination');this.change(d.zone,d.spawn?.[0]??d.x,d.spawn?.[1]??(d.room?(d.z>2?d.z-d.room.d/2+1.6:d.z<-2?d.z+d.room.d/2-1.6:d.z):d.z));this.visited.add(id);this.publish();}
 change(zone:Place,x:number,z:number){this.race?.stop();this.teleportArmed=false;if(this.arcade&&this.arcade.mode!=='off'){this.arcade.setMode('off');this.playerModel?.pose(null);this.firstPerson=this.preArcadeCamera;}if(this.cart?.driving){this.cart.driving=false;this.cart.motor.reset();this.playerModel?.pose(null);}this.motor.reset();this.stick={x:0,y:0};this.stickRunning=false;this.stopActivity();this.renderer.shadowMap.needsUpdate=true;this.playerModel?.emote(null);if(zone!==this.zone){this.scene.remove(this.world.group);if(!this.worlds.has(zone)){const w=interior(zone);this.addNPCs(w,zone);this.worlds.set(zone,w);}this.zone=zone;this.world=this.worlds.get(zone)!;this.scene.add(this.world.group);}if(this.staffEnabled)void this.loadStaff().catch(error=>console.warn('Staff could not load; re-enter the room to retry.',error));this.player.position.set(x,this.floorAt(x,z),z);this.player.scale.setScalar(zone==='grounds'?OUTDOOR_HUMAN_SCALE:1);this.player.rotation.y=0;this.orbit.reset();this.cameraFeetY=this.player.position.y;this.player.visible=true;this.followCamera.reset();this.camera.fov=zone==='grounds'?60:66;this.camera.updateProjectionMatrix();this.yaw=0;this.pitch=.16;this.velocityY=0;this.keys.clear();this.nearby=null;this.scene.background=new T.Color(zone==='grounds'?0xa4cee0:0xabb9b7);this.scene.fog=zone==='grounds'?new T.Fog(0xa4cee0,140,360):null;this.hemi.intensity=zone==='grounds'?1.85:1.7;this.hemi.groundColor.setHex(zone==='grounds'?0x596142:0x817158);this.sun.intensity=zone==='grounds'?2.15:1.8;this.camera.position.set(x,5,z+9);this.publish();}
 interact(){if(this.paused||(this.arcade&&this.arcade.mode!=='off'))return;if(this.cart?.driving){this.exitCart();return;}if(this.activePose){this.stopActivity();this.publish();return;}if(!this.nearby)return;const n=this.nearby;if(n.kind==='vehicle'){this.enterCart();return;}if(n.kind==='npc'){this.keys.clear();this.met.add(n.id);this.publish();this.talk(n.id);}else if(n.kind==='equipment'){this.activity=this.world.worksite?.signal()??'';this.activityTime=8;this.publish();}else if((n.kind==='seat'||n.kind==='lectern')&&n.pose){this.returnPosition.copy(this.player.position);this.activePose=n;this.player.position.set(n.pose[0],0,n.pose[1]);this.player.rotation.y=n.pose[2];this.playerModel?.emote(null);this.playerModel?.pose(n.kind==='seat'?'sit':'briefing');this.motor.reset();this.stick={x:0,y:0};this.stickRunning=false;this.keys.clear();this.velocityY=0;this.activity=n.kind==='seat'?'Seated · E or move to stand':'At the lectern · E or move to leave';this.followCamera.reset();this.publish();}else if(n.target)this.travel(n.target);else if(n.zone&&n.spawn)this.change(n.zone,...n.spawn);}
 publish(){const p=this.player.position;let location=this.zone==='grounds'?'White House grounds':this.zone==='west'?'West Wing corridor':'Residence corridor';for(const d of destinations.filter(d=>d.zone===this.zone)){const inRoom=d.room?Math.abs(p.x-d.x)<d.room.w/2&&Math.abs(p.z-d.z)<d.room.d/2:Math.hypot(p.x-d.x,p.z-d.z)<(d.id==='south'?30:d.id==='north'?30:14);if(inRoom){location=d.name;this.visited.add(d.id);break;}}this.update({race:this.arcade?.mode==='race'?this.race?.snapshot(this.cart?.object.position??p):undefined,raceLoading:this.raceLoading,teleportArmed:this.teleportArmed,notice:this.notice,arcade:this.arcade?.snapshot(p,this.camera),driving:!!this.cart?.driving,speed:Math.round(Math.abs(this.cart?.motor.speed??0)*3.6),estateMap:this.estateMap,activity:this.activity,firstPerson:this.firstPerson,location,zone:this.zone,x:p.x,z:p.z,heading:this.yaw,nearby:this.nearby,visited:[...this.visited],met:[...this.met]});}
 loop=(now:number)=>{if(this.disposed)return;if(document.hidden){this.last=now;this.frame=requestAnimationFrame(this.loop);return;}const elapsed=(now-(this.last||now))/1000,dt=Math.min(elapsed,.04);this.last=now;if(this.budget.sample(elapsed))this.renderer.setPixelRatio(this.budget.ratio);const p=this.player.position;const previousX=p.x,previousZ=p.z;const running=this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')||(this.arcade?.mode!=='flight'&&!this.cart?.driving&&this.stickRunning&&!this.keys.has('KeyC')),slow=this.keys.has('KeyC');const mode:Locomotion=running?(slow?'sprint':'run'):(slow?'stroll':'walk');if(!this.paused){if(this.noticeTime>0){this.noticeTime-=dt;if(this.noticeTime<=0)this.notice='';}if(this.activityTime>0){this.activityTime-=dt;if(this.activityTime<=0)this.activity='';}if(this.keys.has('KeyQ')||this.keys.has('KeyR')){this.orbit.manualLook();this.yaw+=(this.keys.has('KeyR')?1:-1)*dt*1.8;}let forward=(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)+this.stick.y,right=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0)+this.stick.x;
 if(this.arcade?.mode==='flight'){
   this.flightNear=this.flightBoxes.filter(b=>p.x>b.min.x-2&&p.x<b.max.x+2&&p.z>b.min.z-2&&p.z<b.max.z+2&&p.y>b.min.y-4&&p.y<b.max.y+2);
   this.arcade.flight(dt,p,this.yaw,right,forward,(this.keys.has('Space')?1:0)-(this.keys.has('KeyC')?1:0),running,candidate=>this.flightBlocked(candidate));
   if(this.arcade.velocity.lengthSq()>.05)this.player.rotation.y=-Math.atan2(this.arcade.velocity.x,-this.arcade.velocity.z);this.velocityY=0;
 }else if(this.cart?.driving){
   const cart=this.cart,canDrive=this.arcade?.mode!=='race'||!!this.race?.ready();cart.update(canDrive?dt:0,T.MathUtils.clamp(forward,-1,1),T.MathUtils.clamp(right,-1,1),this.keys.has('Space'),(x,z)=>this.blocked(x,z)||this.floorAt(x,z)>.16||this.world.actors.some(a=>Math.hypot(x-a.group.position.x,z-a.group.position.z)<.5)||(Math.abs(x+72)<6.5&&Math.abs(z-50)<12.5));
   if(this.arcade?.mode==='race'){if(canDrive)this.race?.resolveContacts(cart,(x,z)=>!this.blocked(x,z));if(!canDrive)cart.motor.reset();if(raceDeviation(cart.object.position)>4)cart.motor.speed=Math.min(cart.motor.speed,3);}
   p.copy(cart.driverPosition());this.player.rotation.y=-cart.motor.heading;this.activity='Gold cart · '+Math.round(Math.abs(cart.motor.speed)*3.6)+' km/h';
 }else{
   const len=Math.hypot(forward,right),magnitude=Math.min(1,len);
   // On foot the view never rotates itself, so input always follows that view.
   const basis=this.yaw;
   if(len){if(this.activePose)this.stopActivity();forward/=len;right/=len;}
   const speed=({walk:3.2,stroll:1.6,run:6.5,sprint:9}[mode])*(this.zone==='grounds'?OUTDOOR_HUMAN_SCALE:.78)*magnitude;
   const airborne=p.y>this.floorAt(p.x,p.z)+.04||this.velocityY>0;
   const delta=this.motor.horizontal((Math.sin(basis)*forward+Math.cos(basis)*right)*speed,(-Math.cos(basis)*forward+Math.sin(basis)*right)*speed,dt,airborne);
   const steps=Math.max(1,Math.ceil(Math.hypot(delta.x,delta.z)/.12));for(let i=0;i<steps;i++){if(!this.blocked(p.x+delta.x/steps,p.z))p.x+=delta.x/steps;else this.motor.x=0;if(!this.blocked(p.x,p.z+delta.z/steps))p.z+=delta.z/steps;else this.motor.z=0;}
   const dx=p.x-previousX,dz=p.z-previousZ;if(Math.hypot(dx,dz)>.0001){const target=-Math.atan2(dx,-dz);this.player.rotation.y+=Math.atan2(Math.sin(target-this.player.rotation.y),Math.cos(target-this.player.rotation.y))*(1-Math.exp(-dt*16));this.walkTime+=dt*speed*1.8;}
   const groundY=this.floorAt(p.x,p.z);if(this.motor.jump(p.y<=groundY+.03&&this.velocityY<=0,dt))this.velocityY=this.zone==='grounds'?4.6:6.5;
   this.velocityY-=dt*17;p.y=Math.max(groundY,p.y+this.velocityY*dt);if(this.zone!=='grounds'&&p.y>1.15){p.y=1.15;this.velocityY=Math.min(0,this.velocityY);}if(p.y===groundY)this.velocityY=0;
 }
 const cartSpot=this.world.spots.find(s=>s.id==='gold-cart');if(cartSpot&&this.cart){cartSpot.x=this.cart.object.position.x;cartSpot.z=this.cart.object.position.z;}

 let near:Hotspot|null=null,best=3.5;for(const spot of this.world.spots){const distance=Math.hypot(p.x-spot.x,p.z-spot.z,spot.y===undefined?0:p.y-spot.y);if(distance<best&&distance<(spot.kind==='seat'?1.6:3.5)){near=spot;best=distance;}}this.nearby=this.arcade&&this.arcade.mode!=='off'?null:this.cart?.driving?{id:'exit-cart',label:'Get out of the golf cart',kind:'vehicle',x:p.x,z:p.z}:this.activePose?{...this.activePose,label:'Stand up / leave'}:near;this.world.worksite?.update(dt);if(this.zone==='grounds')for(const c of this.crew){const near=c.staff.object.position.distanceTo(p)<65;c.staff.object.visible=near;if(near){c.staff.animate(dt);c.time+=dt;c.arm?.quaternion.copy(c.base).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.sin(c.time*1.8)*.3));}}for(const a of this.world.actors){const distance=a.group.position.distanceTo(p);if(distance<7){const target=-Math.atan2(p.x-a.group.position.x,-(p.z-a.group.position.z));a.group.rotation.y+=Math.atan2(Math.sin(target-a.group.rotation.y),Math.cos(target-a.group.rotation.y))*Math.min(1,dt*3);}a.group.visible=distance<65;if(distance<24)a.staff?.animate(dt);a.group.position.y=0;}}
 if(!this.paused)this.playerModel?.animate(this.cart?.driving||this.arcade?.mode==='flight'?0:Math.hypot(p.x-previousX,p.z-previousZ)/(this.zone==='grounds'?OUTDOOR_HUMAN_SCALE:1),dt,!this.cart?.driving&&this.arcade?.mode!=='flight'&&p.y>this.floorAt(p.x,p.z)+.05,mode);
 const moving=Math.hypot(p.x-previousX,p.z-previousZ)>.0001;
 if(!this.paused&&!this.firstPerson&&(this.cart?.driving||(this.arcade?.mode==='flight'&&this.arcade.guided)))this.yaw=this.orbit.follow(this.yaw,-this.player.rotation.y,moving,dt);
 const indoors=this.zone!=='grounds',humanScale=indoors?1:OUTDOOR_HUMAN_SCALE,distance=(this.arcade?.mode==='flight'?7:this.cart?.driving?6.8:indoors?4.3:4.8)*this.zoom,pitch=this.pitch;
 // Smooth only step-height changes; the horizontal anchor follows this frame's position.
 this.cameraFeetY=T.MathUtils.lerp(this.cameraFeetY,p.y,1-Math.exp(-dt*14));
 const target=new T.Vector3(p.x,Math.min(this.cameraFeetY+(this.cart?.driving?1.65:this.activePose?.kind==='seat'?1.35:2.05)*humanScale,indoors?3.25:100),p.z);
 const desired=target.clone().add(new T.Vector3(-Math.sin(this.yaw)*distance*Math.cos(pitch),Math.sin(pitch)*distance,Math.cos(this.yaw)*distance*Math.cos(pitch)));
 desired.y=T.MathUtils.clamp(desired.y,this.cameraFeetY+.22,indoors?3.9:100);
 const oval=destinations.find(d=>d.id==='oval')!;const inOval=this.zone==='west'&&((p.x-oval.x)/8)**2+((p.z-oval.z)/8.6)**2<1.03;
 this.world.cameraObstacles??=new CameraObstacles(this.world.solids,this.zone==='grounds',this.world.cameraOnly);
 const surfaces=this.world.cameraObstacles.nearby(p.x,p.z,inOval);
 if(this.firstPerson){
   this.camera.position.set(p.x,Math.min(this.cameraFeetY+(this.cart?.driving?2.15:this.activePose?.kind==='seat'?2:2.7)*humanScale,indoors?3.8:100),p.z);
   this.camera.lookAt(this.camera.position.clone().add(new T.Vector3(Math.sin(this.yaw)*Math.cos(this.pitch),-Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch))));this.player.visible=false;
 }else{
   const follow=this.followCamera.solve(target,desired,surfaces,dt,this.camera,2*humanScale);this.camera.position.copy(follow.position);this.player.visible=follow.showPlayer;this.camera.lookAt(target);
 }
 if(!this.paused&&this.arcade&&this.arcade.mode!=='off'){this.arcade.update(dt,this.camera);if(this.arcade.mode==='race'&&this.cart)this.race?.update(dt,this.cart.object.position);if(this.keys.has('KeyX'))this.fireBlaster();}
 for(const r of this.world.rings){(r.material as T.MeshBasicMaterial).opacity=.55+Math.sin(now*.003)*.2;}this.tick+=dt;if(this.tick>.20){this.publish();this.tick=0;}this.shadowTick+=elapsed; if(this.shadowTick>1/15){this.shadowTick=0;this.sun.position.set(p.x-35,60,p.z+28);this.sun.target.position.set(p.x,0,p.z);this.renderer.shadowMap.needsUpdate=true;}for(const object of this.world.group.children){if(object.userData.distanceCull){const d=object.position.distanceTo(p);object.visible=d<object.userData.distanceCull;for(const part of object.children){if(part.userData.leafDetail){part.visible=!!this.world.group.userData.foliageReady;if(part instanceof T.InstancedMesh)part.count=d<45?96:d<90?64:48;}if(part.userData.foliageCore)part.visible=!this.world.group.userData.foliageReady;}}}this.camera.updateMatrixWorld();for(const actor of this.world.actors)for(const child of actor.group.children)if(child instanceof T.Sprite){const distance=actor.group.position.distanceTo(p);child.visible=this.mount.clientWidth>700&&!window.matchMedia?.('(pointer: coarse)').matches&&distance>4&&distance<12;if(child.visible){const depth=Math.max(.1,child.getWorldPosition(new T.Vector3()).applyMatrix4(this.camera.matrixWorldInverse).z*-1);const worldWidth=150/this.mount.clientHeight*2*depth*Math.tan(T.MathUtils.degToRad(this.camera.fov/2));child.scale.set(Math.min(2.4,worldWidth),Math.min(2.4,worldWidth)*96/512,1);}}this.renderer.render(this.scene,this.camera);this.frame=requestAnimationFrame(this.loop);};
 sound(enabled:boolean){if(!this.audioContext&&enabled){this.audioContext=new AudioContext();const ctx=this.audioContext,buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);const samples=buffer.getChannelData(0);let brown=0;for(let i=0;i<samples.length;i++){brown=(brown+Math.random()*.02-.01)/1.02;samples[i]=brown*.8;}this.ambient=ctx.createBufferSource();this.ambient.buffer=buffer;this.ambient.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=600;this.gain=ctx.createGain();this.gain.gain.value=0;this.ambient.connect(filter);filter.connect(this.gain);this.gain.connect(ctx.destination);this.ambient.start();}if(this.audioContext&&this.gain){void this.audioContext.resume();this.gain.gain.setTargetAtTime(enabled?.4:0,this.audioContext.currentTime,.4);}}
 dispose(){this.race?.dispose();this.race=null;this.arcade?.dispose();this.arcade=null;if(this.westExterior){this.westExterior.parent?.remove(this.westExterior);disposeResidence(this.westExterior);this.westExterior=null;}this.cart?.dispose();this.cart=null;for(const c of this.crew){c.staff.object.parent?.remove(c.staff.object);c.staff.dispose();}this.crew=[];if(this.residence){this.residence.parent?.remove(this.residence);disposeResidence(this.residence);this.residence=null;}this.disposed=true;cancelAnimationFrame(this.frame);this.cleanup.forEach(fn=>fn());void this.audioContext?.close();if(this.playerModel){this.player.remove(this.playerModel.object);this.playerModel.dispose();this.playerModel=null;}const geos=new Set<T.BufferGeometry>(),mats=new Set<T.Material>(),textures=new Set<T.Texture>();const collect=(obj:T.Object3D)=>{obj.traverse(child=>{if(child instanceof T.Mesh||child instanceof T.Sprite){if(child instanceof T.Mesh)geos.add(child.geometry);if(child instanceof T.InstancedMesh)child.dispose();for(const m of Array.isArray(child.material)?child.material:[child.material]){mats.add(m);if('map'in m&&m.map instanceof T.Texture)textures.add(m.map);}}});};this.worlds.forEach(w=>{for(const actor of w.actors)if(actor.staff){actor.group.remove(actor.staff.object);actor.staff.dispose();}w.cameraObstacles?.dispose();collect(w.group);});this.staffModels.dispose();collect(this.player);geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());this.followCamera.dispose();clearRoomFinishes();clearInteriorDetails();clearVisualResources();this.renderer.dispose();this.renderer.domElement.remove();}
}

function chair(g:T.Group,x:number,z:number,color:number,rotation=0){const c=new T.Group();box(c,0,.61,0,.87,.18,.90,C.wood);cushion(c,0,.75,-.015,.76,.16,.79,color);box(c,0,1.18,.4,.88,1.05,.18,C.wood);cushion(c,0,1.19,.28,.73,.88,.15,color);for(const sx of [-.31,.31])for(const sz of [-.3,.3]){cyl(c,sx,.30,sz,.052,.61,C.wood,8,.065);}for(const side of [-1,1]){box(c,side*.48,.98,.05,.12,.13,.78,C.wood);cyl(c,side*.48,.78,-.24,.04,.4,C.wood,8);}for(const sx of [-.19,.19])for(const sy of [1.0,1.36]){const button=ball(c,sx,sy,.19,.024,C.gold);button.scale.z=.5;}c.position.set(x,0,z);c.rotation.y=rotation;g.add(c);}
function desk(w:World,x:number,z:number,width=4,depth=1.7){const g=w.group;box(g,x,1.14,z,width,.27,depth,C.wood);box(g,x,1.26,z,width+.1,.08,depth+.1,0x815434);for(const side of [-1,1]){box(g,x+side*(width/2-.55),.52,z,1.02,1.1,depth-.15,0x6b452b);for(let j=0;j<3;j++){box(g,x+side*(width/2-.55),.3+j*.3,z-depth/2,.85,.23,.04,0x845d3c);box(g,x+side*(width/2-.55),.3+j*.3,z-depth/2-.04,.18,.035,.025,C.gold);}}box(g,x,1.32,z-.13,.75,.025,.55,0xf3eddb);box(g,x+.8,1.35,z,.5,.1,.4,0x1e2d32);deskDetails(g,x,z,width,depth,width>=4.7);solid(w,x,z,width,depth);}
function cushion(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,color:number){const m=new T.Mesh(new RoundedBoxGeometry(w,h,d,1,.065),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function sofa(g:T.Group,x:number,z:number,rot=0,color=0xe0cf9e){const s=new T.Group();cushion(s,0,.55,0,2.6,.7,1,color);cushion(s,0,1.1,.44,2.6,1,.3,color);cushion(s,-1.25,.83,0,.28,.7,1.1,color);cushion(s,1.25,.83,0,.28,.7,1.1,color);for(const sx of [-.85,0,.85])cushion(s,sx,.97,-.05,.77,.15,.78,color);for(const sx of [-1,1])for(const sz of [-.35,.35])cyl(s,sx,.16,sz,.07,.32,C.wood,8);for(const sx of [-.85,0,.85])for(const sy of [1.08,1.38])ball(s,sx,sy,.255,.045,0xc4b182);s.position.set(x,0,z);s.rotation.y=rot;g.add(s);}
function plant(g:T.Group,x:number,y:number,z:number){cyl(g,x,y+.35,z,.35,.7,0xc5b392,10,.42);for(let i=0;i<5;i++){const leaf=ball(g,x+Math.sin(i*2)*.24,y+1.1+(i%2)*.25,z+Math.cos(i*2)*.23,.46,0x527348);leaf.scale.set(.7,1.5,.7);}}
function chandelier(g:T.Group,x:number,z:number){cyl(g,x,4.15,z,.055,1.2,C.gold,8);const ring=new T.Mesh(new T.TorusGeometry(.9,.06,6,12),mat(C.gold));ring.rotation.x=Math.PI/2;ring.position.set(x,3.8,z);g.add(ring);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;cyl(g,x+Math.cos(a)*.9,3.98,z+Math.sin(a)*.9,.08,.42,0xffefbd,6);ball(g,x+Math.cos(a)*.9,3.58,z+Math.sin(a)*.9,.12,0xe9e7cc);}}
function rug(g:T.Group,x:number,z:number,rx:number,rz:number,color:number,oval=false){carpetDetail(g,x,z,rx,rz,oval);if(oval){const r=cyl(g,x,.075,z,rx,.04,C.gold,48);r.scale.z=rz/rx;const r2=cyl(g,x,.105,z,rx-.15,.025,color,48);r2.scale.z=(rz-.15)/(rx-.15);}else{box(g,x,.075,z,rx*2,.03,rz*2,C.gold);box(g,x,.097,z,rx*2-.25,.025,rz*2-.25,color);}if(oval)for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const star=ball(g,x+Math.cos(a)*rx*.78,.13,z+Math.sin(a)*rz*.78,.08,0xdfc985);star.scale.y=.1;}}
function wall(w:World,x:number,z:number,length:number,vertical:boolean,color:number,doors:number[],inward=1){
 const start=(vertical?z:x)-length/2,end=start+length,openings=doors.filter(d=>d>start+1.2&&d<end-1.2).sort((a,b)=>a-b);
 const parts:{a:number;b:number}[]=[];let p=start;
 for(const d of openings){if(d-1.6>p)parts.push({a:p,b:d-1.6});p=Math.max(p,d+1.6);}if(p<end)parts.push({a:p,b:end});
 for(const {a,b}of parts){const px=vertical?x:(a+b)/2,pz=vertical?(a+b)/2:z;
   box(w.group,px,2.3,pz,vertical?.22:b-a,4.6,vertical?b-a:.22,0xe9e2cd);
   wallPanels(w.group,px,pz,b-a,vertical,inward,color);
   if(w.group.userData.west)corridorFace(w.group,px,pz,b-a,vertical,inward);
   solid(w,px,pz,vertical?.22:b-a,vertical?b-a:.22,4.6);
 }
 for(const d of openings){
   const px=vertical?x:d,pz=vertical?d:z;
   box(w.group,px,4.1,pz,vertical?.25:3.2,1,vertical?3.2:.25,0xe9e2cd);
   (w.cameraOnly??=[]).push({x:px,z:pz,w:vertical?.4:3.2,d:vertical?3.2:.4,height:1,y:3.6});
   for(const sign of [-1,1])box(w.group,vertical?x:d+sign*1.6,1.85,vertical?d+sign*1.6:z,vertical?.33:.11,3.7,vertical?.11:.33,C.white);
 }
}
function officeStorage(w:World,d:Destination){
 const r=d.room!,width=.58,depth=Math.min(2.8,r.d-3);
 if(depth<1.8)return;
 // Try each corner. Reject cabinets that cross a doorway or an existing desk.
 for(const side of [-1,1])for(const end of [-1,1]){
   const x=d.x+side*(r.w/2-.58),z=d.z+end*(r.d/2-depth/2-.7);
   const doors=side<0?r.doors?.west:r.doors?.east;
   if(doors?.some(v=>Math.abs(v-z)<depth/2+2))continue;
   if(w.solids.some(o=>Math.abs(x-o.x)<(width+o.w)/2+.15&&Math.abs(z-o.z)<(depth+o.d)/2+.15))continue;
   box(w.group,x,1.2,z,width,2.4,depth,0x69412d);
   // Shelf openings and individually sized books face into the room.
   for(let shelf=0;shelf<3;shelf++){
     box(w.group,x-side*.32,.52+shelf*.67,z,.035,.52,depth-.18,0x343c37);
     box(w.group,x-side*.38,.24+shelf*.67,z,.17,.07,depth,0x94754e);
     for(let b=0;b<7;b++)box(w.group,x-side*.37,.48+shelf*.67,z-depth/2+.3+b*(depth-.5)/7,.15,.33+(b%3)*.04,.13,[0x647262,0x7e4b40,0x3f5968,0xb09a70][(b+shelf)%4]);
   }
   box(w.group,x,2.45,z,width+.16,.1,depth+.12,0x815434);
   solid(w,x,z,width,depth,2.5);return;
 }
}
function furnish(w:World,d:Destination){const g=w.group,{x,z}=d,r=d.room!,{style}=r;const rx=r.w/2,rz=r.d/2;
 if(style==='oval'){w.solids.push(...buildOvalOffice(g,x,z));const seat=OVAL_SEATS.find(s=>s.kind==='president')!;w.spots.push({id:'sit-resolute',label:'Sit at the Resolute desk',kind:'seat',x:x-1.5,z:z+seat.z,pose:[x+seat.x,z+seat.z,seat.rotation]});return;}
 floorFinish(g,d);
 const north=z-rz,south=z+rz;roomDetails(g,d);
 wall(w,x,north,r.w,false,r.color,r.doors?r.doors.north??[]:[x],1);if(d.id!=='colonnade')wall(w,x,south,r.w,false,r.color,r.doors?r.doors.south??[]:[x],-1);
 wall(w,x-rx,z,r.d,true,r.color,r.doors?r.doors.west??[]:[-10,0,10],1);wall(w,x+rx,z,r.d,true,r.color,r.doors?r.doors.east??[]:[-10,0,10],-1);
 if(d.zone==='west')corridorRoomSigns(g,d);
 if(style==='corridor'){hallDetails(g,d);
   if(d.id==='west-lobby'){
     // Blue upholstery and dark wood from the archived lobby tour; keep all four routes open.
     for(const [sx,sz,rot]of [[-10,-1.15,0],[-1.2,-8,Math.PI/2]]){sofa(g,sx,sz,rot,0x637b94);solid(w,sx,sz,rot?1.1:2.7,rot?2.7:1.1,1.6);}
     for(const [tx,tz]of [[-11,-3.1],[-1.2,-10]]){box(g,tx,.86,tz,1,.13,1,0x69412d);for(const dx of [-.35,.35])for(const dz of [-.35,.35])box(g,tx+dx,.42,tz+dz,.075,.84,.075,0x69412d);lamp(g,tx,.93,tz);solid(w,tx,tz,1,1,1.8);}
   }
   if(d.id==='reception'){sofa(g,-14,20.8,0,0x637b94);solid(w,-14,20.8,2.7,1.1,1.6);}
if(d.id==='colonnade'){for(let cx=19;cx<84;cx+=4.5)solid(w,cx,-17.25,.6,.6,4.4);}return;}
 if(style==='small-office'){desk(w,x,z+rz-1.8,Math.min(2.2,r.w-1.6),1);chair(g,x,z+rz-.7,0x4b3b2d);lamp(g,x-.65,1.32,z+rz-1.8);officeStorage(w,d);if(r.w>5.5&&r.d>8)chair(g,x,z+rz-3.3,0x6d766e,Math.PI);return;}
 if(style==='palm'){for(const px of [x-rx+1.4,x+rx-1.4])for(const pz of [z-rz+1.5,z+rz-1.5])plant(g,px,0,pz);bench(g,x,z-rz+1,0);return;}
 if(style==='press-offices'){for(let px=x-rx+4;px<x+rx-2;px+=5)for(const pz of [z-rz+3,z+rz-4]){desk(w,px,pz,2.6,1.2);chair(g,px,pz+1.2,0x394d57);}return;}
 if(style!=='press')chandelier(g,x,z);
 if(style==='office'){
   rug(g,x,z,rx*.7,rz*.6,0x61736d);desk(w,x,z+rz-3,Math.min(r.w-3,3.8));chair(g,x,z+rz-1.6,0x4b3b2d);lamp(g,x-1.25,1.32,z+rz-2.7);chair(g,x-1,z+1,0x716958,Math.PI);chair(g,x+1,z+1,0x716958,Math.PI);w.spots.push({id:'sit-'+d.id,label:'Sit at the desk',kind:'seat',x:x-1.1,z:z+rz-1.6,pose:[x,z+rz-1.6,0]});plant(g,x-rx+1.2,0,z+rz-1.4);flag(g,x+rx-1.2,0,z+rz-1.2,.53);officeStorage(w,d);
 }else if(style==='meeting'||style==='dining'){
   const length=Math.min(r.d-5,style==='dining'?12:7);rug(g,x,z,rx*.77,rz*.78,0x778177);box(g,x,1.2,z,3.2,.2,length,C.wood);for(const sz of [-length/2+1,length/2-1])box(g,x,.6,z+sz,1.9,1.2,.4,C.wood);solid(w,x,z,3.2,length);for(let i=0;i<Math.floor(length/1.7);i++)for(const side of [-1,1]){const cz=z-length/2+.9+i*1.7;chair(g,x+side*2.25,cz,0x584837,side>0?Math.PI/2:-Math.PI/2);box(g,x+side*.85,1.34,cz,.55,.02,.5,C.white);cyl(g,x+side*1.15,1.42,cz-.3,.08,.2,0xc5d0c2,8);}flag(g,x-rx+1.3,0,z+rz-1.3,.55);
 }else if(style==='press'){
   const podiumX=x-rx+3;
   box(g,podiumX,.13,z-1,4,.24,8.6,0x334b61);box(g,podiumX,.94,z-1,1,1.65,1.2,0x283b50);box(g,podiumX,1.78,z-1,1.25,.12,1.5,C.wood);solid(w,podiumX,z-1,1.25,1.5,1.9);
   box(g,x-rx+.4,2.35,z-1,.12,4.35,9,0x214f73);textPanel(g,'THE WHITE HOUSE',x-rx+.5,2.7,z-1,3.3,.65,Math.PI/2);
   for(const offset of [-3,3]){box(g,x-rx+.55,2.55,z-1+offset,.12,1.4,2.3,0x152c44);flag(g,podiumX-.4,0,z-1+offset,.46);}
   // Seven rows of seven fixed seats. A continuous south aisle preserves the door connection.
   for(let row=0;row<7;row++)for(let col=0;col<7;col++){const px=39.2+row*1.7,pz=[-37.6,-36.35,-35.1,-32.2,-30.95,-29.7,-28.45][col];const seat=new T.Group();seat.name='Press seat '+(row*7+col+1);seat.position.set(px,0,pz);seat.rotation.y=Math.PI/2;g.add(seat);cushion(seat,0,.72,0,.68,.19,.72,0x304b70);cushion(seat,0,1.2,.31,.68,.93,.16,0x304b70);box(seat,0,.32,0,.19,.64,.38,0x39414a);for(const side of [-1,1])box(seat,side*.39,.91,0,.07,.08,.73,0x28353d);solid(w,px,pz,.82,.82,1.65);}
   for(const px of [39,45,51]){box(g,px,4.24,z-1,.08,.14,9,0x343b40);for(const pz of [z-4,z+2])box(g,px,4.12,pz,.8,.1,.45,0xfff1d1);}
   for(const px of [36,48])openDoor(g,px,-25);openDoor(g,54,-28,Math.PI/2);
   w.spots.push({id:'briefing-lectern',label:'Address the press',kind:'lectern',x:34,z:-31,pose:[33.6,-33,-Math.PI/2]});
 }else if(style==='bedroom'){
   rug(g,x,z,rx*.7,rz*.65,0x7d7773);box(g,x,0.65,z+1,3.5,.75,4.4,C.wood);box(g,x,1.1,z+1,3.4,.25,4.2,0xf1e7cd);box(g,x,1.28,z+1.6,3.3,.16,2.6,0xa3afa0);box(g,x,1.8,z-1.2,3.6,1.8,.2,C.wood);for(const side of [-1,1]){box(g,x+side*.85,1.3,z-.5,1.2,.23,.8,C.white);cyl(g,x+side*1.75,1.5,z-1.2,.1,3,C.wood);box(g,x+side*2.7,.6,z-1,1,1.2,1,C.wood);lamp(g,x+side*2.7,1.22,z-1);}solid(w,x,z+1,3.5,4.4);plant(g,x-rx+1.2,0,z+rz-1.3);
 }else if(style==='kitchen'){
   box(g,x,1,z,3.4,1.6,3.8,0xb8bfc0);box(g,x,1.88,z,3.6,.15,4,0xe2e5d8);solid(w,x,z,3.6,4);box(g,x-rx+1.3,1,z,1.8,1.8,r.d-4,0xd1d2c6);box(g,x-rx+1.3,2,z,2,.15,r.d-4,0x89989a);for(let i=0;i<4;i++)cyl(g,x-rx+1.3,2.12,z-rz+3+i*2,.4,.16,0x48545a,12);box(g,x+rx-1.1,1.8,z+rz-2,1.7,3.5,1.7,0xa8b5b6);solid(w,x-rx+1.3,z,2,r.d-4);
 }else if(style==='library'||style==='china'){
   for(const side of [-1,1]){box(g,x+side*(rx-.7),1.6,z,1.1,3.2,r.d-5,C.wood);for(let shelf=0;shelf<4;shelf++){box(g,x+side*(rx-.7),.55+shelf*.72,z,1.25,.1,r.d-5,0x94754e);for(let j=0;j<Math.floor(r.d-5);j++){if(style==='china'){const plate=cyl(g,x+side*(rx-.95),.85+shelf*.72,z-rz+3+j,.24,.06,C.white,12);plate.rotation.z=Math.PI/2;}else box(g,x+side*(rx-.78),.89+shelf*.72,z-rz+2.8+j,.7,.53,.5,[0x657262,0x8a5145,0x416174,0xbaa15d][(j+shelf)%4]);}}solid(w,x+side*(rx-.7),z,1.1,r.d-5);}rug(g,x,z,rx*.55,rz*.52,0x8c7660);cyl(g,x,.9,z,1.1,.15,C.wood);cyl(g,x,.45,z,.3,.9,C.wood);chair(g,x,z+2,0x8c6e54);
 }else if(style==='flowers'){
   desk(w,x,z+2,Math.min(5,r.w-4),1.8);for(let i=0;i<5;i++){const px=x-1.7+i*.85;cyl(g,px,1.55,z+2,.2,.5,0x7e9ca2,8,.25);for(let j=0;j<3;j++)ball(g,px+Math.sin(j*2)*.17,2.05,z+2+Math.cos(j*2)*.17,.23,[0xe4c3c3,0xe7ddb5,0xc9989e][j]);}for(const side of [-1,1])plant(g,x+side*(rx-1.5),0,z+rz-2);
 }else if(style==='games'){
   box(g,x,1,z,3.5,.3,6,C.wood);box(g,x,1.19,z,3.1,.1,5.6,0x477556);for(const sx of [-1,1])for(const sz of [-2,2])box(g,x+sx,.5,z+sz,.2,1,.2,C.wood);for(let i=0;i<7;i++)ball(g,x+Math.sin(i)*.75,1.33,z+Math.cos(i)*1.7,.12,[0xf4e9c9,0xc95240,0xd6aa32][i%3]);solid(w,x,z,3.5,6);sofa(g,x-rx+2,z,-Math.PI/2);
 }else if(style==='music'){
   box(g,x,1.2,z,3,.5,3.5,0x272c2c);box(g,x,1.45,z-1.5,2.7,.1,.7,C.white);for(let i=0;i<14;i++)box(g,x-1.2+i*.18,1.54,z-1.4,.08,.06,.25,0x1a2525);const lid=box(g,x,2,z+.3,3,.1,2.8,0x272c2c);lid.rotation.z=.2;for(const sx of [-1.2,1.2])box(g,x+sx,.6,z+1,.15,1.2,.15,0x272c2c);chair(g,x,z-2.5,0x4d4037,Math.PI);solid(w,x,z,3,3.5);
 }else if(style==='ballroom'){
   for(const sz of [-10,0,10]){chandelier(g,x,z+sz);rug(g,x,z+sz,rx*.67,3.2,0xc8b890);sofa(g,x-rx+1.3,z+sz,-Math.PI/2,0xe8d8b0);}plant(g,x+rx-1.2,0,z-rz+2);plant(g,x+rx-1.2,0,z+rz-2);
 }else if(style==='hall'){
   for(const sx of [-rx+1,rx-1]){cyl(g,x+sx,2.1,z,.34,4.2,C.white,12);plant(g,x+sx,0,z+3.5);}rug(g,x,z,rx*.65,rz*.65,0xa24f48);
 }else{
   rug(g,x,z,rx*.71,rz*.62,style==='salon-oval'?0x41627a:0x867660,style==='salon-oval');cyl(g,x,.85,z,1.0,.15,C.wood);cyl(g,x,.42,z,.25,.85,C.wood);sofa(g,x-rx+1.6,z,-Math.PI/2);sofa(g,x+rx-1.6,z,Math.PI/2);w.spots.push({id:'sit-'+d.id,label:'Sit on the sofa',kind:'seat',x:x-rx+2.8,z:z-1.5,pose:[x-rx+1.6,z,-Math.PI/2]});plant(g,x-rx+1.1,0,z+rz-1.3);plant(g,x+rx-1.1,0,z+rz-1.3);
 }
}
export function interior(zone:Place):World {const w:World={group:new T.Group(),solids:[],spots:[],actors:[],rings:[]};const g=w.group;g.userData.west=zone==='west';if(zone==='west'){for(const r of WEST_FOOTPRINT){box(g,r.x,-.15,r.z,r.w,.3,r.d,0xcfbf98);circulationFloor(g,r.x,r.z,r.w,r.d);}}else box(g,0,-.15,0,60,.3,40,0xcfbf98);for(let i=-28;i<29;i+=2)for(let j=-18;j<20;j+=2)if(zone!=='west')box(g,i,.018,j,1.99,.025,1.99,((i+j)/2)%2?0xcec8b3:0xe7e0c8);for(const d of destinations.filter(d=>d.zone===zone&&d.room))furnish(w,d);
 if(zone==='west'){openDoor(g,-5.5,-22,Math.PI);openDoor(g,96,-23,Math.PI/2);ring(w,{id:'exit-west',label:'Exit to the Rose Garden',kind:'door',x:44,z:-18.5,zone:'grounds',spawn:[...GARDEN_EXIT]});ring(w,{id:'residence-west',label:'Palm Room: enter the residence',kind:'door',x:93,z:-23,zone:'ground',spawn:[-26,0]});ring(w,{id:'exit-west-north',label:'North lobby entrance',kind:'door',x:-5.5,z:-20,zone:'grounds',spawn:[-60,-40]});}
 else {if(zone==='ground'){ring(w,{id:'residence-exit',label:'Exit to the South Lawn',kind:'door',x:0,z:16.2,target:'south'});openDoor(g,0,18);}if(zone==='state'){ring(w,{id:'residence-exit',label:'Exit to the North Lawn',kind:'door',x:0,z:-11.5,target:'north'});openDoor(g,0,-13,Math.PI);}const order:Place[]=['ground','state','second','third'];const index=order.indexOf(zone);if(index<3)ring(w,{id:'stairs-up',label:`Up to the ${floors.find(f=>f.id===order[index+1])?.label}`,kind:'door',x:9,z:zone==='state'?-8:0,zone:order[index+1],spawn:[5,0]});if(index>0)ring(w,{id:'stairs-down',label:`Down to the ${floors.find(f=>f.id===order[index-1])?.label}`,kind:'door',x:-9,z:zone==='state'?-8:0,zone:order[index-1],spawn:[-5,0]});if(zone==='ground')ring(w,{id:'to-west',label:'Palm Room and West Wing',kind:'door',x:-27,z:0,zone:'west',spawn:[91,-23]});for(const x of [-9,9]){for(let step=0;step<5;step++)box(g,x-1+step*.45,.06+step*.08,zone==='state'?-9.6:-1.6,.4,.1+step*.16,1.8,0xdbcbaa);}}
 if(zone==='west')for(const r of WEST_FOOTPRINT)ceiling(g,r.x,r.z,r.w,r.d,r.d===47?{x:22,z:15.6,rx:8,rz:8.6}:undefined);else ceiling(g,0,0,60,40);
 mergeStatic(g);return w;}


