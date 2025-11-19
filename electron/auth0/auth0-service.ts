/**
 * Refactored Auth0 Authentication Service - Main Process Only
 * Implements PKCE flow with secure token storage for Electron apps
 *
 * This is the main orchestrator that coordinates the various specialized components:
 * - TokenManager: Handles token refresh, validation, rate limiting
 * - SecureStorage: Manages encrypted storage with fallback mechanisms
 * - DeviceFlowManager: Handles OAuth2 Device Authorization Flow
 * - SessionManager: Handles session storage and restoration
 * - UserManager: Handles user info fetching and database creation
 */
import { Auth0Config } from '../../config/auth.config'
import {
  DeviceFlowManager,
  DeviceAuthorizationResult,
} from './device-flow-manager'
import { SecureStorage } from './secure-storage'
import { SessionManager } from './session-manager'
import { TokenManager, Auth0Tokens } from './token-manager'
import { Auth0User, Auth0Session, Auth0Event } from './types'
import { UserManager } from './user-manager'

// Re-export types for backward compatibility
export type { Auth0User, Auth0Session, Auth0Event }

export class Auth0Service {
  private domain = ''
  private clientId = ''
  private audience?: string
  private scope = 'openid profile email offline_access'

  // Specialized components
  private tokenManager!: TokenManager
  private secureStorage!: SecureStorage
  private deviceFlowManager!: DeviceFlowManager
  private sessionManager!: SessionManager
  private userManager!: UserManager

  // Event listeners
  private listeners = new Set<
    (event: Auth0Event, session: Auth0Session | null, error?: string) => void
  >()

  /**
   * Initialize Auth0 client configuration and all components
   */
  async initialize(
    domain: string,
    clientId: string,
    config: Auth0Config
  ): Promise<void> {
    if (!domain || !clientId) {
      throw new Error('Missing Auth0 credentials')
    }

    // Validate domain format (supports both standard Auth0 domains and custom domains)
    if (
      !domain.includes('.auth0.com') &&
      !domain.includes('.us.auth0.com') &&
      !domain.includes('auth.unstuck.gg')
    ) {
      throw new Error('Invalid Auth0 domain format')
    }

    this.domain = domain.startsWith('https://') ? domain : `https://${domain}`
    this.clientId = clientId
    this.audience = config.audience
    this.scope = config.scope

    // Initialize specialized components
    this.secureStorage = new SecureStorage()
    await this.secureStorage.initialize()

    this.tokenManager = new TokenManager(
      config,
      this.domain,
      this.clientId,
      this.audience
    )

    this.sessionManager = new SessionManager(
      this.secureStorage,
      this.tokenManager
    )

    this.userManager = new UserManager(this.domain, this.secureStorage)

    this.deviceFlowManager = new DeviceFlowManager(
      config,
      this.domain,
      this.clientId,
      this.audience,
      this.scope
    )

    // Set up device flow event handling
    this.deviceFlowManager.setEventCallback((event, tokens, error) => {
      if (event === 'SUCCESS' && tokens) {
        void this.handleDeviceFlowSuccess(tokens)
      } else if (event === 'ERROR') {
        this.notifyListeners('ERROR', null, error)
      }
    })

    // Try to restore existing session
    await this.restoreSession()
  }

  /**
   * Start Device Authorization Flow
   */
  async startDeviceAuthFlow(): Promise<DeviceAuthorizationResult> {
    return await this.deviceFlowManager.startDeviceAuthFlow()
  }

  /**
   * Cancel current device authorization flow
   */
  cancelDeviceAuthorization(): void {
    this.deviceFlowManager.cancelDeviceAuthorization()
  }

  /**
   * Check if user is currently signed in with valid tokens
   */
  isSignedIn(): boolean {
    return this.sessionManager.isSignedIn()
  }

  /**
   * Get current session with automatic token refresh
   */
  async getSession(): Promise<{
    user: Auth0User | null
    tokens: Auth0Tokens | null
  }> {
    const currentSession = this.sessionManager.getCurrentSession()

    if (currentSession) {
      // Check if tokens are expired and refresh if needed
      if (this.tokenManager.isTokenExpired(currentSession.tokens)) {
        try {
          await this.sessionManager.refreshSessionTokens()
          const refreshedSession = this.sessionManager.getCurrentSession()
          this.notifyListeners('TOKEN_REFRESHED', refreshedSession)

          return {
            user: refreshedSession?.user ?? null,
            tokens: refreshedSession?.tokens ?? null,
          }
        } catch (error) {
          // Handle specific refresh errors that require re-authentication
          if (
            error instanceof Error &&
            (error.message.includes('re-authentication required') ||
              error.message.includes('expired too long ago') ||
              error.message.includes('Too many token refresh attempts'))
          ) {
            await this.signOut()
            return { user: null, tokens: null }
          }
        }
      }

      return {
        user: currentSession.user,
        tokens: currentSession.tokens,
      }
    }

    return { user: null, tokens: null }
  }

  /**
   * Sign out user and clear all stored tokens
   */
  async signOut(): Promise<void> {
    try {
      const currentSession = this.sessionManager.getCurrentSession()

      // Revoke tokens if available
      if (currentSession?.tokens.refresh_token) {
        await this.tokenManager.revokeToken(
          currentSession.tokens.refresh_token
        )
      }

      // Clear stored session
      await this.sessionManager.clearSession()

      // Cancel any ongoing device flow
      this.deviceFlowManager.cancelDeviceAuthorization()

      // Notify listeners
      this.notifyListeners('SIGNED_OUT', null)
    } catch {
      // Still clear local session even if revocation fails
      await this.sessionManager.clearSession()
      this.notifyListeners('SIGNED_OUT', null)
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(
    callback: (
      event: Auth0Event,
      session: Auth0Session | null,
      error?: string
    ) => void
  ) {
    this.listeners.add(callback)

    return {
      unsubscribe: () => {
        this.listeners.delete(callback)
      },
    }
  }

  /**
   * Check if secure storage is available
   */
  async isSecureStorage(): Promise<boolean> {
    return await this.secureStorage.isSecureStorageAvailable()
  }

  // Private methods

  /**
   * Handle successful device flow completion
   */
  private async handleDeviceFlowSuccess(tokens: Auth0Tokens): Promise<void> {
    try {
      // Get user info
      const user = await this.userManager.getUserInfo(tokens.access_token)

      // Create session
      const session: Auth0Session = { user, tokens }

      // Store session securely
      await this.sessionManager.storeSession(session)

      // Check if this is a new user and create in database if needed
      await this.userManager.createUserInDatabase(user)

      // Notify listeners
      this.notifyListeners('SIGNED_IN', session)
    } catch {
      this.notifyListeners('ERROR', null, 'Failed to complete authentication')
    }
  }

  /**
   * Restore session from secure storage
   */
  private async restoreSession(): Promise<void> {
    const result = await this.sessionManager.restoreSession()

    if (result.session) {
      // Ensure user is created in database
      await this.userManager.createUserInDatabase(result.session.user)

      this.notifyListeners('SIGNED_IN', result.session)
    }
  }

  /**
   * Notify all listeners of auth events
   */
  private notifyListeners(
    event: Auth0Event,
    session: Auth0Session | null,
    error?: string
  ) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, session, error)
      } catch {
        // Silently ignore listener errors
      }
    })
  }
}

// Export both the class and a singleton instance for backward compatibility
export const auth0Service = new Auth0Service()
