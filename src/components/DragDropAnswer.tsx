import { useState } from 'react'
import type { CoinValue, DragDropPayload } from '../data/questions/types'

const COIN_LABELS: Record<CoinValue, string> = {
  1: '1¢',
  5: '5¢',
  10: '10¢',
  25: '25¢',
}

type DragDropAnswerProps = {
  payload: DragDropPayload
  disabled?: boolean
  onSubmit: (answer: number) => void
}

export function DragDropAnswer({
  payload,
  disabled = false,
  onSubmit,
}: DragDropAnswerProps) {
  if (payload.kind === 'coins') {
    return (
      <CoinsAnswer
        availableCoins={payload.availableCoins}
        targetCents={payload.targetCents}
        disabled={disabled}
        onSubmit={onSubmit}
      />
    )
  }

  return (
    <ClockAnswer
      targetHour={payload.targetHour}
      targetMinute={payload.targetMinute}
      disabled={disabled}
      onSubmit={onSubmit}
    />
  )
}

type CoinsAnswerProps = {
  availableCoins: CoinValue[]
  targetCents: number
  disabled?: boolean
  onSubmit: (answer: number) => void
}

function CoinsAnswer({
  availableCoins,
  targetCents,
  disabled = false,
  onSubmit,
}: CoinsAnswerProps) {
  const [selected, setSelected] = useState<CoinValue[]>([])
  const total = selected.reduce((sum, coin) => sum + coin, 0)

  function addCoin(coin: CoinValue) {
    if (disabled) return
    setSelected((prev) => [...prev, coin])
  }

  function removeAt(index: number) {
    if (disabled) return
    setSelected((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 text-center">
        Tap coins to add them. Tap a coin in your tray to remove it.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {availableCoins.map((coin) => (
          <button
            key={`bank-${coin}`}
            type="button"
            disabled={disabled}
            onClick={() => addCoin(coin)}
            className="min-h-16 min-w-16 rounded-full border-2 border-amber-400/70 bg-amber-500/20 text-lg font-bold hover:bg-amber-500/30 disabled:opacity-50"
          >
            {COIN_LABELS[coin]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-600 min-h-24 p-3">
        <p className="text-xs text-slate-500 mb-2 text-center">Your coins</p>
        <div className="flex flex-wrap justify-center gap-2">
          {selected.length === 0 ? (
            <span className="text-slate-500 text-sm">Empty</span>
          ) : (
            selected.map((coin, index) => (
              <button
                key={`tray-${index}-${coin}`}
                type="button"
                disabled={disabled}
                onClick={() => removeAt(index)}
                className="min-h-12 min-w-12 rounded-full bg-amber-400 text-slate-900 text-sm font-bold disabled:opacity-50"
              >
                {COIN_LABELS[coin]}
              </button>
            ))
          )}
        </div>
      </div>

      <p className="text-center text-slate-300">
        Total: <span className="text-amber-300 font-semibold">{total}¢</span>
        <span className="text-slate-500"> (goal {targetCents}¢)</span>
      </p>

      <button
        type="button"
        disabled={disabled || selected.length === 0}
        onClick={() => onSubmit(total)}
        className="w-full min-h-14 rounded-2xl bg-amber-400 text-slate-900 text-lg font-bold hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        Check coins
      </button>
    </div>
  )
}

type ClockAnswerProps = {
  targetHour: number
  targetMinute: 0 | 30
  disabled?: boolean
  onSubmit: (answer: number) => void
}

function ClockAnswer({
  targetHour,
  targetMinute,
  disabled = false,
  onSubmit,
}: ClockAnswerProps) {
  const [hour, setHour] = useState(12)
  const [minute, setMinute] = useState<0 | 30>(0)

  const displayHour = ((hour - 1) % 12) + 1
  const timeLabel = `${displayHour}:${minute.toString().padStart(2, '0')}`

  function handleSubmit() {
    // Match generator encoding: on-the-hour → hour only; half-hour → hour*100+30
    const answer = minute === 0 ? hour : hour * 100 + minute
    onSubmit(answer)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 text-center">
        Set the clock to match the time in the question
        <span className="sr-only">
          {' '}
          (target {targetHour}:{targetMinute.toString().padStart(2, '0')})
        </span>
      </p>

      <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border-4 border-slate-500 bg-slate-800 relative">
        <span className="text-3xl font-bold text-amber-300">{timeLabel}</span>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-300 text-center">Hour</p>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <button
              key={h}
              type="button"
              disabled={disabled}
              onClick={() => setHour(h)}
              className={`min-h-12 rounded-xl border text-sm font-semibold disabled:opacity-50 ${
                hour === h
                  ? 'border-amber-400 bg-amber-400 text-slate-900'
                  : 'border-slate-600 bg-slate-800'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setMinute(0)}
          className={`min-h-14 rounded-2xl border font-semibold disabled:opacity-50 ${
            minute === 0
              ? 'border-amber-400 bg-amber-400 text-slate-900'
              : 'border-slate-600 bg-slate-800'
          }`}
        >
          :00
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setMinute(30)}
          className={`min-h-14 rounded-2xl border font-semibold disabled:opacity-50 ${
            minute === 30
              ? 'border-amber-400 bg-amber-400 text-slate-900'
              : 'border-slate-600 bg-slate-800'
          }`}
        >
          :30
        </button>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={handleSubmit}
        className="w-full min-h-14 rounded-2xl bg-amber-400 text-slate-900 text-lg font-bold hover:bg-amber-300 disabled:opacity-50"
      >
        Check time
      </button>
    </div>
  )
}
