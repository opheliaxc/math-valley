import type { ReactNode } from 'react'
import {
  boundsCenter,
  boundsSize,
  padBounds,
  rotateBounds,
  type Bounds,
} from './geometry'
import { VISUAL } from './visualTheme'
import './visuals.css'

type VisualFrameProps = {
  bounds: Bounds
  size: number
  altText: string
  className?: string
  rotationDeg?: number
  children: ReactNode
}

export function VisualFrame({
  bounds,
  size,
  altText,
  className,
  rotationDeg = 0,
  children,
}: VisualFrameProps) {
  const safe = Number.isFinite(bounds.minX)
    ? bounds
    : { minX: 0, minY: 0, maxX: 100, maxY: 100 }
  const { w, h } = boundsSize(safe)
  const pad = Math.max(w, h) * 0.12
  const padded = padBounds(safe, pad)
  const fitted = rotateBounds(padded, rotationDeg)
  const view = padBounds(fitted, Math.max(boundsSize(fitted).w, boundsSize(fitted).h) * 0.02)
  const { w: vw, h: vh } = boundsSize(view)
  const origin = boundsCenter(padded)

  return (
    <figure
      className={['mv-visual', className].filter(Boolean).join(' ')}
      role="img"
      aria-label={altText || undefined}
    >
      <svg
        className="mv-visual-svg"
        width={size}
        height={size}
        viewBox={`${view.minX} ${view.minY} ${vw} ${vh}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x={view.minX}
          y={view.minY}
          width={vw}
          height={vh}
          fill={VISUAL.paper}
        />
        <g
          transform={
            rotationDeg
              ? `rotate(${rotationDeg} ${origin.x} ${origin.y})`
              : undefined
          }
        >
          {children}
        </g>
      </svg>
    </figure>
  )
}
