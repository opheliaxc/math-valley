/** Shared stroke/fill for geometry SVGs (readable on light cards). */
export const VISUAL = {
  stroke: '#0f172a',
  fill: '#e2e8f0',
  shade: '#94a3b8',
  accent: '#b45309',
  tick: '#475569',
  paper: '#f8fafc',
} as const

export function strokeWidthFor(boundsW: number, boundsH: number): number {
  return Math.max(Math.max(boundsW, boundsH) * 0.022, 0.8)
}
