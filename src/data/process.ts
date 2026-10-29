import type { ImageKey } from './images';

/**
 * Suggested process stages from the scope (section 6.7), pending owner approval.
 * Wording avoids promising timeframes, approvals or outcomes.
 */

export interface ProcessStep {
  title: string;
  /** One line for compact previews. */
  short: string;
  description: string;
  /** Short label for the stage navigation on the Process page. */
  navLabel: string;
  /** What typically happens during the stage (Process page). */
  points: { title: string; text: string }[];
}

export const processSteps: ProcessStep[] = [
  {
    title: 'Initial enquiry',
    short: 'You share what you have in mind.',
    description:
      'It starts with a short description of your project: what you want to build or change, where, and roughly when. This is enough to begin a conversation.',
    navLabel: 'Enquiry',
    points: [
      { title: 'A short description', text: 'What you want to build or change, where it is, and roughly when.' },
      { title: 'Anything you already have', text: 'Drawings, photos or plans help, but none are needed to start.' },
    ],
  },
  {
    title: 'Requirement discussion',
    short: 'We talk through needs and priorities.',
    description:
      'A closer conversation about how the space will be used, what matters most to you, and any constraints such as budget, timing or an existing design.',
    navLabel: 'Requirements',
    points: [
      { title: 'How the space will be used', text: 'Who it is for, how many rooms, and the everyday routines it needs to support.' },
      { title: 'Priorities and constraints', text: 'Budget, timing, style preferences and any existing design or approvals.' },
    ],
  },
  {
    title: 'Site review and feasibility',
    short: 'The site and any existing structure are reviewed.',
    description:
      'Where it is relevant, the site or existing building is reviewed to understand access, conditions and what is practical before plans are fixed.',
    navLabel: 'Site review',
    points: [
      { title: 'Site conditions', text: 'Access, orientation, ground conditions and neighbouring buildings.' },
      { title: 'Existing structures', text: 'For renovation, the condition of what is already there and what can be kept.' },
    ],
  },
  {
    title: 'Proposal and planning',
    short: 'Scope, approach and sequence are set out.',
    description:
      'The scope of work, the approach and the order in which things happen are set out clearly, so everyone understands what will be built and how.',
    navLabel: 'Planning',
    points: [
      { title: 'Scope', text: 'What is included in the work, and what is not.' },
      { title: 'Approach', text: 'Materials, methods and the people involved at each stage.' },
      { title: 'Sequence', text: 'The order in which the work happens, and the decisions needed along the way.' },
    ],
  },
  {
    title: 'Execution and progress updates',
    short: 'Work proceeds in planned stages.',
    description:
      'Construction moves through planned stages, with regular updates on progress and early notice of any decisions that need your input.',
    navLabel: 'Construction',
    points: [
      { title: 'Planned stages', text: 'From groundwork and structure to services and finishes.' },
      { title: 'Progress updates', text: 'Regular news on progress, with early notice of decisions that need you.' },
    ],
  },
  {
    title: 'Quality checks and handover',
    short: 'Finished work is checked and handed over.',
    description:
      'Completed work is checked before handover, and the finished space is walked through together so you know how everything works.',
    navLabel: 'Handover',
    points: [
      { title: 'Final checks', text: 'Finished work reviewed and any snags put right before handover.' },
      { title: 'Walkthrough', text: 'The space walked through together, so you know how everything works.' },
    ],
  },
];

/** Stills rendered from the 3D model at each construction stage, one per step. */
export const stageImages: ImageKey[] = [
  'render-stage-1',
  'render-stage-2',
  'render-stage-3',
  'render-stage-4',
  'render-stage-5',
  'render-stage-6',
];

export const processCaveat =
  'Every project is different. The stages and how long each one takes depend on its size, its site and the approvals it needs.';
