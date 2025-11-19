import { Slider } from '../ui/slider'

interface TransparencySettingsProps {
  currentTransparency: number
  onTransparencyChange?: (transparency: number) => void
}

export function TransparencySettings({
  currentTransparency,
  onTransparencyChange,
}: TransparencySettingsProps) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-medium text-overlay-text-primary mb-2">
        Appearance
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-overlay-text-muted">
            Overlay transparency
          </span>
          <span className="text-xs text-overlay-accent-primary font-mono">
            {currentTransparency}%
          </span>
        </div>
        <div className="px-1">
          <Slider
            min={10}
            max={100}
            step={5}
            value={[currentTransparency]}
            onValueChange={(value: number[]) => onTransparencyChange?.(value[0])}
            className="w-full"
          />
        </div>
        <div className="flex justify-between text-xs text-overlay-text-muted px-1">
          <span>More transparent</span>
          <span>More opaque</span>
        </div>
      </div>
    </div>
  )
}

