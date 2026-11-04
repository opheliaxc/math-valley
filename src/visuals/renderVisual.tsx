import type { ReactNode } from 'react'
import type { VisualSpec } from '../../question-generator/src/types.ts'
import {
  renderAnglePrimitive,
  renderArcPrimitive,
  renderCirclePrimitive,
  renderGridPrimitive,
  renderLinesPrimitive,
  renderPartitionedShapePrimitive,
  renderPolygonPrimitive,
  renderProtractorAnglePrimitive,
  renderRectCompositePrimitive,
  renderShapeCompositePrimitive,
  renderSymmetryFigurePrimitive,
} from './primitives'
import { VisualFrame } from './VisualFrame'

export type RenderVisualOptions = {
  /** Accessible label; normally from GeneratedQuestion.altText or option.altText. */
  altText?: string
  className?: string
  /** SVG width/height in CSS pixels. */
  size?: number
  /** Rotate the figure around its center (demo + advanced items). */
  rotationDeg?: number
}

/**
 * Turn a VisualSpec into an SVG figure.
 * Text-only questions omit `visual` and never call this.
 */
export function renderVisual(
  spec: VisualSpec,
  options: RenderVisualOptions = {},
): ReactNode {
  const { altText = '', className, size = 160, rotationDeg = 0 } = options
  const primitive = primitiveFor(spec)

  return (
    <VisualFrame
      bounds={primitive.bounds}
      size={size}
      altText={altText}
      className={className}
      rotationDeg={rotationDeg}
    >
      {primitive.nodes}
    </VisualFrame>
  )
}

function primitiveFor(spec: VisualSpec) {
  switch (spec.kind) {
    case 'polygon':
      return renderPolygonPrimitive(spec)
    case 'circle':
      return renderCirclePrimitive(spec)
    case 'arc':
      return renderArcPrimitive(spec)
    case 'grid':
      return renderGridPrimitive(spec)
    case 'lines':
      return renderLinesPrimitive(spec)
    case 'angle':
      return renderAnglePrimitive(spec)
    case 'protractor-angle':
      return renderProtractorAnglePrimitive(spec)
    case 'partitioned-shape':
      return renderPartitionedShapePrimitive(spec)
    case 'shape-composite':
      return renderShapeCompositePrimitive(spec)
    case 'rect-composite':
      return renderRectCompositePrimitive(spec)
    case 'symmetry-figure':
      return renderSymmetryFigurePrimitive(spec)
    default: {
      const _exhaustive: never = spec
      return _exhaustive
    }
  }
}
