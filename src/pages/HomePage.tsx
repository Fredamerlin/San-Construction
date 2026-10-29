import { ArrowRight, MessageSquare } from 'lucide-react';
import { Action } from '../components/brand/Action';
import { ClosingCta } from '../components/brand/ClosingCta';
import { CostEstimator } from '../components/brand/CostEstimator';
import { Wrap } from '../components/brand/primitives';
import { HomeApproach } from '../components/home/HomeApproach';
import { HomeCommercial } from '../components/home/HomeCommercial';
import { HomeExpertise } from '../components/home/HomeExpertise';
import { HomeMaterials } from '../components/home/HomeMaterials';
import { HomePortfolio } from '../components/home/HomePortfolio';
import { HomeResidential } from '../components/home/HomeResidential';
import { HomeWalkthrough } from '../components/sections/home/HomeWalkthrough';
import { showEstimator } from '../data/estimator';
import { staticPages } from '../data/pageMeta';
import { site } from '../data/site';
import { Seo } from '../lib/seo';

export default function HomePage() {
  const whatsapp = site.contact.whatsapp;

  return (
    <>
      <Seo meta={staticPages.home} />
      {/* Approved hero: rendered exactly as before, outside the redesign's `.ref` scope */}
      <HomeWalkthrough />

      <div className="ref">
        <HomeExpertise />
        <HomeResidential />
        <HomeCommercial />
        <HomeMaterials />
        {showEstimator && (
          <section id="calculator" aria-label="Construction cost estimator" className="relative bg-ink px-0 py-24">
            <Wrap>
              <CostEstimator />
            </Wrap>
          </section>
        )}
        <HomePortfolio />
        <HomeApproach />
        <ClosingCta
          eyebrow="Start your project"
          title={
            <>
              Ready to Build Your <em className="gold-text">Masterpiece</em>?
            </>
          }
          text="Share a few details about your plot or building and what you would like to create. We can talk through the site, the layout and a realistic budget."
        >
          <Action to="/contact" icon={ArrowRight}>
            Schedule an initial meeting
          </Action>
          {whatsapp ? (
            <Action href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} variant="whatsapp" icon={MessageSquare} iconStart>
              WhatsApp us
            </Action>
          ) : (
            <Action to="/projects" variant="glass">
              Explore our projects
            </Action>
          )}
        </ClosingCta>
      </div>
    </>
  );
}
