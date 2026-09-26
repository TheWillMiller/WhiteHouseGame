import * as T from 'three';
import {material} from './visuals';
import {wallPanels} from './room-finishes';
import {corridorFace} from './interior-details';
export type WallPlan={x:number;z:number;length:number;vertical:boolean;color:number;doors:number[];inward:number};
type World={group:T.Group;solids:{x:number;z:number;w:number;d:number;height?:number}[];cameraOnly?:{x:number;z:number;w:number;d:number;height:number;y:number}[]};

/** Assemble a shared partition once, unioning door openings before either face is finished. */
export function assembleWalls(world:World,plans:WallPlan[]){
 const lines=new Map<string,WallPlan[]>();
 for(const p of plans){const key=(p.vertical?'x':'z')+':'+(p.vertical?p.x:p.z).toFixed(3);const list=lines.get(key)??[];list.push(p);lines.set(key,list);}
 const mesh=(x:number,y:number,z:number,w:number,h:number,d:number)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(0xe9e2cd));m.position.set(x,y,z);m.userData.cameraBlocker=true;world.group.add(m);return m;};
 for(const rows of lines.values()){
  const vertical=rows[0].vertical,line=vertical?rows[0].x:rows[0].z;
  const ranges=rows.map(p=>{const center=vertical?p.z:p.x;return {p,a:center-p.length/2,b:center+p.length/2};});
  const doors=[...new Set(ranges.flatMap(({p,a,b})=>p.doors.filter(d=>d>a+1.2&&d<b-1.2)))].sort((a,b)=>a-b);
  const cuts=[...new Set([...ranges.flatMap(r=>[r.a,r.b]),...doors.flatMap(d=>[d-1.6,d+1.6])])].sort((a,b)=>a-b);
  for(let i=1;i<cuts.length;i++){
   const a=cuts[i-1],b=cuts[i],mid=(a+b)/2,owners=ranges.filter(r=>mid>r.a-1e-6&&mid<r.b+1e-6);
   if(!owners.length||doors.some(d=>Math.abs(mid-d)<1.6))continue;
   const x=vertical?line:mid,z=vertical?mid:line,len=b-a;
   mesh(x,2.3,z,vertical?.22:len+.002,4.6,vertical?len+.002:.22);
   world.solids.push({x,z,w:vertical?.22:len,d:vertical?len:.22,height:4.6});
   const faces=new Set<number>();for(const {p}of owners){if(faces.has(p.inward))continue;faces.add(p.inward);wallPanels(world.group,x,z,len,vertical,p.inward,p.color);if(world.group.userData.west)corridorFace(world.group,x,z,len,vertical,p.inward);}
  }
  for(const d of doors){const x=vertical?line:d,z=vertical?d:line;
   mesh(x,4.1,z,vertical?.25:3.2,1,vertical?3.2:.25);
   (world.cameraOnly??=[]).push({x,z,w:vertical?.4:3.2,d:vertical?3.2:.4,height:1,y:3.6});
   for(const side of [-1,1]){const jamb=mesh(vertical?line:d+side*1.6,1.8,vertical?d+side*1.6:line,vertical?.34:.10,3.6,vertical?.10:.34);jamb.name='Continuous doorway jamb';}
  }
 }
}
