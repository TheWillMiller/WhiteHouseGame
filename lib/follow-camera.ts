import * as T from 'three';

/** Retract immediately at a wall, then ease the boom back out. Never interpolate through a wall. */
export class FollowCamera {
  distance = 0;
  reset() { this.distance = 0; }
  solve(target: T.Vector3, desired: T.Vector3, surfaces: T.Object3D[], dt: number) {
    const direction = desired.clone().sub(target), wanted = direction.length(); direction.normalize();
    const right = new T.Vector3().crossVectors(direction, new T.Vector3(0, 1, 0)).normalize();
    const up = new T.Vector3().crossVectors(right, direction).normalize();
    let clear = wanted;
    // A small camera volume protects the near plane at corners, not just its center pixel.
    for (const offset of [new T.Vector3(), right.clone().multiplyScalar(.22), right.clone().multiplyScalar(-.22), up.clone().multiplyScalar(.18), up.clone().multiplyScalar(-.18)]) {
      const ray = new T.Raycaster(target.clone().add(offset), direction, 0, wanted + .3);
      const hit = ray.intersectObjects(surfaces, false)[0];
      if (hit) clear = Math.min(clear, Math.max(.10, hit.distance - .30));
    }
    this.distance = !this.distance || clear < this.distance ? clear : T.MathUtils.damp(this.distance, clear, 4, dt);
    return { position: target.clone().addScaledVector(direction, this.distance), showPlayer: this.distance >= 2.0 };
  }
}
