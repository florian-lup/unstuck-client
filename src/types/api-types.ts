/**
 * API Type Definitions
 * All request/response types for the Unstuck API
 */

// ==================== Text Chat Types ====================
export interface TextChatRequest {
  query: string
  game: string
  version?: string
  conversation_id?: string
}

export interface TextChatResponse {
  id: string
  conversation_id: string
  model: string
  created: number
  content: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  request_limit_info: {
    remaining_requests: number
    max_requests: number
    limit_type: 'lifetime' | 'monthly'
    reset_date: string | null
  }
}

// ==================== Gaming Chat Types ====================
export interface GamingChatResponse {
  id: string
  conversation_id: string
  model: string
  created: number
  content: string
  search_results: {
    title: string
    url: string
    date: string | null
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    search_context_size: string
    citation_tokens: number
    num_search_queries: number
  }
  finish_reason: string
  request_limit_info: {
    remaining_requests: number
    max_requests: number
    limit_type: 'lifetime' | 'monthly'
    reset_date: string | null
  }
}

// ==================== Conversation Types ====================
export interface ConversationsResponse {
  conversations: {
    id: string
    title: string
    game_name: string
    game_version: string
    conversation_type: string
    created_at: string
    updated_at: string
  }[]
  total: number
  remaining_requests: number
  max_requests: number
  limit_type: string
  reset_date: string | null
}

export interface ConversationHistoryResponse {
  conversation_id: string
  messages: {
    role: 'user' | 'assistant'
    content: string
  }[]
  created_at: number
  updated_at: number
  request_limit_info: {
    remaining_requests: number
    max_requests: number
    limit_type: 'lifetime' | 'monthly'
    reset_date: string | null
  }
}

// ==================== Subscription Types ====================
export interface CreateCheckoutSessionResponse {
  checkout_url: string
  session_id: string
}

export interface SubscriptionStatusResponse {
  subscription_tier: string
  subscription_status: string | null
  stripe_customer_id: string | null
}

export interface CancelSubscriptionResponse {
  success: boolean
  message: string
}

// ==================== Voice Types ====================
export interface VoiceSessionRequest {
  game: string | null
}

export interface VoiceSessionResponse {
  client_secret: string
  ephemeral_key_id: string
  model: string
  expires_at: number
  websocket_url: string
  connection_instructions: {
    url: string
    auth_header: string
    protocol: string
    expires_in_seconds: string
    note: string
  }
}

export interface VoiceSessionError {
  error: string
  message: string
  request_id: string
}

export interface VoiceToolCallRequest {
  tool_name: string
  arguments: Record<string, unknown>
  session_id: string // Required for security validation
}

export interface WebSearchResult {
  query: string
  results: {
    title: string
    content: string
    raw_content: string
  }[]
}

export interface VoiceToolCallResponse {
  call_id?: string
  result: WebSearchResult | Record<string, unknown>
  error: string | null
}

// ==================== User Management Types ====================
export interface CreateUserRequest {
  auth0_user_id: string
  email?: string
  username?: string
}

export interface CreateUserResponse {
  success: boolean
  user_id: string
  auth0_user_id: string
  message: string
  is_new_user: boolean
}

// ==================== Error Types ====================
export interface ApiErrorResponse {
  error: string
  message: string
  request_id: string
  // Some endpoints return nested error details
  detail?: {
    error: string
    message: string
    feature?: string
    current_tier?: string
    upgrade_required?: boolean
  }
}

// Custom error class for subscription-related errors
// These errors have pre-formatted messages from the backend
export class SubscriptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SubscriptionError'
  }
}

