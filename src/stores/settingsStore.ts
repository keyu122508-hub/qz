import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GlobalSettings } from '@/types'

type SettingsStore = GlobalSettings & {
  update: (partial: Partial<GlobalSettings>) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      userName: 'User',
      theme: 'dark',
      fontSize: 'md',
      defaultApiConfigId: '',
      ageConfirmed: false,
      renderHtml: true,
      streamingAnimation: true,
      update: (partial) => set(partial),
    }),
    { name: 'tavernlite-settings' }
  )
)
