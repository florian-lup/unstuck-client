import { useState, useEffect, useCallback, useRef } from 'react'
import { secureAuth } from '../../lib/auth'
import {
  OpenAIRealtimeWebRTCManager,
  type ConnectionState,
  voiceSessionService,
} from '../../lib/chat'
import type { Game } from '../../lib/data'
import { useAudioPlayback } from './use-audio-playback'

export interface VoiceChatState {
  isConnected: boolean
  isConnecting: boolean
  isMuted: boolean
  transcript: string
  error: string | null
  connectionState: ConnectionState
}

export interface UseVoiceChatOptions {
  selectedGame: Game | null
  onError?: (error: Error) => void
}

export function useVoiceChat({ selectedGame, onError }: UseVoiceChatOptions) {
  const [state, setState] = useState<VoiceChatState>({
    isConnected: false,
    isConnecting: false,
    isMuted: true,
    transcript: '',
    error: null,
    connectionState: 'disconnected',
  })

  const realtimeManagerRef = useRef<OpenAIRealtimeWebRTCManager | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const { handleAudioResponse, cleanup: cleanupAudio } = useAudioPlayback()

  /**
   * Update connection state
   */
  const updateConnectionState = useCallback(
    (connectionState: ConnectionState) => {
      setState((prev) => ({
        ...prev,
        connectionState,
        isConnected: connectionState === 'connected',
        isConnecting: connectionState === 'connecting',
        error: connectionState === 'error' ? prev.error : null,
      }))
    },
    []
  )

  /**
   * Update transcript
   */
  const updateTranscript = useCallback((text: string, isFinal: boolean) => {
    setState((prev) => ({
      ...prev,
      transcript: isFinal ? text : `${prev.transcript} ${text}`,
    }))
  }, [])

  /**
   * Handle errors
   */
  const handleError = useCallback(
    (error: Error) => {
      setState((prev) => ({
        ...prev,
        error: error.message,
        connectionState: 'error',
      }))
      onError?.(error)
    },
    [onError]
  )

  /**
   * Start voice chat
   */
  const startVoiceChat = useCallback(async () => {
    if (state.isConnected || state.isConnecting) {
      return
    }

    try {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }))

      // Get access token
      const accessToken = await secureAuth.getValidAccessToken()
      if (!accessToken) {
        throw new Error('No authentication token available')
      }

      // Get ephemeral token from backend
      // Concatenate version to game name if version exists
      const gameWithVersion = selectedGame
        ? selectedGame.version
          ? `${selectedGame.gameName} ${selectedGame.version}`
          : selectedGame.gameName
        : null

      const session = await voiceSessionService.createVoiceSession(
        {
          game: gameWithVersion,
        },
        accessToken
      )

      // Store session ID for ending session later
      sessionIdRef.current = session.ephemeral_key_id

      // Create WebRTC manager
      realtimeManagerRef.current = new OpenAIRealtimeWebRTCManager({
        model: session.model,
        ephemeralKey: session.client_secret,
        ephemeralKeyId: session.ephemeral_key_id, // Store session ID for tool call validation
        accessToken: accessToken,
        onConnectionStateChange: updateConnectionState,
        onTranscriptUpdate: updateTranscript,
        onAudioResponse: handleAudioResponse,
        onError: handleError,
      })

      // Connect to OpenAI via WebRTC
      await realtimeManagerRef.current.connect()

      // Audio capture starts automatically with WebRTC
      setState((prev) => ({ ...prev, isMuted: false }))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to start voice chat'
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isConnecting: false,
        connectionState: 'error',
      }))
      handleError(error instanceof Error ? error : new Error(errorMessage))
    }
  }, [
    state.isConnected,
    state.isConnecting,
    selectedGame,
    updateConnectionState,
    updateTranscript,
    handleAudioResponse,
    handleError,
  ])

  /**
   * Stop voice chat
   */
  const stopVoiceChat = useCallback(async () => {
    // End session on backend if we have a session ID
    if (sessionIdRef.current) {
      try {
        const accessToken = await secureAuth.getValidAccessToken()
        if (accessToken) {
          await voiceSessionService.endVoiceSession(
            { session_id: sessionIdRef.current },
            accessToken
          )
        }
      } catch {
        // Error ending voice session, but don't prevent disconnection
      }
      sessionIdRef.current = null
    }

    if (realtimeManagerRef.current) {
      realtimeManagerRef.current.disconnect()
      realtimeManagerRef.current = null
    }

    // Cleanup audio playback
    cleanupAudio()

    setState({
      isConnected: false,
      isConnecting: false,
      isMuted: true,
      transcript: '',
      error: null,
      connectionState: 'disconnected',
    })
  }, [cleanupAudio])

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (!realtimeManagerRef.current) return

    if (state.isMuted) {
      // Unmute - start audio capture
      realtimeManagerRef.current
        .startAudioCapture()
        .then(() => {
          setState((prev) => ({ ...prev, isMuted: false }))
        })
        .catch((error: unknown) => {
          handleError(
            error instanceof Error
              ? error
              : new Error('Failed to start audio capture')
          )
        })
    } else {
      // Mute - stop audio capture
      realtimeManagerRef.current.stopAudioCapture()
      setState((prev) => ({ ...prev, isMuted: true }))
    }
  }, [state.isMuted, handleError])

  /**
   * Send text message
   */
  const sendTextMessage = useCallback(
    (text: string) => {
      if (!realtimeManagerRef.current || !state.isConnected) {
        throw new Error('Not connected to voice chat')
      }

      realtimeManagerRef.current.sendTextMessage(text)
    },
    [state.isConnected]
  )

  /**
   * Clear transcript
   */
  const clearTranscript = useCallback(() => {
    setState((prev) => ({ ...prev, transcript: '' }))
  }, [])

  /**
   * Configure interruption detection
   */
  const setInterruptionConfig = useCallback(
    (config: { enabled?: boolean; threshold?: number }) => {
      if (realtimeManagerRef.current) {
        realtimeManagerRef.current.setInterruptionConfig(config)
      }
    },
    []
  )

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // End session on backend if we have a session ID
      if (sessionIdRef.current) {
        const sessionId = sessionIdRef.current
        const endSession = async () => {
          try {
            const accessToken = await secureAuth.getValidAccessToken()
            if (accessToken) {
              await voiceSessionService.endVoiceSession(
                { session_id: sessionId },
                accessToken
              )
            }
          } catch {
            // Error ending voice session, but don't prevent cleanup
          }
        }
        void endSession()
        sessionIdRef.current = null
      }

      if (realtimeManagerRef.current) {
        realtimeManagerRef.current.disconnect()
      }
      
      cleanupAudio()
    }
  }, [cleanupAudio])

  return {
    ...state,
    startVoiceChat,
    stopVoiceChat,
    toggleMute,
    sendTextMessage,
    clearTranscript,
    setInterruptionConfig,
  }
}
