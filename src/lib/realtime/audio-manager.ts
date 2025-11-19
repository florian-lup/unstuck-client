/**
 * Audio Manager
 * Handles audio capture from microphone and playback from remote peer
 */

export class AudioManager {
  private mediaStream: MediaStream | null = null
  private remoteAudioElement: HTMLAudioElement | null = null
  private audioContext: AudioContext | null = null

  /**
   * Setup audio track for peer connection
   */
  async setupAudioTrack(
    peerConnection: RTCPeerConnection
  ): Promise<MediaStream> {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
        },
      })

      // Add audio track to peer connection
      const audioTrack = this.mediaStream.getAudioTracks()[0]
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (audioTrack) {
        peerConnection.addTrack(audioTrack, this.mediaStream)
      }

      return this.mediaStream
    } catch {
      throw new Error('Microphone access denied')
    }
  }

  /**
   * Handle incoming audio track from remote peer
   */
  handleRemoteTrack(event: RTCTrackEvent): void {
    if (event.track.kind === 'audio') {
      // Create audio element to play remote audio
      if (!this.remoteAudioElement) {
        this.remoteAudioElement = new Audio()
        this.remoteAudioElement.autoplay = true
      }

      const stream = new MediaStream([event.track])
      this.remoteAudioElement.srcObject = stream
    }
  }

  /**
   * Stop capturing audio from microphone
   */
  stopAudioCapture(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        track.stop()
      })
      this.mediaStream = null
    }
  }

  /**
   * Clean up audio resources
   */
  cleanup(): void {
    this.stopAudioCapture()

    if (this.remoteAudioElement) {
      this.remoteAudioElement.pause()
      this.remoteAudioElement.srcObject = null
      this.remoteAudioElement = null
    }

    if (this.audioContext) {
      void this.audioContext.close()
      this.audioContext = null
    }
  }

  /**
   * Check if audio is being captured
   */
  isCapturing(): boolean {
    return this.mediaStream !== null
  }
}

