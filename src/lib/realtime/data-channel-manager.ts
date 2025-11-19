/**
 * Data Channel Manager
 * Handles WebRTC data channel for sending/receiving control messages
 */

export type DataChannelState = 'connecting' | 'open' | 'closing' | 'closed'

export interface DataChannelConfig {
  onOpen?: () => void
  onMessage?: (data: string) => void
  onError?: (error: Error) => void
  onClose?: () => void
}

export class DataChannelManager {
  private dataChannel: RTCDataChannel | null = null
  private config: DataChannelConfig

  constructor(config: DataChannelConfig) {
    this.config = config
  }

  /**
   * Create and setup data channel
   */
  create(peerConnection: RTCPeerConnection): RTCDataChannel {
    this.dataChannel = peerConnection.createDataChannel('oai-events', {
      ordered: true,
    })

    this.dataChannel.onopen = this.handleOpen.bind(this)
    this.dataChannel.onmessage = this.handleMessage.bind(this)
    this.dataChannel.onerror = this.handleError.bind(this)
    this.dataChannel.onclose = this.handleClose.bind(this)

    return this.dataChannel
  }

  /**
   * Wait for data channel to open
   */
  async waitForOpen(timeoutMs = 10000): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Data channel connection timeout'))
      }, timeoutMs)

      if (this.dataChannel) {
        if (this.dataChannel.readyState === 'open') {
          clearTimeout(timeout)
          resolve()
        } else {
          this.dataChannel.addEventListener('open', () => {
            clearTimeout(timeout)
            resolve()
          })
          this.dataChannel.addEventListener('error', () => {
            clearTimeout(timeout)
            reject(new Error('Data channel connection failed'))
          })
        }
      }
    })
  }

  /**
   * Send a message through the data channel
   */
  send(message: Record<string, unknown>): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not open')
    }

    this.dataChannel.send(JSON.stringify(message))
  }

  /**
   * Send text message to conversation
   */
  sendTextMessage(text: string): void {
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text,
          },
        ],
      },
    })
  }

  /**
   * Cancel current response
   */
  cancelResponse(): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.send({ type: 'response.cancel' })
    }
  }

  /**
   * Send function result back to OpenAI
   */
  sendFunctionResult(callId: string, output: string): void {
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: output,
      },
    })
  }

  /**
   * Request OpenAI to create a response
   */
  requestResponse(): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.send({ type: 'response.create' })
    }
  }

  /**
   * Close the data channel
   */
  close(): void {
    if (this.dataChannel) {
      this.dataChannel.close()
      this.dataChannel = null
    }
  }

  /**
   * Get current ready state
   */
  getReadyState(): DataChannelState | null {
    return this.dataChannel?.readyState ?? null
  }

  /**
   * Check if data channel is open
   */
  isOpen(): boolean {
    return this.dataChannel?.readyState === 'open'
  }

  // Event handlers
  private handleOpen(): void {
    this.config.onOpen?.()
  }

  private handleMessage(event: MessageEvent): void {
    this.config.onMessage?.(event.data as string)
  }

  private handleError(): void {
    this.config.onError?.(new Error('Data channel error'))
  }

  private handleClose(): void {
    this.config.onClose?.()
  }
}

