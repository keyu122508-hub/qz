import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCharacterStore } from '@/stores/characterStore'
import type { Character } from '@/types'

export function CharacterListPage() {
  const navigate = useNavigate()
  const { characters, loaded, load, remove, pin, unpin } = useCharacterStore()
  const [search, setSearch] = useState('')
  const [menuId, setMenuId] = useState<string | null>(null)

  useEffect(() => { if (!loaded) load() }, [loaded, load])

  const filtered = characters.filter(c =>
    c.card.data.name.toLowerCase().includes(search.toLowerCase()) ||
    c.card.data.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (c: Character) => {
    if (confirm(`删除角色「${c.card.data.name}」及其所有对话记录？`)) {
      await remove(c.id)
    }
    setMenuId(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f] px-4 pt-safe">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-xl font-semibold">角色</h1>
          <button
            onClick={() => navigate('/characters/import')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c084fc] hover:bg-[#a855f7] text-white text-sm rounded-lg transition-colors"
          >
            <span className="text-base leading-none">+</span> 导入
          </button>
        </div>
        <div className="pb-3">
          <input
            type="text"
            placeholder="搜索角色..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm placeholder-[#6b7280] focus:outline-none focus:border-[#c084fc] transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {!loaded ? (
          <div className="flex items-center justify-center h-32 text-[#6b7280]">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-[#6b7280]">
            <span className="text-4xl">🎭</span>
            <p className="text-sm">
              {search ? '没有找到匹配的角色' : '还没有角色，点击右上角导入'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(c => (
              <div
                key={c.id}
                className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3 active:bg-[#242424] transition-colors"
                onClick={() => navigate(`/characters/${c.id}`)}
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#242424]">
                  {c.avatarData ? (
                    <img src={c.avatarData} alt={c.card.data.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎭</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {c.pinnedAt && <span className="text-[#c084fc] text-xs">📌</span>}
                    <span className="font-medium text-[#e5e7eb] truncate">{c.card.data.name}</span>
                  </div>
                  <p className="text-xs text-[#9ca3af] line-clamp-2 mt-0.5">
                    {c.card.data.description || c.card.data.personality || '暂无描述'}
                  </p>
                </div>

                {/* Menu button */}
                <button
                  className="p-2 text-[#6b7280] hover:text-[#e5e7eb] flex-shrink-0"
                  onClick={e => { e.stopPropagation(); setMenuId(menuId === c.id ? null : c.id) }}
                >
                  ⋮
                </button>

                {/* Dropdown menu */}
                {menuId === c.id && (
                  <div className="absolute right-2 top-12 z-20 bg-[#242424] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden">
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#e5e7eb] hover:bg-[#2a2a2a]"
                      onClick={e => { e.stopPropagation(); c.pinnedAt ? unpin(c.id) : pin(c.id); setMenuId(null) }}
                    >
                      {c.pinnedAt ? '取消置顶' : '置顶'}
                    </button>
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-[#2a2a2a]"
                      onClick={e => { e.stopPropagation(); handleDelete(c) }}
                    >
                      删除角色
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overlay to close menu */}
      {menuId && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
      )}
    </div>
  )
}
