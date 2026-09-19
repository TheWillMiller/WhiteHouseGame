globalThis.DOMRect ??= class DOMRect { constructor(x=0,y=0,width=0,height=0){Object.assign(this,{x,y,width,height});} };
// Deterministic geometry budget and CPU camera benchmark; not a browser FPS test.
import * as T from 'three';import {writeFileSync} from 'node:fs';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx,width:0,height:0})};
const {grounds}=await import('../.qa/game.mjs'),{FollowCamera}=await import('../.qa/follow-camera.mjs'),{CameraObstacles}=await import('../.qa/render-budget.mjs');
const w=grounds();w.group.updateMatrixWorld(true);const proxies=new CameraObstacles(w.solids,true),camera=new FollowCamera(),times=[];
let triangles=0,instanceTriangles=0,geometryBytes=0,meshes=0;const counted=new Set();
w.group.traverse(o=>{if(!o.isMesh||o.geometry.type==='BoxGeometry'&&o.userData.dynamic)return;meshes++;const n=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;if(o.isInstancedMesh)instanceTriangles+=n*o.count;else triangles+=n;if(!counted.has(o.geometry)){counted.add(o.geometry);for(const a of Object.values(o.geometry.attributes))geometryBytes+=a.array.byteLength;geometryBytes+=o.geometry.index?.array.byteLength??0;}});
for(const [x,z]of [[0,38],[0,8],[-32,10],[40,20],[0,-70]])for(let i=0;i<8;i++){const target=new T.Vector3(x,2.15,z),desired=target.clone().add(new T.Vector3(Math.sin(i)*8.2,2,Math.cos(i)*8.2));const start=performance.now();camera.solve(target,desired,proxies.nearby(x,z),.016);times.push(performance.now()-start);}
times.sort((a,b)=>a-b);const report={note:'Offline CPU benchmark; excludes imported residence/player and browser rendering. Unculled triangle count includes the loading fallback.',cameraMedianMs:times[20],cameraP95Ms:times[38],geometryMB:geometryBytes/1048576,triangles,instanceTriangles,meshes};console.log(report);writeFileSync('.qa/performance-current.json',JSON.stringify(report,null,2));
