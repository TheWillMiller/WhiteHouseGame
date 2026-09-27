import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {modelAssembly} from './furniture-models';
import {material,detailedFlag} from './visuals';
import {textPanel} from './interior-details';
import type {SituationState} from './situation-game';
export const SITUATION_BOUNDS={halfWidth:6,halfDepth:9};
export function insideSituation(x:number,z:number){return (Math.abs(x)<5.65&&z> -8.65&&z<8.9)||(Math.abs(x)<1.15&&z>=8.9&&z<10.95);}
type Solid={x:number;z:number;w:number;d:number;height?:number;seatId?:string};
type RoomWorld={group:T.Group;solids:Solid[];spots:{id:string;label:string;kind:'command'|'seat'|'door'|'npc'|'lectern'|'equipment'|'vehicle';x:number;z:number;target?:string;pose?:[number,number,number];hipHeight?:number}[]};
/** Public-photo interpretation of the renovated JFK conference room, not a measured plan. */
export function buildSituationRoom(w:RoomWorld){
 const g=w.group;g.name='Situation Room · JFK conference room';
 const block=(x:number,y:number,z:number,width:number,height:number,depth:number,color:number,round=0)=>{const mesh=new T.Mesh(round?new RoundedBoxGeometry(width,height,depth,1,round):new T.BoxGeometry(width,height,depth),material(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;};
 const solid=(x:number,z:number,width:number,depth:number,height:number)=>w.solids.push({x,z,w:width,d:depth,height});
 // Continuous low-contrast carpet; every finish occupies a separate height.
 const carpet=block(0,.05,0,12,.12,18,0x345b73);carpet.name='Situation Room continuous carpet';
 for(const side of [-1,1]){block(side*6,1.72,0,.24,3.44,18.2,0x69412d);solid(side*6,0,.24,18.2,3.44);}
 block(0,1.72,-9,12,.24+3.2,.24,0x69412d);solid(0,-9,12,.24,3.44);
 // Actual opening leads to a small modeled landing rather than a door pasted on a wall.
 for(const side of [-1,1]){block(side*3.55,1.72,9,4.9,3.44,.24,0x69412d);solid(side*3.55,9,4.9,.24,3.44);}
 block(0,3,9,2.2,.88,.24,0x69412d);block(0,.05,10.1,3,.12,2.4,0x345b73);
 for(const side of [-1,1]){block(side*1.5,1.72,10.1,.18,3.44,2.4,0x69412d);solid(side*1.5,10.1,.18,2.4,3.44);}
 block(0,1.72,11.3,3,3.44,.18,0x69412d);solid(0,11.3,3,.18,3.44);
 // Mahogany raised panels and horizontal rails from the 2023–2026 public photographs.
 for(const side of [-1,1])for(let z=-7.8;z<8.5;z+=1.6){
  block(side*5.86,1.55,z,.055,2.52,1.43,0x5a3826);
  for(const edge of [-1,1])block(side*5.81,1.55,z+edge*.715,.10,2.62,.055,0x94754e);
  for(const y of [.25,2.85])block(side*5.81,y,z,.10,.06,1.46,0x94754e);
 }
 for(let x=-5.1;x<5.8;x+=1.7){block(x,1.56,-8.84,1.53,2.56,.045,0x5a3826);for(const y of [.28,2.84])block(x,y,-8.80,1.56,.06,.07,0x94754e);for(const side of [-1,1])block(x+side*.765,1.56,-8.80,.06,2.6,.07,0x94754e);}
 for(const side of [-1,1])for(const y of [.12,3.24])block(side*5.82,y,0,.12,.13,18,0x815434);
 // Ceiling panels and white linear lighting, with no costly shadow-casting point lights.
 block(0,3.48,0,12,.12,18,0x1f292d);
 for(let x=-4.5;x<=4.5;x+=3)for(let z=-7.5;z<=7.5;z+=3)block(x,3.38,z,2.87,.08,2.87,0xe3e4dc);
 const glow=new T.MeshBasicMaterial({color:0xffefcd});
 for(const x of [-3,3]){const light=new T.Mesh(new T.BoxGeometry(.055,.025,16.5),glow);light.position.set(x,3.315,0);g.add(light);}
 // Rounded conference table, 13 inner seats and perimeter observer chairs.
 modelAssembly(g,0,-1,{asset:'situation-table',width:2.30,height:.76,depth:7.8,yaw:0},()=>{block(0,.80,-1,2.30,.12,7.8,0x815434,.08);for(const z of [-3.5,1.5])block(0,.42,z,1.6,.73,.24,0x69412d);});solid(0,-1,2.30,7.8,.87);
 const chair=(x:number,z:number,yaw:number,id?:string)=>{modelAssembly(g,x,z,{asset:'executive-chair',width:.68,height:1.2,depth:.70,yaw},()=>{block(x,.57,z,.64,.18,.66,0x192129,.045);block(x,1,z+.22,.64,.84,.13,0x192129,.035);});const s:Solid={x,z,w:.72,d:.72,height:1.31};if(id)s.seatId=id;w.solids.push(s);};
 for(let row=0;row<6;row++)for(const side of [-1,1]){const z=-4.15+row*1.25;chair(side*1.6,z,side*Math.PI/2);block(side*.71,.884,z,.64,.016,.62,0x20282a,.025);block(side*.24,.882,z,.20,.015,.29,0x5a3826);}
 chair(0,-5.65,Math.PI,'sit-situation');
 for(const side of [-1,1])for(const z of [-5,-2.9,-.8,1.3,3.4])chair(side*4.85,z,side*Math.PI/2);
 detailedFlag(g,-1.3,.11,-8.25,.54);detailedFlag(g,1.3,.11,-8.25,.54,true);
 // Use the existing credited presidential seal artwork rather than a fabricated insignia.
 const sealMaterial=new T.MeshBasicMaterial({color:0xffffff});
 if(typeof document.createElementNS==='function'){const base=window.location.pathname.startsWith('/trumpgame')?'/trumpgame/':'/';const tx=new T.TextureLoader().load(base+'textures/helipad-seal-v1.svg');tx.colorSpace=T.SRGBColorSpace;sealMaterial.map=tx;}
 const seal=new T.Mesh(new T.CircleGeometry(.305,48),sealMaterial);seal.position.set(0,2.30,-8.73);g.add(seal);
 // A working watch-desk console by the entry, clear of the full circulation aisle.
 modelAssembly(g,-4.5,6.5,{asset:'situation-table',width:.82,height:.76,depth:2.6,yaw:0},()=>{block(-4.5,.82,6.5,.82,.08,2.6,0x815434);});solid(-4.5,6.5,.82,2.6,.87);
 block(-4.6,1.18,6.5,.06,.47,.90,0x1a262c,.02);block(-4.6,.95,6.5,.05,.20,.05,0x303e43);
 textPanel(g,'JFK CONFERENCE ROOM',0,2.9,8.83,1.75,.19,Math.PI);
 textPanel(g,'WEST WING',0,2.5,11.17,1.35,.24,Math.PI);
 w.spots.push({id:'situation-console',label:'Take command · Situation Room challenge',kind:'command',x:-3.4,z:6.5});
 w.spots.push({id:'situation-table',label:'Start a Situation Room briefing',kind:'command',x:0,z:4.0});
 w.spots.push({id:'sit-situation',label:'Sit at the head of the table',kind:'seat',x:1.05,z:-6.2,pose:[0,-5.65,Math.PI],hipHeight:.76});
 w.spots.push({id:'exit-situation',label:'Return to the West Wing lobby',kind:'door',x:0,z:10.1,target:'west-lobby'});
 return new SituationDisplays(g);
}
export class SituationDisplays {
 private canvas:HTMLCanvasElement;private texture:T.CanvasTexture;private stamp='';
 constructor(g:T.Group){
  this.canvas=document.createElement('canvas');this.canvas.width=1024;this.canvas.height=512;this.texture=new T.CanvasTexture(this.canvas);this.texture.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map:this.texture,toneMapped:false});
  for(const side of [-1,1])for(const z of [-4,0]){const surround=new T.Mesh(new T.BoxGeometry(.12,1.62,3.60),new T.MeshStandardMaterial({color:0x121a20,roughness:.35}));surround.position.set(side*5.70,2.29,z);g.add(surround);const screen=new T.Mesh(new T.PlaneGeometry(3.48,1.51),material);screen.position.set(side*5.625,2.29,z);screen.rotation.y=-side*Math.PI/2;screen.userData.dynamic=true;screen.name='Live situation display';g.add(screen);}
  this.update();
 }
 update(state?:SituationState){
  const stamp=state?`${state.phase}/${Math.floor(state.elapsed)}/${state.resolved}/${state.score}`:'standby';if(this.stamp===stamp)return;this.stamp=stamp;
  const c=this.canvas.getContext('2d')!;c.fillStyle='#0a202a';c.fillRect(0,0,1024,512);c.fillStyle='#8dddd0';c.font='22px sans-serif';c.fillText('WHITE HOUSE  /  SITUATION ROOM',40,49);c.fillStyle='#eff4ee';c.font='bold 47px sans-serif';c.fillText(state?.phase==='running'?'RESPONSE IN PROGRESS':state?.phase==='won'?'ALL INCIDENTS CONTAINED':'WATCH FLOOR ONLINE',40,116);
  c.strokeStyle='#38515b';c.lineWidth=1;for(let x=40;x<990;x+=62){c.beginPath();c.moveTo(x,153);c.lineTo(x,470);c.stroke();}for(let y=153;y<490;y+=52){c.beginPath();c.moveTo(40,y);c.lineTo(990,y);c.stroke();}
  if(state){for(const i of state.incidents.filter(i=>i.status!=='pending')){const x=80+i.x*6,y=160+i.y*3;c.fillStyle=i.status==='resolved'?'#8dddd0':i.status==='lost'?'#ff937e':'#f1ce80';c.beginPath();c.arc(x,y,9,0,Math.PI*2);c.fill();c.font='18px sans-serif';c.fillText(i.title,x+15,y+5);}c.fillStyle='#f5f4de';c.font='24px sans-serif';c.fillText(`CONTAINED  ${state.resolved} / ${state.total}`,720,215);c.fillText(`CONFIDENCE  ${Math.round(state.confidence)}%`,720,261);c.fillText(`SCORE  ${state.score}`,720,307);}
  else{c.fillStyle='#ebca7d';c.font='31px sans-serif';c.fillText('RESPONSE EXERCISES',80,228);c.fillStyle='#b7ced1';c.font='24px sans-serif';c.fillText('Storm Watch  /  Lights Out  /  The Long Night',80,286);c.fillText('Use the table or watch desk to take command.',80,357);}
  this.texture.needsUpdate=true;
 }
}
