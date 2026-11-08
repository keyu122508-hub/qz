import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApiConfigStore, makeDefaultConfig } from '@/stores/apiConfigStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { testConnection } from '@/lib/apiClient'
import type { ApiProvider, ApiConfig } from '@/types'
import { PROVIDER_DEFAULTS, MODEL_SUGGESTIONS, API_KEY_LINKS } from '@/types'

const PROVIDERS: { id: ApiProvider; label: string; emoji: string }[] = [
  { id: 'openai', label: 'OpenAI', emoji: '🤖' },
  { id: 'claude', label: 'Claude', emoji: '🌟' },
  { id: 'deepseek', label: 'DeepSeek', emoji: '🐋' },
  { id: 'openrouter', label: 'OpenRouter', emoji: '🔀' },
  { id: 'custom', label: '自定义', emoji: '⚙️' },
]

export type FormState = Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'>

function AdvancedPanel({ form, patch }: { form: FormState; patch: (p: Partial<FormState>) => void }) {
  return (
    <div className="space-y-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
      <div>
        <label className="text-xs text-[#9ca3af] block mb-1">配置名称</label>
        <input value={form.name} onChange={e => patch({ name: e.target.value })}
          className="w-full bg-[#242424] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c084fc]" />
      </div>
      {form.provider !== 'custom' && (
        <div>
          <label className="text-xs text-[#9ca3af] block mb-1">Base URL（代理地址，默认官方）</label>
          <input value={form.baseUrl} onChange={e => patch({ baseUrl: e.target.value })}
            className="w-full bg-[#242424] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c084fc]" />
        </div>
      )}
      <div>
        <label className="text-xs text-[#9ca3af] block mb-1">温度 ({form.temperature})</label>
        <input type="range" min="0" max="2" step="0.05" value={form.temperature}
          onChange={e => patch({ temperature: parseFloat(e.target.value) })} className="w-full accent-[#c084fc]" />
      </div>
      <div>
        <label className="text-xs text-[#9ca3af] block mb-1">最大输出 Token</label>
        <input type="number" value={form.maxTokens}
          onChange={e => patch({ maxTokens: parseInt(e.target.value) || 2048 })}
          className="w-full bg-[#242424] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs text-[#9ca3af] block mb-1">上下文限制 Token</label>
        <input type="number" value={form.contextLimit}
          onChange={e => patch({ contextLimit: parseInt(e.target.value) || 8192 })}
          className="w-full bg-[#242424] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm" />
      </div>
    </div>
  )
}


export function ApiConfigEditPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { configs, add, update } = useApiConfigStore()
  const { update: upSettings } = useSettingsStore()
  const [form, setForm] = useState<FormState>(() => makeDefaultConfig('openai'))
  const [showKey, setShowKey] = useState(false)
  const [showAdv, setShowAdv] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState<{ ok: boolean; msg: string } | null>(null)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!isNew) {
      const cfg = configs.find(c => c.id === id)
      if (cfg) setForm({ name: cfg.name, provider: cfg.provider, baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, model: cfg.model, temperature: cfg.temperature, maxTokens: cfg.maxTokens, contextLimit: cfg.contextLimit, streaming: cfg.streaming })
    }
  }, [id, configs, isNew])

  const patch = (p: Partial<FormState>) => setForm(f => ({ ...f, ...p }))
  const selectP = (p: ApiProvider) => { const d = PROVIDER_DEFAULTS[p]; patch({ provider: p, baseUrl: d.baseUrl, model: d.model }) }

  const handleTest = async () => {
    setTesting(true); setTestMsg(null)
    try { const m = await testConnection(form as ApiConfig); setTestMsg({ ok: true, msg: `✓ 成功 · ${m}` }) }
    catch (e) { setTestMsg({ ok: false, msg: e instanceof Error ? e.message : '失败' }) }
    finally { setTesting(false) }
  }

  const handleSave = async () => {
    if (!form.apiKey) return
    setSaveError('')
    try {
      if (isNew) {
        const cfg = await add(form)
        upSettings({ defaultApiConfigId: cfg.id })
      } else if (id) {
        await update(id, form)
      }
      navigate('/settings')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存失败，请重试')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-4 pt-safe border-b border-[#2a2a2a]">
        <button onClick={() => navigate(-1)} className="text-[#9ca3af] text-xl px-1">←</button>
        <h1 className="text-lg font-semibold">{isNew ? '添加配置' : '编辑配置'}</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-5 mt-4">
        <div className="grid grid-cols-3 gap-2">
          {PROVIDERS.map(p => (
            <button key={p.id} onClick={() => selectP(p.id)}
              className={`py-2.5 rounded-xl border text-sm font-medium transition-colors flex flex-col items-center gap-0.5 ${form.provider === p.id ? 'border-[#c084fc] bg-[#c084fc]/10 text-[#e5e7eb]' : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#9ca3af] hover:border-[#3a3a3a]'}`}>
              <span className="text-lg leading-none">{p.emoji}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#9ca3af]">API Key</label>
            {API_KEY_LINKS[form.provider] && (
              <a href={API_KEY_LINKS[form.provider]} target="_blank" rel="noreferrer" className="text-xs text-[#c084fc]">去哪里获取 →</a>
            )}
          </div>
          <div className="relative">
            <input type={showKey ? 'text' : 'password'} value={form.apiKey} onChange={e => patch({ apiKey: e.target.value })}
              placeholder="粘贴你的 API Key" autoComplete="off"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#c084fc]" />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]">{showKey ? '🙈' : '👁'}</button>
          </div>
        </div>
        {form.provider === 'custom' && (
          <div>
            <label className="text-xs text-[#9ca3af] block mb-1">Base URL</label>
            <input value={form.baseUrl} onChange={e => patch({ baseUrl: e.target.value })} placeholder="https://your-proxy/v1"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c084fc]" />
          </div>
        )}
        <div>
          <label className="text-xs text-[#9ca3af] block mb-1">模型</label>
          <input value={form.model} onChange={e => patch({ model: e.target.value })}
            placeholder="输入或点击下方快选"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c084fc]" />
          {(MODEL_SUGGESTIONS[form.provider] ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {MODEL_SUGGESTIONS[form.provider].map(s => (
                <button key={s} onClick={() => patch({ model: s })}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.model === s ? 'border-[#c084fc] bg-[#c084fc]/10 text-[#e5e7eb]' : 'border-[#2a2a2a] text-[#6b7280] hover:border-[#c084fc]/50 hover:text-[#9ca3af]'}`}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleTest} disabled={!form.apiKey || testing}
          className="w-full py-2.5 bg-[#242424] hover:bg-[#2a2a2a] disabled:opacity-50 rounded-xl text-sm transition-colors">
          {testing ? '测试中...' : '测试连接'}
        </button>
        {testMsg && <p className={`text-sm text-center ${testMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{testMsg.msg}</p>}
        {saveError && <p className="text-sm text-center text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{saveError}</p>}
        <button onClick={() => setShowAdv(!showAdv)} className="w-full flex items-center justify-between py-1 text-sm text-[#6b7280]">
          <span>高级设置</span><span>{showAdv ? '▲' : '▼'}</span>
        </button>
        {showAdv && <AdvancedPanel form={form} patch={patch} />}
        <button onClick={handleSave} disabled={!form.apiKey || !form.model}
          className="w-full py-3.5 bg-[#c084fc] hover:bg-[#a855f7] disabled:opacity-40 text-white rounded-xl font-semibold transition-colors">
          保存
        </button>
      </div>
    </div>
  )
}
