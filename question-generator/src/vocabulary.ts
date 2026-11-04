/**
 * Small rotating vocabulary for word-problem prompts (spec §9.2).
 * Expand later as needed — not meant to be exhaustive in v1.
 */

export const NAMES = [
  'Mia',
  'Leo',
  'Ava',
  'Noah',
  'Sofia',
  'Eli',
  'Amara',
  'Kai',
  'Lila',
  'Omar',
  'Emma',
  'Jay',
  'Nina',
  'Theo',
  'Zoe',
] as const

export const OBJECTS = [
  'apples',
  'stickers',
  'marbles',
  'pencils',
  'books',
  'crayons',
  'balls',
  'cards',
  'blocks',
  'cookies',
  'shells',
  'beads',
  'erasers',
  'stars',
  'coins',
] as const

export const SETTINGS = [
  'at the park',
  'in the classroom',
  'at the store',
  'on the playground',
  'at home',
  'at the library',
  'at the bakery',
  'on a field trip',
  'at the beach',
  'in the garden',
] as const

export type Name = (typeof NAMES)[number]
export type ObjectWord = (typeof OBJECTS)[number]
export type Setting = (typeof SETTINGS)[number]

/** Pick one item from a readonly list. Caller supplies the index (from RNG later). */
export function pickAt<T>(items: readonly T[], index: number): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from an empty vocabulary list')
  }
  const i = ((index % items.length) + items.length) % items.length
  return items[i]!
}

/** Convenience picks using Math.random — fine for manual testing; seeded RNG comes with the engine. */
export function randomName(): Name {
  return pickAt(NAMES, Math.floor(Math.random() * NAMES.length))
}

export function randomObject(): ObjectWord {
  return pickAt(OBJECTS, Math.floor(Math.random() * OBJECTS.length))
}

export function randomSetting(): Setting {
  return pickAt(SETTINGS, Math.floor(Math.random() * SETTINGS.length))
}

/** Two distinct names — useful for compare / give-away word problems. */
export function randomNamePair(): [Name, Name] {
  const first = randomName()
  let second = randomName()
  let guard = 0
  while (second === first && guard < 20) {
    second = randomName()
    guard += 1
  }
  if (second === first) {
    second = pickAt(NAMES, (NAMES.indexOf(first) + 1) % NAMES.length)
  }
  return [first, second]
}
