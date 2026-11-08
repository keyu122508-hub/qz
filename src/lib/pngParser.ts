import type { CharacterCardV2, CharacterCardData } from '@/types'

const PNG_SIG = new Uint8Array([137,80,78,71,13,10,26,10])

function cleanBase64(s: string): string {
  return s.replace(/[^A-Za-z0-9+/=]/g, '')
}

function base64ToUtf8(b64: string): string {
  const bin = atob(cleanBase64(b64))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder('utf-8').decode(bytes)
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw')
  const writer = ds.writable.getWriter()
  writer.write(data as Uint8Array<ArrayBuffer>); writer.close()
  const chunks: Uint8Array[] = []
  const reader = ds.readable.getReader()
  for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value) }
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total); let off = 0
  for (const c of chunks) { out.set(c, off); off += c.length }
  return out
}

function decodeCharaValue(value: string): CharacterCardV2 | null {
  const v = value.trim()
  try { return normalizeCard(JSON.parse(base64ToUtf8(v))) } catch { /**/ }
  try { return normalizeCard(JSON.parse(v)) } catch { return null }
}

export async function parsePngCharaCard(file: File): Promise<CharacterCardV2 | null> {
  const buffer = await file.arrayBuffer()
  return extractCharaFromBuffer(buffer)
}

export async function extractCharaFromBuffer(buffer: ArrayBuffer): Promise<CharacterCardV2 | null> {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  const utf8 = new TextDecoder('utf-8')
  const latin1 = new TextDecoder('latin1')
  for (let i = 0; i < 8; i++) { if (bytes[i] !== PNG_SIG[i]) return null }

  let offset = 8
  while (offset + 12 <= buffer.byteLength) {
    const length = view.getUint32(offset)
    const type = utf8.decode(bytes.slice(offset + 4, offset + 8))
    const data = bytes.slice(offset + 8, offset + 8 + length)

    if (type === 'tEXt') {
      const nullIdx = data.indexOf(0)
      if (nullIdx !== -1) {
        const kw = latin1.decode(data.slice(0, nullIdx)).trim().toLowerCase()
        if (kw === 'chara') {
          return decodeCharaValue(latin1.decode(data.slice(nullIdx + 1)))
        }
      }
    } else if (type === 'zTXt') {
      const nullIdx = data.indexOf(0)
      if (nullIdx !== -1) {
        const kw = latin1.decode(data.slice(0, nullIdx)).trim().toLowerCase()
        if (kw === 'chara') {
          try {
            const inflated = await inflate(data.slice(nullIdx + 2))
            return decodeCharaValue(utf8.decode(inflated))
          } catch { return null }
        }
      }
    } else if (type === 'iTXt') {
      let pos = 0
      while (pos < data.length && data[pos] !== 0) pos++
      const kw = utf8.decode(data.slice(0, pos)).trim().toLowerCase()
      if (kw === 'chara') {
        const compressionFlag = data[pos + 1]
        pos += 3
        while (pos < data.length && data[pos] !== 0) pos++; pos++
        while (pos < data.length && data[pos] !== 0) pos++; pos++
        const textData = data.slice(pos)
        if (compressionFlag === 1) {
          try { return decodeCharaValue(utf8.decode(await inflate(textData))) } catch { return null }
        }
        return decodeCharaValue(utf8.decode(textData))
      }
    } else if (type === 'IEND') { break }
    offset += 12 + length
  }
  return null
}

function normalizeCard(raw: Record<string, unknown>): CharacterCardV2 {
  if (raw.spec === 'chara_card_v2' || raw.spec === 'chara_card_v3') {
    return raw as unknown as CharacterCardV2
  }
  const data: CharacterCardData = {
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    personality: String(raw.personality ?? ''),
    scenario: String(raw.scenario ?? ''),
    first_mes: String(raw.first_mes ?? ''),
    mes_example: String(raw.mes_example ?? ''),
    alternate_greetings: Array.isArray(raw.alternate_greetings) ? raw.alternate_greetings : [],
    system_prompt: String(raw.system_prompt ?? ''),
    post_history_instructions: String(raw.post_history_instructions ?? ''),
    creator: String(raw.creator ?? ''),
    creator_notes: String(raw.creator_notes ?? ''),
    character_version: String(raw.character_version ?? ''),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    extensions: (raw.extensions as Record<string, unknown>) ?? {},
    character_book: raw.character_book as CharacterCardData['character_book'],
  }
  return { spec: 'chara_card_v2', spec_version: '2.0', data }
}

export function extractAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
