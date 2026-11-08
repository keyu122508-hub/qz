import { create } from 'zustand'
import { db } from '@/lib/db'
import type { Chat, Message, Character, ApiConfig } from '@/types'
import { nanoid } from '@/lib/nanoid'
import { buildPrompt } from '@/lib/promptBuilder'
import { streamChat } from '@/lib/apiClient'

interface ChatStore {
  currentChatId: string | null
  messages: Message[]
  streaming: boolean
  streamingMessageId: string | null
  error: string | null
  loadChat: (chatId: string) => Promise<void>
  createChat: (char: Character, apiConfigId: string, greetingIdx: number) => Promise<Chat>
  sendMessage: (content: string, char: Character, cfg: ApiConfig, userName: string, hidden?: boolean) => Promise<void>
  regenerate: (msgId: string, char: Character, cfg: ApiConfig, userName: string) => Promise<void>
  editMessage: (msgId: string, content: string) => Promise<void>
  deleteMessage: (msgId: string) => Promise<void>
  clearError: () => void
  getChatsForCharacter: (charId: string) => Promise<Chat[]>
  deleteChat: (chatId: string) => Promise<void>
}

export const useChatStore = create<ChatStore>((set, get) => ({
  currentChatId: null, messages: [], streaming: false,
  streamingMessageId: null, error: null,

  loadChat: async (chatId) => {
    const msgs = await db.messages.where('chatId').equals(chatId).sortBy('createdAt')
    set({ currentChatId: chatId, messages: msgs, error: null })
  },

  createChat: async (char, apiConfigId, greetingIdx) => {
    const now = Date.now(); const chatId = nanoid()
    const chat: Chat = {
      id: chatId, characterId: char.id, apiConfigId,
      title: char.card.data.name + ' · ' + new Date().toLocaleDateString('zh-CN'),
      greetingIndex: greetingIdx, createdAt: now, updatedAt: now,
    }
    await db.chats.add(chat)
    const greetings = [char.card.data.first_mes, ...char.card.data.alternate_greetings]
    const text = greetings[greetingIdx] ?? char.card.data.first_mes ?? ''
    if (text) await db.messages.add({ id: nanoid(), chatId, role: 'assistant', content: text, swipes: [text], currentSwipe: 0, createdAt: now + 1, metadata: {} })
    await get().loadChat(chatId)
    return chat
  },

  sendMessage: async (content, char, cfg, userName, hidden = false) => {
    const { currentChatId, messages } = get()
    if (!currentChatId || get().streaming) return
    const now = Date.now()
    let updatedMessages = messages
    if (!hidden) {
      const userMsg: Message = { id: nanoid(), chatId: currentChatId, role: 'user', content, swipes: [content], currentSwipe: 0, createdAt: now, metadata: {} }
      await db.messages.add(userMsg)
      updatedMessages = [...messages, userMsg]
      set(s => ({ messages: [...s.messages, userMsg] }))
    }
    const aId = nanoid()
    const aMsg: Message = { id: aId, chatId: currentChatId, role: 'assistant', content: '', swipes: [''], currentSwipe: 0, createdAt: now + 1, metadata: {} }
    await db.messages.add(aMsg)
    set(s => ({ messages: [...s.messages, aMsg], streaming: true, streamingMessageId: aId, error: null }))
    const prompt = buildPrompt({ character: char, history: updatedMessages, userMessage: content, userName, contextLimit: cfg.contextLimit })
    let text = ''
    try {
      for await (const chunk of streamChat(cfg, prompt)) {
        text += chunk
        set(s => ({ messages: s.messages.map(m => m.id === aId ? { ...m, content: text, swipes: [text] } : m) }))
      }
      await db.messages.update(aId, { content: text, swipes: [text], metadata: { model: cfg.model } })
      await db.chats.update(currentChatId, { updatedAt: Date.now() })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '发送失败' })
      await db.messages.delete(aId)
      set(s => ({ messages: s.messages.filter(m => m.id !== aId) }))
    } finally { set({ streaming: false, streamingMessageId: null }) }
  },

  regenerate: async (msgId, char, cfg, userName) => {
    const { messages, currentChatId } = get()
    if (!currentChatId || get().streaming) return
    const idx = messages.findIndex(m => m.id === msgId)
    if (idx === -1) return
    const before = messages.slice(0, idx)
    const lastUser = [...before].reverse().find(m => m.role === 'user')
    const prompt = buildPrompt({ character: char, history: before, userMessage: lastUser?.content ?? '', userName, contextLimit: cfg.contextLimit })
    const target = messages[idx]
    const newSwipes = [...target.swipes, '']; const newIdx = newSwipes.length - 1
    await db.messages.update(msgId, { swipes: newSwipes, currentSwipe: newIdx, content: '' })
    set(s => ({ messages: s.messages.map(m => m.id === msgId ? { ...m, swipes: newSwipes, currentSwipe: newIdx, content: '' } : m), streaming: true, streamingMessageId: msgId, error: null }))
    let text = ''
    try {
      for await (const chunk of streamChat(cfg, prompt)) {
        text += chunk
        set(s => ({ messages: s.messages.map(m => { if (m.id !== msgId) return m; const sw = [...m.swipes]; sw[newIdx] = text; return { ...m, swipes: sw, content: text } }) }))
      }
      const fs = [...target.swipes, text]
      await db.messages.update(msgId, { swipes: fs, currentSwipe: newIdx, content: text })
    } catch (e) { set({ error: e instanceof Error ? e.message : '重生失败' }) }
    finally { set({ streaming: false, streamingMessageId: null }) }
  },

  editMessage: async (msgId, content) => {
    await db.messages.update(msgId, { content, swipes: [content], currentSwipe: 0 })
    set(s => ({ messages: s.messages.map(m => m.id === msgId ? { ...m, content, swipes: [content], currentSwipe: 0 } : m) }))
  },
  deleteMessage: async (msgId) => {
    await db.messages.delete(msgId)
    set(s => ({ messages: s.messages.filter(m => m.id !== msgId) }))
  },
  clearError: () => set({ error: null }),
  getChatsForCharacter: (cid) => db.chats.where('characterId').equals(cid).sortBy('updatedAt'),
  deleteChat: async (chatId) => {
    await db.messages.where('chatId').equals(chatId).delete()
    await db.chats.delete(chatId)
  },
}))