import { LunaraDisplay } from '../components/LunaraDisplay'
import { getAvatar } from '../data/avatars'
import { describeTopicProgress } from '../data/practiceSession'
import {
  isZoneEnterable,
  isZoneUnlocked,
  type PlayerState,
} from '../data/playerState'
import type { TopicId } from '../data/topics'
import { getZonesForGrade } from '../data/zones'
import { LANDING_PATH } from '../routes'

type HomeScreenProps = {
  player: PlayerState
  onStartSession: (topic: TopicId) => void
  onSwitchAdventurer: () => void
}

export function HomeScreen({
  player,
  onStartSession,
  onSwitchAdventurer,
}: HomeScreenProps) {
  const { profile } = player
  const avatar = getAvatar(profile.avatarId)

  return (
    <main className="min-h-screen bg-slate-900 text-white px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-lg space-y-6">
        <header className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${avatar.color}`}
              aria-hidden
            >
              {avatar.emoji}
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold tracking-wide">Math Valley</h1>
              <p className="text-slate-400 text-sm">
                {profile.name} · Grade {profile.grade}
                {player.contentLevel !== profile.grade
                  ? ` · Content L${player.contentLevel}`
                  : ''}
              </p>
            </div>
          </div>
        </header>

        <LunaraDisplay xp={player.xp} />

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-300 text-left">
            World map
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {getZonesForGrade(player.contentLevel).map((zone) => {
              const unlocked = isZoneUnlocked(player, zone.id)
              const enterable = isZoneEnterable(player, zone.id)
              const progressLabel = describeTopicProgress(
                player.studentProgress,
                zone.id,
              )

              if (!enterable) {
                const comingSoon = !zone.practiceable
                return (
                  <div
                    key={zone.id}
                    className="min-h-20 rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 opacity-60"
                  >
                    <p className="font-semibold text-slate-400">
                      🔒 {zone.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {comingSoon
                        ? 'Coming soon — visible on the map, not open for practice yet'
                        : unlocked
                          ? 'Not open for practice yet'
                          : 'Keep practicing earlier zones to unlock'}
                    </p>
                    {comingSoon ? (
                      <p className="text-xs text-slate-600 mt-1">{zone.intro}</p>
                    ) : null}
                  </div>
                )
              }

              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => onStartSession(zone.id)}
                  className={`min-h-24 rounded-2xl border border-white/10 bg-gradient-to-br ${zone.accentClass} px-4 py-3 text-left hover:brightness-110 transition`}
                >
                  <span className="block text-white font-semibold text-lg">
                    {zone.name}
                  </span>
                  <span className="block text-sm text-white/80 mt-1">
                    {zone.intro}
                  </span>
                  <span className="block text-xs text-white/70 mt-2">
                    {progressLabel}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onSwitchAdventurer}
            className="w-full min-h-12 px-4 rounded-xl text-sm text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200"
          >
            Switch adventurer
          </button>
          <a
            href={LANDING_PATH}
            className="flex w-full min-h-12 items-center justify-center px-4 rounded-xl text-sm text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200"
          >
            Back to Math Valley
          </a>
        </div>
      </div>
    </main>
  )
}
