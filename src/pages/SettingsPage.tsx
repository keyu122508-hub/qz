import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiConfigStore } from '@/stores/apiConfigStore'
import { useSettingsStore } from '@/stores/settingsStore'

export function SettingsPage() {
  const navigate = useNavigate()
  const { configs, load, remove } = useApiConfigStore()
  const { userName, update, defaultApiConfigId } = useSettingsStore()

  // Always reload from DB on mount — ensures fresh data after save
  useEffect(() => { load() }, [load])

  const setDefault = (id: string) => update({ defaultApiConfigId: id })

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-[#0f0f0f] px-4 pt-safe">
        <div className="py-4">
          <h1 className="text-xl font-semibold">我的</h1>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-6">

        {/* Profile */}
        <section>
          <p className="text-xs text-[#6b7280] mb-2 uppercase tracking-wider">用户信息</p>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <label className="text-xs text-[#9ca3af] block mb-1">你的名字（用于对话中的 {'{{user}}'}）</label>
            <input type="text" value={userName} onChange={e => update({ userName: e.target.value })}
              className="w-full bg-[#242424] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c084fc]" />
          </div>
        </section>

        {/* API Configs */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#6b7280] uppercase tracking-wider">API 配置</p>
            <button onClick={() => navigate('/settings/api/new')} className="text-xs text-[#c084fc] hover:underline">+ 添加</button>
          </div>
          {configs.length === 0 ? (
            <button onClick={() => navigate('/settings/api/new')}
              className="w-full py-4 border border-dashed border-[#2a2a2a] rounded-xl text-sm text-[#9ca3af] hover:border-[#c084fc] transition-colors">
              + 添加 API 配置
            </button>
          ) : (
            <div className="space-y-2">
              {configs.map(c => (
                <div key={c.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3">
                  <button onClick={() => setDefault(c.id)} className="flex-shrink-0">
                    <div className={`w-4 h-4 rounded-full border-2 transition-colors ${defaultApiConfigId === c.id ? 'border-[#c084fc] bg-[#c084fc]' : 'border-[#6b7280]'}`} />
                  </button>
                  <div className="flex-1 min-w-0" onClick={() => navigate(`/settings/api/${c.id}`)}>
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-[#9ca3af] truncate">{c.provider} · {c.model}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/settings/api/${c.id}`)} className="text-[#6b7280] hover:text-[#e5e7eb] text-sm px-2">编辑</button>
                    <button onClick={() => { if (confirm(`删除配置「${c.name}」？`)) remove(c.id) }} className="text-[#6b7280] hover:text-red-400 text-sm px-1">删</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* About */}
        <section>
          <p className="text-xs text-[#6b7280] mb-2 uppercase tracking-wider">关于</p>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 space-y-2 text-sm text-[#9ca3af]">
            <p>浅酌 TavernLite v0.1.0</p>
            <p>角色卡兼容 SillyTavern chara_card_v2</p>
            <p className="text-xs text-[#6b7280]">所有对话数据仅存储在本设备，未经你同意不会上传任何内容。</p>
          </div>
        </section>

      </div>
    </div>
  )
}
