import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Dusk lighting shared by all scenes: a cool sky key, a warm afterglow from one side, and a
 * reflection environment for the glass.
 *
 * The reflection environment is generated once from a tiny in-memory scene of glowing
 * panels (pre-filtered with PMREMGenerator). No HDRI download, no external asset licence,
 * and no image-loader code in the bundle.
 */
export function SceneEnvironment({ background, ground = true }: { background: string; ground?: boolean }) {
  return (
    <>
      {/* Opaque background matching the page section, and fog of the same colour so the
          ground fades into it with no visible horizon line */}
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 70, 190]} />
      <hemisphereLight args={['#5f7088', '#0d0b09', 0.55]} />
      <directionalLight position={[-24, 34, 18]} intensity={1.15} color="#c7d3df" />
      <directionalLight position={[30, 7, -18]} intensity={0.75} color="#d99b5c" />
      <ReflectionEnvironment />

      {ground && (
        <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
          <planeGeometry args={[400, 400]} />
          <meshStandardMaterial color="#121110" roughness={1} />
        </mesh>
      )}
    </>
  );
}

function panel(color: string, intensity: number, size: [number, number], position: [number, number, number], rotation: [number, number, number]) {
  const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  return mesh;
}

function ReflectionEnvironment() {
  const { gl, scene } = useThree();

  useLayoutEffect(() => {
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color('#06070a');
    envScene.add(
      // Cool overcast sky overhead
      panel('#93a7bd', 0.9, [60, 60], [0, 30, 0], [Math.PI / 2, 0, 0]),
      // Warm low afterglow on one side, the main highlight in the glass
      panel('#e3a466', 2.4, [60, 5], [40, 5, -12], [0, -Math.PI / 2, 0]),
      // Soft fill from the opposite side
      panel('#f5f2ec', 0.5, [30, 14], [-40, 10, 14], [0, Math.PI / 2, 0]),
    );

    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromScene(envScene, 0.04);
    const previous = scene.environment;
    scene.environment = target.texture;

    return () => {
      scene.environment = previous;
      target.dispose();
      pmrem.dispose();
      envScene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
      });
    };
  }, [gl, scene]);

  return null;
}
