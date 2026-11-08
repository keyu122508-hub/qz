import type { ApiMessage, Character, Message } from '@/types'
import { replaceMacros } from './macros'

interface BuildPromptOptions {
  character: Character
  history: Message[]          // excludes the new user message
  userMessage: string
  userName: string
  contextLimit: number        // token budget (rough estimate: 1 token ≈ 4 chars)
}

/** Rough token count estimate */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/** Parse mes_example into few-shot messages */
function parseMesExample(
  mesExample: string,
  charName: string,
  userName: string
): ApiMessage[] {
  if (!mesExample.trim()) return []
  const msgs: ApiMessage[] = []
  const lines = mesExample.split('\n')
  let current: { role: ApiMessage['role']; lines: string[] } | null = null

  for (const line of lines) {
    if (line.trim() === '<START>') {
      if (current) msgs.push({ role: current.role, content: current.lines.join('\n').trim() })
      current = null
      continue
    }
    const userMatch = line.match(/^{{user}}:\s*(.*)/i)
    const charMatch = line.match(/^{{char}}:\s*(.*)/i)
    if (userMatch) {
      if (current) msgs.push({ role: current.role, content: current.lines.join('\n').trim() })
      current = { role: 'user', lines: [userMatch[1]] }
    } else if (charMatch) {
      if (current) msgs.push({ role: current.role, content: current.lines.join('\n').trim() })
      current = { role: 'assistant', lines: [charMatch[1]] }
    } else if (current) {
      current.lines.push(line)
    }
  }
  if (current) msgs.push({ role: current.role, content: current.lines.join('\n').trim() })

  // Replace macros in examples
  return msgs.map(m => ({
    ...m,
    content: m.content.replace(/\{\{char\}\}/gi, charName).replace(/\{\{user\}\}/gi, userName),
  }))
}

/** Build the messages array to send to the API */
export function buildPrompt(opts: BuildPromptOptions): ApiMessage[] {
  const { character, history, userMessage, userName, contextLimit } = opts
  const { data } = character.card
  const charName = data.name

  const apply = (text: string) => replaceMacros(text, data, userName)

  // 1. System prompt
  const baseSystem = data.system_prompt?.trim()
    ? apply(data.system_prompt)
    : `You are ${charName}. Stay in character at all times.`

  // 2. Character description block
  const descParts: string[] = []
  if (data.description) descParts.push(apply(data.description))
  if (data.personality) descParts.push(`[${charName}'s personality: ${apply(data.personality)}]`)
  if (data.scenario) descParts.push(`[Scenario: ${apply(data.scenario)}]`)

  // 3. World book constant entries
  const wb = data.character_book
  const constantEntries = (wb?.entries ?? [])
    .filter(e => e.enabled && e.constant)
    .sort((a, b) => a.insertion_order - b.insertion_order)
    .map(e => apply(e.content))

  const systemContent = [baseSystem, ...descParts, ...constantEntries]
    .filter(Boolean)
    .join('\n\n')

  const messages: ApiMessage[] = [{ role: 'system', content: systemContent }]

  // 4. Few-shot examples
  const examples = parseMesExample(data.mes_example ?? '', charName, userName)
  messages.push(...examples)

  // 5. History messages (trim oldest to fit context)
  const userMsg: ApiMessage = { role: 'user', content: apply(userMessage) }
  const postInstructions = data.post_history_instructions?.trim()
    ? apply(data.post_history_instructions)
    : ''

  const charBudget = contextLimit * 4 // rough char budget
  let usedChars = estimateTokens(systemContent) * 4
  if (postInstructions) usedChars += estimateTokens(postInstructions) * 4
  usedChars += estimateTokens(userMessage) * 4
  for (const ex of examples) usedChars += estimateTokens(ex.content) * 4

  const historyMessages: ApiMessage[] = []
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i]
    const content = msg.swipes[msg.currentSwipe] ?? msg.content
    const chars = content.length + 10
    if (usedChars + chars > charBudget) break
    historyMessages.unshift({ role: msg.role as ApiMessage['role'], content: apply(content) })
    usedChars += chars
  }

  // 6. World book keyword-triggered entries
  const scanDepth = wb?.scan_depth ?? 4
  const recentContent = historyMessages.slice(-scanDepth).map(m => m.content).join(' ')
  const triggeredEntries = (wb?.entries ?? [])
    .filter(e => e.enabled && !e.constant)
    .filter(e => {
      const haystack = recentContent.toLowerCase()
      return e.keys.some(k => k && haystack.includes(k.toLowerCase()))
    })
    .sort((a, b) => a.insertion_order - b.insertion_order)

  if (triggeredEntries.length > 0) {
    const beforeChar = triggeredEntries
      .filter(e => e.position === 'before_char')
      .map(e => apply(e.content))
      .join('\n\n')
    const afterChar = triggeredEntries
      .filter(e => e.position !== 'before_char')
      .map(e => apply(e.content))
      .join('\n\n')
    if (beforeChar) messages.splice(1, 0, { role: 'system', content: beforeChar })
    if (afterChar) messages.push({ role: 'system', content: afterChar })
  }

  messages.push(...historyMessages)

  // 7. Post-history instructions
  if (postInstructions) messages.push({ role: 'system', content: postInstructions })

  // 8. User message
  messages.push(userMsg)

  return messages
}
