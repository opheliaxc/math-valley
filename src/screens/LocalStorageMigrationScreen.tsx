import { useState } from 'react'
import {
  describeLocalPeek,
  dismissLocalMigrationOffer,
  importLocalSaveToServer,
  removeMigratedLocalStorageCopy,
} from '../data/localStorageMigration'
import type { LocalStoragePeek, PlayerState } from '../data/playerState'

type Props = {
  peek: LocalStoragePeek
  onImported: (player: PlayerState, studentId: string) => void
  onSkip: () => void
}

export function LocalStorageMigrationScreen({
  peek,
  onImported,
  onSkip,
}: Props) {
  const description = describeLocalPeek(peek)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imported, setImported] = useState<{
    studentId: string
    player: PlayerState
  } | null>(null)

  async function handleImport() {
    if (peek.kind === 'unreadable') return
    setBusy(true)
    setError(null)
    try {
      const result = await importLocalSaveToServer(peek)
      setImported(result)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Import failed. Your browser save was left unchanged.',
      )
    } finally {
      setBusy(false)
    }
  }

  function handleSkip() {
    dismissLocalMigrationOffer(peek)
    onSkip()
  }

  function handleContinueKeepBrowserCopy() {
    if (!imported) return
    onImported(imported.player, imported.studentId)
  }

  function handleContinueRemoveBrowserCopy() {
    if (!imported) return
    removeMigratedLocalStorageCopy()
    onImported(imported.player, imported.studentId)
  }

  if (imported) {
    return (
      <main className="min-h-screen bg-slate-900 text-white px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-lg space-y-6 text-center">
          <p className="text-amber-300 text-sm tracking-widest uppercase">
            Import complete
          </p>
          <h1 className="text-3xl font-bold">Saved on the server</h1>
          <p className="text-slate-300 text-sm">
            {imported.player.profile.name}’s progress is now saved on the server.
            Your browser copy is still there until you choose to remove it.
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleContinueRemoveBrowserCopy}
              className="w-full min-h-14 rounded-2xl text-lg font-bold bg-amber-400 text-slate-900 hover:bg-amber-300"
            >
              Continue and remove browser copy
            </button>
            <button
              type="button"
              onClick={handleContinueKeepBrowserCopy}
              className="w-full min-h-12 rounded-2xl text-sm font-semibold border border-slate-600 text-slate-200 hover:border-slate-400"
            >
              Continue but keep browser copy
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-lg space-y-6">
        <header className="text-center space-y-2">
          <p className="text-amber-300 text-sm tracking-widest uppercase">
            Math Valley
          </p>
          <h1 className="text-3xl font-bold">{description.title}</h1>
          <p className="text-slate-400 text-sm">
            This is an optional, explicit import — nothing is deleted unless you
            say so after a successful import.
          </p>
        </header>

        <ul className="rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-4 text-left text-sm text-slate-200 space-y-2">
          {description.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        {error ? (
          <p className="text-sm text-rose-300 text-center" role="alert">
            {error}
          </p>
        ) : null}

        <div className="space-y-3">
          {peek.kind !== 'unreadable' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleImport()}
              className="w-full min-h-14 rounded-2xl text-lg font-bold transition disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 bg-amber-400 text-slate-900 hover:bg-amber-300"
            >
              {busy ? 'Importing…' : 'Import into project save file'}
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={handleSkip}
            className="w-full min-h-12 rounded-2xl text-sm font-semibold border border-slate-600 text-slate-200 hover:border-slate-400 disabled:opacity-50"
          >
            {peek.kind === 'unreadable' ? 'Dismiss' : 'Not now — keep using server only'}
          </button>
        </div>
      </div>
    </main>
  )
}
