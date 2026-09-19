import * as T from 'three';
export type Footprint={x:number;z:number;w:number;d:number;height?:number;y?:number};
export class CameraObstacles {
 readonly meshes:T.Mesh[]=[];
 private records:{mesh:T.Mesh;box:Footprint;ovalWall:boolean}[]=[];
 constructor(solids:Footprint[],grounds:boolean,cameraOnly:Footprint[]=[]){
  const geometry=new T.BoxGeometry(1,1,1),material=new T.MeshBasicMaterial({side:T.DoubleSide});
  for(const box of [...solids,...cameraOnly]){
   const narrow=Math.min(box.w,box.d)<.7;
   const ovalWall=box.w<=.4&&box.d<=.4;
   const height=box.height??(grounds?(box.w>45?22:box.x===0&&box.z<-35?19:box.x===0&&box.z<0?17:box.w>20?10:box.w<1.5&&box.d<1.5?9:3):(narrow?5.4:1.55));
   const mesh=new T.Mesh(geometry,material);mesh.position.set(box.x,(box.y??0)+height/2,box.z);mesh.scale.set(box.w+(narrow?.12:0),height,box.d+(narrow?.12:0));mesh.updateMatrixWorld(true);this.meshes.push(mesh);this.records.push({mesh,box,ovalWall});
  }
 }
 nearby(x:number,z:number,ovalOnly=false){return this.records.filter(r=>(!ovalOnly||r.ovalWall)&&Math.abs(x-r.box.x)<r.box.w/2+10&&Math.abs(z-r.box.z)<r.box.d/2+10).map(r=>r.mesh);}
 dispose(){this.meshes[0]?.geometry.dispose();(this.meshes[0]?.material as T.Material|undefined)?.dispose();}
}

// Hysteresis avoids resolution changes caused by one slow loading frame.
export class RenderBudget {
 ratio:number;private frames=0;private elapsed=0;private cooldown=0;
 constructor(readonly maximum:number){this.ratio=maximum;}
 sample(seconds:number){
  if(seconds<=0||seconds>1)return false;
  this.frames++;this.elapsed+=seconds;if(this.elapsed<3)return false;
  const fps=this.frames/this.elapsed;this.frames=0;this.elapsed=0;
  if(this.cooldown>0){this.cooldown--;return false;}
  const old=this.ratio;
  if(fps<38)this.ratio=Math.max(.65,this.ratio-.15);
  else if(fps>57)this.ratio=Math.min(this.maximum,this.ratio+.1);
  if(Math.abs(old-this.ratio)>.01){this.cooldown=2;return true;}return false;
 }
}
