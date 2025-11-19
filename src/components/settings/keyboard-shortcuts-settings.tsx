import { KeybindSetting } from './keybind-setting'

interface KeybindConfig {
  label: string
  currentKeybind: string
  isCapturing: boolean
  onStartCapturing: () => void
  onCancelCapturing: () => void
  onReset: () => void
}

interface KeyboardShortcutsSettingsProps {
  keybinds: KeybindConfig[]
}

export function KeyboardShortcutsSettings({
  keybinds,
}: KeyboardShortcutsSettingsProps) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-medium text-overlay-text-primary mb-2">
        Keyboard shortcuts
      </h3>
      <div className="space-y-3">
        {keybinds.map((keybind, index) => (
          <KeybindSetting key={index} {...keybind} />
        ))}
      </div>
    </div>
  )
}

