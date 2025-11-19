/**
 * WebRTC Connection Manager
 * Handles RTCPeerConnection, SDP exchange, and ICE handling
 */

export interface WebRTCConnectionConfig {
  ephemeralKey: string
  onICEStateChange?: (state: RTCIceConnectionState) => void
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  onTrack?: (event: RTCTrackEvent) => void
  onError?: (error: Error) => void
}

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection | null = null
  private config: WebRTCConnectionConfig

  constructor(config: WebRTCConnectionConfig) {
    this.config = config
  }

  /**
   * Create and setup peer connection
   */
  create(): RTCPeerConnection {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })

    // Set up event handlers
    this.peerConnection.oniceconnectionstatechange =
      this.handleICEStateChange.bind(this)
    this.peerConnection.onconnectionstatechange =
      this.handleConnectionStateChange.bind(this)
    this.peerConnection.ontrack = this.handleTrack.bind(this)

    return this.peerConnection
  }

  /**
   * Create and set local SDP offer
   */
  async createOffer(): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
  }

  /**
   * Wait for ICE gathering to complete
   */
  async waitForICEGathering(timeoutMs = 5000): Promise<void> {
    return new Promise((resolve) => {
      if (!this.peerConnection) {
        resolve()
        return
      }

      if (this.peerConnection.iceGatheringState === 'complete') {
        resolve()
        return
      }

      const checkState = () => {
        if (this.peerConnection?.iceGatheringState === 'complete') {
          this.peerConnection.removeEventListener(
            'icegatheringstatechange',
            checkState
          )
          resolve()
        }
      }

      this.peerConnection.addEventListener('icegatheringstatechange', checkState)

      // Timeout
      setTimeout(() => {
        if (this.peerConnection) {
          this.peerConnection.removeEventListener(
            'icegatheringstatechange',
            checkState
          )
        }
        resolve()
      }, timeoutMs)
    })
  }

  /**
   * Exchange SDP with OpenAI API
   */
  async exchangeSDP(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection?.localDescription) {
      throw new Error('Local description not set')
    }

    try {
      const response = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
        body: this.peerConnection.localDescription.sdp,
      })

      if (!response.ok) {
        let errorText = await response.text()

        // Try to parse as JSON for better error message
        try {
          const errorJson = JSON.parse(errorText) as {
            error?: { message?: string }
          }
          if (errorJson.error?.message) {
            errorText = errorJson.error.message
          }
        } catch {
          // Not JSON, use text as-is
        }

        if (response.status === 400) {
          throw new Error(
            `WebRTC SDP exchange failed. Your backend may need to be updated to use the OpenAI GA API ` +
              `(/v1/realtime/client_secrets endpoint) instead of the beta API. Error: ${errorText}`
          )
        }

        throw new Error(
          `SDP exchange failed (${response.status}): ${errorText}`
        )
      }

      const answerSDP = await response.text()

      return {
        type: 'answer',
        sdp: answerSDP,
      }
    } catch {
      throw new Error('Failed to establish WebRTC connection with OpenAI')
    }
  }

  /**
   * Set remote description with answer from OpenAI
   */
  async setRemoteDescription(
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    await this.peerConnection.setRemoteDescription(answer)
  }

  /**
   * Get the peer connection instance
   */
  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection
  }

  /**
   * Close the peer connection
   */
  close(): void {
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
  }

  // Event handlers
  private handleICEStateChange(): void {
    if (!this.peerConnection) return

    const state = this.peerConnection.iceConnectionState
    this.config.onICEStateChange?.(state)

    switch (state) {
      case 'failed':
      case 'disconnected':
        this.config.onError?.(new Error('ICE connection failed'))
        break
      case 'closed':
        // Connection closed
        break
    }
  }

  private handleConnectionStateChange(): void {
    if (!this.peerConnection) return

    const state = this.peerConnection.connectionState
    this.config.onConnectionStateChange?.(state)

    switch (state) {
      case 'failed':
        this.config.onError?.(new Error('Peer connection failed'))
        break
      case 'disconnected':
      case 'closed':
        // Connection closed/disconnected
        break
    }
  }

  private handleTrack(event: RTCTrackEvent): void {
    this.config.onTrack?.(event)
  }
}

