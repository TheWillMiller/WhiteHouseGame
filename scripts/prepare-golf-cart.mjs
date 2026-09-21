// Michael Ruddy, Golf cart, CC BY 3.0. Source retained in public/models/credits.txt.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {getBounds,join,weld,prune,meshopt} from '@gltf-transform/functions';
import {MeshoptEncoder} from 'meshoptimizer';
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const doc=await io.read(process.argv[2]||'.qa/golf-cart-original.glb'),root=doc.getRoot(),scene=root.listScenes()[0];
const scale=.88,ground=.9005013108253479;
for(const mesh of root.listMeshes())for(const p of mesh.listPrimitives()){
 const a=p.getAttribute('POSITION'),v=a.getArray();for(let i=0;i<v.length;i+=3){v[i]*=scale;v[i+1]=(v[i+1]+ground)*scale;v[i+2]*=scale;}
}
const gold=[.83,.50,.12,1],leather=[.19,.12,.068,1];
for(const m of root.listMaterials()){
 const name=m.getName();m.setRoughnessFactor(.55).setMetallicFactor(0);
 if(name==='mat21')m.setName('Champagne gold body').setBaseColorFactor(gold).setMetallicFactor(.82).setRoughnessFactor(.25);
 if(name==='mat18')m.setName('Saddle leather').setBaseColorFactor(leather).setRoughnessFactor(.8);
 if(name==='mat17'||name==='mat16'||name==='mat7')m.setBaseColorFactor([.024,.03,.035,1]).setRoughnessFactor(.82);
 if(name==='mat15'||name==='mat25')m.setName('Polished metal').setAlphaMode('OPAQUE').setBaseColorFactor([.55,.58,.61,1]).setMetallicFactor(.9).setRoughnessFactor(.22);
 if(name==='mat12')m.setBaseColorFactor([.95,.86,.55,1]).setEmissiveFactor([.25,.17,.06]);
}
// Each tyre and hub keeps its own real axle pivot. Static parts batch by material.
for(const side of [-1,1])for(const front of [true,false]){
 const tyre=root.listNodes().find(n=>{if(!n.getMesh())return false;const b=getBounds(n);return b.max[1]<.55&&b.max[0]-b.min[0]<.2&&Math.sign(b.min[0])===side&&(b.min[2]<0)===front&&n.getMesh().listPrimitives().some(p=>p.getMaterial()?.getName()==='mat17');});
 if(!tyre)throw Error('Wheel missing');const b=getBounds(tyre),center=b.min.map((n,i)=>(n+b.max[i])/2),pivot=doc.createNode(`wheel-${front?'f':'r'}${side<0?'l':'r'}`).setTranslation(center);scene.addChild(pivot);
 for(const node of [...scene.listChildren()]){if(node===pivot||!node.getMesh())continue;const nb=getBounds(node),c=nb.min.map((n,i)=>(n+nb.max[i])/2);if(Math.hypot(c[0]-center[0],c[1]-center[1],c[2]-center[2])<.12){node.setTranslation(center.map(v=>-v));pivot.addChild(node);}}
}
for(const node of root.listNodes())if(!node.getName().startsWith('wheel-')){node.setName('');node.getMesh()?.setName('');}
scene.setName('Golden golf cart');scene.setExtras({author:'Michael Ruddy',source:'https://poly.pizza/m/0ZN5hIrQCUh',license:'CC-BY-3.0',adaptation:'Gold body, saddle seats, metal trim, scaled to metres, animated wheel pivots.'});
await doc.transform(join({keepNamed:true}),weld(),prune(),meshopt({encoder:MeshoptEncoder,level:'high'}));
await io.write('public/models/gold-golf-cart.glb',doc);
console.log('Gold golf cart prepared',getBounds(scene));
