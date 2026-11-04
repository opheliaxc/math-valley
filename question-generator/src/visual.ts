/**
 * Visual question contract — Phase 0.
 * VisualSpec is a data description of a picture (not an image file).
 * Kinds grow as geometry grades are added; renderers and validators read this.
 */

export type Point2D = { x: number; y: number }

/** One piece inside a `shape-composite` VisualSpec. */
export type ShapeCompositePiece =
  | {
      type: 'polygon'
      points: Point2D[]
      closed?: boolean
      fill?: string
      stroke?: string
    }
  | {
      type: 'circle'
      cx: number
      cy: number
      r: number
      fill?: string
      stroke?: string
    }
  | {
      type: 'pie'
      cx: number
      cy: number
      r: number
      startDeg: number
      endDeg: number
      fill?: string
      stroke?: string
    }

export type VisualSpec =
  | {
      kind: 'polygon'
      points: Point2D[]
      /** Default true. False = open figure (e.g. non-polygon distractor). */
      closed?: boolean
      fill?: string
      stroke?: string
    }
  | {
      kind: 'circle'
      cx: number
      cy: number
      r: number
      fill?: string
      stroke?: string
    }
  | {
      kind: 'arc'
      cx: number
      cy: number
      r: number
      startDeg: number
      endDeg: number
      stroke?: string
    }
  | {
      kind: 'grid'
      rows: number
      cols: number
      /** Cells to shade, 0-based row/col. */
      shaded?: Array<{ row: number; col: number }>
    }
  | {
      kind: 'lines'
      items: Array<{
        type: 'line' | 'ray' | 'segment'
        a: Point2D
        b: Point2D
        label?: string
      }>
    }
  | {
      kind: 'angle'
      vertex: Point2D
      /** Point on the first ray. */
      from: Point2D
      /** Point on the second ray. */
      to: Point2D
      showArc?: boolean
    }
  | {
      kind: 'protractor-angle'
      vertex: Point2D
      from: Point2D
      to: Point2D
      /** Whole-degree measure shown / to be read. */
      measureDeg: number
    }
  | {
      kind: 'partitioned-shape'
      shape: 'circle' | 'rectangle'
      /** Number of parts the shape is cut into. */
      parts: number
      equal: boolean
      /**
       * How parts are cut. Defaults: circle → radial, rectangle → strips-v.
       * `grid-2x2` is only valid when parts === 4.
       * `diagonal` is for rectangle halves (parts === 2): two triangles.
       */
      cut?: 'radial' | 'strips-v' | 'strips-h' | 'grid-2x2' | 'diagonal'
      width?: number
      height?: number
      r?: number
      /** Which part indices are shaded (0-based). */
      shadedParts?: number[]
    }
  | {
      /** Several 2-D pieces drawn together (composites for NY-1.G.2). */
      kind: 'shape-composite'
      pieces: ShapeCompositePiece[]
    }
  | {
      kind: 'rect-composite'
      rects: Array<{
        x: number
        y: number
        w: number
        h: number
        label?: string
      }>
    }
  | {
      kind: 'symmetry-figure'
      points: Point2D[]
      axis?: { a: Point2D; b: Point2D }
      showAxis?: boolean
    }

/** Text options stay plain strings; picture options carry an id + VisualSpec. */
export type PictureOption = {
  id: string
  text?: string
  visual?: VisualSpec
  /** Generated from the VisualSpec; never hand-written per question. */
  altText: string
}

export type QuestionOption = string | PictureOption

export function isPictureOption(option: QuestionOption): option is PictureOption {
  return typeof option !== 'string'
}

/**
 * Value compared to `correctAnswer`.
 * Text options: the option string. Picture options: the option id.
 */
export function optionAnswerValue(option: QuestionOption): string {
  return typeof option === 'string' ? option : option.id
}

/** Stable React/list key for an option. */
export function optionKey(option: QuestionOption, index: number): string {
  return typeof option === 'string' ? `text-${index}-${option}` : option.id
}

/** Visible label for text-only UIs (before picture-option rendering lands). */
export function optionLabel(option: QuestionOption): string {
  if (typeof option === 'string') return option
  return option.text ?? option.altText
}
