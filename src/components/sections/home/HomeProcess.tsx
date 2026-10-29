import { processSteps } from '../../../data/process';
import { Reveal } from '../../motion/Reveal';
import { ButtonLink } from '../../ui/ButtonLink';
import { Container } from '../../ui/Container';
import { SectionHeading } from '../../ui/SectionHeading';
import { ProcessSteps } from '../ProcessSteps';

export function HomeProcess() {
  return (
    <section aria-labelledby="process-title" className="bg-graphite py-24 sm:py-32">
      <Container>
        <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="process-title"
            mark
            title={
              <>
                From first conversation to <em>handover.</em>
              </>
            }
            intro="A clear sequence, adapted to each project."
          />
          <ButtonLink to="/process" variant="secondary" className="self-start lg:self-auto">
            Our process
          </ButtonLink>
        </Reveal>
        <div className="mt-16">
          <ProcessSteps steps={processSteps} variant="compact" />
        </div>
      </Container>
    </section>
  );
}
