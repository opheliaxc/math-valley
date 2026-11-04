import { motion } from 'framer-motion'
import { getLunaraStage, getNextLunaraStage } from '../data/lunara'

type LunaraDisplayProps = {
  xp: number
  compact?: boolean
}

export function LunaraDisplay({ xp, compact = false }: LunaraDisplayProps) {
  const stage = getLunaraStage(xp)
  const next = getNextLunaraStage(xp)
  const progress = next
    ? Math.min(1, (xp - stage.minXp) / (next.minXp - stage.minXp))
    : 1

  return (
    <div
      className={`rounded-2xl border border-amber-500/30 bg-gradient-to-br from-violet-950/80 to-slate-900 p-4 ${
        compact ? '' : 'space-y-3'
      }`}
    >
      <div className={`flex items-center gap-4 ${compact ? '' : 'flex-col text-center'}`}>
        <motion.div
          key={stage.id}
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className={`flex items-center justify-center rounded-full bg-violet-800/50 ${
            compact ? 'h-16 w-16 text-3xl' : 'h-24 w-24 text-5xl'
          }`}
          aria-hidden
        >
          {stage.emoji}
        </motion.div>
        <div className={compact ? 'text-left flex-1' : 'space-y-1'}>
          <p className="text-amber-300 text-xs tracking-widest uppercase">Lunara</p>
          <p className="text-lg font-semibold text-white">{stage.label}</p>
          {!compact && <p className="text-sm text-slate-400">{stage.blurb}</p>}
          <p className="text-sm text-slate-300">{xp} XP</p>
        </div>
      </div>

      {next && (
        <div className="space-y-1 mt-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Next: {next.label}</span>
            <span>
              {xp}/{next.minXp}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full bg-violet-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
