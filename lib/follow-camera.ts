import * as T from 'three';
import CameraControls from 'camera-controls';
CameraControls.install({ THREE: T });
/** Manual on-foot view; gentle chase recentering is reserved for vehicles. */
export class ThirdPersonOrbit {
 private lookDelay=0;
 looking=false;
 reset(_yaw=0){this.lookDelay=0;this.looking=false;}
 manualLook(){this.lookDelay=1.2;}
 movementBasis(_input:string,yaw:number){return yaw;}
 follow(yaw:number,heading:number,moving:boolean,dt:number){this.lookDelay=Math.max(0,this.lookDelay-dt);if(!moving||this.looking||this.lookDelay>0)return yaw;const delta=Math.atan2(Math.sin(heading-yaw),Math.cos(heading-yaw));return yaw+delta*(1-Math.exp(-dt*2.2));}
}
/** Library orbit damping and near-plane collision, with an undelayed player anchor. */
export class FollowCamera {
  private camera = new T.PerspectiveCamera(66, 1, .18, 420);
  private controls = new CameraControls(this.camera);
  private centerRay = new T.Raycaster();
  private fresh = true;
  private azimuth = 0;
  distance = 0;
  constructor() { this.controls.smoothTime = .16; this.controls.minDistance = .05; this.controls.restThreshold = .001; }
  reset() { this.fresh = true; this.distance = 0; }
  dispose() { this.controls.dispose(); }
  solve(target: T.Vector3, desired: T.Vector3, surfaces: T.Object3D[], dt: number, view?: T.PerspectiveCamera, avatarClearance=2) {
    if (view) { this.camera.fov = view.fov; this.camera.aspect = view.aspect; this.camera.updateProjectionMatrix(); }
    const delta = desired.clone().sub(target), sphere = new T.Spherical().setFromVector3(delta);
    this.controls.colliderMeshes = surfaces as T.Mesh[];
    void this.controls.moveTo(target.x, target.y, target.z, false);
    // Spherical theta wraps at +/-PI. Feed a continuous equivalent angle so
    // crossing south never asks camera-controls to orbit a full revolution.
    this.azimuth=this.fresh?sphere.theta:this.azimuth+Math.atan2(Math.sin(sphere.theta-this.azimuth),Math.cos(sphere.theta-this.azimuth));
    // Look input is already smooth. A second angular spring makes steering lag.
    void this.controls.rotateTo(this.azimuth, sphere.phi, false);
    void this.controls.dollyTo(sphere.radius, !this.fresh);
    this.controls.update(Math.max(dt, 1 / 240)); this.fresh = false;
    const position = this.camera.position.clone(), previous = this.distance;
    this.distance = position.distanceTo(target);
    // The library tests the four near-plane corners. A narrow column or cabinet
    // can fit between those rays, so also protect the center of the lens.
    const direction = position.clone().sub(target).normalize();
    this.centerRay.set(target, direction); this.centerRay.far = this.distance + .12;
    const hit = this.centerRay.intersectObjects(surfaces, false)[0];
    if (hit && hit.distance < this.distance + .12) {
      this.distance = Math.max(.05, hit.distance - .12);
      position.copy(target).addScaledVector(direction, this.distance);
      void this.controls.dollyTo(this.distance, false);
      this.controls.update(0);
    }
    // A hard wall retraction must clear the old dolly velocity; otherwise the
    // first unobstructed frame continues moving inward before easing out.
    if (previous > this.distance + .01 && this.distance < sphere.radius - .01) {
      void this.controls.dollyTo(this.distance, false);
      this.controls.update(0);
    }
    return { position, showPlayer: this.distance >= avatarClearance };
  }
}
