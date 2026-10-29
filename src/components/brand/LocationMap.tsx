import { ExternalLink, MapPin } from 'lucide-react';
import { directionsUrl, mapEmbedSrc, site } from '../../data/site';
import { Action } from './Action';
import { PillBadge } from './primitives';

/**
 * Google Maps for the Contact page. Uses a keyless Google Maps embed (no API key, nothing
 * secret in the bundle), lazy-loaded so it costs nothing until it nears the viewport.
 *
 * Until SAN Construction's office location is confirmed in `site.location`, this shows a
 * clearly labelled placeholder of the same size instead of guessing at a pin.
 */
export function LocationMap() {
  const { location, contact } = site;
  const src = mapEmbedSrc();
  const directions = directionsUrl();
  const name = location.label ?? 'SAN Construction office';
  const address = contact.address ?? location.query;

  if (!src) {
    return (
      <div className="relative flex h-[340px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-gold/40 bg-ink p-6 text-center md:h-[440px]">
        <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-40" />
        <div className="relative z-10 flex max-w-md flex-col items-center">
          <span aria-hidden="true" className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
            <MapPin className="size-7" />
          </span>
          <PillBadge className="mb-4">Map placeholder</PillBadge>
          <h3 className="mb-2 text-2xl text-white md:text-3xl">Office location to be confirmed</h3>
          <p className="text-sm leading-relaxed text-gray-400">
            The map will show SAN Construction’s office once its address is confirmed. Until then, send an enquiry and we will
            arrange where to meet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
      <div className="overflow-hidden rounded-3xl border border-line bg-card lg:col-span-8">
        <iframe
          title={`Google Map showing the location of ${name}`}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="block h-[320px] w-full border-0 md:h-[440px]"
        />
      </div>
      <div className="glass-panel flex flex-col justify-between gap-6 rounded-3xl p-6 md:p-8 lg:col-span-4">
        <div>
          <span className="mb-1 block font-mono text-xs uppercase text-gold">Visit us</span>
          <h3 className="mb-3 text-2xl text-white">{name}</h3>
          {address && <p className="text-sm leading-relaxed text-gray-300">{address}</p>}
          {contact.hours && <p className="mt-3 text-xs text-gray-400">{contact.hours}</p>}
        </div>
        {directions && (
          <Action href={directions} icon={ExternalLink} size="sm" className="w-full">
            Get directions
          </Action>
        )}
      </div>
    </div>
  );
}
