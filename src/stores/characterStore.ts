import { create } from 'zustand'
import { db } from '@/lib/db'
import type { Character, CharacterCardV2 } from '@/types'
import { nanoid } from '@/lib/nanoid'

interface CharacterStore {
  characters: Character[]
  loaded: boolean
  load: () => Promise<void>
  add: (card: CharacterCardV2, avatarData?: string) => Promise<Character>
  remove: (id: string) => Promise<void>
  pin: (id: string) => Promise<void>
  unpin: (id: string) => Promise<void>
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  characters: [],
  loaded: false,

  load: async () => {
    const chars = await db.characters.orderBy('updatedAt').reverse().toArray()
    // Sort: pinned first (by pinnedAt desc), then by updatedAt desc
    chars.sort((a, b) => {
      if (a.pinnedAt && !b.pinnedAt) return -1
      if (!a.pinnedAt && b.pinnedAt) return 1
      if (a.pinnedAt && b.pinnedAt) return b.pinnedAt - a.pinnedAt
      return b.updatedAt - a.updatedAt
    })
    set({ characters: chars, loaded: true })
  },

  add: async (card, avatarData) => {
    const now = Date.now()
    const character: Character = {
      id: nanoid(),
      card,
      avatarData,
      createdAt: now,
      updatedAt: now,
    }
    await db.characters.add(character)
    await get().load()
    return character
  },

  remove: async (id) => {
    await db.characters.delete(id)
    // Also remove associated chats and messages
    const chats = await db.chats.where('characterId').equals(id).toArray()
    for (const chat of chats) {
      await db.messages.where('chatId').equals(chat.id).delete()
    }
    await db.chats.where('characterId').equals(id).delete()
    await get().load()
  },

  pin: async (id) => {
    await db.characters.update(id, { pinnedAt: Date.now() })
    await get().load()
  },

  unpin: async (id) => {
    await db.characters.update(id, { pinnedAt: undefined })
    await get().load()
  },
}))
