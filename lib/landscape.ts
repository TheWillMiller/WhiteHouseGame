import {GARDENS,WEST_APPROACH,WEST_WALKS,SOUTH_DRIVE,DRIVE_BRANCHES,SOUTH_FOUNTAIN,NORTH_DRIVE} from './grounds-layout';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {material} from './visuals';

const forestMaterials=new WeakMap<T.Group,T.MeshStandardMaterial>();
function foliageMaterial(parent:T.Group){
 let m=forestMaterials.get(parent);if(m)return m;
 m=new T.MeshStandardMaterial({color:0xffffff,roughness:.94,side:T.DoubleSide,alphaTest:.45});forestMaterials.set(parent,m);
 if(typeof document!=='undefined'&&typeof document.createElementNS==='function'){
  const base=window.location.pathname.startsWith('/trumpgame')?'/trumpgame/':'/';
  const texture=new T.TextureLoader().load(base+'textures/elm-foliage-v1.webp',()=>{parent.userData.foliageReady=true;});texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;m.map=texture;
 }
 return m;
}
// Each tree is a separately culled instance cluster, never merged into the entire estate.
export function gardenTree(parent:T.Group,x:number,z:number,seed:number){
 const group=new T.Group();group.position.set(x,0,z);group.name='Mature garden tree';parent.add(group);
 let s=seed+71;const rand=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
 const height=8+rand()*5,crown=3.4+rand()*1.5;
 const bark=new T.MeshStandardMaterial({color:0x655d50,roughness:1});
 const trunk=new T.Mesh(new T.CylinderGeometry(.19,.44,height*.70,7),bark);trunk.position.y=height*.35;trunk.castShadow=true;trunk.userData.dynamic=true;group.add(trunk);
 const branches:T.Vector3[]=[];
 for(let i=0;i<9;i++){
  const a=i*2.399+seed,r=crown*(.6+rand()*.35),start=new T.Vector3(0,height*(.33+i*.025),0),end=new T.Vector3(Math.cos(a)*r,height*(.65+rand()*.3),Math.sin(a)*r);branches.push(end);
  const length=start.distanceTo(end),b=new T.Mesh(new T.CylinderGeometry(.035,.16,length,5),bark);b.position.copy(start).add(end).multiplyScalar(.5);b.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.clone().sub(start).normalize());b.castShadow=true;b.userData.dynamic=true;group.add(b);
 }
 const timber:T.BufferGeometry[]=[];group.updateMatrixWorld(true);for(const child of [...group.children])if(child instanceof T.Mesh){child.updateMatrix();const geometry=child.geometry.toNonIndexed();geometry.applyMatrix4(child.matrix);timber.push(geometry);group.remove(child);child.geometry.dispose();}const wood=new T.Mesh(mergeGeometries(timber)!,bark);timber.forEach(geo=>geo.dispose());wood.castShadow=true;wood.userData.dynamic=true;group.add(wood);
 const leaves=new T.InstancedMesh(new T.PlaneGeometry(2.8,2.8),foliageMaterial(parent),96);
 const matrix=new T.Matrix4(),rotation=new T.Quaternion(),scale=new T.Vector3(),point=new T.Vector3();
 for(let i=0;i<96;i++){
  const center=branches[i%branches.length],a=rand()*Math.PI*2,r=Math.sqrt(rand())*2.25;
  point.set(center.x+Math.cos(a)*r,center.y+(rand()-.35)*2.5,center.z+Math.sin(a)*r);
  rotation.setFromEuler(new T.Euler((rand()-.5)*2,rand()*6.28,(rand()-.5)*2));scale.setScalar(.65+rand()*.40);matrix.compose(point,rotation,scale);leaves.setMatrixAt(i,matrix);leaves.setColorAt(i,new T.Color().setScalar(.74+rand()*.26));
 }
 const cores=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({color:0x486344,roughness:1,flatShading:false}),24);
 for(let i=0;i<24;i++){const center=branches[i%9];point.set(center.x+(rand()-.5)*2.6,center.y+(rand()-.5)*1.7,center.z+(rand()-.5)*2.6);rotation.identity();scale.set(1.15+rand()*.4,.85+rand()*.6,1.1+rand()*.6);matrix.compose(point,rotation,scale);cores.setMatrixAt(i,matrix);cores.setColorAt(i,new T.Color().setHSL(.25+rand()*.04,.25,.60+rand()*.15));}cores.userData.foliageCore=true;cores.userData.dynamic=true;cores.castShadow=true;cores.receiveShadow=true;cores.computeBoundingSphere();group.add(cores);
 leaves.userData.leafDetail=true;leaves.name='Instanced broadleaf canopy';leaves.castShadow=true;leaves.receiveShadow=true;leaves.userData.dynamic=true;leaves.computeBoundingSphere();group.add(leaves);
 group.userData.distanceCull=155;
 return group;
}

export function gardenFinishes(g:T.Group){
 const stone=material(0xd7d4c7),iron=material(0x263330);
 const slab=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o;};
 for(const {id,x,z,w,d} of GARDENS){
  for(const dz of [-d/2,d/2])slab(x,.13,z+dz,w,.15,.18,stone);
  for(const dx of [-w/2,w/2])slab(x+dx,.13,z,.18,.15,d,stone);
  if(id==='rose')continue;
  for(const dx of [-9,9])for(const dz of [-5.5,5.5]){
   const urn=new T.Mesh(new T.LatheGeometry([new T.Vector2(.33,0),new T.Vector2(.40,.1),new T.Vector2(.20,.28),new T.Vector2(.24,.55),new T.Vector2(.53,.84),new T.Vector2(.58,1.05)],12),stone);urn.position.set(x+dx,.2,z+dz);urn.castShadow=true;g.add(urn);
   for(let j=0;j<7;j++){const sprig=new T.Mesh(new T.ConeGeometry(.18,.8,5),material(0x42614a));sprig.position.set(x+dx+Math.sin(j*2.4)*.22,1.30,z+dz+Math.cos(j*2.4)*.22);sprig.rotation.z=Math.sin(j)*.25;g.add(sprig);}
  }
 }
 // Fine wrought-iron uprights provide a proper perimeter silhouette.
 for(const z of [-132])for(let x=-99;x<=99;x+=1){if(pathClearance(x,z)<.5)continue;slab(x,1.18,z,.045,2.36,.045,iron);}
}

// Match the residence's pale masonry, deep window reveals and layered cornices.
export function westWingFinishes(g:T.Group){
 const white=material(0xf1efdf),stone=material(0xcac9bd),glass=material(0x344c56),roof=material(0x777b72),bronze=material(0x424b44);
 const slab=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;};
 slab(-58,7.27,-20,31.5,.13,35.5,roof);
 for(const [y,h,overhang]of [[.28,.5,.18],[4.0,.13,.12],[6.55,.18,.24],[6.86,.16,.48],[7.22,.18,.18]]){
  for(const z of [-38, -2]){if(z===-38&&y<3.8){for(const [cx,width]of [[-67.8,12.4],[-50.2,16.4]])slab(cx,y,z,width,h,.25+overhang,white);}else slab(-58,y,z,32+overhang*2,h,.25+overhang,white);}
  for(const x of [-74,-42])slab(x,y,-20,.25+overhang,h,36,white);
 }
 for(const x of [-73.4,-42.6])for(let y=.6;y<6.4;y+=.43)for(const z of [-38.03,-1.97])slab(x,y,z,1.1,.39,.23,stone);
 for(let x=-71;x<-43;x+=4)for(const z of [-38.14,-1.86]){
  const direction=z<-20?-1:1;
  for(const [y,h]of [[2.55,2.45],[5.33,1.62]]){
   if(z<-20&&y<3.8&&Math.abs(x+60)<2.8)continue;
   slab(x,y,z,1.86,h,.15,glass);
   for(const side of [-1,1])slab(x+side*1.04,y,z+direction*.09,.15,h+.29,.23,white);
   slab(x,y+h/2+.12,z+direction*.12,2.3,.18,.31,white);
   slab(x,y-h/2-.1,z+direction*.16,2.3,.16,.43,stone);
   slab(x,y,z+direction*.10,.075,h,.05,white);
   for(const dy of [-h/6,h/6])slab(x,y+dy,z+direction*.10,1.86,.055,.05,white);
  }
 }
 for(const x of [-74.12,-41.88])for(const z of [-33,-27,-21,-15,-9])for(const [y,h]of [[2.55,2.45],[5.33,1.62]]){
  if(x>-50&&Math.abs(z+24)<4&&y<3)continue;
  const direction=x<-58?-1:1;slab(x,y,z,.13,h,1.8,glass);
  for(const side of [-1,1])slab(x+direction*.09,y,z+side*1.03,.25,h+.29,.15,white);
  for(const dy of [-h/2-.1,h/2+.1])slab(x+direction*.12,y+dy,z,.30,.16,2.2,white);
  slab(x+direction*.1,y,z,.05,h,.065,white);for(const dy of [-h/6,h/6])slab(x+direction*.1,y+dy,z,.05,.055,1.8,white);
 }
 // North and south parapets with recessed balusters, matching the main roofline.
 for(const z of [-37.8,-2.2]){
  slab(-58,7.75,z,32,.14,.34,white);
  for(let x=-73.5;x<-42;x+=1.25)slab(x,7.49,z,.16,.48,.22,white);
 }
 // North lobby entrance, matching the supplied first-floor plan.
 slab(-60,4.4,-39.8,7,.26,4.3,white);slab(-60,4.64,-39.8,7.4,.19,4.65,stone);
 for(const x of [-62.8,-57.2]){
  const column=new T.Mesh(new T.CylinderGeometry(.22,.28,4.12,12),white);column.position.set(x,2.06,-41.55);column.castShadow=true;g.add(column);
  slab(x,.16,-41.55,.7,.3,.7,stone);slab(x,4.08,-41.55,.64,.21,.64,white);
 }
 // Curved Oval Office pavilion: radial window frames and a continuous cornice.
 for(const y of [.25,4.83,5.18]){
  const rim=new T.Mesh(new T.CylinderGeometry(6.93,6.93,.18,64),white);rim.scale.z=.8;rim.position.set(-47,y,-1.5);rim.castShadow=true;g.add(rim);
 }
 for(let i=0;i<6;i++){
  const a=i/6*Math.PI,frame=new T.Group();frame.position.set(-47+Math.cos(a)*6.65,2.8,-1.5+Math.sin(a)*5.32);frame.rotation.y=Math.PI/2-a;
  const local=(x:number,y:number,w:number,h:number)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,.14),white);o.position.set(x,y,.06);frame.add(o);};
  const window=new T.Mesh(new T.BoxGeometry(1.1,2.7,.09),glass);frame.add(window);for(const x of [-.64,.64])local(x,0,.13,3);for(const y of [-1.47,1.47])local(0,y,1.44,.13);local(0,0,.055,2.7);for(const y of [-.45,.45])local(0,y,1.1,.05);g.add(frame);
 }
 // Finer park bench slats and curled iron ends read as furniture instead of crates.
 for(const [x,z]of [[GARDENS[0].x-7.1,GARDENS[0].z],[GARDENS[0].x+7.1,GARDENS[0].z],[28,18],[42,18]])for(let j=0;j<3;j++)slab(x,1+j*.14,z,.72,.045,1.95,bronze);
}

type Route={name:string;points:readonly (readonly number[])[];width:number;closed?:boolean;surface:'drive'|'walk'};
// All paths, scenery exclusions and QA use the same curves. No legacy rectangles.
export const ESTATE_ROUTES:Route[]=[
 {name:'North Drive',points:NORTH_DRIVE,width:7, surface:'drive'},
 {name:'South Drive',points:SOUTH_DRIVE,width:7.6,closed:true,surface:'drive'},
 ...DRIVE_BRANCHES.map((points,i)=>({name:'South Drive junction '+i,points,width:7.6,surface:'drive' as const})),
 {name:'West entrance drive',points:WEST_APPROACH,width:6.2,surface:'drive'},
 ...WEST_WALKS.map((points,i)=>({name:'Garden walk '+i,points,width:2.1,surface:'walk' as const})),
 {name:'North Portico approach',points:[[0,-55],[0,-42]],width:4,surface:'walk'},
 {name:'Southern perimeter walk',points:[[-106.8,103.9],[-107,135],[-97,164],[-71,193],[-36,209],[0,214],[36,209],[71,193],[97,164],[107,135],[107,106.8]],width:2.2,surface:'walk'},

];
const curves=ESTATE_ROUTES.map(r=>new T.CatmullRomCurve3(r.points.map(([x,z])=>new T.Vector3(x,0,z)),r.closed??false,'centripetal'));
const samples=curves.map(c=>c.getPoints(240));
export function pathClearance(x:number,z:number){let clearance=Infinity;for(let j=0;j<samples.length;j++){const p=samples[j];for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],dx=b.x-a.x,dz=b.z-a.z,t=T.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);clearance=Math.min(clearance,Math.hypot(x-a.x-dx*t,z-a.z-dz*t)-ESTATE_ROUTES[j].width/2);}}
 if(Math.abs(x)<1.8&&z>-4.8&&z<35)clearance=Math.min(clearance,-.1);
 return clearance;}
function routeSurface(g:T.Group,j:number){const r=ESTATE_ROUTES[j],curve=curves[j],v:number[]=[],uv:number[]=[];
 for(let i=0;i<240;i++)for(const [u,side]of [[i/240,-1],[i/240,1],[(i+1)/240,-1],[i/240,1],[(i+1)/240,1],[(i+1)/240,-1]]){const p=curve.getPoint(u),t=curve.getTangent(u),n=new T.Vector3(-t.z,0,t.x).normalize();v.push(p.x+n.x*r.width/2*side,r.surface==='drive'?.035:.043,p.z+n.z*r.width/2*side);uv.push(side,u*60);}
 // Tight junctions can reverse the inside edge; orient every surface upward.
 const clean:number[]=[],tex:number[]=[];for(let i=0;i<v.length;i+=9){const cross=(v[i+5]-v[i+2])*(v[i+6]-v[i])-(v[i+3]-v[i])*(v[i+8]-v[i+2]);if(Math.abs(cross)<1e-8)continue;for(const k of cross>0?[0,1,2]:[0,2,1]){clean.push(...v.slice(i+k*3,i+k*3+3));tex.push(...uv.slice(i/3*2+k*2,i/3*2+k*2+2));}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(clean,3));geo.setAttribute('uv',new T.Float32BufferAttribute(tex,2));geo.computeVertexNormals();const m=new T.Mesh(geo,material(r.surface==='drive'?0x666a66:0xcac8b0));m.name=r.name;m.receiveShadow=true;g.add(m);
}
export function estateDrives(g:T.Group){ESTATE_ROUTES.forEach((r,j)=>{if(r.surface==='drive')routeSurface(g,j);});}
export function gardenApproaches(g:T.Group){ESTATE_ROUTES.forEach((r,j)=>{if(r.surface==='walk')routeSurface(g,j);});}

/** September 2026 official Rose Garden photos: white lattice chairs and striped parasols. */
export function roseDining(g:T.Group,solids:{x:number;z:number;w:number;d:number;height?:number}[]){
 const white=material(0xe9e6d8),gold=material(0xd6ad4c),cloth=material(0xf2e6ba);
 const canopyWhite=white.clone(),canopyGold=gold.clone();canopyWhite.side=canopyGold.side=T.DoubleSide;
 const part=(p:T.Group,geo:T.BufferGeometry,m:T.Material,x:number,y:number,z:number)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;};
 const box=(p:T.Group,x:number,y:number,z:number,w:number,h:number,d:number)=>part(p,new T.BoxGeometry(w,h,d),white,x,y,z);
 for(const x of [-50.5,-38])for(const z of [-9.6,-2.3]){
  const table=new T.Group();table.name='Rose Garden striped-parasol dining setting';table.position.set(x,0,z);g.add(table);
  part(table,new T.CylinderGeometry(.82,.82,.08,32),cloth,0,.87,0);part(table,new T.CylinderGeometry(.07,.12,.7,8),white,0,.48,0);
  part(table,new T.CylinderGeometry(.025,.03,2.7,8),white,0,1.47,0);
  for(let i=0;i<16;i++){const a=i*Math.PI/8,b=(i+1)*Math.PI/8,geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([0,3.05,0,Math.cos(a)*2.1,2.63,Math.sin(a)*2.1,Math.cos(b)*2.1,2.63,Math.sin(b)*2.1],3));geo.computeVertexNormals();part(table,geo,i%2?canopyWhite:canopyGold,0,0,0);}
  solids.push({x,z,w:1.65,d:1.65,height:.92});
  for(let i=0;i<4;i++){const a=i*Math.PI/2,c=new T.Group();c.position.set(Math.sin(a)*1.4,0,Math.cos(a)*1.4);c.rotation.y=a;table.add(c);box(c,0,.54,0,.52,.08,.52);box(c,0,1.05,.26,.56,.055,.055);
   for(const side of [-1,1]){box(c,side*.25,.80,.26,.035,.55,.035);for(const dz of [-.22,.22])box(c,side*.23,.30,dz,.035,.5,.035);}
   for(const dx of [-.15,0,.15])for(const sign of [-1,1]){const l=box(c,dx,.81,.265,.025,.45,.025);l.rotation.z=sign*.65;}
   solids.push({x:x+Math.sin(a)*1.4,z:z+Math.cos(a)*1.4,w:.58,d:.58,height:1.1});
  }
 }
}
