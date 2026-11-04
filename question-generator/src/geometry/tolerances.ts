/**
 * Ambiguity margins for geometry pictures (spec §4.2).
 * Tunable starting values — if a random draw lands in a margin, redraw.
 */
export const GEOMETRY_TOLERANCE = {
  /** Acute only when interior angle ≤ this (degrees). */
  acuteMaxDeg: 75,
  /** Obtuse only when interior angle ≥ this (degrees). */
  obtuseMinDeg: 105,
  /** Right angle: |measure − 90| must be ≤ this (degrees). Use 0 for integer-grid exactness. */
  rightEpsilonDeg: 1e-6,
  /** Non-parallel lines must differ by at least this many degrees. */
  parallelClearDeg: 10,
  /** Unequal partitions: relative area difference at least this (0.25 = 25%). */
  unequalAreaMinRatio: 0.25,
  /**
   * Near-collinear vertices: |sin| of turn angle below this → ambiguous side count.
   * ~0.087 ≈ sin(5°).
   */
  collinearSinEps: 0.087,
  /** Floating-point "exact" for parallel / perpendicular (normalized cross/dot). */
  exactEps: 1e-9,
} as const

export type GeometryTolerance = typeof GEOMETRY_TOLERANCE
