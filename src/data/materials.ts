/**
 * Material palette shown on the Home page (reference "Material & BIM Studio" board) and the
 * short material tabs on the Services page. General descriptions of each material only:
 * no durability figures, certifications or sourcing claims, because none have been verified.
 */

export interface Material {
  key: string;
  name: string;
  /** Where it is typically used. */
  use: string;
  description: string;
  /** Swatch colours for the small sample square. */
  swatch: { fill: string; edge: string };
  specs: { label: string; value: string }[];
}

export const materials: Material[] = [
  {
    key: 'teak',
    name: 'Teak wood',
    use: 'Main doors, frames and louvred screens',
    description:
      'A dense, naturally oily hardwood with a warm grain. Well seasoned and properly finished, it suits entrance doors, window frames, louvres and interior screens in humid climates.',
    swatch: { fill: 'rgba(120, 53, 15, 0.6)', edge: '#d97706' },
    specs: [
      { label: 'Typical use', value: 'Doors & screens' },
      { label: 'Character', value: 'Warm, tight grain' },
      { label: 'Care', value: 'Oiled or sealed' },
    ],
  },
  {
    key: 'concrete',
    name: 'Board-formed concrete',
    use: 'Exposed walls, slabs and overhangs',
    description:
      'Concrete cast against timber boards, so the grain of the formwork stays on the finished surface. Its mass helps buffer heat, and it can be left exposed as a finish in its own right.',
    swatch: { fill: 'rgba(120, 113, 108, 0.6)', edge: '#a8a29e' },
    specs: [
      { label: 'Typical use', value: 'Walls & overhangs' },
      { label: 'Character', value: 'Timber-grain texture' },
      { label: 'Care', value: 'Sealed against stains' },
    ],
  },
  {
    key: 'stone',
    name: 'Kota stone',
    use: 'Floors, verandahs and courtyards',
    description:
      'A fine-grained blue-grey limestone from the Kota region of Rajasthan. Honed, it stays cool underfoot and is a long-standing choice for floors, steps and shaded outdoor spaces.',
    swatch: { fill: 'rgba(51, 65, 85, 0.6)', edge: '#64748b' },
    specs: [
      { label: 'Typical use', value: 'Floors & verandahs' },
      { label: 'Character', value: 'Cool, blue-grey' },
      { label: 'Origin', value: 'Kota, Rajasthan' },
    ],
  },
  {
    key: 'brass',
    name: 'Brushed brass',
    use: 'Jali screens, handles and railings',
    description:
      'A warm metal for details people touch and see up close: door hardware, light fittings, railings and perforated jali screens. It can be lacquered to stay bright or left to develop a patina.',
    swatch: { fill: 'rgba(202, 138, 4, 0.6)', edge: '#facc15' },
    specs: [
      { label: 'Typical use', value: 'Hardware & screens' },
      { label: 'Character', value: 'Warm, ages gently' },
      { label: 'Care', value: 'Lacquered or natural' },
    ],
  },
];

/** Compact tabs beside the residential section on the Services page. */
export const residentialMaterialTabs: { key: string; label: string; title: string; text: string }[] = [
  {
    key: 'masonry',
    label: 'Masonry',
    title: 'Clay brick and block walls',
    text: 'Walls chosen for the climate and the structure, from fired clay bricks to hollow clay blocks with better insulation.',
  },
  {
    key: 'teak',
    label: 'Teak',
    title: 'Teak entrances and joinery',
    text: 'Seasoned hardwood for main doors, frames and screens, finished to cope with heat and humidity.',
  },
  {
    key: 'stone',
    label: 'Stone',
    title: 'Natural stone floors',
    text: 'Cool, hard-wearing stone such as Kota for living areas, verandahs and courtyards.',
  },
];
