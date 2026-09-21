import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {CartMotor} from './locomotion';
import {disposeResidence} from './residence-model';

export class GolfCart {
  object:T.Group;motor=new CartMotor();driving=false;private wheels:{node:T.Object3D;front:boolean}[]=[];
  private roll=0;private reflection:T.WebGLRenderTarget|null=null;
  constructor(scene:T.Group,renderer?:T.WebGLRenderer){
    this.object=scene;scene.position.set(5,0,35);scene.rotation.y=0;
    if(renderer){const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();this.reflection=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();}
    scene.traverse(o=>{o.userData.dynamic=true;if(o.name.startsWith('wheel-'))this.wheels.push({node:o,front:o.name.startsWith('wheel-f')});if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial&&this.reflection){m.envMap=this.reflection.texture;m.envMapIntensity=1.1;}}});
  }
  /** Driver hip aligned with the left seat. The posed avatar supplies .608 m hip height. */
  driverPosition(){return this.local(-.27,.166,.12);}
  local(x:number,y:number,z:number){return new T.Vector3(x,y,z).applyEuler(this.object.rotation).add(this.object.position);}
  contains(x:number,z:number,radius=.24){const p=new T.Vector3(x,0,z).sub(this.object.position).applyAxisAngle(new T.Vector3(0,1,0),this.motor.heading);return Math.abs(p.x)<.86+radius&&p.z>-1.45-radius&&p.z<1.5+radius;}
  placeOnCourse(p:T.Vector3,heading:number,distance:number){this.object.position.copy(p);this.motor.heading=heading;this.object.rotation.y=-heading;this.roll+=distance/.246;for(const {node,front}of this.wheels)node.rotation.set(this.roll,front?-.10:0,0,'YXZ');}
  update(dt:number,throttle:number,steer:number,brake:boolean,blocked:(x:number,z:number)=>boolean){
    const steps=Math.max(1,Math.ceil(dt/(1/90))),h=dt/steps;
    for(let i=0;i<steps;i++){
      const old=this.motor.heading,delta=this.motor.step(throttle,steer,brake,h),next=this.object.position.clone().add(new T.Vector3(delta.x,0,delta.z));
      // Sweep a closely spaced footprint, so a narrow post cannot pass between corner tests.
      let hit=false;for(const x of [-.82,0,.82])for(const z of [-1.42,-.7,0,.7,1.45]){const p=new T.Vector3(x,0,z).applyAxisAngle(new T.Vector3(0,1,0),-this.motor.heading).add(next);if(blocked(p.x,p.z)){hit=true;break;}}
      if(hit){this.motor.heading=old;this.motor.speed=0;}else{this.object.position.copy(next);this.roll+=this.motor.speed*h/.246;}
    }
    this.object.rotation.y=-this.motor.heading;
    for(const {node,front}of this.wheels){node.rotation.set(this.roll,front?-this.motor.steer*.45:0,0,'YXZ');}
  }
  dispose(){this.object.parent?.remove(this.object);disposeResidence(this.object);this.reflection?.dispose();}
}
export async function loadGolfCart(pathname:string,renderer:T.WebGLRenderer){const base=pathname==='/trumpgame'||pathname.startsWith('/trumpgame/')?'/trumpgame/':'/';const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(base+'models/gold-golf-cart.glb');return new GolfCart(gltf.scene,renderer);}
