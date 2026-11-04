import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useReducedMotion } from 'framer-motion'

type LandingMotionValue = {
  /** OS prefers-reduced-motion */
  reduce: boolean
  /** Footer "Pause animations" pressed */
  paused: boolean
  /** Ambient loops + scroll-in are allowed */
  active: boolean
  setPaused: (paused: boolean) => void
  togglePaused: () => void
}

const LandingMotionContext = createContext<LandingMotionValue | null>(null)

export function LandingMotionProvider({ children }: { children: ReactNode }) {
  const reduce = Boolean(useReducedMotion())
  const [paused, setPaused] = useState(false)
  const togglePaused = useCallback(() => {
    setPaused((value) => !value)
  }, [])

  const value = useMemo<LandingMotionValue>(
    () => ({
      reduce,
      paused,
      active: !reduce && !paused,
      setPaused,
      togglePaused,
    }),
    [reduce, paused, togglePaused],
  )

  return createElement(
    LandingMotionContext.Provider,
    { value },
    children,
  )
}

/** Reduced-motion + pause state for landing ambient / scroll motion. */
export function useLandingMotion(): LandingMotionValue {
  const ctx = useContext(LandingMotionContext)
  if (!ctx) {
    throw new Error('useLandingMotion must be used within LandingMotionProvider')
  }
  return ctx
}
