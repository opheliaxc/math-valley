import { useState } from 'react'

type TypedAnswerProps = {
  disabled?: boolean
  onSubmit: (answer: string) => void
}

export function TypedAnswer({ disabled = false, onSubmit }: TypedAnswerProps) {
  const [value, setValue] = useState('')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (disabled || value.trim() === '') return
    onSubmit(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block space-y-2">
        <span className="sr-only">Your answer</span>
        <input
          type="text"
          inputMode="text"
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Type your answer"
          className="w-full min-h-14 rounded-2xl bg-slate-800 border border-slate-600 px-4 text-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
        />
      </label>
      <button
        type="submit"
        disabled={disabled || value.trim() === ''}
        className="w-full min-h-14 rounded-2xl bg-amber-400 text-slate-900 text-lg font-bold hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        Check answer
      </button>
    </form>
  )
}
