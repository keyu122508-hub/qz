import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useChatStore } from '@/stores/chatStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useApiConfigStore } from '@/stores/apiConfigStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { db } from '@/lib/db'
import type { Chat, Character, ApiConfig } from '@/types'

export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const store = useChatStore()
  const { characters } = useCharacterStore()
  const { configs } = useApiConfigStore()
  const { userName } = useSettingsStore()
  const [chat, setChat] = useState<Chat | null>(null)
  const [character, setCharacter] = useState<Character | null>(null)
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null)
  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chatId) return
    db.chats.get(chatId).then(c => { if (c) { setChat(c); store.loadChat(chatId) } })
  }, [chatId])

  // Scroll to bottom when chat first loads
  useEffect(() => {
    if (store.messages.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'instant' })
    }
  }, [chat?.id])

  useEffect(() => {
    if (!chat) return
    setCharacter(characters.find(c => c.id === chat.characterId) ?? null)
    setApiConfig(configs.find(c => c.id === chat.apiConfigId) ?? null)
  }, [chat, characters, configs])

  const lastMsgContent = store.messages[store.messages.length - 1]?.content ?? ''
  useEffect(() => {
    if (!bottomRef.current) return
    bottomRef.current.scrollIntoView({ behavior: store.streaming ? 'instant' : 'smooth' })
  }, [store.messages.length, lastMsgContent, store.streaming])

  const handleSend = async () => {
    if (!input.trim() || store.streaming || !character || !apiConfig) return
    const text = input.trim(); setInput('')
    await store.sendMessage(text, character, apiConfig, userName)
  }

  const handleContinue = async () => {
    if (store.streaming || !character || !apiConfig) return
    await store.sendMessage('请继续', character, apiConfig, userName, true)
  }

  const handleNewChat = () => {
    if (character) navigate(`/characters/${character.id}`)
  }

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!chat || !character) {
    return <div className="flex items-center justify-center h-full text-[#6b7280]">加载中...</div>
  }

  const AvatarImg = () => (
    <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#1a1a1a] flex-shrink-0 mt-1">
      {character.avatarData
        ? <img src={character.avatarData} className="w-full h-full object-cover" alt="" />
        : <div className="w-full h-full flex items-center justify-center text-sm">🎭</div>}
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 pt-safe bg-[#0f0f0f] border-b border-[#2a2a2a] flex-shrink-0">
        <button onClick={() => navigate('/characters')} className="text-[#9ca3af] hover:text-[#e5e7eb] text-xl px-1" title="返回角色列表">←</button>
        <AvatarImg />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{character.card.data.name}</p>
          {apiConfig && <p className="text-xs text-[#6b7280] truncate">{apiConfig.model}</p>}
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(v => !v)} className="text-[#6b7280] hover:text-[#e5e7eb] px-2 py-1 rounded-lg hover:bg-[#1a1a1a] transition-colors" title="更多操作">&#8942;</button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 z-20 bg-[#242424] border border-[#2a2a2a] rounded-xl shadow-xl min-w-[120px]">
                <button onClick={() => { handleNewChat(); setShowMenu(false) }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#e5e7eb] hover:bg-[#2a2a2a] transition-colors rounded-xl">
                  ✦ 新建对话
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {store.error && (
        <div className="mx-4 mt-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between gap-2 flex-shrink-0">
          <p className="text-red-400 text-xs flex-1">{store.error}</p>
          <button onClick={store.clearError} className="text-red-400 text-lg leading-none">&#215;</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {store.messages.filter(m => m.role !== 'system').map(msg => {
          const isUser = msg.role === 'user'
          const isStreaming = msg.id === store.streamingMessageId
          const content = msg.swipes[msg.currentSwipe] ?? msg.content
          return (
            <div key={msg.id} className={`flex gap-2.5 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
              {!isUser && <AvatarImg />}
              <div className={`flex flex-col gap-1 max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
                {editingId === msg.id ? (
                  <div className="w-full space-y-2">
                    <textarea value={editingText} onChange={e => setEditingText(e.target.value)}
                      className="w-full bg-[#242424] border border-[#c084fc]/50 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none min-h-[60px]" />
                    <div className="flex gap-2">
                      <button onClick={async () => { await store.editMessage(msg.id, editingText); setEditingId(null) }}
                        className="px-3 py-1 bg-[#c084fc] text-white text-xs rounded-lg">保存</button>
                      <button onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-[#242424] text-[#9ca3af] text-xs rounded-lg">取消</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
                      ${isUser ? 'bg-[#c084fc]/20 border border-[#c084fc]/30 rounded-tr-sm' : 'bg-[#1a1a1a] border border-[#2a2a2a] rounded-tl-sm'}
                      ${isStreaming ? 'streaming-cursor' : ''}`}>
                      {content || (isStreaming ? '' : '(空消息)')}
                    </div>
                    <div className={`flex items-center gap-3 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                      {!isUser && !isStreaming && character && apiConfig && (
                        <button onClick={() => store.regenerate(msg.id, character, apiConfig, userName)}
                          className="text-[#6b7280] hover:text-[#c084fc] transition-colors" title="重新生成">&#8634;</button>
                      )}
                      {!isStreaming && (
                        <button onClick={() => { setEditingId(msg.id); setEditingText(content) }}
                          className="text-[#6b7280] hover:text-[#e5e7eb] transition-colors text-sm" title="编辑消息">&#9998;</button>
                      )}
                      {!isStreaming && (
                        <button onClick={() => { if (confirm('删除这条消息？')) store.deleteMessage(msg.id) }}
                          className="text-[#6b7280] hover:text-red-400 transition-colors text-sm" title="删除消息">&#128465;</button>
                      )}
                      {msg.swipes.length > 1 && !isStreaming && (
                        <span className="text-[#6b7280] text-xs">{msg.currentSwipe+1}/{msg.swipes.length}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 px-4 pt-2 pb-3 pb-safe bg-[#0f0f0f] border-t border-[#2a2a2a]">
        <div className="flex items-end gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4 py-2 focus-within:border-[#c084fc] transition-colors">
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder={store.streaming ? '生成中...' : '输入消息...(回车发送)'}
            disabled={store.streaming || !apiConfig} rows={1}
            className="flex-1 bg-transparent text-sm placeholder-[#6b7280] focus:outline-none resize-none max-h-32 py-1 disabled:opacity-50"
            onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height='auto'; t.style.height=Math.min(t.scrollHeight,128)+'px' }} />
          <button onClick={handleSend} disabled={!input.trim()||store.streaming||!apiConfig}
            title="发送消息"
            className="w-8 h-8 bg-[#c084fc] hover:bg-[#a855f7] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors mb-0.5 flex-shrink-0">
            {store.streaming
              ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <span className="font-bold text-sm">&#8593;</span>}
          </button>
        </div>
        <div className="flex justify-end mt-1.5 px-0.5">
          <button onClick={handleContinue}
            disabled={store.streaming || !apiConfig || store.messages.length === 0}
            title="让 AI 续写上一条回复"
            className="text-xs text-[#6b7280] hover:text-[#c084fc] disabled:opacity-30 transition-colors px-2.5 py-1 rounded-full border border-[#2a2a2a] hover:border-[#c084fc]/40 flex items-center gap-1">
            <span>&#10022;</span><span>续写</span>
          </button>
        </div>
      </div>
    </div>
  )
}