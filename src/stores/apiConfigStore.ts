import { create } from 'zustand'
import type { ApiConfig, ApiProvider } from '@/types'
import { PROVIDER_DEFAULTS } from '@/types'
import { nanoid } from '@/lib/nanoid'

const STORAGE_KEY = 'tavernlite-api-configs'

function readConfigs(): ApiConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ApiConfig[]
  } catch {
    return []
  }
}

function writeConfigs(configs: ApiConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
  } catch { /* storage full or unavailable */ }
}

interface ApiConfigStore {
  configs: ApiConfig[]
  loaded: boolean
  load: () => Promise<void>
  add: (partial: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ApiConfig>
  update: (id: string, partial: Partial<ApiConfig>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useApiConfigStore = create<ApiConfigStore>((set) => ({
  configs: readConfigs(),
  loaded: true,

  load: async () => {
    const configs = readConfigs()
    set({ configs, loaded: true })
  },

  add: async (partial) => {
    const now = Date.now()
    const config: ApiConfig = { id: nanoid(), ...partial, createdAt: now, updatedAt: now }
    const existing = readConfigs()
    const next = [config, ...existing]
    writeConfigs(next)
    set({ configs: next })
    return config
  },

  update: async (id, partial) => {
    const next = readConfigs().map(c =>
      c.id === id ? { ...c, ...partial, updatedAt: Date.now() } : c
    )
    writeConfigs(next)
    set({ configs: next })
  },

  remove: async (id) => {
    const next = readConfigs().filter(c => c.id !== id)
    writeConfigs(next)
    set({ configs: next })
  },
}))

export function makeDefaultConfig(provider: ApiProvider): Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'> {
  const defaults = PROVIDER_DEFAULTS[provider]
  const providerLabels: Record<ApiProvider, string> = {
    openai: 'OpenAI', claude: 'Claude', openrouter: 'OpenRouter', deepseek: 'DeepSeek', custom: '自定义'
  }
  return {
    name: `我的 ${providerLabels[provider]}`,
    provider,
    baseUrl: defaults.baseUrl,
    apiKey: '',
    model: defaults.model,
    temperature: 1.0,
    maxTokens: 2048,
    contextLimit: 8192,
    streaming: true,
  }
}

