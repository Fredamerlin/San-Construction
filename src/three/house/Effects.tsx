import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import type { SceneQuality } from '../capability';

/**
 * Post-processing: ambient occlusion for contact depth (high quality only), bloom so lamps
 * and lit windows glow, filmic tone mapping, and a light vignette.
 * Bloom only picks up pixels brighter than 1, i.e. the lamp materials, not sunlit walls.
 */
export function Effects({ quality }: { quality: SceneQuality }) {
  if (quality === 'high') {
    return (
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={1.1} intensity={2.4} distanceFalloff={0.8} halfRes />
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.85} radius={0.72} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.32} darkness={0.5} />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.75} radius={0.65} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.32} darkness={0.5} />
    </EffectComposer>
  );
}
