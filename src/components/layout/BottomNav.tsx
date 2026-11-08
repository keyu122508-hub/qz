import { NavLink, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/characters', icon: '🎭', label: '角色' },
  { to: '/recent', icon: '💬', label: '最近' },
  { to: '/settings', icon: '⚙️', label: '我的' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-[#2a2a2a] pb-safe">
      <div className="flex items-stretch h-14 max-w-lg mx-auto">
        {tabs.map(tab => {
          const active = location.pathname.startsWith(tab.to)
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                active ? 'text-[#c084fc]' : 'text-[#6b7280]'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

