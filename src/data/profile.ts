import type { AvatarId } from './avatars'

export type Grade = 1 | 2 | 3 | 4

export type Profile = {
  name: string
  grade: Grade
  avatarId: AvatarId
}
