export type AvatarId = 'ember' | 'sage' | 'sky' | 'gold' | 'violet' | 'rose'

export type AvatarOption = {
  id: AvatarId
  label: string
  emoji: string
  color: string
}

export const AVATARS: AvatarOption[] = [
  { id: 'ember', label: 'Ember', emoji: '🔥', color: 'bg-orange-500' },
  { id: 'sage', label: 'Sage', emoji: '🌿', color: 'bg-emerald-500' },
  { id: 'sky', label: 'Sky', emoji: '✨', color: 'bg-sky-500' },
  { id: 'gold', label: 'Gold', emoji: '⭐', color: 'bg-amber-500' },
  { id: 'violet', label: 'Violet', emoji: '🌙', color: 'bg-violet-500' },
  { id: 'rose', label: 'Rose', emoji: '🌸', color: 'bg-rose-500' },
]

export function getAvatar(id: AvatarId): AvatarOption {
  return AVATARS.find((avatar) => avatar.id === id) ?? AVATARS[0]
}
