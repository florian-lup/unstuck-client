/**
 * Message Handler
 * Handles parsing and routing of messages from OpenAI Realtime API
 */

import { apiClient } from '../../api'

export interface MessageHandlerConfig {
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void
  onAudioResponse?: (audioData: ArrayBuffer) => void
  onError?: (error: Error) => void
  ephemeralKeyId: string
  accessToken: string
  onFunctionResult?: (callId: string, output: string) => void
  onRequestResponse?: () => void
}

interface RealtimeMessage {
  type: string
  transcript?: string
  delta?: string
  error?: { message?: string; type?: string }
  call_id?: string
  name?: string
  arguments?: string
}

export class MessageHandler {
  private config: MessageHandlerConfig

  constructor(config: MessageHandlerConfig) {
    this.config = config
  }

  /**
   * Handle incoming message from data channel
   */
  async handleMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data) as RealtimeMessage

      switch (message.type) {
        case 'session.created':
        case 'session.updated':
          break

        case 'input_audio_buffer.speech_started':
        case 'input_audio_buffer.speech_stopped':
          // User speech events
          break

        case 'conversation.item.input_audio_transcription.completed':
          // User's speech was transcribed (final)
          if (message.transcript) {
            this.config.onTranscriptUpdate?.(message.transcript, true)
          }
          break

        case 'conversation.item.input_audio_transcription.delta':
          // Partial transcript of user's speech
          if (message.delta) {
            this.config.onTranscriptUpdate?.(message.delta, false)
          }
          break

        case 'response.output_audio.delta':
          // AI audio response chunk
          if (message.delta) {
            const audioData = this.base64ToArrayBuffer(message.delta)
            this.config.onAudioResponse?.(audioData)
          }
          break

        case 'response.audio.done':
          // AI finished speaking
          break

        case 'response.output_audio_transcript.delta':
          // AI's speech transcript (partial)
          if (message.delta) {
            this.config.onTranscriptUpdate?.(message.delta, false)
          }
          break

        case 'response.output_audio_transcript.done':
          // AI's speech transcript (complete)
          if (message.transcript) {
            this.config.onTranscriptUpdate?.(message.transcript, true)
          }
          break

        case 'response.function_call_arguments.done':
          // Function call request from OpenAI
          if (message.call_id && message.name && message.arguments) {
            await this.handleFunctionCall(
              message.call_id,
              message.name,
              message.arguments
            )
          }
          break

        case 'response.done':
        case 'response.cancelled':
          break

        case 'error': {
          const errorMsg =
            message.error?.message ?? message.error?.type ?? 'Unknown error'
          this.config.onError?.(new Error(errorMsg))
          break
        }

        default:
          break
      }
    } catch {
      // Error parsing message - silently ignore
    }
  }

  /**
   * Handle function call from OpenAI
   */
  private async handleFunctionCall(
    callId: string,
    functionName: string,
    argumentsStr: string
  ): Promise<void> {
    try {
      // Parse function arguments
      let functionArgs: Record<string, unknown>
      try {
        functionArgs = JSON.parse(argumentsStr) as Record<string, unknown>
      } catch (parseError) {
        throw new Error(
          `Invalid function arguments JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
        )
      }

      // Call the backend tool endpoint with session ID for security validation
      const response = await apiClient.voiceToolCall(
        {
          tool_name: functionName,
          arguments: functionArgs,
          session_id: this.config.ephemeralKeyId,
        },
        this.config.accessToken
      )

      // Determine the output to send back to OpenAI
      const output = response.error
        ? JSON.stringify({ error: response.error })
        : JSON.stringify(response.result)

      // Send the function result back to OpenAI
      this.config.onFunctionResult?.(callId, output)

      // Request OpenAI to continue with the response
      this.config.onRequestResponse?.()
    } catch (error) {
      // Send error back to OpenAI
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'

      this.config.onFunctionResult?.(
        callId,
        JSON.stringify({ error: errorMessage })
      )

      // Let OpenAI naturally continue the conversation after receiving the error result
    }
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      const charCode = binaryString.charCodeAt(i)
      // eslint-disable-next-line security/detect-object-injection
      bytes[i] = charCode
    }
    return bytes.buffer
  }
}

