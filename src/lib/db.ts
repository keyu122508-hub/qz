import Dexie, { Table } from 'dexie'
import type { Character, Chat, Message, ApiConfig } from '@/types'

export class TavernDB extends Dexie {
  characters!: Table<Character>
  chats!: Table<Chat>
  messages!: Table<Message>
  apiConfigs!: Table<ApiConfig>

  constructor() {
    super('TavernLiteDB')
    this.version(1).stores({
      characters: 'id, updatedAt, pinnedAt',
      chats: 'id, characterId, apiConfigId, updatedAt',
      messages: 'id, chatId, createdAt',
      apiConfigs: 'id, updatedAt',
    })
  }
}

export const db = new TavernDB()
