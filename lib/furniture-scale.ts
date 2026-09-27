import * as T from 'three';
import {furnitureModel} from './furniture-models';

export const FURNITURE_FLOOR=.11;
export const SEATED_HIP=.78;
export const SOFA_HIP=.745;
type Solid={x:number;z:number;w:number;d:number;height?:number;seatId?:string};

/** Resize one legacy furniture assembly about its own base, never the room or its layout. */
export function furniturePiece(parent:T.Group,solids:Solid[],name:string,x:number,z:number,scale:[number,number,number],build:()=>void){
 const first=parent.children.length,firstSolid=solids.length;build();
 const pieces=parent.children.slice(first),group=new T.Group();group.name=name;
 group.position.set(x,FURNITURE_FLOOR,z);group.scale.set(...scale);
 for(const piece of pieces){piece.position.x-=x;piece.position.z-=z;group.add(piece);}parent.add(group);
 group.updateWorldMatrix(true,true);const bounds=new T.Box3().setFromObject(group),size=bounds.getSize(new T.Vector3());
 group.userData.furniture={name,width:size.x,height:size.y,depth:size.z,base:FURNITURE_FLOOR};
 let yaw=pieces.find(o=>o instanceof T.Group)?.rotation.y??0;
 const sideways=Math.abs(Math.sin(yaw))>.5,localWidth=sideways?size.z:size.x,localDepth=sideways?size.x:size.z;
 let asset='',width=localWidth,height=size.y,depth=localDepth;
 if(/sofa/i.test(name)||name==='State room seating'&&localWidth>1){asset='Sofa_01';height=.97;}
 else if(/Armchair|fireplace armchair|guest chair|President chair/.test(name)||name==='State room seating'){asset='ArmChair_01';height=1.05;width=Math.max(.62,localWidth);depth=Math.max(.65,localDepth);}
 else if(name==='Office desk'){asset='antique-desk';height=.76;}
 else if(name==='Resolute desk'){asset='antique-desk';width=1.8288;height=.8255;depth=1.2192;}
 else if(/coffee table/i.test(name)){asset='gothic_coffee_table';height=.46;}
 else if(/side table/i.test(name)){asset='ClassicNightstand_01';height=.75;}
 else if(/round table/i.test(name)){asset='round_wooden_table_01';height=.76;}
 else if(name==='Bed and nightstands'){asset='GothicBed_01';width=1.92;height=2.1;depth=2.30;yaw=Math.PI;}
 else if(name==='Grand piano'){asset='grand-piano';width=1.5;height=1.4;depth=2.25;}
 else if(name==='Press audience chair'){asset='press-chair';width=.64;height=1.02;depth=.64;}
 else if(name==='Billiard table'){asset='pool-table';width=1.54;height=.79;depth=2.82;}
 else if(name==='Kitchen island'){asset='kitchen-island';width=2.10;height=.93;depth=2.8;}
 else if(name==='Kitchen counter'){asset='kitchen-counter';width=.84;height=.93;depth=2.7;yaw=Math.PI;}
 else if(name==='Refrigerator'){asset='refrigerator';width=.94;height=1.95;depth=.90;}
 if(asset){furnitureModel(group,{asset,width,height,depth,yaw});group.userData.furniture={name,width:Math.abs(Math.cos(yaw))*width+Math.abs(Math.sin(yaw))*depth,height,depth:Math.abs(Math.sin(yaw))*width+Math.abs(Math.cos(yaw))*depth,base:FURNITURE_FLOOR};}
 for(const solid of solids.slice(firstSolid)){solid.x=x+(solid.x-x)*scale[0];solid.z=z+(solid.z-z)*scale[2];solid.w*=scale[0];solid.d*=scale[2];solid.height=asset?FURNITURE_FLOOR+height:FURNITURE_FLOOR+(solid.height??(bounds.max.y-FURNITURE_FLOOR)/scale[1])*scale[1];}
 return group;
}
