/**
 * Secure Auth Client - Renderer Process
 * Uses IPC to communicate with main process for Auth0 authentication
 */

import type {
  AuthUser,
  AuthSession,
  AuthTokens,
  DeviceAuthorizationResponse,
  SessionResponse,
  AuthEventCallback,
} from '@/types/auth-types'
import { AuthEventManager } from './auth-events'
import { AuthIPC } from './auth-ipc'
import { AuthTokenManager } from './auth-token-manager'

// Re-export types for convenience
export type {
  AuthUser,
  AuthSession,
  AuthTokens,
  AuthEvent,
  AuthEventCallback,
  DeviceAuthorizationResponse,
  SessionResponse,
} from '@/types/auth-types'

export class SecureAuthClient {
  private eventManager = new AuthEventManager()
  private tokenManager = new AuthTokenManager()
  private ipc = new AuthIPC()

  private user: AuthUser | null = null
  private session: AuthSession | null = null
  private pendingSessionRequest: Promise<SessionResponse> | null = null

  constructor() {
    this.setupIpcListeners()
  }

  /**
   * Start Auth0 Device Authorization Flow
   */
  async startAuthFlow(): Promise<DeviceAuthorizationResponse> {
    return this.ipc.startAuthFlow()
  }

  /**
   * Get current session with request deduplication
   * If multiple calls happen simultaneously, they share the same IPC request
   */
  async getSession(): Promise<SessionResponse> {
    // If there's already a pending request, return it
    // This prevents multiple simultaneous IPC calls (React Strict Mode protection)
    if (this.pendingSessionRequest) {
      return this.pendingSessionRequest
    }

    // Create new request
    this.pendingSessionRequest = this.fetchSession()

    try {
      return await this.pendingSessionRequest
    } finally {
      // Clear pending request after completion (success or error)
      this.pendingSessionRequest = null
    }
  }

  /**
   * Internal method to actually fetch the session from IPC
   */
  private async fetchSession(): Promise<SessionResponse> {
    const result = await this.ipc.getSession()

    // Update local state
    this.user = result.user
    this.session = result.session

    return result
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    await this.ipc.signOut()

    this.user = null
    this.session = null

    this.eventManager.notify('SIGNED_OUT', null)
  }

  /**
   * Check if secure storage is being used
   */
  async isSecureStorage(): Promise<boolean> {
    return this.ipc.isSecureStorage()
  }

  /**
   * Cancel device authorization flow
   */
  async cancelDeviceFlow(): Promise<void> {
    return this.ipc.cancelDeviceFlow()
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback: AuthEventCallback) {
    return this.eventManager.addListener(callback)
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    return this.user
  }

  /**
   * Get current session
   */
  getCurrentSession(): AuthSession | null {
    return this.session
  }

  /**
   * Get current tokens
   */
  getCurrentTokens(): AuthTokens | null {
    return this.session?.tokens ?? null
  }

  /**
   * Get valid access token - uses cached tokens if valid, refreshes if needed
   * This reduces IPC calls and avoids rate limiting
   */
  async getValidAccessToken(): Promise<string | null> {
    // First try cached tokens
    const cachedTokens = this.getCurrentTokens()
    const validToken = this.tokenManager.getValidToken(cachedTokens)

    if (validToken) {
      return validToken
    }

    // Cached tokens are expired or missing, get fresh session
    try {
      const sessionData = await this.getSession()
      return sessionData.tokens?.access_token ?? null
    } catch {
      return null
    }
  }

  /**
   * Setup IPC listeners for auth events
   */
  private setupIpcListeners() {
    this.ipc.setupListeners(
      // onSignIn
      (session) => {
        this.user = session.user
        this.session = session
        this.eventManager.notify('SIGNED_IN', session)
      },
      // onError
      (error) => {
        this.eventManager.notify('ERROR', null, error)
      },
      // onTokenRefresh
      (session) => {
        this.session = session
        this.eventManager.notify('TOKEN_REFRESHED', session)
      }
    )
  }

  /**
   * Cleanup listeners when component unmounts
   */
  cleanup() {
    this.ipc.removeListeners()
    this.eventManager.clear()
    this.pendingSessionRequest = null
  }
}

// Export singleton instance
export const secureAuth = new SecureAuthClient()
