import * as T from 'three';

// A temporary arcade circuit, installed only while racing. North is -Z.
const route=[[0,106],[40,105],[82,78],[83,48],[83,16],[83,-15],[83,-47],[44,-78],[0,-83],[-48,-78],[-109,-55],[-112,-22],[-112,20],[-104,65],[-60,108]];
const curve=new T.CatmullRomCurve3(route.map(([x,z])=>new T.Vector3(x,0,z)),true,'centripetal');
curve.arcLengthDivisions=2048;
export const COURSE_LENGTH=curve.getLength(),TAU=Math.PI*2,CHECKPOINTS=16;
const samples=curve.getSpacedPoints(768);
export const courseMap=samples.filter((_,i)=>i%6===0).map(p=>[p.x,p.z]);
const wrap=(a:number)=>(a%TAU+TAU)%TAU;
export function raceHeading(angle:number){const t=curve.getTangentAt(wrap(angle)/TAU);return Math.atan2(t.x,-t.z);}
export function courseGround(x:number,z:number){return x>55&&x<101&&z>-39&&z<61?.28:.075;}
export function racePoint(angle:number,lane=0){const p=curve.getPointAt(wrap(angle)/TAU),h=raceHeading(angle);p.x+=Math.cos(h)*lane;p.z+=Math.sin(h)*lane;p.y=courseGround(p.x,p.z);return p;}
export function projectCourse(p:T.Vector3){let best=Infinity,at=0;for(let i=0;i<samples.length-1;i++){const a=samples[i],b=samples[i+1],dx=b.x-a.x,dz=b.z-a.z,t=T.MathUtils.clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz),0,1),d=(p.x-a.x-dx*t)**2+(p.z-a.z-dz*t)**2;if(d<best){best=d;at=(i+t)/768*TAU;}}return {angle:at,distance:Math.sqrt(best)};}
export function raceDeviation(p:T.Vector3){return projectCourse(p).distance;}
// Ramps sit on open straights, outside the low construction deck.
export const RAMPS=[.065,.48,.79].map(f=>({angle:f*TAU,length:7,height:1.25}));
export const BOOST_PADS=[.025,.22,.43,.64,.88].map(f=>f*TAU);
export const ITEM_BOXES=[.045,.18,.35,.53,.71,.91].map(f=>f*TAU);
export function rampAt(p:T.Vector3){for(const r of RAMPS){const center=racePoint(r.angle),h=raceHeading(r.angle),dx=p.x-center.x,dz=p.z-center.z,along=dx*Math.sin(h)-dz*Math.cos(h),side=dx*Math.cos(h)+dz*Math.sin(h);if(Math.abs(side)<2.9&&along>=-r.length/2&&along<=r.length/2)return {height:r.height*(along/r.length+.5),along,ramp:r};}return null;}
export function buildTrackSurface(){const vertices:number[]=[];for(let i=0;i<768;i++){const a=i/768*TAU,b=(i+1)/768*TAU;for(const [angle,lane]of [[a,-3.2],[b,-3.2],[a,3.2],[a,3.2],[b,-3.2],[b,3.2]]){const p=racePoint(angle,lane);vertices.push(p.x,p.y+.015,p.z);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();return g;}
