import * as T from 'three';
import CameraControls from 'camera-controls';
CameraControls.install({ THREE: T });
/** Library orbit damping and near-plane collision, with an undelayed player anchor. */
export class FollowCamera {
  private camera = new T.PerspectiveCamera(66, 1, .18, 420);
  private controls = new CameraControls(this.camera);
  private centerRay = new T.Raycaster();
  private fresh = true;
  distance = 0;
  constructor() { this.controls.smoothTime = .16; this.controls.minDistance = .05; this.controls.restThreshold = .001; }
  reset() { this.fresh = true; this.distance = 0; }
  dispose() { this.controls.dispose(); }
  solve(target: T.Vector3, desired: T.Vector3, surfaces: T.Object3D[], dt: number, view?: T.PerspectiveCamera) {
    if (view) { this.camera.fov = view.fov; this.camera.aspect = view.aspect; this.camera.updateProjectionMatrix(); }
    const delta = desired.clone().sub(target), sphere = new T.Spherical().setFromVector3(delta);
    this.controls.colliderMeshes = surfaces as T.Mesh[];
    void this.controls.moveTo(target.x, target.y, target.z, false);
    void this.controls.rotateTo(sphere.theta, sphere.phi, !this.fresh);
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
    return { position, showPlayer: this.distance >= 2.0 };
  }
}
