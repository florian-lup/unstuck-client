import { Pencil } from 'lucide-react'
import { Button } from '../ui/button'

interface KeybindSettingProps {
  label: string
  currentKeybind: string
  isCapturing: boolean
  onStartCapturing: () => void
  onCancelCapturing: () => void
  onReset: () => void
}

export function KeybindSetting({
  label,
  currentKeybind,
  isCapturing,
  onStartCapturing,
  onCancelCapturing,
  onReset,
}: KeybindSettingProps) {
  const formatKeybindForDisplay = (keybind: string) => {
    if (!keybind || keybind === '') {
      return (
        <span className="text-xs text-overlay-text-muted italic">Not set</span>
      )
    }
    return keybind.split('+').map((key, index, array) => (
      <div key={key} className="flex items-center">
        <kbd className="px-2 py-1 text-xs border border-overlay-border-primary rounded text-overlay-text-primary">
          {key === '\\' ? '\\' : key}
        </kbd>
        {index < array.length - 1 && (
          <span className="text-xs text-overlay-text-muted mx-1">+</span>
        )}
      </div>
    ))
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-overlay-text-muted">{label}</span>
      <div className="flex items-center gap-2">
        {isCapturing ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-overlay-accent-primary">
              Press keys...
            </span>
            <div className="flex gap-1">
              <Button
                onClick={onReset}
                variant="gaming"
                size="sm"
                className="px-2 py-1 text-xs h-auto border border-overlay-border-primary"
              >
                Reset
              </Button>
              <Button
                onClick={onCancelCapturing}
                variant="gaming"
                size="sm"
                className="px-2 py-1 text-xs h-auto border border-overlay-border-primary"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center">
              {formatKeybindForDisplay(currentKeybind)}
            </div>
            <Button
              onClick={onStartCapturing}
              variant="gaming"
              size="icon"
              className="px-2 py-1 h-auto hover:!border-transparent"
            >
              <Pencil className="w-3 h-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

