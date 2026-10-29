import type { WalkthroughScene } from './walkthrough';

/**
 * Captions for the cinematic (video) walkthrough, by scene label as set in
 * cinematic/shots.json. The home is a concept design, not a completed SAN project.
 * All copy is provisional until approved.
 */
const CAPTIONS: Record<string, Omit<WalkthroughScene, 'label'>> = {
  Exterior: { title: 'A home at golden hour', caption: 'A two-storey Kerala-style home with a tiled roof, set among coconut palms.' },
  Entrance: { title: 'The welcome', caption: 'A deep porch with a teak ceiling, a brass lantern and a carved teak front door.' },
  Living: { title: 'Living room', caption: 'Light, open living with a teak media wall and wide garden views.' },
  Dining: { title: 'Dining', caption: 'A carved timber jali screen and brass pendants frame the family table.' },
  Kitchen: { title: 'Kitchen', caption: 'Teak cabinetry, granite counters and a window over the sink.' },
  Bedroom: { title: 'Master bedroom', caption: 'A calm retreat upstairs: cane, carved teak and soft daylight.' },
  Bathroom: { title: 'Bathroom', caption: 'A copper basin, a teak vanity and a backlit jali panel.' },
  SAN: { title: 'Building your dream home', caption: 'Planned with care and built with craft, from the first conversation to handover.' },
};

export function cinematicScenes(labels: string[]): WalkthroughScene[] {
  return labels.map((label) => ({ label, ...(CAPTIONS[label] ?? { title: label, caption: '' }) }));
}
