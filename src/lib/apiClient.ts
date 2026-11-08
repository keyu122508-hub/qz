import type { ApiConfig, ApiMessage } from '@/types'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Stream chat completion, yields text delta chunks */
export async function* streamChat(
  config: ApiConfig,
  messages: ApiMessage[]
): AsyncGenerator<string, void, unknown> {
  if (config.provider === 'claude') {
    yield* streamClaude(config, messages)
  } else {
    yield* streamOpenAI(config, messages)
  }
}

async function* streamOpenAI(
  config: ApiConfig,
  messages: ApiMessage[]
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      ...(config.provider === 'openrouter'
        ? { 'HTTP-Referer': 'https://tavernlite.app', 'X-Title': 'TavernLite' }
        : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new ApiError(response.status, `API error ${response.status}: ${text.slice(0, 200)}`)
  }
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch { /* ignore */ }
    }
  }
}

async function* streamClaude(
  config: ApiConfig,
  messages: ApiMessage[]
): AsyncGenerator<string, void, unknown> {
  const systemParts = messages.filter(m => m.role === 'system').map(m => m.content)
  const chatMessages = consolidateMessages(messages.filter(m => m.role !== 'system'))
  const base = config.baseUrl.replace(/\/$/, '')
  const response = await fetch(`${base}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      ...(systemParts.length ? { system: systemParts.join('\n\n') } : {}),
      messages: chatMessages,
      stream: true,
    }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new ApiError(response.status, `Claude error ${response.status}: ${text.slice(0, 200)}`)
  }
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const parsed = JSON.parse(line.slice(6))
        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          yield parsed.delta.text
        }
      } catch { /* ignore */ }
    }
  }
}

function consolidateMessages(msgs: ApiMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  const result: { role: 'user' | 'assistant'; content: string }[] = []
  for (const msg of msgs) {
    const role = msg.role === 'assistant' ? 'assistant' : 'user'
    if (result.length > 0 && result[result.length - 1].role === role) {
      result[result.length - 1].content += '\n\n' + msg.content
    } else {
      result.push({ role, content: msg.content })
    }
  }
  if (result.length > 0 && result[0].role === 'assistant') {
    result.unshift({ role: 'user', content: '.' })
  }
  return result
}

export async function testConnection(config: ApiConfig): Promise<string> {
  if (config.provider === 'claude') {
    const base = config.baseUrl.replace(/\/$/, '')
    const res = await fetch(`${base}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: config.model, max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] }),
    })
    if (!res.ok) throw new ApiError(res.status, (await res.text()).slice(0, 200))
    const data = await res.json()
    return data.model ?? config.model
  } else {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 50 }),
    })
    if (!res.ok) throw new ApiError(res.status, (await res.text()).slice(0, 200))
    const data = await res.json()
    return data.model ?? config.model
  }
}
