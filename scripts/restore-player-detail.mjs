import {NodeIO} from '@gltf-transform/core';
import {copyToDocument,prune,dedup} from '@gltf-transform/functions';
import {writeFile} from 'node:fs/promises';
import * as T from 'three';
const io=new NodeIO(),rig=await io.read('public/models/trump-animated-v2.glb'),detail=await io.read(process.argv[2]);
const mesh=rig.getRoot().listMeshes()[0],coarse=mesh.listPrimitives()[0],original=detail.getRoot().listMeshes()[0].listPrimitives()[0];
const map=copyToDocument(rig,detail,[original]),p=map.get(original),pos=p.getAttribute('POSITION'),cp=coarse.getAttribute('POSITION');
const a=pos.getArray(),b=cp.getArray(),lo=pos.getMin([]),hi=pos.getMax([]),clo=cp.getMin([]),chi=cp.getMax([]),scale=(chi[1]-clo[1])/(hi[1]-lo[1]);
for(let i=0;i<a.length;i+=3){a[i]=(a[i]-(lo[0]+hi[0])/2)*scale+(clo[0]+chi[0])/2;a[i+1]=(a[i+1]-lo[1])*scale+clo[1];a[i+2]=(a[i+2]-(lo[2]+hi[2])/2)*scale+(clo[2]+chi[2])/2;}
// Transfer the supplied skeleton's weights spatially to the original detailed mesh.
// Four nearest surface vertices smooth the transfer without inventing new joints.
const joints=coarse.getAttribute('JOINTS_0'),weights=coarse.getAttribute('WEIGHTS_0'),ji=new Uint16Array(pos.getCount()*4),we=new Float32Array(pos.getCount()*4);let maxDistance=0;
const indices=coarse.getIndices().getArray(),adj=Array.from({length:cp.getCount()},()=>[]);for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++)adj[indices[i+j]].push(i);
const triangle=new T.Triangle(),point=new T.Vector3(),closest=new T.Vector3(),bary=new T.Vector3();
for(let i=0;i<pos.getCount();i++){
  const nearest=[[-1,Infinity],[-1,Infinity],[-1,Infinity],[-1,Infinity]];
  for(let j=0;j<cp.getCount();j++){const d=(a[i*3]-b[j*3])**2+(a[i*3+1]-b[j*3+1])**2+(a[i*3+2]-b[j*3+2])**2;if(d<nearest[3][1]){nearest[3]=[j,d];nearest.sort((x,y)=>x[1]-y[1]);}}
  const totals=new Map();point.fromArray(a,i*3);let best=Infinity,face=0,blend=[1,0,0];
  for(const faceIndex of new Set(nearest.flatMap(([j])=>adj[j]))){triangle.a.fromArray(b,indices[faceIndex]*3);triangle.b.fromArray(b,indices[faceIndex+1]*3);triangle.c.fromArray(b,indices[faceIndex+2]*3);triangle.closestPointToPoint(point,closest);const d=point.distanceToSquared(closest);if(d<best){best=d;face=faceIndex;triangle.getBarycoord(closest,bary);blend=bary.toArray();}}
  maxDistance=Math.max(maxDistance,Math.sqrt(best));
  for(let v=0;v<3;v++){const j=indices[face+v],js=joints.getElement(j,[]),ws=weights.getElement(j,[]);for(let k=0;k<4;k++)totals.set(js[k],(totals.get(js[k])||0)+ws[k]*blend[v]);}
  const top=[...totals].sort((x,y)=>y[1]-x[1]).slice(0,4),sum=top.reduce((v,x)=>v+x[1],0);top.forEach(([joint,weight],k)=>{ji[i*4+k]=joint;we[i*4+k]=weight/sum;});
}
if(maxDistance>.15)throw Error('Meshes do not align closely enough: '+maxDistance);
const buffer=rig.getRoot().listBuffers()[0];p.setAttribute('JOINTS_0',rig.createAccessor().setType('VEC4').setArray(ji).setBuffer(buffer));p.setAttribute('WEIGHTS_0',rig.createAccessor().setType('VEC4').setArray(we).setBuffer(buffer));
p.getMaterial().setMetallicFactor(0).setRoughnessFactor(.85).setNormalScale(.35);
mesh.removePrimitive(coarse).addPrimitive(p);for(const a of rig.getRoot().listAccessors())a.setBuffer(buffer);for(const b of rig.getRoot().listBuffers())if(b!==buffer)b.dispose();await rig.transform(prune(),dedup());await io.write('public/models/trump-detailed-v3.glb',rig);
await writeFile('assets/models/detail-transfer.json',JSON.stringify({source:'Original 60,000-triangle Meshy model with supplied 28-joint skin weights transferred from animated export',vertices:pos.getCount(),maxSurfaceDistance:maxDistance,output:'public/models/trump-detailed-v3.glb'},null,2));
console.log({vertices:pos.getCount(),maxDistance});
