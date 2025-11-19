/**
 * Type definitions for authentication system
 */

export interface AuthUser {
  sub: string
  email?: string
  name?: string
  nickname?: string
  picture?: string
  email_verified?: boolean
  [key: string]: unknown
}

export interface AuthTokens {
  access_token: string
  refresh_token?: string
  id_token?: string
  expires_at: number
  token_type: string
  scope?: string
}

export interface AuthSession {
  user: AuthUser
  tokens: AuthTokens
}

export interface DeviceAuthorizationResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
}

export interface SessionResponse {
  user: AuthUser | null
  session: AuthSession | null
  tokens: AuthTokens | null
}

export type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'ERROR'

export type AuthEventCallback = (
  event: AuthEvent,
  session: AuthSession | null,
  error?: string
) => void

