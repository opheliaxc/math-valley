import { motion, useInView } from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import { useLandingMotion } from './useLandingMotion'

type AmbientKind = 'float' | 'drift' | 'twinkle'

type AmbientMotionProps = {
  kind: AmbientKind
  children: ReactNode
  /** Extra seconds on the loop (gentle 6–12s range). */
  duration?: number
  className?: string
}

const LOOPS: Record<
  AmbientKind,
  { animate: Record<string, number[]>; duration: number }
> = {
  float: {
    animate: { y: [0, -7, 0] },
    duration: 8,
  },
  drift: {
    animate: { x: [0, 10, 0] },
    duration: 11,
  },
  twinkle: {
    animate: { opacity: [0.45, 1, 0.45] },
    duration: 7,
  },
}

/**
 * Ambient SVG/HTML motion: only while in view and motion is active.
 * Uses transform/opacity only.
 */
export function AmbientMotion({
  kind,
  children,
  duration,
  className,
}: AmbientMotionProps) {
  const { active } = useLandingMotion()
  const ref = useRef<SVGGElement | null>(null)
  const inView = useInView(ref, { amount: 0.2, once: false })
  const play = active && inView
  const loop = LOOPS[kind]
  const secs = duration ?? loop.duration

  return (
    <motion.g
      ref={ref}
      className={className}
      style={
        play
          ? { willChange: kind === 'twinkle' ? 'opacity' : 'transform' }
          : undefined
      }
      animate={play ? loop.animate : { x: 0, y: 0, opacity: 1 }}
      transition={
        play
          ? { duration: secs, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0 }
      }
    >
      {children}
    </motion.g>
  )
}

type ScrollRevealProps = {
  children: ReactNode
  className?: string
}

/** One-time scroll-in for section content. Skipped when reduce/paused. */
export function ScrollReveal({ children, className }: ScrollRevealProps) {
  const { active } = useLandingMotion()

  if (!active) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
