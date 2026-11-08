import type { CharacterCardData } from '@/types'

/** Replace {{char}}, {{user}}, etc. placeholders in text */
export function replaceMacros(
  text: string,
  charData: CharacterCardData,
  userName: string
): string {
  return text
    .replace(/\{\{char\}\}/gi, charData.name)
    .replace(/\{\{user\}\}/gi, userName)
    .replace(/\{\{charDescription\}\}/gi, charData.description)
    .replace(/\{\{charPersonality\}\}/gi, charData.personality)
    .replace(/\{\{scenario\}\}/gi, charData.scenario)
}
