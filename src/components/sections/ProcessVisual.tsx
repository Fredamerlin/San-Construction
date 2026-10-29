import { lazy, Suspense, useRef, useState } from 'react';
import { useMotionValueEvent, type MotionValue } from 'motion/react';
import { processSteps, stageImages } from '../../data/process';
import { SceneErrorBoundary } from '../../three/SceneErrorBoundary';
import { useIdleReady, useSceneCapability } from '../../three/useSceneCapability';
import { Picture } from '../ui/Picture';

const ProcessScene = lazy(() => import('../../three/ProcessScene'));

// Scroll progress 0–1 maps to construction stage 0.6–6 (starting with survey lines visible)
const STAGE_START = 0.6;
const toStage = (progress: number) => STAGE_START + Math.min(Math.max(progress, 0), 1) * (6 - STAGE_START);
const toStepIndex = (stage: number) =>
  Math.min(processSteps.length - 1, Math.floor(((stage - STAGE_START) / (6 - STAGE_START)) * processSteps.length));

/**
 * Sticky visual beside the process steps on large screens. The live 3D building assembles
 * as the steps scroll by; without 3D, still renders of each stage crossfade instead.
 * Purely illustrative: every step's content is in the HTML list beside it.
 */
export function ProcessVisual({ progress }: { progress: MotionValue<number> }) {
  const capability = useSceneCapability();
  // Only large screens show this panel; smaller screens never load the 3D code
  const [desktop] = useState(() => window.matchMedia('(min-width: 64rem)').matches);
  const enabled = capability.enabled && desktop;
  const idle = useIdleReady(enabled);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  // A ref, not state: the 3D scene reads it every frame, so scrolling never re-renders React
  const stage = useRef(toStage(progress.get()));
  const [active, setActive] = useState(() => toStepIndex(toStage(progress.get())));

  useMotionValueEvent(progress, 'change', (value) => {
    stage.current = toStage(value);
    setActive(toStepIndex(stage.current));
  });

  const live = enabled && idle && status !== 'failed';

  return (
    <div aria-hidden="true" data-scene={enabled ? status : 'off'} className="sticky top-28">
      <div className="relative aspect-[4/5] max-h-[72svh] w-full overflow-hidden bg-graphite">
        {stageImages.map((key, index) => (
          <div
            key={key}
            className={`absolute inset-0 transition-opacity duration-700 ease-cinematic ${
              index === active ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Picture image={key} alt="" sizes="40vw" />
          </div>
        ))}

        {live && (
          <SceneErrorBoundary onError={() => setStatus('failed')}>
            <Suspense fallback={null}>
              <div
                className={`absolute inset-0 transition-opacity duration-1000 ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}
              >
                <ProcessScene
                  quality={capability.quality}
                  stage={stage}
                  onReady={() => setStatus('ready')}
                  onFail={() => setStatus('failed')}
                />
              </div>
            </Suspense>
          </SceneErrorBoundary>
        )}
      </div>
      <p className="mt-4 flex items-baseline justify-between text-sm text-stone">
        <span className="uppercase tracking-[0.18em]">
          Stage {active + 1} / {processSteps.length}
        </span>
        <span className="font-display text-lg text-bone">{processSteps[active]?.title}</span>
      </p>
    </div>
  );
}
