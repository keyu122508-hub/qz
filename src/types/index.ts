// ── Character Card (SillyTavern v2 compatible) ───────────────────────────────

export interface WorldBookEntry {
  id: number
  name: string
  comment: string
  keys: string[]
  secondary_keys: string[]
  content: string
  enabled: boolean
  constant: boolean
  selective: boolean
  case_sensitive: boolean
  insertion_order: number
  position: 'before_char' | 'after_char'
  extensions: Record<string, unknown>
}

export interface WorldBook {
  name: string
  description: string
  scan_depth: number
  token_budget: number
  recursive_scanning: boolean
  extensions: Record<string, unknown>
  entries: WorldBookEntry[]
}

export interface CharacterCardData {
  name: string
  description: string
  personality: string
  scenario: string
  first_mes: string
  mes_example: string
  alternate_greetings: string[]
  system_prompt: string
  post_history_instructions: string
  creator: string
  creator_notes: string
  character_version: string
  tags: string[]
  extensions: Record<string, unknown>
  character_book?: WorldBook
}

export interface CharacterCardV2 {
  spec: 'chara_card_v2' | string
  spec_version: string
  data: CharacterCardData
}

// ── Stored Character (DB) ─────────────────────────────────────────────────────

export interface Character {
  id: string
  card: CharacterCardV2
  avatarUrl?: string       // blob URL or data URL from imported PNG
  avatarData?: string      // base64 avatar for persistence
  createdAt: number
  updatedAt: number
  pinnedAt?: number
}

// ── API Config ────────────────────────────────────────────────────────────────

export type ApiProvider = 'openai' | 'claude' | 'openrouter' | 'deepseek' | 'custom'

export interface ApiConfig {
  id: string
  name: string
  provider: ApiProvider
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  contextLimit: number
  streaming: boolean
  createdAt: number
  updatedAt: number
}

// ── Chat & Messages ───────────────────────────────────────────────────────────

export interface Chat {
  id: string
  characterId: string
  apiConfigId: string
  title: string
  greetingIndex: number
  createdAt: number
  updatedAt: number
}

export type MessageRole = 'user' | 'assistant' | 'system'

export interface MessageMetadata {
  tokens?: number
  model?: string
}

export interface Message {
  id: string
  chatId: string
  role: MessageRole
  content: string
  swipes: string[]
  currentSwipe: number
  createdAt: number
  metadata: MessageMetadata
}

// ── Global Settings ───────────────────────────────────────────────────────────

export interface GlobalSettings {
  userName: string
  theme: 'light' | 'dark' | 'system'
  fontSize: 'sm' | 'md' | 'lg'
  defaultApiConfigId: string
  ageConfirmed: boolean
  renderHtml: boolean
  streamingAnimation: boolean
}

// ── API Client ────────────────────────────────────────────────────────────────

export interface ApiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export const PROVIDER_DEFAULTS: Record<ApiProvider, { baseUrl: string; model: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
  claude: { baseUrl: 'https://api.anthropic.com', model: 'claude-3-5-sonnet-20241022' },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', model: 'openrouter/auto' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  custom: { baseUrl: '', model: '' },
}

export const MODEL_SUGGESTIONS: Record<ApiProvider, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  claude: [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
  ],
  openrouter: [
    'openrouter/auto',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
    'google/gemini-flash-1.5',
    'meta-llama/llama-3.1-70b-instruct',
  ],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  custom: [],
}

export const API_KEY_LINKS: Record<ApiProvider, string> = {
  openai: 'https://platform.openai.com/api-keys',
  claude: 'https://console.anthropic.com/keys',
  openrouter: 'https://openrouter.ai/keys',
  deepseek: 'https://platform.deepseek.com/api_keys',
  custom: '',
}
