import { Power } from 'lucide-react'
import { Button } from './ui/button'

interface AutoLaunchSettingsProps {
  autoLaunchEnabled: boolean
  onToggleAutoLaunch: () => void
}

export function AutoLaunchSettings({
  autoLaunchEnabled,
  onToggleAutoLaunch,
}: AutoLaunchSettingsProps) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-medium text-overlay-text-primary mb-2">
        Startup
      </h3>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Power
            className={`w-4 h-4 transition-colors duration-200 ${
              autoLaunchEnabled
                ? 'text-overlay-accent-primary'
                : 'text-overlay-text-muted'
            }`}
          />
          <span className="text-xs text-overlay-text-muted">
            Launch Unstuck when computer starts
          </span>
        </div>
        <Button
          onClick={onToggleAutoLaunch}
          variant="gaming"
          size="sm"
          className="px-3 py-1 text-xs h-auto border border-overlay-border-primary hover:border-overlay-accent-primary"
        >
          {autoLaunchEnabled ? 'Disable' : 'Enable'}
        </Button>
      </div>
    </div>
  )
}

