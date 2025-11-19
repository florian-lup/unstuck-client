import { useState, useEffect, useCallback } from 'react'

interface UseKeybindCaptureOptions {
  onKeybindChange?: (keybind: string) => void
  defaultKeybind?: string
}

export function useKeybindCapture({
  onKeybindChange,
  defaultKeybind = '',
}: UseKeybindCaptureOptions) {
  const [isCapturing, setIsCapturing] = useState(false)

  const handleKeybindCapture = useCallback(
    (event: KeyboardEvent) => {
      if (!isCapturing) return

      event.preventDefault()
      event.stopPropagation()

      const keys = []
      if (event.ctrlKey) keys.push('Ctrl')
      if (event.altKey) keys.push('Alt')
      if (event.shiftKey) keys.push('Shift')
      if (event.metaKey) keys.push('Meta')

      // Don't capture modifier keys alone
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
        keys.push(event.key)
        const newKeybind = keys.join('+')
        setIsCapturing(false)
        onKeybindChange?.(newKeybind)
      }
    },
    [isCapturing, onKeybindChange]
  )

  useEffect(() => {
    if (isCapturing) {
      document.addEventListener('keydown', handleKeybindCapture)
      return () => {
        document.removeEventListener('keydown', handleKeybindCapture)
      }
    }
  }, [isCapturing, handleKeybindCapture])

  const startCapturing = () => { setIsCapturing(true); }
  const cancelCapturing = () => { setIsCapturing(false); }
  const resetToDefault = () => {
    setIsCapturing(false)
    onKeybindChange?.(defaultKeybind)
  }

  return {
    isCapturing,
    startCapturing,
    cancelCapturing,
    resetToDefault,
  }
}

