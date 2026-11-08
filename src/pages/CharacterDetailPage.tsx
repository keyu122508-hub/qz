import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCharacterStore } from '@/stores/characterStore'
import { useApiConfigStore } from '@/stores/apiConfigStore'
import { useChatStore } from '@/stores/chatStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { db } from '@/lib/db'
import type { Chat } from '@/types'

export function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { characters, loaded, load } = useCharacterStore()
  const { configs, loaded: cfgLoaded, load: loadCfgs } = useApiConfigStore()
  const { createChat } = useChatStore()
  const { defaultApiConfigId } = useSettingsStore()
  const [greetingIdx, setGreetingIdx] = useState(0)
  const [selectedApiId, setSelectedApiId] = useState('')
  const [lastChat, setLastChat] = useState<Chat | null>(null)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState('')
  const [editingGreeting, setEditingGreeting] = useState(false)
  const [greetingDraft, setGreetingDraft] = useState('')

  useEffect(() => { if (!loaded) load() }, [loaded, load])
  useEffect(() => { if (!cfgLoaded) loadCfgs() }, [cfgLoaded, loadCfgs])
  useEffect(() => { setSelectedApiId(defaultApiConfigId || configs[0]?.id || '') }, [configs, defaultApiConfigId])
  useEffect(() => {
    if (!id) return
    db.chats.where('characterId').equals(id).sortBy('updatedAt').then(chats => {
      if (chats.length > 0) setLastChat(chats[chats.length - 1])
    })
  }, [id])

  const character = characters.find(c => c.id === id)
  if (!loaded) return <div className="flex items-center justify-center h-full text-[#6b7280]">加载中...</div>
  if (!character) return <div className="flex items-center justify-center h-full text-[#6b7280]">角色不存在</div>

  const { data } = character.card
  const greetings = [data.first_mes, ...data.alternate_greetings].filter(Boolean)
  const currentGreeting = greetings[greetingIdx] ?? ''

  const handleNewChat = async () => {
    if (!selectedApiId) { navigate('/settings/api/new'); return }
    const chat = await createChat(character, selectedApiId, greetingIdx)
    navigate(`/chat/${chat.id}`)
  }

  const saveDesc = async () => {
    const updated = { ...character, card: { ...character.card, data: { ...character.card.data, description: descDraft } }, updatedAt: Date.now() }
    await db.characters.put(updated)
    await load()
    setEditingDesc(false)
  }

  const saveGreeting = async () => {
    const newFirstMes = greetingIdx === 0 ? greetingDraft : data.first_mes
    const newAlts = greetingIdx === 0 ? data.alternate_greetings : data.alternate_greetings.map((g, i) => i + 1 === greetingIdx ? greetingDraft : g)
    const updated = { ...character, card: { ...character.card, data: { ...character.card.data, first_mes: newFirstMes, alternate_greetings: newAlts } }, updatedAt: Date.now() }
    await db.characters.put(updated)
    await load()
    setEditingGreeting(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-4 pt-safe border-b border-[#2a2a2a]">
        <button onClick={() => navigate(-1)} className="text-[#9ca3af] hover:text-[#e5e7eb] text-xl px-1" title="返回">&#8592;</button>
        <h1 className="text-lg font-semibold flex-1 truncate">{data.name}</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center py-6 px-4">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#1a1a1a] mb-3">
            {character.avatarData ? <img src={character.avatarData} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-4xl">&#127917;</div>}
          </div>
          <h2 className="text-xl font-semibold">{data.name}</h2>
          {data.creator && <p className="text-sm text-[#9ca3af]">by {data.creator}</p>}
          {data.tags?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {data.tags.slice(0,6).map(t => <span key={t} className="text-xs bg-[#242424] text-[#9ca3af] px-2 py-0.5 rounded-full">#{t}</span>)}
            </div>
          )}
        </div>
        {data.description && (
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-[#c084fc] font-medium">描述</p>
              <button onClick={() => { setDescDraft(data.description); setEditingDesc(true) }} className="text-xs text-[#6b7280] hover:text-[#c084fc]">编辑</button>
            </div>
            {editingDesc ? (
              <div className="space-y-2">
                <textarea value={descDraft} onChange={e => setDescDraft(e.target.value)} rows={5} className="w-full bg-[#1a1a1a] border border-[#c084fc]/50 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none text-[#e5e7eb]" />
                <div className="flex gap-2">
                  <button onClick={saveDesc} className="px-3 py-1 bg-[#c084fc] text-white text-xs rounded-lg">保存</button>
                  <button onClick={() => setEditingDesc(false)} className="px-3 py-1 bg-[#242424] text-[#9ca3af] text-xs rounded-lg">取消</button>
                </div>
              </div>
            ) : <p className="text-sm text-[#9ca3af] leading-relaxed">{data.description}</p>}
          </div>
        )}
        {greetings.length > 0 && (
          <div className="px-4 mb-4">
            <p className="text-xs text-[#c084fc] mb-2 font-medium">新对话开场白</p>
            <div className="flex flex-col gap-1.5">
              {greetings.map((g, i) => (
                <button key={i} onClick={() => setGreetingIdx(i)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${greetingIdx===i?'bg-[#c084fc]/20 border border-[#c084fc]/50 text-[#e5e7eb]':'bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ca3af] hover:border-[#3a3a3a]'}`}>
                  {i===0?'默认开场白':`备选开场白 ${i}`}
                </button>
              ))}
            </div>
            {currentGreeting && (
              <div className="mt-3 bg-[#1a1a1a] rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#6b7280]">预览</span>
                  <button onClick={() => { setGreetingDraft(currentGreeting); setEditingGreeting(true) }} className="text-xs text-[#6b7280] hover:text-[#c084fc]">编辑</button>
                </div>
                {editingGreeting ? (
                  <div className="space-y-2">
                    <textarea value={greetingDraft} onChange={e => setGreetingDraft(e.target.value)} rows={4} className="w-full bg-[#242424] border border-[#c084fc]/50 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none text-[#e5e7eb]" />
                    <div className="flex gap-2">
                      <button onClick={saveGreeting} className="px-3 py-1 bg-[#c084fc] text-white text-xs rounded-lg">保存</button>
                      <button onClick={() => setEditingGreeting(false)} className="px-3 py-1 bg-[#242424] text-[#9ca3af] text-xs rounded-lg">取消</button>
                    </div>
                  </div>
                ) : <p className="text-sm text-[#9ca3af] line-clamp-3">{currentGreeting}</p>}
              </div>
            )}
          </div>
        )}
        <div className="px-4 mb-4">
          <p className="text-xs text-[#c084fc] mb-2 font-medium">使用 API</p>
          {configs.length===0 ? (
            <button onClick={() => navigate('/settings/api/new')} className="w-full py-2.5 border border-dashed border-[#2a2a2a] rounded-xl text-sm text-[#9ca3af] hover:border-[#c084fc] transition-colors">+ 还没有 API 配置，点此添加</button>
          ) : (
            <select value={selectedApiId} onChange={e => setSelectedApiId(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#c084fc]">
              {configs.map(c => <option key={c.id} value={c.id}>{c.name} ({c.model})</option>)}
            </select>
          )}
        </div>
        <div className="px-4 pb-8 space-y-2.5">
          {lastChat && (
            <button onClick={() => navigate(`/chat/${lastChat.id}`)} className="w-full py-3.5 bg-[#c084fc] hover:bg-[#a855f7] text-white rounded-xl font-semibold transition-colors">继续上次对话</button>
          )}
          <button onClick={handleNewChat} disabled={!selectedApiId}
            className={`w-full py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-40 ${lastChat?'bg-[#242424] hover:bg-[#2a2a2a] text-[#e5e7eb] border border-[#2a2a2a]':'bg-[#c084fc] hover:bg-[#a855f7] text-white'}`}>
            {lastChat?'新建对话':'开始对话'}
          </button>
        </div>
      </div>
    </div>
  )
}