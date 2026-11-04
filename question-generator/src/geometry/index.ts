/**
 * Geometry utility library — Phase 0 Step 5.
 * Pure math for generators and validators (answers come from the geometry).
 */

export { GEOMETRY_TOLERANCE, type GeometryTolerance } from './tolerances.ts'

export {
  add,
  angleBetweenVectorsDeg,
  cross,
  dot,
  length,
  lineAngleSeparationDeg,
  normalize,
  scale,
  vec,
} from './vectors.ts'

export {
  hasNearCollinearVertices,
  isSimplePolygon,
  polygonArea,
  polygonPerimeter,
  segmentsIntersectProperly,
} from './polygon.ts'

export {
  areParallel,
  arePerpendicular,
  isZeroVector,
  parallelRelation,
  perpendicularRelation,
  segmentDirection,
  type ParallelRelation,
  type PerpendicularRelation,
} from './lines.ts'

export {
  angleAtVertexDeg,
  classifyAngleAtVertex,
  classifyAngleDeg,
  type AngleClass,
} from './angles.ts'

export {
  isSymmetricAcross,
  pointsAlmostEqual,
  reflectPoint,
  reflectPoints,
} from './reflection.ts'

export {
  areasDifferEnough,
  isAngleClassAmbiguous,
  isAngleMeasureAmbiguous,
  isLineRelationAmbiguous,
  isParallelAmbiguous,
  isPerpendicularAmbiguous,
  relativeAreaDifference,
  unequalPartitionWeights,
} from './guards.ts'
