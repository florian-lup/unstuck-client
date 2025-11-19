/**
 * Token validation and management utilities
 */

import type { AuthTokens } from '@/types/auth-types'

const TOKEN_BUFFER_TIME = 300 // 5 minute buffer before expiration

export class AuthTokenManager {
  /**
   * Check if a token is still valid based on expiration time
   */
  isTokenValid(tokens: AuthTokens | null): boolean {
    if (!tokens?.access_token) {
      return false
    }

    // If no expiration info, assume valid (caller will handle refresh)
    if (!tokens.expires_at) {
      return true
    }

    const now = Math.floor(Date.now() / 1000)
    return tokens.expires_at > now + TOKEN_BUFFER_TIME
  }

  /**
   * Get access token if valid, null otherwise
   */
  getValidToken(tokens: AuthTokens | null): string | null {
    if (!this.isTokenValid(tokens)) {
      return null
    }
    return tokens?.access_token ?? null
  }
}

