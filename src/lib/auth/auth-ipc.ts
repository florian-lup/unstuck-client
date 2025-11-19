/**
 * IPC communication layer for authentication
 */

import type {
  AuthSession,
  AuthUser,
  AuthTokens,
  DeviceAuthorizationResponse,
  SessionResponse,
} from '@/types/auth-types'

export class AuthIPC {
  /**
   * Check if Auth API is available
   */
  private ensureAuthAPI(): void {
    if (!window.electronAPI?.auth) {
      throw new Error('Auth API not available')
    }
  }

  /**
   * Start Auth0 Device Authorization Flow
   */
  async startAuthFlow(): Promise<DeviceAuthorizationResponse> {
    this.ensureAuthAPI()

    // After ensureAuthAPI(), we know electronAPI exists
    const electronAPI = window.electronAPI
    if (!electronAPI) {
      throw new Error('Auth API not available')
    }

    const result = await electronAPI.auth.startAuthFlow()
    if (!result.success) {
      throw new Error(result.error ?? 'Failed to start authentication flow')
    }

    if (
      !result.device_code ||
      !result.user_code ||
      !result.verification_uri ||
      !result.expires_in
    ) {
      throw new Error('Invalid device authorization response')
    }

    return {
      device_code: result.device_code,
      user_code: result.user_code,
      verification_uri: result.verification_uri,
      expires_in: result.expires_in,
    }
  }

  /**
   * Get current session from IPC
   */
  async getSession(): Promise<SessionResponse> {
    this.ensureAuthAPI()

    // After ensureAuthAPI(), we know electronAPI exists
    const electronAPI = window.electronAPI
    if (!electronAPI) {
      throw new Error('Auth API not available')
    }

    const result = await electronAPI.auth.getSession()
    if (!result.success) {
      throw new Error(result.error ?? 'Failed to get session')
    }

    const user =
      result.user && typeof result.user === 'object' && 'sub' in result.user
        ? (result.user as AuthUser)
        : null

    const session =
      result.session &&
      typeof result.session === 'object' &&
      'user' in result.session &&
      'tokens' in result.session
        ? (result.session as AuthSession)
        : null

    const tokens =
      result.tokens &&
      typeof result.tokens === 'object' &&
      'access_token' in result.tokens
        ? (result.tokens as AuthTokens)
        : null

    return { user, session, tokens }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    this.ensureAuthAPI()

    // After ensureAuthAPI(), we know electronAPI exists
    const electronAPI = window.electronAPI
    if (!electronAPI) {
      throw new Error('Auth API not available')
    }

    const result = await electronAPI.auth.signOut()
    if (!result.success) {
      throw new Error(result.error ?? 'Failed to sign out')
    }
  }

  /**
   * Check if secure storage is being used
   */
  async isSecureStorage(): Promise<boolean> {
    if (!window.electronAPI?.auth) {
      return false
    }

    return await window.electronAPI.auth.isSecureStorage()
  }

  /**
   * Cancel device authorization flow
   */
  async cancelDeviceFlow(): Promise<void> {
    this.ensureAuthAPI()

    // After ensureAuthAPI(), we know electronAPI exists
    const electronAPI = window.electronAPI
    if (!electronAPI) {
      throw new Error('Auth API not available')
    }

    const result = await electronAPI.auth.cancelDeviceFlow()
    if (!result.success) {
      throw new Error(result.error ?? 'Failed to cancel device flow')
    }
  }

  /**
   * Setup IPC listeners for auth events
   */
  setupListeners(
    onSignIn: (session: AuthSession) => void,
    onError: (error: string) => void,
    onTokenRefresh: (session: AuthSession) => void
  ): void {
    if (!window.electronAPI?.auth) {
      return
    }

    // Listen for successful authentication
    window.electronAPI.auth.onAuthSuccess((session: unknown) => {
      if (
        session &&
        typeof session === 'object' &&
        'user' in session &&
        'tokens' in session
      ) {
        onSignIn(session as AuthSession)
      }
    })

    // Listen for authentication errors
    window.electronAPI.auth.onAuthError((error: string) => {
      onError(error)
    })

    // Listen for token refresh events
    window.electronAPI.auth.onTokenRefresh?.((session: unknown) => {
      if (
        session &&
        typeof session === 'object' &&
        'user' in session &&
        'tokens' in session
      ) {
        onTokenRefresh(session as AuthSession)
      }
    })
  }

  /**
   * Remove all IPC listeners
   */
  removeListeners(): void {
    if (window.electronAPI?.auth) {
      window.electronAPI.auth.removeAuthListeners()
    }
  }
}

