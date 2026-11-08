import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/stores/settingsStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useApiConfigStore } from '@/stores/apiConfigStore'
import { BottomNav } from '@/components/layout/BottomNav'
import { AgeConfirmPage } from '@/pages/AgeConfirmPage'
import { CharacterListPage } from '@/pages/CharacterListPage'
import { CharacterDetailPage } from '@/pages/CharacterDetailPage'
import { ImportCharacterPage } from '@/pages/ImportCharacterPage'
import { ChatPage } from '@/pages/ChatPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ApiConfigEditPage } from '@/pages/ApiConfigEditPage'
import { RecentChatsPage } from '@/pages/RecentChatsPage'

function AppRoutes() {
  const { ageConfirmed } = useSettingsStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { load: loadChars, loaded: charsLoaded } = useCharacterStore()
  const { load: loadCfgs, loaded: cfgsLoaded } = useApiConfigStore()

  useEffect(() => {
    if (!charsLoaded) loadChars()
    if (!cfgsLoaded) loadCfgs()
  }, [])

  if (!ageConfirmed && location.pathname !== '/age-confirm') {
    return <Navigate to="/age-confirm" replace />
  }

  const noNav = location.pathname.startsWith('/age-confirm') || location.pathname.startsWith('/chat/')

  return (
    <div className="flex flex-col h-full">
      <div className={`flex-1 overflow-hidden ${noNav ? '' : 'pb-14'}`}>
        <Routes>
          <Route path="/age-confirm" element={<AgeConfirmPage />} />
          <Route path="/characters" element={<CharacterListPage />} />
          <Route path="/characters/import" element={<ImportCharacterPage />} />
          <Route path="/characters/:id" element={<CharacterDetailPage />} />
          <Route path="/chat" element={<ChatRedirect />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/api/:id" element={<ApiConfigEditPage />} />
          <Route path="/recent" element={<RecentChatsPage />} />
          <Route path="*" element={<Navigate to="/characters" replace />} />
        </Routes>
      </div>
      {!noNav && <BottomNav />}
    </div>
  )
}

function ChatRedirect() {
  return <Navigate to="/characters" replace />
}

export default AppRoutes
