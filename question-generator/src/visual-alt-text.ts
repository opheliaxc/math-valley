/**
 * Generate accessible alt text from a VisualSpec (never hand-write per question).
 */
import type { VisualSpec } from './visual.ts'

export function altTextFromVisual(spec: VisualSpec): string {
  switch (spec.kind) {
    case 'polygon': {
      const closed = spec.closed !== false
      const n = spec.points.length
      if (!closed) {
        return `an open figure with ${n} points`
      }
      if (n === 3) return 'a triangle'
      if (n === 4) return 'a four-sided shape'
      if (n === 5) return 'a pentagon'
      if (n === 6) return 'a hexagon'
      return `a polygon with ${n} sides`
    }
    case 'circle':
      return 'a circle'
    case 'arc':
      return 'an arc'
    case 'grid': {
      const shaded = spec.shaded?.length ?? 0
      return `a ${spec.rows} by ${spec.cols} grid with ${shaded} shaded squares`
    }
    case 'lines':
      return `a figure with ${spec.items.length} lines`
    case 'angle':
      return 'an angle'
    case 'protractor-angle':
      return `an angle of ${spec.measureDeg} degrees on a protractor`
    case 'partitioned-shape': {
      const shape = spec.shape === 'circle' ? 'circle' : 'rectangle'
      const equal = spec.equal ? 'equal' : 'unequal'
      return `a ${shape} split into ${spec.parts} ${equal} parts`
    }
    case 'shape-composite':
      return `a shape made of ${spec.pieces.length} pieces`
    case 'rect-composite':
      return `a figure made of ${spec.rects.length} rectangles`
    case 'symmetry-figure':
      return 'a figure with a line of symmetry'
    default: {
      const _exhaustive: never = spec
      return _exhaustive
    }
  }
}
