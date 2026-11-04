import { useEffect } from 'react'
import { landingCopy } from './data/landingCopy'
import {
  LandingMotionProvider,
  useLandingMotion,
} from './motion/useLandingMotion'
import { Explorers } from './sections/Explorers'
import { ExploreValley } from './sections/ExploreValley'
import { FinalCta } from './sections/FinalCta'
import { Hero } from './sections/Hero'
import { HowItWorks } from './sections/HowItWorks'
import { LandingFooter } from './sections/LandingFooter'
import { LandingNav } from './sections/LandingNav'
import fredokaUrl from './fonts/fredoka-latin-600-normal.woff2?url'
import './landing.css'

const APP_TITLE_FALLBACK = 'Math Valley'

function LandingShell() {
  const copy = landingCopy
  const { paused, reduce } = useLandingMotion()

  useEffect(() => {
    const previousTitle = document.title
    document.title = copy.meta.title

    const existing = document.querySelector('meta[name="description"]')
    const created = !(existing instanceof HTMLMetaElement)
    const meta =
      existing instanceof HTMLMetaElement
        ? existing
        : document.createElement('meta')
    const previousDescription = created ? '' : meta.content
    if (created) {
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = copy.meta.description

    return () => {
      document.title = previousTitle || APP_TITLE_FALLBACK
      if (created) {
        meta.remove()
      } else {
        meta.content = previousDescription
      }
    }
  }, [copy.meta.description, copy.meta.title])

  /* Preload heading font only on the landing route (Section 9.3). */
  useEffect(() => {
    const existing = document.querySelector(
      'link[data-mv-landing-font-preload="fredoka"]',
    )
    if (existing) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    link.href = fredokaUrl
    link.dataset.mvLandingFontPreload = 'fredoka'
    document.head.appendChild(link)

    return () => {
      link.remove()
    }
  }, [])

  const rootClass = [
    'mv-landing',
    paused ? 'mv-landing--paused' : '',
    reduce ? 'mv-landing--reduce' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      <LandingNav />

      <main id="main" tabIndex={-1}>
        <Hero />
        <ExploreValley />
        <HowItWorks />
        <Explorers />
        <FinalCta />
      </main>

      <LandingFooter />
    </div>
  )
}

/** Landing page with motion provider (S9). */
export default function LandingPage() {
  return (
    <LandingMotionProvider>
      <LandingShell />
    </LandingMotionProvider>
  )
}
