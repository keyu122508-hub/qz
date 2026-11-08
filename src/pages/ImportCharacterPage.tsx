import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { parsePngCharaCard, extractAvatarDataUrl } from '@/lib/pngParser'
import { useCharacterStore } from '@/stores/characterStore'
import type { CharacterCardV2 } from '@/types'

type Tab = 'file' | 'json' | 'url'

export function ImportCharacterPage() {
  const navigate = useNavigate()
  const { add } = useCharacterStore()
  const [tab, setTab] = useState<Tab>('file')
  const [parsed, setParsed] = useState<CharacterCardV2 | null>(null)
  const [avatarData, setAvatarData] = useState<string | undefined>()
  const [jsonText, setJsonText] = useState('')
  const [urlText, setUrlText] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(''); setParsed(null); setAvatarData(undefined)
    if (file.name.endsWith('.png') || file.type === 'image/png') {
      const card = await parsePngCharaCard(file)
      if (!card) { setError('无法解析该 PNG，请确认是酒馆格式角色卡'); return }
      setParsed(card); setAvatarData(await extractAvatarDataUrl(file))
    } else if (file.name.endsWith('.json')) {
      try { setParsed(JSON.parse(await file.text())) } catch { setError('JSON 解析失败') }
    } else { setError('请上传 PNG 或 JSON 角色卡') }
  }

  const handleImport = async () => {
    if (!parsed) return
    await add(parsed, avatarData)
    navigate('/characters')
  }

  const tabCls = (t: Tab) =>
    `flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-[#c084fc] text-white' : 'text-[#9ca3af] hover:text-[#e5e7eb]'}`

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-4 pt-safe border-b border-[#2a2a2a]">
        <button onClick={() => navigate(-1)} className="text-[#9ca3af] hover:text-[#e5e7eb] text-xl px-1">&#8592;</button>
        <h1 className="text-lg font-semibold">导入角色卡</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="flex bg-[#1a1a1a] rounded-xl p-1 mt-4 mb-4 gap-1">
          {(['file','json','url'] as Tab[]).map(t => (
            <button key={t} className={tabCls(t)} onClick={() => { setTab(t); setParsed(null); setError('') }}>
              {t==='file'?'上传文件':t==='json'?'粘贴 JSON':'URL 拉取'}
            </button>
          ))}
        </div>

        {tab === 'file' && (
          <div className="space-y-3">
            <div
              className="border-2 border-dashed border-[#2a2a2a] rounded-xl p-8 text-center cursor-pointer hover:border-[#c084fc] transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            >
              <input ref={fileRef} type="file" accept=".png,.json" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              <div className="text-4xl mb-3">📁</div>
              <p className="text-[#9ca3af] text-sm">拖拽 PNG / JSON 文件至此</p>
              <p className="text-[#6b7280] text-xs mt-1">支持酒馆 chara_card_v1/v2 格式</p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-3 bg-[#1a1a1a] hover:bg-[#242424] border border-[#2a2a2a] hover:border-[#c084fc] rounded-xl text-sm text-[#e5e7eb] transition-colors flex items-center justify-center gap-2"
            >
              <span>📂</span><span>从设备选择文件</span>
            </button>
          </div>
        )}

        {tab === 'json' && (
          <div className="space-y-3">
            <textarea value={jsonText} onChange={e => setJsonText(e.target.value)}
              placeholder="粘贴角色卡 JSON 内容..."
              className="w-full h-40 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm font-mono placeholder-[#6b7280] focus:outline-none focus:border-[#c084fc] resize-none" />
            <button onClick={() => { try { setParsed(JSON.parse(jsonText)); setError('') } catch { setError('JSON 格式错误') }}}
              className="w-full py-2.5 bg-[#242424] hover:bg-[#2a2a2a] rounded-xl text-sm transition-colors">
              解析 JSON
            </button>
          </div>
        )}

        {tab === 'url' && (
          <div className="space-y-3">
            <input type="url" value={urlText} onChange={e => setUrlText(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c084fc]" />
            <button onClick={async () => {
              setError(''); setLoading(true)
              try { const r = await fetch(urlText); if (!r.ok) throw new Error(String(r.status)); await handleFile(new File([await r.blob()], 'c.png')) }
              catch (e) { setError(e instanceof Error ? e.message : '失败') } finally { setLoading(false) }
            }} disabled={loading || !urlText}
              className="w-full py-2.5 bg-[#242424] hover:bg-[#2a2a2a] disabled:opacity-50 rounded-xl text-sm transition-colors">
              {loading ? '拉取中...' : '拉取角色卡'}
            </button>
          </div>
        )}

        {error && <p className="mt-3 text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-2">{error}</p>}

        {parsed && (
          <div className="mt-5 bg-[#1a1a1a] border border-[#c084fc]/30 rounded-xl p-4">
            <p className="text-xs text-[#c084fc] mb-3 font-medium">&#10003; 解析成功</p>
            <div className="flex items-center gap-3 mb-3">
              {avatarData && <img src={avatarData} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" />}
              <div>
                <p className="font-semibold">{parsed.data.name}</p>
                {parsed.data.creator && <p className="text-xs text-[#9ca3af]">by {parsed.data.creator}</p>}
              </div>
            </div>
            <p className="text-sm text-[#9ca3af] line-clamp-3">{parsed.data.description}</p>
            <button onClick={handleImport}
              className="mt-4 w-full py-3 bg-[#c084fc] hover:bg-[#a855f7] text-white rounded-xl font-medium transition-colors">
              确认导入
            </button>
          </div>
        )}
      </div>
    </div>
  )
}