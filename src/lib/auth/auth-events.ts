/**
 * Event management for authentication state changes
 */

import type { AuthEvent, AuthEventCallback, AuthSession } from '@/types/auth-types'

export class AuthEventManager {
  private listeners = new Set<AuthEventCallback>()

  /**
   * Add a listener for auth state changes
   */
  addListener(callback: AuthEventCallback) {
    this.listeners.add(callback)

    return {
      unsubscribe: () => {
        this.listeners.delete(callback)
      },
    }
  }

  /**
   * Notify all listeners of an auth event
   */
  notify(event: AuthEvent, session: AuthSession | null, error?: string) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, session, error)
      } catch {
        // Silently ignore listener errors
      }
    })
  }

  /**
   * Clear all listeners
   */
  clear() {
    this.listeners.clear()
  }
}

