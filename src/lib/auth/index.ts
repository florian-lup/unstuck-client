/**
 * Auth module exports
 */

export { secureAuth, SecureAuthClient } from './auth-client'
export type {
  AuthUser,
  AuthSession,
  AuthTokens,
  AuthEvent,
  AuthEventCallback,
  DeviceAuthorizationResponse,
  SessionResponse,
} from '@/types/auth-types'
