/**
 * Convert PCM16 buffer to AudioBuffer
 */
export function convertPCM16ToAudioBuffer(
  pcm16Buffer: ArrayBuffer,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    try {
      // PCM16 is 16-bit signed integer
      const int16Array = new Int16Array(pcm16Buffer)

      // Create AudioBuffer
      const audioBuffer = audioContext.createBuffer(
        1, // mono
        int16Array.length,
        24000 // sample rate
      )

      // Convert int16 to float32 and copy to AudioBuffer
      const channelData = audioBuffer.getChannelData(0)
      for (let i = 0; i < int16Array.length; i++) {
        // eslint-disable-next-line security/detect-object-injection
        const sample = int16Array[i]
        // Convert from int16 (-32768 to 32767) to float32 (-1.0 to 1.0)
        // eslint-disable-next-line security/detect-object-injection
        channelData[i] = sample / (sample < 0 ? 32768 : 32767)
      }

      resolve(audioBuffer)
    } catch (error) {
      reject(
        error instanceof Error
          ? error
          : new Error('Failed to convert PCM16 to AudioBuffer')
      )
    }
  })
}

