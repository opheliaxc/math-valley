import { Cloud, Flower, Star } from './Decor'
import { Lunara } from './Lunara'
import { AmbientMotion } from '../motion/AmbientMotion'

/**
 * Smaller hero echo for the final CTA (Section 5.2 A7).
 * Reuses sky / hills / flying Lunara; decorative only.
 */
export function FinalScene({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 480 200"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mv-final-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--mv-sky)" />
          <stop offset="100%" stopColor="var(--mv-lavender)" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      <rect width="480" height="200" fill="url(#mv-final-sky)" />
      <circle cx="420" cy="40" r="24" fill="var(--mv-sun)" />
      <AmbientMotion kind="drift" duration={11}>
        <g transform="translate(40 18) scale(1.1)" opacity="0.9">
          <Cloud />
        </g>
      </AmbientMotion>
      <AmbientMotion kind="drift" duration={9}>
        <g transform="translate(280 28) scale(0.9)" opacity="0.85">
          <Cloud />
        </g>
      </AmbientMotion>

      <ellipse cx="120" cy="160" rx="140" ry="50" fill="var(--mv-grass)" />
      <ellipse cx="360" cy="170" rx="160" ry="48" fill="var(--mv-grass-deep)" />
      <ellipse cx="240" cy="180" rx="200" ry="36" fill="var(--mv-grass)" />

      <AmbientMotion kind="float" duration={8}>
        <g>
          <ellipse cx="240" cy="120" rx="56" ry="24" fill="var(--mv-lavender)" />
          <ellipse
            cx="238"
            cy="114"
            rx="40"
            ry="12"
            fill="var(--mv-cream)"
            opacity="0.5"
          />
          <ellipse cx="240" cy="136" rx="34" ry="8" fill="var(--mv-grass)" />
        </g>
      </AmbientMotion>

      <AmbientMotion kind="twinkle" duration={6.5}>
        <g transform="translate(200 70)">
          <Star />
        </g>
      </AmbientMotion>
      <g transform="translate(40 150) scale(0.9)">
        <Flower />
      </g>
      <g transform="translate(400 155) scale(0.85)">
        <Flower />
      </g>

      <AmbientMotion kind="float" duration={7.5}>
        <g transform="translate(280 20) scale(1.35)">
          <Lunara pose="flying" nested tint="lavender" />
        </g>
      </AmbientMotion>
    </svg>
  )
}
