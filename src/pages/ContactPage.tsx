import { useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Building, Clock, Copy, ExternalLink, Info, Mail, MapPin, PhoneCall, type LucideIcon } from 'lucide-react';
import { Action } from '../components/brand/Action';
import { jumpTo, scrollToSection } from '../components/brand/scroll';
import { BrandHero } from '../components/brand/BrandHero';
import { ClosingCta } from '../components/brand/ClosingCta';
import { LocationMap } from '../components/brand/LocationMap';
import { Eyebrow, IconBox, SectionHeader, Wrap } from '../components/brand/primitives';
import { EnquiryForm } from '../components/forms/EnquiryForm';
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal';
import { PlaceholderBadge } from '../components/ui/PlaceholderBadge';
import { staticPages } from '../data/pageMeta';
import { directionsUrl, hasContactDetails, site } from '../data/site';
import { Seo } from '../lib/seo';

const helpfulDetails = [
  'What you want to build, renovate or fit out',
  'Where the project is located',
  'Roughly when you would like to start',
  'Any drawings, photos or plans you have',
];

const nextSteps = [
  {
    title: 'We read your enquiry',
    text: 'We look at what you have described: the type of project, the site and anything you have shared.',
  },
  {
    title: 'A first conversation',
    text: 'We get in touch to talk it through, ask a few questions and, where it helps, arrange to see the site.',
  },
  {
    title: 'Clear next steps',
    text: 'We explain the approach we would suggest, what is involved and what happens next, before you commit to anything.',
  },
];

/** Copies text and briefly confirms it in a live region (instead of an alert). */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" onClick={copy} className="flex min-h-11 items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-400 hover:text-white">
      <Copy aria-hidden="true" className="size-3.5 text-gold" />
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </button>
  );
}

function InfoCard({ icon, kicker, title, children }: { icon: LucideIcon; kicker: string; title: string; children: ReactNode }) {
  return (
    <div className="group h-full rounded-3xl border border-line bg-card p-6 transition-colors hover:border-gold/50">
      <IconBox icon={icon} className="mb-6 rounded-2xl group-hover:bg-gold group-hover:text-black" />
      <span className="mb-1 block font-mono text-xs uppercase text-gold">{kicker}</span>
      <h3 className="mb-2 text-xl text-white">{title}</h3>
      {children}
    </div>
  );
}

export default function ContactPage() {
  const { contact } = site;
  const directions = directionsUrl();

  return (
    <div className="ref">
      <Seo meta={staticPages.contact} />
      <BrandHero
        image="walk-8"
        imageAlt=""
        height="short"
        pulse
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact us' }]}
        badge="Consultations & enquiries"
        title={
          <>
            Let’s Build Something <br className="hidden sm:block" />
            <em className="gold-text">Great Together.</em>
          </>
        }
        lead="Have a project in mind? Tell us what you are planning, and let’s explore how we can bring it to life."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Action href="#enquiry" onClick={jumpTo('enquiry')} icon={ArrowDown}>
            Discuss your project
          </Action>
          <Action to="/projects" variant="glass" icon={Building} iconStart>
            Explore our projects
          </Action>
        </div>
      </BrandHero>

      {/* Direct contact details: only real, supplied details are shown */}
      <section aria-label="Contact details" className="relative border-t border-line bg-ink py-16">
        <Wrap>
          {hasContactDetails ? (
            <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
              {contact.phone && (
                <StaggerItem>
                  <InfoCard icon={PhoneCall} kicker="Direct phone" title="Call us">
                    <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className="mb-2 block font-mono text-sm text-gray-300 hover:text-gold">
                      {contact.phone}
                    </a>
                    <CopyButton text={contact.phone} label="Copy number" />
                  </InfoCard>
                </StaggerItem>
              )}
              {contact.email && (
                <StaggerItem>
                  <InfoCard icon={Mail} kicker="Email enquiries" title="Email us">
                    <a href={`mailto:${contact.email}`} className="mb-2 block break-all font-mono text-sm text-gray-300 hover:text-gold">
                      {contact.email}
                    </a>
                    <CopyButton text={contact.email} label="Copy email" />
                  </InfoCard>
                </StaggerItem>
              )}
              {contact.address && (
                <StaggerItem>
                  <InfoCard icon={MapPin} kicker="Office" title="Visit us">
                    <p className="mb-4 text-xs leading-relaxed text-gray-300">{contact.address}</p>
                    {directions && (
                      <Action href={directions} variant="link" icon={ExternalLink} className="text-[0.6875rem]">
                        Get directions
                      </Action>
                    )}
                  </InfoCard>
                </StaggerItem>
              )}
              {contact.hours && (
                <StaggerItem>
                  <InfoCard icon={Clock} kicker="Office hours" title="Working hours">
                    <p className="text-xs leading-relaxed text-gray-300">{contact.hours}</p>
                  </InfoCard>
                </StaggerItem>
              )}
            </Stagger>
          ) : (
            <Reveal>
              <div className="flex flex-col gap-4 rounded-3xl border border-line bg-card p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
                <div className="flex items-start gap-4">
                  <IconBox icon={Info} className="rounded-2xl" />
                  <div>
                    <h2 className="mb-1 text-2xl text-white">The enquiry form is the best way to reach us</h2>
                    <p className="text-sm text-gray-400">Phone, email and office details will appear here once they are confirmed.</p>
                  </div>
                </div>
                <PlaceholderBadge label="Details pending" className="self-start sm:self-center" />
              </div>
            </Reveal>
          )}
        </Wrap>
      </section>

      {/* Enquiry form */}
      <section id="enquiry" aria-labelledby="brief-title" className="relative border-t border-line bg-ink py-20 outline-none">
        <Wrap>
          <Reveal>
            <div className="glass-panel relative mx-auto max-w-4xl overflow-hidden rounded-3xl p-5 sm:p-8 md:p-12">
              <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-15" />
              <div className="relative z-10 mb-10 max-w-2xl">
                <Eyebrow>Project brief</Eyebrow>
                <h2 id="brief-title" className="mb-4 text-3xl text-white md:text-5xl">
                  Tell Us About Your Project
                </h2>
                <p className="mb-5 text-sm font-light text-gray-400">Share a few details about what you are planning. A short description is enough to start the conversation.</p>
                <ul aria-label="Helpful to include" className="flex flex-wrap gap-2">
                  {helpfulDetails.map((item) => (
                    <li key={item} className="rounded-full border border-white/10 bg-ink/70 px-3 py-1.5 text-[0.6875rem] text-gray-300">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <EnquiryForm />
            </div>
          </Reveal>
        </Wrap>
      </section>

      {/* Location and map */}
      <section aria-labelledby="location-title" className="relative border-t border-line bg-card py-20">
        <Wrap>
          <SectionHeader
            layout="center"
            id="location-title"
            eyebrow="Our office"
            title="Find Us"
            intro="Visit us for an in-person conversation about your project."
            className="mb-12"
          />
          <Reveal>
            <LocationMap />
          </Reveal>
        </Wrap>
      </section>

      {/* What happens next */}
      <section aria-labelledby="next-title" className="relative border-t border-line bg-ink py-20">
        <Wrap>
          <SectionHeader
            layout="center"
            id="next-title"
            eyebrow="After you get in touch"
            title="What Happens Next?"
            intro="A simple sequence from your first message to an agreed way forward."
          />
          <Stagger className="grid grid-cols-1 gap-8 md:grid-cols-3" stagger={0.1}>
            {nextSteps.map((step, i) => (
              <StaggerItem key={step.title}>
                <div className="h-full rounded-3xl border border-line bg-card p-8">
                  <IconBox size="md" className="mb-6 rounded-2xl text-sm">
                    {String(i + 1).padStart(2, '0')}
                  </IconBox>
                  <h3 className="mb-3 text-2xl text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{step.text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Wrap>
      </section>

      <ClosingCta
        eyebrow="Start planning"
        title={
          <>
            Your Project Starts With a <em className="gold-text">Conversation.</em>
          </>
        }
        text="Share your ideas with SAN Construction and take the first step toward a space built to last."
      >
        <Action onClick={() => scrollToSection('enquiry')} icon={ArrowUp}>
          Send us your project details
        </Action>
      </ClosingCta>
    </div>
  );
}
