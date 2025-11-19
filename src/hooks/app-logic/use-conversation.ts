import { useState, useCallback } from 'react'
import { type Conversation } from '../../components/conversation-history'
import { type Message } from '../../components/text-chat'
import { apiClient } from '../../lib/api-client'
import { secureAuth } from '../../lib/auth-client'
import { chatService } from '../../lib/chat-service'
import { type Game } from '../../lib/games'
import { conversationCache } from '../../services/conversation-cache'

export function useConversation() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessage, setIsLoadingMessage] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null)

  // Start a new conversation
  const startNewConversation = useCallback(() => {
    chatService.startNewConversation()
    setMessages([])
    setCurrentConversationId(null)
    // Invalidate conversation list cache so fresh data is fetched when history is opened
    conversationCache.invalidateConversationList()
  }, [])

  // Send a message in the current conversation
  const sendMessage = useCallback(
    async (
      messageContent: string,
      selectedGame: Game | null,
      _activeToggle?: 'guides' | 'builds' | 'lore' | 'fix' | null
    ) => {
      // Remember if we had a conversation ID before sending
      const hadConversation = !!currentConversationId

      // Immediately add user message to show it right away
      const userMessage: Message = {
        id: `${Date.now()}-user`,
        content: messageContent,
        role: 'user',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      // Set loading state
      setIsLoadingMessage(true)

      try {
        // Send message through chat service
        const { assistantMessage, conversationId } =
          await chatService.sendMessage(messageContent, selectedGame)

        // If this was a new conversation, update the ID and invalidate cache
        if (!hadConversation && conversationId) {
          setCurrentConversationId(conversationId)
          // Invalidate conversation list cache since a new conversation was created
          conversationCache.invalidateConversationList()
        }

        // Add assistant message to state
        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        // Handle errors (including auth errors from backend)
        const errorMessage: Message = {
          id: `${Date.now()}-error`,
          content: error instanceof Error ? error.message : 'Unknown error',
          role: 'assistant',
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoadingMessage(false)
      }
    },
    [currentConversationId]
  )

  // Load a conversation from history
  const loadConversation = useCallback(async (conversation: Conversation) => {
    try {
      setIsLoadingMessage(true)
      setMessages([]) // Clear current messages while loading

      // Check cache first
      const cachedHistory = conversationCache.getCachedConversationHistory(
        conversation.id
      )
      if (cachedHistory) {
        // Convert cached API messages to Message format expected by TextChat
        const convertedMessages: Message[] = cachedHistory.messages.map(
          (msg, index) => ({
            id: `${conversation.id}-${index}`,
            content: msg.content,
            role: msg.role,
            timestamp: new Date(cachedHistory.updated_at * 1000), // Convert unix timestamp to Date
            // Add remaining requests to the last assistant message (if available)
            ...(msg.role === 'assistant' &&
              index === cachedHistory.messages.length - 1 && {
                remainingRequests:
                  cachedHistory.request_limit_info.remaining_requests,
              }),
          })
        )

        // Update state
        setMessages(convertedMessages)
        setCurrentConversationId(conversation.id)

        // Set the conversation ID in chat service so new messages go to this conversation
        chatService.setConversationId(conversation.id)
        setIsLoadingMessage(false)
        return
      }

      const accessToken = await secureAuth.getValidAccessToken()
      if (!accessToken) {
        throw new Error('No authentication token available')
      }

      // Get conversation history from API
      const historyResponse = await apiClient.getConversationHistory(
        conversation.id,
        accessToken
      )

      // Cache the response
      conversationCache.setCachedConversationHistory(
        conversation.id,
        historyResponse
      )

      // Convert API messages to Message format expected by TextChat
      const convertedMessages: Message[] = historyResponse.messages.map(
        (msg, index) => ({
          id: `${conversation.id}-${index}`,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(historyResponse.updated_at * 1000), // Convert unix timestamp to Date
          // Add remaining requests to the last assistant message
          ...(msg.role === 'assistant' &&
            index === historyResponse.messages.length - 1 && {
              remainingRequests:
                historyResponse.request_limit_info.remaining_requests,
            }),
        })
      )

      // Update state
      setMessages(convertedMessages)
      setCurrentConversationId(conversation.id)

      // Set the conversation ID in chat service so new messages go to this conversation
      chatService.setConversationId(conversation.id)
    } catch (error) {
      // Show error message
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        content:
          error instanceof Error
            ? `Failed to load conversation: ${error.message}`
            : 'Failed to load conversation',
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages([errorMessage])
    } finally {
      setIsLoadingMessage(false)
    }
  }, [])

  return {
    messages,
    isLoadingMessage,
    currentConversationId,
    startNewConversation,
    sendMessage,
    loadConversation,
  }
}

