import { useRef, useCallback } from 'react'
import { convertPCM16ToAudioBuffer } from '../../lib/audio/audio-utils'

/**
 * Hook for managing audio playback queue
 */
export function useAudioPlayback() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)

  /**
   * Play audio from queue
   */
  const playAudioQueue = useCallback(async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false
      return
    }

    isPlayingRef.current = true

    // Initialize audio context if needed
    audioContextRef.current ??= new window.AudioContext({
      sampleRate: 24000,
    })

    try {
      const audioData = audioQueueRef.current.shift()
      if (!audioData) return

      // Convert PCM16 to AudioBuffer
      const audioBuffer = await convertPCM16ToAudioBuffer(
        audioData,
        audioContextRef.current
      )

      // Create source and play
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)

      source.onended = () => {
        // Play next in queue
        void playAudioQueue()
      }

      source.start()
    } catch {
      isPlayingRef.current = false
    }
  }, [])

  /**
   * Handle audio response from OpenAI
   */
  const handleAudioResponse = useCallback(
    (audioData: ArrayBuffer) => {
      // Add to queue
      audioQueueRef.current.push(audioData)

      // Start playing if not already playing
      if (!isPlayingRef.current) {
        void playAudioQueue()
      }
    },
    [playAudioQueue]
  )

  /**
   * Clear audio queue and close audio context
   */
  const cleanup = useCallback(() => {
    audioQueueRef.current = []
    isPlayingRef.current = false

    if (audioContextRef.current) {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }
  }, [])

  return {
    handleAudioResponse,
    cleanup,
  }
}

