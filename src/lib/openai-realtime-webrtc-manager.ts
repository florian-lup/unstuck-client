/**
 * OpenAI Realtime WebRTC Manager
 * Manages WebRTC connection to OpenAI Realtime API for voice chat
 *
 * WebRTC provides:
 * - Lower latency compared to WebSockets
 * - Built-in media handling and audio optimization
 * - Better error correction and packet loss handling
 * - Native browser support for audio streaming
 */

import { AudioManager } from './realtime/audio-manager'
import { DataChannelManager } from './realtime/data-channel-manager'
import { MessageHandler } from './realtime/message-handler'
import { WebRTCConnection } from './realtime/webrtc-connection'

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'

export interface RealtimeConfig {
  model: string
  ephemeralKey: string
  ephemeralKeyId: string // Session ID for tool call validation
  accessToken: string
  onConnectionStateChange?: (state: ConnectionState) => void
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void
  onAudioResponse?: (audioData: ArrayBuffer) => void
  onError?: (error: Error) => void
}

export class OpenAIRealtimeWebRTCManager {
  private connectionState: ConnectionState = 'disconnected'
  private config: RealtimeConfig
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private intentionalDisconnect = false

  // Component managers
  private webrtcConnection: WebRTCConnection
  private audioManager: AudioManager
  private dataChannelManager: DataChannelManager
  private messageHandler: MessageHandler

  constructor(config: RealtimeConfig) {
    this.config = config

    // Initialize component managers
    this.webrtcConnection = new WebRTCConnection({
      ephemeralKey: config.ephemeralKey,
      onTrack: (event) => { this.audioManager.handleRemoteTrack(event); },
      onError: (error) => { this.handleConnectionError(error); },
    })

    this.audioManager = new AudioManager()

    this.dataChannelManager = new DataChannelManager({
      onOpen: () => { this.handleDataChannelOpen(); },
      onMessage: (data) => void this.messageHandler.handleMessage(data),
      onError: (error) => this.config.onError?.(error),
      onClose: () => { this.handleDataChannelClose(); },
    })

    this.messageHandler = new MessageHandler({
      onTranscriptUpdate: config.onTranscriptUpdate,
      onAudioResponse: config.onAudioResponse,
      onError: config.onError,
      ephemeralKeyId: config.ephemeralKeyId,
      accessToken: config.accessToken,
      onFunctionResult: (callId, output) =>
        { this.dataChannelManager.sendFunctionResult(callId, output); },
      onRequestResponse: () => { this.dataChannelManager.requestResponse(); },
    })
  }

  /**
   * Connect to OpenAI Realtime API via WebRTC
   */
  async connect(): Promise<void> {
    if (
      this.connectionState === 'connected' ||
      this.connectionState === 'connecting'
    ) {
      return
    }

    // Reset intentional disconnect flag when starting a new connection
    this.intentionalDisconnect = false
    this.setConnectionState('connecting')

    try {
      // Create peer connection
      const peerConnection = this.webrtcConnection.create()

      // Create data channel
      this.dataChannelManager.create(peerConnection)

      // Setup audio track
      await this.audioManager.setupAudioTrack(peerConnection)

      // Create and set local SDP offer
      await this.webrtcConnection.createOffer()

      // Wait for ICE gathering to complete
      await this.webrtcConnection.waitForICEGathering()

      // Exchange SDP with OpenAI
      const answer = await this.webrtcConnection.exchangeSDP()

      // Set remote description
      await this.webrtcConnection.setRemoteDescription(answer)

      // Wait for data channel to open
      await this.dataChannelManager.waitForOpen()
    } catch (error) {
      this.setConnectionState('error')
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to connect'
      this.config.onError?.(new Error(errorMessage))
      throw error
    }
  }

  /**
   * Disconnect from WebRTC
   */
  disconnect(): void {
    // Mark as intentional disconnect to prevent auto-reconnect
    this.intentionalDisconnect = true

    // Close all connections
    this.dataChannelManager.close()
    this.webrtcConnection.close()
    this.audioManager.cleanup()

    this.setConnectionState('disconnected')
  }

  /**
   * Start capturing audio from microphone
   */
  startAudioCapture(): Promise<void> {
    // Audio is already being captured via the media track
    // This method exists for API compatibility
    return Promise.resolve()
  }

  /**
   * Stop capturing audio
   */
  stopAudioCapture(): void {
    this.audioManager.stopAudioCapture()
  }

  /**
   * Send a text message through the data channel
   */
  sendTextMessage(text: string): void {
    this.dataChannelManager.sendTextMessage(text)
  }

  /**
   * Cancel the current AI response (for interruptions)
   */
  cancelResponse(): void {
    this.dataChannelManager.cancelResponse()
  }

  /**
   * Configure interruption detection
   * Note: Interruption detection is currently handled by OpenAI's server-side VAD
   */
  setInterruptionConfig(_config: {
    enabled?: boolean
    threshold?: number
  }): void {
    // Interruption is handled by OpenAI's server-side Voice Activity Detection (VAD)
    // This method exists for API compatibility but doesn't modify local state
  }

  /**
   * Handle data channel open
   */
  private handleDataChannelOpen(): void {
    this.setConnectionState('connected')
    this.reconnectAttempts = 0

    // Session is already fully configured by the backend via the ephemeral token
    // No need to send session.update - backend configures:
    // - Model, voice, instructions
    // - Audio input/output formats
    // - Turn detection (server VAD)
    // - Transcription settings
    // Client can send session.update later if runtime changes are needed
  }

  /**
   * Handle data channel close
   */
  private handleDataChannelClose(): void {
    this.setConnectionState('disconnected')

    // Only attempt reconnect if disconnect was not intentional
    if (
      !this.intentionalDisconnect &&
      this.reconnectAttempts < this.maxReconnectAttempts
    ) {
      this.reconnectAttempts++
      setTimeout(() => {
        void this.connect().catch(() => {
          // Reconnection failed silently
        })
      }, 2000)
    }
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(error: Error): void {
    this.setConnectionState('error')
    this.config.onError?.(error)
  }

  /**
   * Update connection state and notify listeners
   */
  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state
    this.config.onConnectionStateChange?.(state)
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState
  }
}
