// User-provided Meshy Golden Presidential Golf Cart. Source stays outside Git.
// Usage: node scripts/prepare-presidential-cart.mjs path/to/original.glb
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {compactPrimitive,prune,textureCompress,meshopt,getBounds} from '@gltf-transform/functions';
import {MeshoptEncoder} from 'meshoptimizer';
import sharp from 'sharp';
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const doc=await io.read(process.argv[2]||'../assets/golf-cart/Meshy_AI_Golden_Presidential_G_0927012820_texture.glb');
const root=doc.getRoot(),scene=root.listScenes()[0],source=root.listMeshes()[0].listPrimitives()[0];
// The replacement was retopologized and baked in Meshy. Preserve EVERY supplied
// triangle and its UVs: another simplification would damage the baked mapping.
const pos=source.getAttribute('POSITION').getArray(),indices=source.getIndices().getArray(),scale=1.55,ground=-getBounds(scene).min[1];
// Meshy supplies a single fused object. Detach the four tyres/hubs at the axle,
// keeping the fenders and chassis static; coordinates are in the source space.
const centers=[[-.777,-.493,-.365],[-.777,-.493,.365],[.609,-.493,-.365],[.609,-.493,.365]],parts=Array.from({length:5},()=>[]);
for(let i=0;i<indices.length;i+=3){
 const tri=Array.from(indices.slice(i,i+3)),c=[0,0,0];for(const v of tri)for(let k=0;k<3;k++)c[k]+=pos[v*3+k]/3;
 const wheel=centers.findIndex(([x,y,z])=>Math.sign(c[2])===Math.sign(z)&&Math.abs(c[2])>.277&&Math.hypot(c[0]-x,c[1]-y)<.185&&c[1]<-.307);
 parts[wheel+1].push(...tri);
}
const material=source.getMaterial().setName('Champagne gold body'),wheelMaterial=material.clone().setName('Presidential wheels');
// Rotate source -X forward onto game -Z, place contact patches at ground level.
for(const semantic of ['POSITION','NORMAL']){const a=source.getAttribute(semantic),v=a.getArray();for(let i=0;i<v.length;i+=3){const x=v[i],y=v[i+1],z=v[i+2];v[i]=-z*(semantic==='POSITION'?scale:1);v[i+1]=semantic==='POSITION'?(y+ground)*scale:y;v[i+2]=x*(semantic==='POSITION'?scale:1);}}
for(const child of [...scene.listChildren()])scene.removeChild(child);
for(let i=0;i<5;i++){
 const primitive=source.clone().setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(parts[i])));compactPrimitive(primitive);
 const name=i===0?'Presidential gold body':`wheel-${i<3?'f':'r'}${centers[i-1][2]>0?'l':'r'}`,node=doc.createNode(name),mesh=doc.createMesh(name).addPrimitive(primitive);node.setMesh(mesh);scene.addChild(node);
 if(i){const [x,y,z]=centers[i-1],center=[-z*scale,(y+ground)*scale,x*scale],a=primitive.getAttribute('POSITION'),v=a.getArray();for(let j=0;j<v.length;j+=3)for(let k=0;k<3;k++)v[j+k]-=center[k];const pivot=doc.createNode(name).setTranslation(center);node.setName('tyre-'+name.slice(6));scene.removeChild(node);pivot.addChild(node);scene.addChild(pivot);primitive.setMaterial(wheelMaterial);}
 console.log(name,parts[i].length/3,'triangles');
}
scene.setName('Golden Presidential Golf Cart');scene.setExtras({source:'User-provided Meshy_AI_Golden_Presidential_G_0927012820_texture.glb',driverSeat:[-.30,.90,.36],wheelRadius:.275});
await doc.transform(prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[2048,2048],quality:95}),meshopt({encoder:MeshoptEncoder,level:'high'}));
await io.write('public/models/presidential-golf-cart-v2.glb',doc);console.log('Prepared cart',getBounds(scene));
