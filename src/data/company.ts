/**
 * Proposed brand messaging. ALL DRAFT, pending approval by SAN Construction.
 * No founding date, team size, experience, statistics, certifications or awards are stated,
 * because none have been supplied.
 */

export interface Principle {
  title: string;
  description: string;
  /** What the principle means in practice (shown when a value card is expanded). */
  details: string[];
}

export const principles: Principle[] = [
  {
    title: 'Clear communication',
    description: 'Straightforward updates, early notice of decisions, and answers you can understand.',
    details: [
      'One clear point of contact for questions and decisions.',
      'Progress shared at agreed stages, not only when something goes wrong.',
      'Decisions that need your input raised early, with the options explained.',
    ],
  },
  {
    title: 'Careful planning',
    description: 'Thinking through scope, sequence and risks before work starts on site.',
    details: [
      'Scope agreed and written down before work begins.',
      'Work sequenced so each trade arrives when the site is ready for it.',
      'Risks and unknowns identified early, while they are still easy to deal with.',
    ],
  },
  {
    title: 'Craftsmanship',
    description: 'Attention to the details people see and touch every day, as well as the ones they don’t.',
    details: [
      'Suitable materials and methods chosen for the climate and the use of the space.',
      'Work checked as each stage is completed, not just at the end.',
      'Junctions, edges and finishes given the same care as the main structure.',
    ],
  },
  {
    title: 'Transparency',
    description: 'Being open about what is involved, what has changed and why.',
    details: [
      'Clear explanations of what is included, and what is not.',
      'Changes discussed and agreed before they happen.',
      'Honest answers when something is uncertain.',
    ],
  },
];

/** "What you can expect" rows on the About page. Draft, pending approval. */
export const expectations: { topic: string; detail: string }[] = [
  { topic: 'Early advice', detail: 'A practical view of your idea, site and priorities before you commit to a design.' },
  { topic: 'Planning', detail: 'Scope, approach and sequence set out clearly, so everyone knows what will be built and how.' },
  { topic: 'Communication', detail: 'Regular updates and early notice of the decisions that need your input.' },
  { topic: 'Site organisation', detail: 'Well-organised sites with clear responsibilities and safety in mind.' },
  { topic: 'Handover', detail: 'Finished work checked and walked through together, so you know how everything works.' },
];

export const aboutCopy = {
  intro: [
    'SAN Construction works across residential, commercial and renovation projects, bringing planning and building together under one approach.',
    'We believe the best buildings come from listening first: understanding how a space will be used, what matters to the people commissioning it, and what the site will allow. From there, careful planning and steady communication carry a project from first conversation to handover.',
  ],
  mission:
    'To plan and build spaces that work well for the people who use them, through careful preparation, honest communication and well-finished work.',
  vision:
    'To be a construction partner people trust with the places that matter to them, and to leave every site better organised than we found it.',
};

export const qualityCopy = {
  title: 'Quality and safety, built into the process.',
  paragraphs: [
    'Quality is not a final inspection. It comes from planning the work properly, using suitable materials and methods, and checking as each stage is completed.',
    'Safety follows the same principle: well-organised sites, clear responsibilities and work planned with the people doing it in mind.',
  ],
};
