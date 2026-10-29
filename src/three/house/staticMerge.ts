import { useLayoutEffect, type RefObject } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Merges every static mesh under `root` into one mesh per material, once, after mount.
 *
 * The house is built from hundreds of small parts (window frames, studs, steps...), each its
 * own draw call. On integrated graphics the draw calls, not the triangles, are the bottleneck,
 * so after the first render the parts are baked into a handful of meshes and the originals
 * hidden. Instanced meshes, and anything under an object with `userData.dynamic`, are left
 * alone so they can still move (e.g. the front door).
 */
export function useStaticMerge(root: RefObject<THREE.Object3D | null>, enabled = true) {
  useLayoutEffect(() => {
    const group = root.current;
    if (!group || !enabled) return;
    group.updateWorldMatrix(true, true);
    const toLocal = new THREE.Matrix4().copy(group.matrixWorld).invert();

    const buckets = new Map<THREE.Material, { geometries: THREE.BufferGeometry[]; cast: boolean; receive: boolean }>();
    const hidden: THREE.Mesh[] = [];

    const visit = (object: THREE.Object3D) => {
      if (object.userData.dynamic) return;
      if (object instanceof THREE.Mesh && !(object instanceof THREE.InstancedMesh) && object.visible && !Array.isArray(object.material)) {
        const material = object.material as THREE.Material;
        const source = object.geometry as THREE.BufferGeometry;
        let geometry = source.index ? source.toNonIndexed() : source.clone();
        // Keep only the attributes every part has, so they can be merged
        for (const name of Object.keys(geometry.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geometry.deleteAttribute(name);
        if (!geometry.attributes.normal) geometry.computeVertexNormals();
        if (!geometry.attributes.uv) {
          geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position!.count * 2), 2));
        }
        geometry.morphAttributes = {};
        geometry = geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(toLocal, object.matrixWorld));
        const bucket = buckets.get(material) ?? { geometries: [], cast: false, receive: false };
        bucket.geometries.push(geometry);
        bucket.cast ||= object.castShadow;
        bucket.receive ||= object.receiveShadow;
        buckets.set(material, bucket);
        hidden.push(object);
      }
      for (const child of object.children) visit(child);
    };
    for (const child of group.children) visit(child);

    const merged: THREE.Mesh[] = [];
    for (const [material, bucket] of buckets) {
      // A single part gains nothing from merging
      if (bucket.geometries.length < 2) {
        bucket.geometries.forEach((g) => g.dispose());
        continue;
      }
      const geometry = mergeGeometries(bucket.geometries, false);
      bucket.geometries.forEach((g) => g.dispose());
      if (!geometry) continue;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = bucket.cast;
      mesh.receiveShadow = bucket.receive;
      mesh.name = 'merged';
      merged.push(mesh);
    }
    const mergedMaterials = new Set(merged.map((m) => m.material));
    const reallyHidden = hidden.filter((m) => mergedMaterials.has(m.material as THREE.Material));
    reallyHidden.forEach((m) => (m.visible = false));
    merged.forEach((m) => group.add(m));

    return () => {
      merged.forEach((m) => {
        group.remove(m);
        m.geometry.dispose();
      });
      reallyHidden.forEach((m) => (m.visible = true));
    };
    // Runs once: the house and site are static after mount
  }, [root, enabled]);
}
