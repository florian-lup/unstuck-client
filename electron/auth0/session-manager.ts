/**
 * Session Management Service
 * Handles session storage, restoration, and clearing
 */
import { SecureStorage } from './secure-storage'
import { TokenManager, Auth0Tokens } from './token-manager'
import { Auth0Session } from './types'

export class SessionManager {
  private secureStorage: SecureStorage
  private tokenManager: TokenManager
  private currentSession: Auth0Session | null = null

  constructor(secureStorage: SecureStorage, tokenManager: TokenManager) {
    this.secureStorage = secureStorage
    this.tokenManager = tokenManager
  }

  /**
   * Get current session
   */
  getCurrentSession(): Auth0Session | null {
    return this.currentSession
  }

  /**
   * Set current session
   */
  setCurrentSession(session: Auth0Session | null): void {
    this.currentSession = session
  }

  /**
   * Store session using secure storage
   */
  async storeSession(session: Auth0Session): Promise<void> {
    await this.secureStorage.setItem('auth0_session', JSON.stringify(session))
    this.currentSession = session
  }

  /**
   * Restore session from secure storage
   */
  async restoreSession(): Promise<{
    session: Auth0Session | null
    needsRefresh: boolean
    refreshError?: Error
  }> {
    try {
      const sessionData = await this.secureStorage.getItem('auth0_session')
      if (!sessionData) {
        return { session: null, needsRefresh: false }
      }

      const restoredSession = JSON.parse(sessionData) as Auth0Session

      // Check if the restored tokens are expired
      if (this.tokenManager.isTokenExpired(restoredSession.tokens)) {
        try {
          // Try to refresh the tokens
          const refreshedTokens = await this.tokenManager.refreshTokens(
            restoredSession.tokens
          )
          restoredSession.tokens = refreshedTokens
          await this.storeSession(restoredSession)

          return { session: restoredSession, needsRefresh: false }
        } catch (error) {
          // Return error for auth service to handle
          await this.clearSession()
          return {
            session: null,
            needsRefresh: false,
            refreshError: error as Error,
          }
        }
      }

      // Tokens are still valid
      this.currentSession = restoredSession
      return { session: restoredSession, needsRefresh: false }
    } catch {
      await this.clearSession()
      return { session: null, needsRefresh: false }
    }
  }

  /**
   * Refresh session tokens
   */
  async refreshSessionTokens(): Promise<Auth0Tokens> {
    if (!this.currentSession) {
      throw new Error('No active session to refresh')
    }

    const refreshedTokens = await this.tokenManager.refreshTokens(
      this.currentSession.tokens
    )
    this.currentSession.tokens = refreshedTokens
    await this.storeSession(this.currentSession)

    return refreshedTokens
  }

  /**
   * Clear session from secure storage
   */
  async clearSession(): Promise<void> {
    await this.secureStorage.removeItem('auth0_session')
    this.currentSession = null
  }

  /**
   * Check if user is currently signed in with valid tokens
   */
  isSignedIn(): boolean {
    if (!this.currentSession) return false
    return !this.tokenManager.isTokenExpired(this.currentSession.tokens)
  }
}

