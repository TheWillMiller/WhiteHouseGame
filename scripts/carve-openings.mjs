/** Subtract boxes from triangles, interpolating every vertex attribute at cut edges. */
export function carveOpenings(doc,primitive,boxes){
 const semantics=primitive.listSemantics(),attributes=semantics.map(s=>primitive.getAttribute(s)),sizes=attributes.map(a=>a.getElementSize()),offsets=[];let stride=0;for(const size of sizes){offsets.push(stride);stride+=size;}
 const posOffset=offsets[semantics.indexOf('POSITION')],out=semantics.map(()=>[]),index=primitive.getIndices().getArray();
 const vertex=id=>attributes.flatMap((a,j)=>Array.from(a.getArray().subarray(id*sizes[j],(id+1)*sizes[j])));
 const split=(poly,axis,value,sign)=>{const inside=[],outside=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=(a[posOffset+axis]-value)*sign,db=(b[posOffset+axis]-value)*sign;const keep=da>=0;(keep?inside:outside).push(a);if((da>=0)!==(db>=0)){const t=da/(da-db),v=a.map((n,j)=>n+(b[j]-n)*t);inside.push(v);outside.push(v);}}return {inside,outside};};
 const subtract=(poly,box)=>{const kept=[];let pending=poly;for(let axis=0;axis<3;axis++)for(const sign of [1,-1]){if(pending.length<3)return kept;const value=sign===1?box.min[axis]:box.max[axis],parts=split(pending,axis,value,sign);if(parts.outside.length>=3)kept.push(parts.outside);pending=parts.inside;}return kept;};
 const write=poly=>{for(let i=1;i<poly.length-1;i++)for(const v of [poly[0],poly[i],poly[i+1]])for(let j=0;j<semantics.length;j++)out[j].push(...v.slice(offsets[j],offsets[j]+sizes[j]));};
 for(let i=0;i<index.length;i+=3){let polys=[[vertex(index[i]),vertex(index[i+1]),vertex(index[i+2])]];for(const box of boxes)polys=polys.flatMap(poly=>{const overlaps=[0,1,2].every(axis=>Math.max(...poly.map(v=>v[posOffset+axis]))>=box.min[axis]&&Math.min(...poly.map(v=>v[posOffset+axis]))<=box.max[axis]);return overlaps?subtract(poly,box):[poly];});for(const poly of polys)write(poly);}
 for(let j=0;j<semantics.length;j++){const a=doc.createAccessor().setType(attributes[j].getType()).setArray(new Float32Array(out[j])).setBuffer(attributes[j].getBuffer());primitive.setAttribute(semantics[j],a);}
 const count=out[0].length/sizes[0];primitive.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from({length:count},(_,i)=>i)).setBuffer(attributes[0].getBuffer()));
}
