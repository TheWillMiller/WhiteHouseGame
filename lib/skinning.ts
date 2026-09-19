import type {SkinnedMesh} from 'three';

/** Keep the GPU pose current when a cached shadow pass skips a skeleton update.
 * Three r186 advances its frame counter between scene collection and shadows.
 * A shadow draw can therefore mark next frame's skeleton as already updated.
 * World matrices are current by onBeforeRender; refresh the small bone palette
 * here so the visible mesh and following camera always use the same frame.
 */
export function synchronizeSkin(mesh:SkinnedMesh){
  mesh.onBeforeRender=()=>mesh.skeleton.update();
}
