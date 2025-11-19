import { useKeybindCapture } from '../../hooks/app-logic/use-keybind-capture'
import { useAutoLaunch } from '../../hooks/utilities'
import { AuthUser } from '../../lib/auth'
import { InteractiveArea } from '../interactive-area'
import { AutoLaunchSettings } from './auto-launch-settings'
import { KeyboardShortcutsSettings } from './keyboard-shortcuts-settings'
import { TransparencySettings } from './transparency-settings'
import { UserProfile } from './user-profile'

interface SettingsMenuProps {
  user: AuthUser | null
  isOpen: boolean
  onLogout: () => void
  onClose: () => void
  currentKeybind?: string
  onKeybindChange?: (keybind: string) => void
  currentChatKeybind?: string
  onChatKeybindChange?: (keybind: string) => void
  currentHistoryKeybind?: string
  onHistoryKeybindChange?: (keybind: string) => void
  currentSettingsKeybind?: string
  onSettingsKeybindChange?: (keybind: string) => void
  currentNewChatKeybind?: string
  onNewChatKeybindChange?: (keybind: string) => void
  currentVoiceChatKeybind?: string
  onVoiceChatKeybindChange?: (keybind: string) => void
  currentTransparency?: number
  onTransparencyChange?: (transparency: number) => void
  isSubscribed: boolean
  subscriptionLoading: boolean
  onUpgrade: () => void
  onCancel: () => void
}

export function SettingsMenu({
  user,
  isOpen,
  onLogout,
  onClose,
  currentKeybind = 'Shift+\\',
  onKeybindChange,
  currentChatKeybind = '',
  onChatKeybindChange,
  currentHistoryKeybind = '',
  onHistoryKeybindChange,
  currentSettingsKeybind = '',
  onSettingsKeybindChange,
  currentNewChatKeybind = '',
  onNewChatKeybindChange,
  currentVoiceChatKeybind = '',
  onVoiceChatKeybindChange,
  currentTransparency = 70,
  onTransparencyChange,
  isSubscribed,
  subscriptionLoading,
  onUpgrade,
  onCancel,
}: SettingsMenuProps) {
  const { isEnabled: autoLaunchEnabled, toggleAutoLaunch } = useAutoLaunch()

  // Setup keybind capture hooks
  const toggleVisibility = useKeybindCapture({
    onKeybindChange,
    defaultKeybind: 'Shift+\\',
  })

  const chatKeybind = useKeybindCapture({
    onKeybindChange: onChatKeybindChange,
    defaultKeybind: '',
  })

  const historyKeybind = useKeybindCapture({
    onKeybindChange: onHistoryKeybindChange,
    defaultKeybind: '',
  })

  const settingsKeybind = useKeybindCapture({
    onKeybindChange: onSettingsKeybindChange,
    defaultKeybind: '',
  })

  const newChatKeybind = useKeybindCapture({
    onKeybindChange: onNewChatKeybindChange,
    defaultKeybind: '',
  })

  const voiceChatKeybind = useKeybindCapture({
    onKeybindChange: onVoiceChatKeybindChange,
    defaultKeybind: '',
  })

  const handleLogout = () => {
    onLogout()
    onClose()
  }

  // Configure keybinds for the keyboard shortcuts section
  const keybinds = [
    {
      label: 'Show / Hide toggle visibility',
      currentKeybind,
      isCapturing: toggleVisibility.isCapturing,
      onStartCapturing: toggleVisibility.startCapturing,
      onCancelCapturing: toggleVisibility.cancelCapturing,
      onReset: toggleVisibility.resetToDefault,
    },
    {
      label: 'Open / Close chat',
      currentKeybind: currentChatKeybind,
      isCapturing: chatKeybind.isCapturing,
      onStartCapturing: chatKeybind.startCapturing,
      onCancelCapturing: chatKeybind.cancelCapturing,
      onReset: chatKeybind.resetToDefault,
    },
    {
      label: 'Open / Close conversation history',
      currentKeybind: currentHistoryKeybind,
      isCapturing: historyKeybind.isCapturing,
      onStartCapturing: historyKeybind.startCapturing,
      onCancelCapturing: historyKeybind.cancelCapturing,
      onReset: historyKeybind.resetToDefault,
    },
    {
      label: 'Open / Close settings',
      currentKeybind: currentSettingsKeybind,
      isCapturing: settingsKeybind.isCapturing,
      onStartCapturing: settingsKeybind.startCapturing,
      onCancelCapturing: settingsKeybind.cancelCapturing,
      onReset: settingsKeybind.resetToDefault,
    },
    {
      label: 'Start new chat',
      currentKeybind: currentNewChatKeybind,
      isCapturing: newChatKeybind.isCapturing,
      onStartCapturing: newChatKeybind.startCapturing,
      onCancelCapturing: newChatKeybind.cancelCapturing,
      onReset: newChatKeybind.resetToDefault,
    },
    {
      label: 'Start / Stop voice chat',
      currentKeybind: currentVoiceChatKeybind,
      isCapturing: voiceChatKeybind.isCapturing,
      onStartCapturing: voiceChatKeybind.startCapturing,
      onCancelCapturing: voiceChatKeybind.cancelCapturing,
      onReset: voiceChatKeybind.resetToDefault,
    },
  ]

  if (!isOpen) return null

  return (
    <InteractiveArea className="w-full">
      <div className="w-full bg-overlay-bg-primary border border-overlay-border-primary rounded-3xl p-4 mt-2">
        <KeyboardShortcutsSettings keybinds={keybinds} />

        <TransparencySettings
          currentTransparency={currentTransparency}
          onTransparencyChange={onTransparencyChange}
        />

        <AutoLaunchSettings
          autoLaunchEnabled={autoLaunchEnabled}
          onToggleAutoLaunch={toggleAutoLaunch}
        />

        {/* Divider */}
        <div className="border-b border-overlay-border-primary mb-3"></div>

        <UserProfile
          user={user}
          isSubscribed={isSubscribed}
          subscriptionLoading={subscriptionLoading}
          onUpgrade={onUpgrade}
          onCancel={onCancel}
          onLogout={handleLogout}
        />
      </div>
    </InteractiveArea>
  )
}
