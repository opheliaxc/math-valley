import { useEffect, useState } from 'react'
import {
  parseActiveSession,
  type ActiveSessionState,
} from './data/activeSession'
import {
  checkApiHealth,
  clearActiveStudentId,
  getActiveStudentId,
  getStudent,
  listStudents,
  setActiveStudentId,
  studentRecordToPlayerState,
} from './data/apiClient'
import { shouldOfferLocalMigration } from './data/localStorageMigration'
import {
  clearPlayerState,
  peekLocalStorageSave,
  type LocalStoragePeek,
  type PlayerState,
} from './data/playerState'
import type { TopicId } from './data/topics'
import { ENTRY_PATH } from './routes'
import { FractionDemoScreen } from './screens/FractionDemoScreen'
import { HomeScreen } from './screens/HomeScreen'
import { LocalStorageMigrationScreen } from './screens/LocalStorageMigrationScreen'
import { ProfileCreateScreen } from './screens/ProfileCreateScreen'
import { SessionScreen } from './screens/SessionScreen'
import { VisualDemoScreen } from './screens/VisualDemoScreen'

type Screen =
  | { name: 'home' }
  | {
      name: 'session'
      topic: TopicId
      restoredSession?: ActiveSessionState | null
    }

type BootStatus = 'loading' | 'migrate' | 'ready' | 'error'

function useLocationHash(): string {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return hash
}

function BootLoadingScreen() {
  return (
    <main className="min-h-screen bg-slate-900 text-white px-4 py-8 flex items-center justify-center">
      <div className="text-center space-y-3" role="status" aria-live="polite">
        <p className="text-amber-300 text-sm tracking-widest uppercase">
          Math Valley
        </p>
        <h1 className="text-2xl font-bold">Loading your adventure…</h1>
        <p className="text-slate-400 text-sm">Checking saved progress</p>
      </div>
    </main>
  )
}

function BootErrorScreen({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <main className="min-h-screen bg-slate-900 text-white px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-amber-300 text-sm tracking-widest uppercase">
            Math Valley
          </p>
          <h1 className="text-2xl font-bold">Couldn’t load saved data</h1>
          <p className="text-slate-300 text-sm">{message}</p>
          <p className="text-slate-500 text-xs">
            Start the app with <code className="text-slate-300">npm run dev</code>{' '}
            so the save server is running. Your progress was not reset.
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="w-full min-h-14 rounded-2xl text-lg font-bold bg-amber-400 text-slate-900 hover:bg-amber-300"
        >
          Try again
        </button>
      </div>
    </main>
  )
}

async function finishBootstrapFromStudentId(
  chosenId: string,
  cancelled: () => boolean,
  apply: (args: {
    studentId: string
    player: PlayerState
    screen: Screen
    resumeWarning: string | null
  }) => void,
): Promise<void> {
  const student = await getStudent(chosenId)
  const nextPlayer = studentRecordToPlayerState(student)
  if (cancelled()) return

  setActiveStudentId(student.id)

  const restored = parseActiveSession(student.activeSession)
  if (student.activeSession && !restored) {
    apply({
      studentId: student.id,
      player: nextPlayer,
      screen: { name: 'home' },
      resumeWarning:
        'An unfinished quiz could not be restored (saved question data was incomplete). Your learning progress was kept.',
    })
    return
  }

  if (restored) {
    apply({
      studentId: student.id,
      player: nextPlayer,
      screen: {
        name: 'session',
        topic: restored.topicId,
        restoredSession: restored,
      },
      resumeWarning: null,
    })
    return
  }

  apply({
    studentId: student.id,
    player: nextPlayer,
    screen: { name: 'home' },
    resumeWarning: null,
  })
}

function App() {
  const [bootStatus, setBootStatus] = useState<BootStatus>('loading')
  const [bootError, setBootError] = useState<string | null>(null)
  const [bootNonce, setBootNonce] = useState(0)
  const [migrationPeek, setMigrationPeek] = useState<LocalStoragePeek | null>(
    null,
  )
  const [studentId, setStudentId] = useState<string | null>(null)
  const [player, setPlayer] = useState<PlayerState | null>(null)
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [resumeWarning, setResumeWarning] = useState<string | null>(null)
  const hash = useLocationHash()

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setBootStatus('loading')
      setBootError(null)
      setResumeWarning(null)
      setMigrationPeek(null)
      // Do not seed default progress while loading — wait for the server.
      setPlayer(null)
      setStudentId(null)

      try {
        await checkApiHealth()

        const peek = peekLocalStorageSave()
        if (shouldOfferLocalMigration(peek)) {
          if (!cancelled) {
            setMigrationPeek(peek)
            setBootStatus('migrate')
          }
          return
        }

        // Only auto-load the browser's remembered student — never pick a
        // random classroom profile. Resume otherwise uses grade + avatar.
        const listed = await listStudents()
        const remembered = getActiveStudentId()
        const chosenId =
          remembered && listed.students.some((s) => s.id === remembered)
            ? remembered
            : null

        if (!chosenId) {
          if (!cancelled) {
            clearActiveStudentId()
            setStudentId(null)
            setPlayer(null)
            setScreen({ name: 'home' })
            setBootStatus('ready')
          }
          return
        }

        await finishBootstrapFromStudentId(
          chosenId,
          () => cancelled,
          ({ studentId: id, player: nextPlayer, screen: nextScreen, resumeWarning: warn }) => {
            setStudentId(id)
            setPlayer(nextPlayer)
            setScreen(nextScreen)
            setResumeWarning(warn)
            setBootStatus('ready')
          },
        )
      } catch (err) {
        if (cancelled) return
        setBootError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while loading.',
        )
        setBootStatus('error')
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [bootNonce])

  async function continueAfterMigrationDecision() {
    setBootStatus('loading')
    setMigrationPeek(null)
    try {
      const listed = await listStudents()
      const remembered = getActiveStudentId()
      const chosenId =
        remembered && listed.students.some((s) => s.id === remembered)
          ? remembered
          : null

      if (!chosenId) {
        clearActiveStudentId()
        setStudentId(null)
        setPlayer(null)
        setScreen({ name: 'home' })
        setBootStatus('ready')
        return
      }

      await finishBootstrapFromStudentId(
        chosenId,
        () => false,
        ({ studentId: id, player: nextPlayer, screen: nextScreen, resumeWarning: warn }) => {
          setStudentId(id)
          setPlayer(nextPlayer)
          setScreen(nextScreen)
          setResumeWarning(warn)
          setBootStatus('ready')
        },
      )
    } catch (err) {
      setBootError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while loading.',
      )
      setBootStatus('error')
    }
  }

  if (hash === '#fraction-demo') {
    return <FractionDemoScreen />
  }

  if (hash === '#visual-demo') {
    return <VisualDemoScreen />
  }

  if (bootStatus === 'loading') {
    return <BootLoadingScreen />
  }

  if (bootStatus === 'error') {
    return (
      <BootErrorScreen
        message={bootError ?? 'Could not reach the save server.'}
        onRetry={() => setBootNonce((n) => n + 1)}
      />
    )
  }

  if (bootStatus === 'migrate' && migrationPeek) {
    return (
      <LocalStorageMigrationScreen
        peek={migrationPeek}
        onImported={(state, id) => {
          setPlayer(state)
          setStudentId(id)
          setScreen({ name: 'home' })
          setBootStatus('ready')
          setMigrationPeek(null)
        }}
        onSkip={() => {
          void continueAfterMigrationDecision()
        }}
      />
    )
  }

  if (!player || !studentId) {
    return (
      <ProfileCreateScreen
        onEntered={async (id) => {
          await finishBootstrapFromStudentId(
            id,
            () => false,
            ({
              studentId: nextId,
              player: nextPlayer,
              screen: nextScreen,
              resumeWarning: warn,
            }) => {
              setStudentId(nextId)
              setPlayer(nextPlayer)
              setScreen(nextScreen)
              setResumeWarning(warn)
              setBootStatus('ready')
            },
          )
        }}
      />
    )
  }

  if (screen.name === 'session') {
    return (
      <SessionScreen
        studentId={studentId}
        topic={screen.topic}
        player={player}
        restoredSession={screen.restoredSession ?? null}
        onPlayerChange={setPlayer}
        onExit={() => {
          setResumeWarning(null)
          setScreen({ name: 'home' })
        }}
      />
    )
  }

  return (
    <>
      {resumeWarning ? (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-950/95 border-b border-amber-500/40 px-4 py-3 text-center">
          <p className="text-sm text-amber-100">{resumeWarning}</p>
          <button
            type="button"
            className="mt-1 text-xs text-amber-300 underline"
            onClick={() => setResumeWarning(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}
      <HomeScreen
        player={player}
        onStartSession={(topic) =>
          setScreen({ name: 'session', topic, restoredSession: null })
        }
        onSwitchAdventurer={() => {
          // Keep server progress; only forget who is active on this browser.
          clearActiveStudentId()
          clearPlayerState()
          setResumeWarning(null)
          // Entry lives at /app (landing owns /). Reload entry so the form shows.
          window.location.assign(ENTRY_PATH)
        }}
      />
    </>
  )
}

export default App
