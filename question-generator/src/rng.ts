/** Mulberry32 — small seeded PRNG for reproducible question generation. */
export interface Rng {
  /** Next float in [0, 1). */
  next(): number
  /** Inclusive integer in [min, max]. */
  int(min: number, max: number): number
  /** True with given probability (default 0.5). */
  chance(p?: number): boolean
  /** Pick one element from a non-empty array. */
  pick<T>(items: readonly T[]): T
  /** Fisher–Yates shuffle; returns a new array. */
  shuffle<T>(items: readonly T[]): T[]
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function createRng(seed?: number): Rng {
  const nextFn = seed === undefined ? Math.random : mulberry32(seed >>> 0)

  const rng: Rng = {
    next: nextFn,
    int(min: number, max: number): number {
      if (max < min) throw new Error(`Rng.int: max (${max}) < min (${min})`)
      return min + Math.floor(rng.next() * (max - min + 1))
    },
    chance(p = 0.5): boolean {
      return rng.next() < p
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('Rng.pick: empty list')
      return items[rng.int(0, items.length - 1)]!
    },
    shuffle<T>(items: readonly T[]): T[] {
      const out = [...items]
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = rng.int(0, i)
        ;[out[i], out[j]] = [out[j]!, out[i]!]
      }
      return out
    },
  }

  return rng
}
