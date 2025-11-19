import { useState, useEffect } from 'react'

const STORAGE_KEY = 'overlay-transparency'
const DEFAULT_TRANSPARENCY = 70
const MIN_TRANSPARENCY = 10
const MAX_TRANSPARENCY = 100

export function useTransparency() {
  const [transparency, setTransparency] = useState<number>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_TRANSPARENCY
    }

    const savedTransparency = localStorage.getItem(STORAGE_KEY)
    if (savedTransparency) {
      const parsedTransparency = parseInt(savedTransparency, 10)
      if (
        !isNaN(parsedTransparency) &&
        parsedTransparency >= MIN_TRANSPARENCY &&
        parsedTransparency <= MAX_TRANSPARENCY
      ) {
        return parsedTransparency
      }
    }
    return DEFAULT_TRANSPARENCY
  })

  // Apply transparency using native Electron window opacity
  useEffect(() => {
    const opacity = transparency / 100
    window.electronAPI?.setWindowOpacity(opacity)
  }, [transparency])

  const handleTransparencyChange = (newTransparency: number) => {
    setTransparency(newTransparency)
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newTransparency.toString())
    }
  }

  return {
    transparency,
    handleTransparencyChange,
  }
}

