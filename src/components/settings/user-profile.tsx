import { LogOut, User, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '../ui/button'

interface UserProfileProps {
  user: { email?: string } | null
  isSubscribed: boolean
  subscriptionLoading: boolean
  onUpgrade: () => void
  onCancel: () => void
  onLogout: () => void
}

export function UserProfile({
  user,
  isSubscribed,
  subscriptionLoading,
  onUpgrade,
  onCancel,
  onLogout,
}: UserProfileProps) {
  const handleUpgrade = () => {
    window.electronAPI?.windowInteraction()
    onUpgrade()
  }

  const handleCancel = () => {
    window.electronAPI?.windowInteraction()
    onCancel()
  }

  const handleLogout = () => {
    window.electronAPI?.windowInteraction()
    onLogout()
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-overlay-bg-secondary rounded-full flex items-center justify-center">
        <User className="w-4 h-4 text-overlay-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-overlay-text-primary truncate">
          {user?.email ?? 'Unknown User'}
        </p>
        <p className="text-xs text-overlay-accent-primary">Signed in</p>
      </div>
      <div className="flex gap-2">
        {isSubscribed ? (
          <Button
            onClick={handleCancel}
            variant="gaming"
            size="sm"
            disabled={subscriptionLoading}
            className="justify-center items-center text-xs py-2 px-3 h-auto border border-overlay-accent-error bg-overlay-accent-error/10 hover:bg-overlay-accent-error/20 hover:border-overlay-accent-error disabled:opacity-50"
          >
            <ArrowDown className="mr-2 w-3.5 h-3.5" />
            <span>{subscriptionLoading ? 'Processing...' : 'Downgrade'}</span>
          </Button>
        ) : (
          <Button
            onClick={handleUpgrade}
            variant="gaming"
            size="sm"
            disabled={subscriptionLoading}
            className="justify-center items-center text-xs py-2 px-3 h-auto border border-overlay-accent-success bg-overlay-accent-success/10 hover:bg-overlay-accent-success/20 hover:border-overlay-accent-success disabled:opacity-50"
          >
            <ArrowUp className="mr-2 w-3.5 h-3.5" />
            <span>{subscriptionLoading ? 'Loading...' : 'Upgrade'}</span>
          </Button>
        )}
        <Button
          onClick={handleLogout}
          variant="gaming"
          size="sm"
          className="justify-center items-center text-xs py-2 px-3 h-auto border border-overlay-border-primary"
        >
          <span>Sign Out</span>
          <LogOut className="ml-2 w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

