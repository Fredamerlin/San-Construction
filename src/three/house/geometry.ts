import * as THREE from 'three';

/*
 * Geometry builders for the house. All UVs are in metres, so a material whose texture
 * repeat is 1 / (tile size in metres) shows the same texel density on every surface.
 */

/** Box with metre-based UVs (BoxGeometry's are 0–1 per face, which stretches textures). */
export function meterBox(width: number, height: number, depth: number) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const uv = geometry.attributes.uv as THREE.BufferAttribute;
  // Face order: +x, -x, +y, -y, +z, -z; four vertices each
  const sizes: [number, number][] = [
    [depth, height],
    [depth, height],
    [width, depth],
    [width, depth],
    [width, height],
    [width, height],
  ];
  sizes.forEach(([su, sv], face) => {
    for (let i = face * 4; i < face * 4 + 4; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  });
  return geometry;
}

// Boxes with metre UVs, created once per size and shared (safe to call in loops and render)
const boxCache = new Map<string, THREE.BufferGeometry>();
export function cachedBox(w: number, h: number, d: number) {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  let geometry = boxCache.get(key);
  if (!geometry) {
    geometry = meterBox(w, h, d);
    boxCache.set(key, geometry);
  }
  return geometry;
}

export interface Opening {
  /** Left edge, measured along the wall from its start. */
  x: number;
  /** Bottom edge, measured from the wall's base. */
  y: number;
  width: number;
  height: number;
}

/**
 * A straight wall with rectangular openings. Local x runs along the wall, y up; the outer
 * face sits at z = 0 and the wall extends to z = -thickness (inward, see <Wall>).
 */
export function wallGeometry(length: number, height: number, thickness: number, openings: Opening[] = []) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(length, 0);
  shape.lineTo(length, height);
  shape.lineTo(0, height);
  shape.closePath();
  for (const o of openings) {
    const hole = new THREE.Path();
    hole.moveTo(o.x, o.y);
    hole.lineTo(o.x, o.y + o.height);
    hole.lineTo(o.x + o.width, o.y + o.height);
    hole.lineTo(o.x + o.width, o.y);
    hole.closePath();
    shape.holes.push(hole);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geometry.translate(0, 0, -thickness);
  return geometry;
}

/** One sloping face: eave edge a→b, upper edge d→c (c above b, d above a). */
export type SlopedFace = [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];

/**
 * Sloping roof faces with UVs measured along the eave (u) and up the slope (v), so roof
 * tiles run in courses parallel to the eave. `underside` faces down (for soffits).
 */
export function slopedFaces(faces: SlopedFace[], underside = false) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const edge = new THREE.Vector3();
  const across = new THREE.Vector3();
  const rel = new THREE.Vector3();

  for (const [a, b, c, d] of faces) {
    edge.subVectors(b, a).normalize();
    // Horizontal direction from the eave toward the ridge
    across.set(-edge.z, 0, edge.x);
    rel.subVectors(d, a).setY(0);
    if (rel.dot(across) < 0) across.negate();
    const run = rel.dot(across);
    const slope = run > 1e-6 ? Math.hypot(run, d.y - a.y) / run : 1;
    const uvOf = (p: THREE.Vector3) => {
      rel.subVectors(p, a);
      const u = rel.dot(edge);
      rel.setY(0);
      return [u, rel.dot(across) * slope];
    };
    const tris = underside ? [a, c, b, a, d, c] : [a, b, c, a, c, d];
    for (const p of tris) {
      positions.push(p.x, p.y, p.z);
      uvs.push(...uvOf(p));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  y: number;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/**
 * The four faces between an outer rectangle (the eave) and a higher inner rectangle.
 * A hip roof is an inner rectangle collapsed to the ridge line. Faces run
 * front, right, back, left (counter-clockwise seen from above).
 */
export function ringFaces(outer: Rect, inner: Rect): SlopedFace[] {
  const o = [v(outer.x0, outer.y, outer.z1), v(outer.x1, outer.y, outer.z1), v(outer.x1, outer.y, outer.z0), v(outer.x0, outer.y, outer.z0)];
  const n = [v(inner.x0, inner.y, inner.z1), v(inner.x1, inner.y, inner.z1), v(inner.x1, inner.y, inner.z0), v(inner.x0, inner.y, inner.z0)];
  return [0, 1, 2, 3].map((i) => [o[i]!, o[(i + 1) % 4]!, n[(i + 1) % 4]!, n[i]!] as SlopedFace);
}

/**
 * Gable roof with its ridge along z, from z0 (back) to z1 (front): the two slopes, their
 * undersides, and the triangular gable end (in the XY plane, base centred on x = 0).
 */
export function gableRoof(x0: number, x1: number, z0: number, z1: number, y: number, rise: number) {
  const xm = (x0 + x1) / 2;
  const faces: SlopedFace[] = [
    // Left slope: eave along x0, from back to front (winding gives an up-and-left normal)
    [v(x0, y, z0), v(x0, y, z1), v(xm, y + rise, z1), v(xm, y + rise, z0)],
    // Right slope: eave along x1, from front to back
    [v(x1, y, z1), v(x1, y, z0), v(xm, y + rise, z0), v(xm, y + rise, z1)],
  ];
  const shape = new THREE.Shape();
  shape.moveTo(x0 - xm, 0);
  shape.lineTo(x1 - xm, 0);
  shape.lineTo(0, rise);
  shape.closePath();
  return {
    slopes: slopedFaces(faces),
    underside: slopedFaces(faces, true),
    gable: new THREE.ShapeGeometry(shape),
  };
}

/**
 * A tube that tapers from `r0` to `r1` along a curve (TubeGeometry has a constant radius).
 * Used for palm trunks.
 */
export function taperedTube(curve: THREE.Curve<THREE.Vector3>, segments: number, radial: number, r0: number, r1: number) {
  const frames = curve.computeFrenetFrames(segments, false);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, point);
    const r = THREE.MathUtils.lerp(r0, r1, t);
    const N = frames.normals[i]!;
    const B = frames.binormals[i]!;
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      normal.set(0, 0, 0).addScaledVector(N, Math.cos(a)).addScaledVector(B, Math.sin(a)).normalize();
      positions.push(point.x + normal.x * r, point.y + normal.y * r, point.z + normal.z * r);
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(j / radial, t * 8);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

/** Position, rotation and length for a box stretched between two points (its long axis is z). */
export function beamBetween(from: THREE.Vector3, to: THREE.Vector3) {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const length = from.distanceTo(to);
  const helper = new THREE.Object3D();
  helper.position.copy(mid);
  helper.lookAt(to);
  return { position: mid, quaternion: helper.quaternion.clone(), length };
}
