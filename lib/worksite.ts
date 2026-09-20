import * as T from 'three';
import {material} from './visuals';
export type Worksite={update:(dt:number)=>void;signal:()=>string;phase:()=>string};
function block(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,color:number){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
export function buildWorksite(g:T.Group):Worksite{
 const crane=new T.Group();crane.position.set(83,0,-32);crane.name='Working tower crane';g.add(crane);
 for(const x of [-.7,.7])for(const z of [-.7,.7])block(crane,x,16,z,.22,32,.22,0xd4a03b);
 for(let y=1;y<32;y+=2){for(const z of [-.7,.7]){block(crane,0,y,z,1.6,.15,.15,0xe0aa37);const brace=block(crane,0,y+.8,z,1.9,.12,.12,0xd4a03b);brace.rotation.z=.87;}}
 const jib=new T.Group();jib.position.y=31.3;crane.add(jib);block(jib,-8,0,0,32,.4,1.4,0xe4b548);block(jib,4,-1,0,4,2.1,2.7,0x56676a);block(jib,-2,-1,0,2,1.8,1.7,0xc8952f);block(jib,-2,-.9,-.9,1.65,1.1,.08,0x456473);
 const carriage=new T.Group();jib.add(carriage);const cable=block(carriage,0,-8,0,.045,16,.045,0x3d4140),load=new T.Group();carriage.add(load);block(load,0,0,0,.65,.35,.65,0xe5b443);
 for(const s of [-1,1]){const sling=block(load,s*1.1,-1,0,.055,2.2,.055,0x565b59);sling.rotation.z=-s*.8;}block(load,0,-1.8,0,7,.32,.45,0x737e80);block(load,0,-1.58,0,7,.08,.75,0x899598);block(load,0,-2.02,0,7,.08,.75,0x899598);
 const digger=new T.Group();digger.position.set(69,0,-47);digger.name='Working excavator';g.add(digger);
 for(const side of [-1,1]){block(digger,side*1.2,.5,0,.75,.9,4,0x35403e);for(let z=-1.6;z<2;z+=.4)block(digger,side*1.2,.95,z,.79,.08,.18,0x59625b);}
 const upper=new T.Group();upper.position.y=1.2;digger.add(upper);block(upper,0,.35,0,2.6,.7,3,0xe3ac3e);block(upper,-.55,1.5,-.5,1.25,1.8,1.7,0xe2b044);block(upper,-.55,1.6,.37,1.04,1.25,.04,0x375963);
 const boom=new T.Group();boom.position.set(.55,.9,.8);upper.add(boom);block(boom,0,1.8,0,.42,3.6,.48,0xdfaa3b);const stick=new T.Group();stick.position.y=3.45;boom.add(stick);block(stick,0,1.5,0,.32,3,.36,0xe6b344);const bucket=new T.Group();bucket.position.y=2.85;stick.add(bucket);block(bucket,0,.18,.3,1.6,.4,1,0x5b625b);for(const x of [-.6,-.2,.2,.6])block(bucket,x,.13,.95,.12,.18,.45,0xa6a394);
 // Keep only articulated assemblies out of static merging. No duplicate character/texture downloads.
 jib.traverse(o=>o.userData.dynamic=true);upper.traverse(o=>o.userData.dynamic=true);
 let time=0;
 const phase=()=>{const t=time%24;return t<8?'Lifting structural steel':t<16?'Crane slewing to the frame':'Lowering the next beam';};
 const update=(dt:number)=>{time+=dt;const t=time%24,raise=t<8?t/8:t<16?1:1-(t-16)/8,ease=raise*raise*(3-2*raise);jib.rotation.y=.12+Math.sin(time*Math.PI/24)*.2;carriage.position.x=-16-Math.sin(time*Math.PI/24)*3;const length=22-ease*11;cable.scale.y=length/16;cable.position.y=-length/2;load.position.y=-length;load.rotation.y=Math.sin(time*.5)*.05;upper.rotation.y=.25+Math.sin(time*.22)*.28;boom.rotation.x=1.05+Math.sin(time*.7)*.22;stick.rotation.x=1.45+Math.sin(time*.7+.8)*.45;bucket.rotation.x=.4+Math.sin(time*.7+1.3)*.35;};
 update(0);return{update,phase,signal(){time=0;return 'Lift signaled. Watch the crane raise, slew and lower the steel beam.';}};
}
