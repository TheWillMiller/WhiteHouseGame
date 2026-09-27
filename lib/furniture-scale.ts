import * as T from 'three';

export const FURNITURE_FLOOR=.11;
export const SEATED_HIP=.64;
type Solid={x:number;z:number;w:number;d:number;height?:number;seatId?:string};

/** Resize one legacy furniture assembly about its own base, never the room or its layout. */
export function furniturePiece(parent:T.Group,solids:Solid[],name:string,x:number,z:number,scale:[number,number,number],build:()=>void){
 const first=parent.children.length,firstSolid=solids.length;build();
 const pieces=parent.children.slice(first),group=new T.Group();group.name=name;
 group.position.set(x,FURNITURE_FLOOR,z);group.scale.set(...scale);
 for(const piece of pieces){piece.position.x-=x;piece.position.z-=z;group.add(piece);}parent.add(group);
 group.updateWorldMatrix(true,true);const bounds=new T.Box3().setFromObject(group),size=bounds.getSize(new T.Vector3());
 group.userData.furniture={name,width:size.x,height:size.y,depth:size.z,base:FURNITURE_FLOOR};
 for(const solid of solids.slice(firstSolid)){solid.x=x+(solid.x-x)*scale[0];solid.z=z+(solid.z-z)*scale[2];solid.w*=scale[0];solid.d*=scale[2];solid.height=FURNITURE_FLOOR+(solid.height??(bounds.max.y-FURNITURE_FLOOR)/scale[1])*scale[1];}
 return group;
}
