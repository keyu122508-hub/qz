import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/lib/db'
import { useCharacterStore } from '@/stores/characterStore'
import { useChatStore } from '@/stores/chatStore'
import type { Chat } from '@/types'

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return diffDays + '天前'
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

export function RecentChatsPage() {
  const navigate = useNavigate()
  const { characters, loaded, load } = useCharacterStore()
  const { deleteChat } = useChatStore()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  const loadChats = () => {
    db.chats.orderBy('updatedAt').reverse().limit(100).toArray().then(c => {
      setChats(c)
      setLoading(false)
    })
  }

  useEffect(() => {
    if (!loaded) load()
    loadChats()
  }, [loaded, load])

  const handleDelete = async (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation()
    const charName = characters.find(c => c.id === chat.characterId)?.card.data.name ?? '该角色'
    if (!confirm('删除与「' + charName + '」的对话记录？')) return
    await deleteChat(chat.id)
    setChats(prev => prev.filter(c => c.id !== chat.id))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-[#0f0f0f] px-4 pt-safe">
        <h1 className="text-xl font-semibold py-4">最近对话</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-[#6b7280]">加载中...</div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-[#6b7280]">
            <span className="text-4xl">💬</span>
            <p className="text-sm">还没有任何对话记录</p>
            <button onClick={() => navigate('/characters')} className="text-[#c084fc] text-sm hover:underline">去选择角色开始聊天</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {chats.map(chat => {
              const char = characters.find(c => c.id === chat.characterId)
              return (
                <div key={chat.id} className="flex items-center gap-2">
                  <button onClick={() => navigate('/chat/' + chat.id)}
                    className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3 text-left hover:bg-[#242424] transition-colors min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#242424] flex-shrink-0">
                      {char?.avatarData
                        ? <img src={char.avatarData} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center text-xl">🎭</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm text-[#e5e7eb] truncate">{char?.card.data.name ?? '已删除角色'}</p>
                        <span className="text-xs text-[#6b7280] flex-shrink-0">{formatTime(chat.updatedAt)}</span>
                      </div>
                      <p className="text-xs text-[#6b7280] truncate mt-0.5">{chat.title}</p>
                    </div>
                  </button>
                  <button onClick={e => handleDelete(chat, e)}
                    className="w-9 h-9 flex items-center justify-center text-[#6b7280] hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors flex-shrink-0"
                    title="删除对话">🗑</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}