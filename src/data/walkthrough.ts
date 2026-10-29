/**
 * Captions for the home-page walkthrough, one per storyboard scene, in order.
 * The house is a concept design created for this website, not a completed SAN project.
 * All copy is provisional until approved.
 */
export interface WalkthroughScene {
  /** Short label for the scene rail. */
  label: string;
  title: string;
  caption: string;
}

export const walkthroughScenes: WalkthroughScene[] = [
  { label: 'Exterior', title: 'A home at golden hour', caption: 'A two-storey concept home with a Kerala-style tiled roof, set among coconut palms.' },
  { label: 'Entrance', title: 'The welcome', caption: 'Pillared porch, a carved teak double door and brass diyas lit at the threshold.' },
  { label: 'Living', title: 'Living room', caption: 'Light, open living with a fluted timber media wall and a warm cove-lit ceiling.' },
  { label: 'Dining', title: 'Dining', caption: 'A carved jali screen frames the dining room, which opens onto the back garden.' },
  { label: 'Kitchen', title: 'Kitchen', caption: 'Teak-toned cabinetry, stone counters and a window over the sink.' },
  { label: 'Bedroom', title: 'Master bedroom', caption: 'A calm retreat with a timber headboard wall and doors out to the balcony.' },
  { label: 'Bathroom', title: 'Bathroom', caption: 'Natural stone, a walk-in shower and a floating vanity with a backlit mirror.' },
  { label: 'Terrace', title: 'Terrace', caption: 'A covered sit-out under the tiled roof, made for long evenings.' },
  { label: 'Garden', title: 'Garden', caption: 'Lawns, palms and low garden lights wrap around the house.' },
  { label: 'Aerial', title: 'From above', caption: 'The whole plot: tiled roofs, the drive, gardens and the compound wall.' },
  { label: 'Night', title: 'After dark', caption: 'At night the house glows from within, its facade washed in warm light.' },
  { label: 'SAN', title: 'Building your dream home', caption: 'Planned with care and built with craft, from the first conversation to handover.' },
];
