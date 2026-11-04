import { useState } from 'react'
import {
  ApiError,
  enterByGradeAvatar,
} from '../data/apiClient'
import { AVATARS, type AvatarId } from '../data/avatars'
import type { Grade } from '../data/profile'
import { LANDING_PATH } from '../routes'

type ProfileCreateScreenProps = {
  /** Called with the student id after resume or create. */
  onEntered: (studentId: string) => void | Promise<void>
}

const GRADES: Grade[] = [1, 2, 3, 4]

type NameMode = 'hidden' | 'new' | 'tiebreak'

export function ProfileCreateScreen({ onEntered }: ProfileCreateScreenProps) {
  const [name, setName] = useState('')
  const [grade, setGrade] = useState<Grade | null>(null)
  const [avatarId, setAvatarId] = useState<AvatarId | null>(null)
  const [nameMode, setNameMode] = useState<NameMode>('hidden')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedName = name.trim()
  const needsName = nameMode !== 'hidden'
  const canSubmit =
    grade !== null &&
    avatarId !== null &&
    !saving &&
    (!needsName || trimmedName.length > 0)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit || grade === null || avatarId === null) return

    setSaving(true)
    setError(null)
    try {
      const student = await enterByGradeAvatar({
        grade,
        avatarId,
        name: needsName ? trimmedName : undefined,
      })
      await onEntered(student.id)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NAME_REQUIRED') {
        setNameMode(err.status === 409 ? 'tiebreak' : 'new')
        setError(err.message)
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not enter Math Valley. Is the server running?',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const subtitle =
    nameMode === 'tiebreak'
      ? 'Type your name to resume — or a new name to create another adventurer'
      : nameMode === 'new'
        ? 'New adventurer — tell us your name'
        : 'Choose your grade and avatar to continue'

  const nameLabel =
    nameMode === 'tiebreak'
      ? 'Your name (resume or create)'
      : 'Your name'

  return (
    <main className="min-h-screen bg-slate-900 text-white px-4 py-8 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-8"
        aria-labelledby="profile-heading"
      >
        <header className="text-center space-y-2">
          <p className="text-amber-300 text-sm tracking-widest uppercase">
            Welcome to
          </p>
          <h1 id="profile-heading" className="text-4xl font-bold tracking-wide">
            Math Valley
          </h1>
          <p className="text-slate-300">{subtitle}</p>
        </header>

        <fieldset className="space-y-3" disabled={saving}>
          <legend className="text-sm font-medium text-slate-200">Your grade</legend>
          <div className="grid grid-cols-4 gap-3">
            {GRADES.map((option) => {
              const selected = grade === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setGrade(option)
                    setNameMode('hidden')
                    setError(null)
                  }}
                  aria-pressed={selected}
                  className={`min-h-14 rounded-2xl text-lg font-semibold border transition ${
                    selected
                      ? 'bg-amber-400 text-slate-900 border-amber-300'
                      : 'bg-slate-800 text-white border-slate-600 hover:border-slate-400'
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="space-y-3" disabled={saving}>
          <legend className="text-sm font-medium text-slate-200">Your avatar</legend>
          <div className="grid grid-cols-3 gap-3">
            {AVATARS.map((avatar) => {
              const selected = avatarId === avatar.id
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => {
                    setAvatarId(avatar.id)
                    setNameMode('hidden')
                    setError(null)
                  }}
                  aria-pressed={selected}
                  aria-label={avatar.label}
                  className={`min-h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 transition ${
                    selected
                      ? 'border-amber-300 ring-2 ring-amber-400'
                      : 'border-slate-600 hover:border-slate-400'
                  }`}
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${avatar.color}`}
                    aria-hidden
                  >
                    {avatar.emoji}
                  </span>
                  <span className="text-xs text-slate-300">{avatar.label}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        {needsName ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">{nameLabel}</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={20}
              autoComplete="nickname"
              placeholder="Type your name"
              disabled={saving}
              autoFocus
              className="w-full min-h-14 rounded-2xl bg-slate-800 border border-slate-600 px-4 text-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
            />
          </label>
        ) : null}

        {error ? (
          <p className="text-sm text-rose-300 text-center" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full min-h-14 rounded-2xl text-lg font-bold transition disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 bg-amber-400 text-slate-900 hover:bg-amber-300"
        >
          {saving ? 'Loading…' : 'Enter Math Valley'}
        </button>

        <a
          href={LANDING_PATH}
          className="flex w-full min-h-12 items-center justify-center px-4 rounded-xl text-sm text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200"
        >
          Back to Math Valley
        </a>
      </form>
    </main>
  )
}
