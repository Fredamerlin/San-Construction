import { visibleProjects } from '../../../data/projects';
import { site } from '../../../data/site';
import { ProjectTile } from '../../cards/ProjectTile';
import { Reveal } from '../../motion/Reveal';
import { ButtonLink } from '../../ui/ButtonLink';
import { Container } from '../../ui/Container';
import { SectionHeading } from '../../ui/SectionHeading';

/** Offset, image-led grid of three projects. Hidden entirely when there is nothing to show. */
export function HomeProjects() {
  const featured = visibleProjects.slice(0, 3);
  if (featured.length === 0) return null;
  const [first, second, third] = featured;

  return (
    <section aria-labelledby="projects-title" className="py-24 sm:py-32">
      <Container>
        <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="projects-title"
            mark
            title={
              <>
                Selected <em>work.</em>
              </>
            }
            intro={
              site.demoMode
                ? 'The concept home is a 3D design created for this site; the other entries are samples with placeholder photographs. None of them show SAN Construction work.'
                : undefined
            }
          />
          <ButtonLink to="/projects" variant="secondary" className="self-start lg:self-auto">
            Explore Our Work
          </ButtonLink>
        </Reveal>

        <div className="mt-16 grid gap-x-10 gap-y-16 md:grid-cols-12">
          {first && (
            <div className="md:col-span-7">
              <ProjectTile project={first} aspect="aspect-[4/3]" sizes="(min-width: 768px) 58vw, 100vw" />
            </div>
          )}
          {second && (
            <div className="md:col-span-5 md:mt-40">
              <ProjectTile project={second} aspect="aspect-[4/5]" sizes="(min-width: 768px) 40vw, 100vw" />
            </div>
          )}
          {third && (
            <div className="md:col-span-6 md:col-start-4">
              <ProjectTile project={third} aspect="aspect-[3/2]" sizes="(min-width: 768px) 50vw, 100vw" />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
