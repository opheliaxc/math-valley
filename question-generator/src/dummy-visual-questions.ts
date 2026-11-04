/**
 * Dummy picture questions for Phase 0 validation / demos.
 * Not tied to NYS standards or the curriculum map.
 */
import type { GeneratedQuestion } from './types.ts'

export const DUMMY_PICTURE_MC: GeneratedQuestion = {
  id: 'dummy-visual-mc',
  standard: 'DEMO-VISUAL',
  grade: 1,
  topic: 'demo',
  difficulty: 'beginner',
  type: 'multiple-choice',
  prompt: 'Which shape is a triangle?',
  correctAnswer: 'triangle',
  correctOptionIndex: 0,
  explanation: 'A triangle has three sides.',
  visualPredicate: 'is-closed-triangle',
  options: [
    {
      id: 'triangle',
      altText: 'a triangle',
      visual: {
        kind: 'polygon',
        points: [
          { x: 0, y: 80 },
          { x: 50, y: 0 },
          { x: 100, y: 80 },
        ],
      },
    },
    {
      id: 'square',
      altText: 'a square',
      visual: {
        kind: 'polygon',
        points: [
          { x: 10, y: 10 },
          { x: 90, y: 10 },
          { x: 90, y: 90 },
          { x: 10, y: 90 },
        ],
      },
    },
    {
      id: 'circle',
      altText: 'a circle',
      visual: { kind: 'circle', cx: 0, cy: 0, r: 45 },
    },
    {
      id: 'open-v',
      altText: 'an open V shape',
      visual: {
        kind: 'polygon',
        closed: false,
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 80 },
          { x: 100, y: 0 },
        ],
      },
    },
  ],
}

/** Deliberately broken: two options satisfy is-closed-triangle. */
export const DUMMY_PICTURE_MC_TWO_CORRECT: GeneratedQuestion = {
  ...DUMMY_PICTURE_MC,
  id: 'dummy-visual-mc-two-correct',
  options: [
    {
      id: 'triangle-a',
      altText: 'a triangle',
      visual: {
        kind: 'polygon',
        points: [
          { x: 0, y: 80 },
          { x: 50, y: 0 },
          { x: 100, y: 80 },
        ],
      },
    },
    {
      id: 'triangle-b',
      altText: 'another triangle',
      visual: {
        kind: 'polygon',
        points: [
          { x: 0, y: 0 },
          { x: 60, y: 0 },
          { x: 30, y: 50 },
        ],
      },
    },
    {
      id: 'square',
      altText: 'a square',
      visual: {
        kind: 'polygon',
        points: [
          { x: 10, y: 10 },
          { x: 90, y: 10 },
          { x: 90, y: 90 },
          { x: 10, y: 90 },
        ],
      },
    },
    {
      id: 'circle',
      altText: 'a circle',
      visual: { kind: 'circle', cx: 0, cy: 0, r: 45 },
    },
  ],
  correctAnswer: 'triangle-a',
  correctOptionIndex: 0,
}

/** Ambiguous angle in the acute/right gap (~80°). */
export const DUMMY_AMBIGUOUS_ANGLE: GeneratedQuestion = {
  id: 'dummy-ambiguous-angle',
  standard: 'DEMO-VISUAL',
  grade: 4,
  topic: 'demo',
  difficulty: 'beginner',
  type: 'short-answer',
  prompt: 'What kind of angle is this?',
  correctAnswer: 'acute',
  explanation: 'Should not pass validation — measure is in the margin.',
  altText: 'an angle of about 80 degrees',
  visual: {
    kind: 'angle',
    vertex: { x: 0, y: 0 },
    from: { x: 100, y: 0 },
    to: {
      x: 100 * Math.cos((80 * Math.PI) / 180),
      y: -100 * Math.sin((80 * Math.PI) / 180),
    },
    showArc: true,
  },
}

export const DUMMY_PICTURE_TRUE_FALSE: GeneratedQuestion = {
  id: 'dummy-visual-tf',
  standard: 'DEMO-VISUAL',
  grade: 1,
  topic: 'demo',
  difficulty: 'beginner',
  type: 'true-false',
  prompt: 'This shape is a triangle.',
  correctAnswer: 'true',
  explanation: 'It has three sides and three vertices.',
  altText: 'a triangle',
  visualPredicate: 'is-closed-triangle',
  visual: {
    kind: 'polygon',
    points: [
      { x: 0, y: 80 },
      { x: 50, y: 0 },
      { x: 100, y: 80 },
    ],
  },
}

export const DUMMY_PICTURE_SHORT: GeneratedQuestion = {
  id: 'dummy-visual-short',
  standard: 'DEMO-VISUAL',
  grade: 2,
  topic: 'demo',
  difficulty: 'beginner',
  type: 'short-answer',
  prompt: 'How many unit squares cover this figure?',
  correctAnswer: '6',
  explanation: 'Count the shaded squares: 6.',
  altText: 'a grid with 6 shaded unit squares',
  visualPredicate: 'count-shaded-cells',
  visual: {
    kind: 'grid',
    rows: 2,
    cols: 4,
    shaded: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ],
  },
}
