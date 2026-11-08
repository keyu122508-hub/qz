import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/stores/settingsStore'

export function AgeConfirmPage() {
  const navigate = useNavigate()
  const update = useSettingsStore(s => s.update)

  const confirm = () => {
    update({ ageConfirmed: true })
    navigate('/characters')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a]">
      <div className="max-w-md w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🍷</div>
        <h1 className="text-2xl font-semibold mb-3 text-[#e5e7eb]">欢迎来到浅酌</h1>
        <p className="text-[#9ca3af] mb-6 leading-relaxed">
          本应用允许生成 NSFW 内容，包括成人主题角色扮演对话。<br />
          您必须年满 18 岁才能继续使用。
        </p>
        <p className="text-sm text-[#6b7280] mb-8">
          所有对话内容存储在您的设备本地，您对生成的内容承担全部责任。
        </p>
        <button
          onClick={confirm}
          className="w-full py-3 bg-[#c084fc] hover:bg-[#a855f7] active:bg-[#9333ea] text-white rounded-xl font-medium transition-colors"
        >
          我已满 18 岁，继续
        </button>
      </div>
    </div>
  )
}
