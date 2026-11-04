import { lazy, Suspense, useEffect, useState } from 'react'
import { ENTRY_PATH, LANDING_PATH } from './routes'

const App = lazy(() => import('./App'))
const LandingPage = lazy(() => import('./landing/LandingPage'))

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname || LANDING_PATH
}

function usePathname(): string {
  const [pathname, setPathname] = useState(() =>
    normalizePathname(window.location.pathname),
  )

  useEffect(() => {
    const sync = () => setPathname(normalizePathname(window.location.pathname))
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  return pathname
}

function useLocationHash(): string {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return hash
}

function RouteFallback({ label }: { label: string }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        color: '#1f2340',
        background: '#fff9ec',
      }}
    >
      <p role="status">{label}</p>
    </main>
  )
}

/**
 * Pathname switch (no react-router):
 * - `/` → landing (code-split; does not load game App)
 * - `/app` → existing game App (entry + home + session)
 * - hash demos → App (unchanged)
 */
export default function Root() {
  const pathname = usePathname()
  const hash = useLocationHash()
  const isDemo = hash === '#fraction-demo' || hash === '#visual-demo'

  if (isDemo || pathname === ENTRY_PATH) {
    return (
      <Suspense fallback={<RouteFallback label="Loading your adventure…" />}>
        <App />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<RouteFallback label="Loading Math Valley…" />}>
      <LandingPage />
    </Suspense>
  )
}
