/**
 * API Client for Unstuck Backend
 * Handles communication with the Unstuck backend API
 */

import type {
  TextChatRequest,
  TextChatResponse,
  GamingChatResponse,
  ConversationsResponse,
  ConversationHistoryResponse,
  CreateCheckoutSessionResponse,
  SubscriptionStatusResponse,
  CancelSubscriptionResponse,
  VoiceSessionRequest,
  VoiceSessionResponse,
  VoiceToolCallRequest,
  VoiceToolCallResponse,
  CreateUserRequest,
  CreateUserResponse,
} from '../../types/api-types'
import { validateResponse } from './api-error-handler'
import { HttpClient } from './http-client'

// Re-export types for backward compatibility
export type {
  TextChatRequest,
  TextChatResponse,
  GamingChatResponse,
  ConversationsResponse,
  ConversationHistoryResponse,
  CreateCheckoutSessionResponse,
  SubscriptionStatusResponse,
  CancelSubscriptionResponse,
  VoiceSessionRequest,
  VoiceSessionResponse,
  VoiceToolCallRequest,
  VoiceToolCallResponse,
  CreateUserRequest,
  CreateUserResponse,
  ApiErrorResponse,
  VoiceSessionError,
  WebSearchResult,
} from '../../types/api-types'

export { SubscriptionError } from '../../types/api-types'

/**
 * API Client for Unstuck Backend
 */
export class ApiClient {
  private readonly httpClient: HttpClient
  private readonly endpoints = {
    textChat: '/text-chat/chat',
    gamingChat: '/gaming/chat',
    conversations: '/text-chat/conversations',
    conversationHistory: (id: string) =>
      `/text-chat/conversations/${id}/history`,
    conversationDelete: (id: string) => `/text-chat/conversations/${id}`,
    subscriptionCheckout: '/subscription/create-checkout-session',
    subscriptionStatus: '/subscription/status',
    subscriptionCancel: '/subscription/cancel',
    voiceSession: '/voice/session',
    voiceToolCall: '/voice/tool-call',
    createUser: '/auth/create-user',
  } as const

  // Timeout configurations (in milliseconds)
  private readonly timeouts = {
    aiRequests: 120000, // 2 minutes for AI-powered requests (chat)
    stripeRequests: 300000, // 5 minutes for Stripe operations (checkout, subscription)
    standardRequests: 30000, // 30 seconds for standard API requests
    quickRequests: 60000, // 1 minute for quick operations
  } as const

  constructor() {
    const baseUrl =
      'https://unstuck-backend-production-d9c1.up.railway.app/api/v1'
    this.httpClient = new HttpClient(baseUrl)
  }

  /**
   * Send a text chat request to the API
   */
  async sendTextChat(
    request: TextChatRequest,
    accessToken: string
  ): Promise<TextChatResponse> {
    const data = await this.httpClient.request<TextChatResponse>(
      this.endpoints.textChat,
      {
        method: 'POST',
        accessToken,
        body: request,
        timeout: this.timeouts.aiRequests,
      }
    )

    validateResponse(data, ['id', 'conversation_id', 'content'])
    return data
  }

  /**
   * Send a gaming chat request to the API
   * Uses same request format as text chat but returns gaming-specific response with search results
   */
  async sendGamingChat(
    request: TextChatRequest,
    accessToken: string
  ): Promise<GamingChatResponse> {
    const data = await this.httpClient.request<GamingChatResponse>(
      this.endpoints.gamingChat,
      {
        method: 'POST',
        accessToken,
        body: request,
        timeout: this.timeouts.aiRequests,
      }
    )

    validateResponse(data, ['id', 'conversation_id', 'content'])
    return data
  }

  /**
   * Fetch user's conversations from the API
   */
  async getConversations(accessToken: string): Promise<ConversationsResponse> {
    const data = await this.httpClient.request<ConversationsResponse>(
      this.endpoints.conversations,
      {
        method: 'GET',
        accessToken,
        timeout: this.timeouts.standardRequests,
      }
    )

    // Validate required fields
    if (!Array.isArray(data.conversations) || typeof data.total !== 'number') {
      throw new Error('Invalid response format from server')
    }

    return data
  }

  /**
   * Get conversation history including all messages
   */
  async getConversationHistory(
    conversationId: string,
    accessToken: string
  ): Promise<ConversationHistoryResponse> {
    const data = await this.httpClient.request<ConversationHistoryResponse>(
      this.endpoints.conversationHistory(conversationId),
      {
        method: 'GET',
        accessToken,
        timeout: this.timeouts.standardRequests,
      }
    )

    // Validate required fields
    if (!data.conversation_id || !Array.isArray(data.messages)) {
      throw new Error('Invalid response format from server')
    }

    return data
  }

  /**
   * Delete a conversation permanently (⚠️ IRREVERSIBLE!)
   */
  async deleteConversation(
    conversationId: string,
    accessToken: string
  ): Promise<void> {
    await this.httpClient.request<Record<string, never>>(
      this.endpoints.conversationDelete(conversationId),
      {
        method: 'DELETE',
        accessToken,
        timeout: this.timeouts.quickRequests,
      }
    )
  }

  /**
   * Create a Stripe checkout session for subscription upgrade
   */
  async createCheckoutSession(
    accessToken: string
  ): Promise<CreateCheckoutSessionResponse> {
    const data = await this.httpClient.request<CreateCheckoutSessionResponse>(
      this.endpoints.subscriptionCheckout,
      {
        method: 'POST',
        accessToken,
        body: {},
        timeout: this.timeouts.stripeRequests,
      }
    )

    validateResponse(data, ['checkout_url', 'session_id'])
    return data
  }

  /**
   * Get the current user's subscription status
   */
  async getSubscriptionStatus(
    accessToken: string
  ): Promise<SubscriptionStatusResponse> {
    const data = await this.httpClient.request<SubscriptionStatusResponse>(
      this.endpoints.subscriptionStatus,
      {
        method: 'GET',
        accessToken,
        timeout: this.timeouts.quickRequests,
      }
    )

    // Validate that required fields exist (subscription_status and stripe_customer_id can be null)
    if (!data.subscription_tier || typeof data.subscription_tier !== 'string') {
      throw new Error('Invalid subscription status response from server')
    }

    return data
  }

  /**
   * Cancel the user's subscription
   */
  async cancelSubscription(
    accessToken: string
  ): Promise<CancelSubscriptionResponse> {
    const data = await this.httpClient.request<CancelSubscriptionResponse>(
      this.endpoints.subscriptionCancel,
      {
        method: 'POST',
        accessToken,
        body: {},
        timeout: this.timeouts.stripeRequests,
      }
    )

    if (typeof data.success !== 'boolean') {
      throw new Error('Invalid cancellation response from server')
    }

    return data
  }

  /**
   * Create a voice session with ephemeral token
   */
  async createVoiceSession(
    request: VoiceSessionRequest,
    accessToken: string
  ): Promise<VoiceSessionResponse> {
    const data = await this.httpClient.request<VoiceSessionResponse>(
      this.endpoints.voiceSession,
      {
        method: 'POST',
        accessToken,
        body: request,
        timeout: this.timeouts.quickRequests,
      }
    )

    validateResponse(data, [
      'client_secret',
      'ephemeral_key_id',
      'websocket_url',
      'model',
    ])
    return data
  }

  /**
   * Execute a voice tool call
   * Used for function calling in voice chat
   */
  async voiceToolCall(
    request: VoiceToolCallRequest,
    accessToken: string
  ): Promise<VoiceToolCallResponse> {
    const data = await this.httpClient.request<VoiceToolCallResponse>(
      this.endpoints.voiceToolCall,
      {
        method: 'POST',
        accessToken,
        body: request,
        timeout: this.timeouts.quickRequests,
      }
    )

    // Validate the response structure
    if (typeof data.result !== 'object') {
      throw new Error('Invalid tool call response from server')
    }

    return data
  }

  /**
   * Create a user in the backend database
   * Called automatically after Auth0 signup (no auth token required)
   */
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    const data = await this.httpClient.request<CreateUserResponse>(
      this.endpoints.createUser,
      {
        method: 'POST',
        body: request,
        timeout: this.timeouts.quickRequests,
      }
    )

    validateResponse(data, ['success', 'user_id', 'auth0_user_id'])
    return data
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
