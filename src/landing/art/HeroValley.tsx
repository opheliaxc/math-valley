import { Cloud, Flower, MathSymbol, Sparkle, Star, StepStone } from './Decor'
import { Lunara } from './Lunara'
import { AmbientMotion } from '../motion/AmbientMotion'

/** Meaningful hero image label (Section 9.1); wording reflects S4 cute-dragon art. */
const HERO_LABEL =
  'Illustration: Lunara the dragon flying over a valley of floating math islands'

/**
 * Hero scene focused on flying cute dragons over a simple valley.
 * Layers stay grouped for ambient motion (S9). One sky gradient only.
 */
export function HeroValley({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 420"
      role="img"
      aria-label={HERO_LABEL}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mv-hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--mv-sky)" />
          <stop offset="100%" stopColor="var(--mv-cream)" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      <g data-layer="sky">
        <rect width="640" height="420" fill="url(#mv-hero-sky)" />
        <circle cx="72" cy="64" r="42" fill="var(--mv-sun)" />
        <circle cx="58" cy="54" r="14" fill="var(--mv-cream)" opacity="0.4" />
      </g>

      <g data-layer="clouds">
        <AmbientMotion kind="drift" duration={12}>
          <g transform="translate(160 28) scale(1.5)" opacity="0.95">
            <Cloud />
          </g>
        </AmbientMotion>
        <AmbientMotion kind="drift" duration={10}>
          <g transform="translate(380 50) scale(1.25)" opacity="0.9">
            <Cloud />
          </g>
        </AmbientMotion>
        <AmbientMotion kind="drift" duration={14}>
          <g transform="translate(500 24) scale(1.1)" opacity="0.85">
            <Cloud />
          </g>
        </AmbientMotion>
      </g>

      <g data-layer="mountains">
        <path
          d="M0 240 L90 150 L170 210 L260 130 L350 200 L450 145 L540 205 L640 160 L640 300 L0 300 Z"
          fill="var(--mv-sky-deep)"
          opacity="0.22"
        />
        <path
          d="M0 260 L120 180 L220 240 L330 165 L430 230 L540 185 L640 220 L640 320 L0 320 Z"
          fill="var(--mv-lavender)"
          opacity="0.3"
        />
      </g>

      <g data-layer="hills">
        <ellipse cx="140" cy="330" rx="200" ry="72" fill="var(--mv-grass)" />
        <ellipse cx="460" cy="340" rx="240" ry="78" fill="var(--mv-grass-deep)" />
        <ellipse cx="320" cy="355" rx="280" ry="58" fill="var(--mv-grass)" />
      </g>

      <g data-layer="river">
        <path
          d="M-20 315 C90 290 160 325 250 308 S400 285 480 318 S580 345 660 320"
          fill="none"
          stroke="var(--mv-sky-deep)"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M-20 315 C90 290 160 325 250 308 S400 285 480 318 S580 345 660 320"
          fill="none"
          stroke="var(--mv-sky)"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.75"
        />
      </g>

      <g data-layer="bridges">
        <path
          d="M200 295 Q235 268 270 295"
          fill="none"
          stroke="var(--mv-gold)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M420 305 Q460 275 500 305"
          fill="none"
          stroke="var(--mv-gold)"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </g>

      <g data-layer="islands">
        <AmbientMotion kind="float" duration={9}>
          <g>
            <ellipse cx="130" cy="235" rx="44" ry="20" fill="var(--mv-lavender)" />
            <ellipse cx="130" cy="229" rx="32" ry="10" fill="var(--mv-cream)" opacity="0.5" />
            <ellipse cx="130" cy="250" rx="26" ry="7" fill="var(--mv-grass)" />
          </g>
        </AmbientMotion>
        <AmbientMotion kind="float" duration={7.5}>
          <g>
            <ellipse cx="320" cy="210" rx="86" ry="36" fill="var(--mv-lavender)" />
            <ellipse cx="318" cy="200" rx="62" ry="18" fill="var(--mv-cream)" opacity="0.55" />
            <ellipse cx="320" cy="236" rx="54" ry="12" fill="var(--mv-grass)" />
          </g>
        </AmbientMotion>
        <AmbientMotion kind="float" duration={10}>
          <g>
            <ellipse cx="520" cy="245" rx="48" ry="22" fill="var(--mv-lavender)" />
            <ellipse cx="520" cy="238" rx="34" ry="11" fill="var(--mv-cream)" opacity="0.5" />
            <ellipse cx="520" cy="260" rx="30" ry="8" fill="var(--mv-grass)" />
          </g>
        </AmbientMotion>
      </g>

      <g data-layer="details">
        <g transform="translate(255 280) scale(0.85)">
          <StepStone />
        </g>
        <g transform="translate(295 288) scale(0.7)">
          <StepStone />
        </g>
        <g transform="translate(335 282) scale(0.8)">
          <StepStone />
        </g>
        <g transform="translate(150 205) scale(0.85)">
          <MathSymbol kind="+" />
        </g>
        <g transform="translate(470 215) scale(0.8)">
          <MathSymbol kind="×" />
        </g>
        <g transform="translate(300 160) scale(0.65)">
          <MathSymbol kind="−" />
        </g>
        <AmbientMotion kind="twinkle" duration={6}>
          <g transform="translate(210 70) scale(0.9)">
            <Star />
          </g>
        </AmbientMotion>
        <AmbientMotion kind="twinkle" duration={8}>
          <g transform="translate(560 110) scale(0.7)">
            <Star />
          </g>
        </AmbientMotion>
        <AmbientMotion kind="twinkle" duration={7}>
          <g transform="translate(280 90)">
            <Sparkle />
          </g>
        </AmbientMotion>
        <g transform="translate(48 350) scale(1.1)">
          <Flower />
        </g>
        <g transform="translate(580 355)">
          <Flower />
        </g>
      </g>

      <g data-layer="dragons">
        <AmbientMotion kind="float" duration={8}>
          <g transform="translate(250 55) scale(2.35)">
            <Lunara pose="flying" nested tint="lavender" />
          </g>
        </AmbientMotion>
        <AmbientMotion kind="float" duration={9.5}>
          <g transform="translate(40 130) scale(1.15) rotate(-8)">
            <Lunara pose="flying" nested tint="coral" />
          </g>
        </AmbientMotion>
        <AmbientMotion kind="float" duration={7}>
          <g transform="translate(470 145) scale(1.25) scale(-1, 1) translate(-100 0)">
            <Lunara pose="flying" nested tint="emerald" />
          </g>
        </AmbientMotion>
      </g>
    </svg>
  )
}
