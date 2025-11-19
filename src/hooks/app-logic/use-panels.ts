import { useState, useEffect, useCallback } from 'react'

interface UsePanelsProps {
  onNewChat?: () => void
  onVoiceChatToggle?: () => void
}

export function usePanels({ onNewChat, onVoiceChatToggle }: UsePanelsProps = {}) {
  const [isTextChatVisible, setIsTextChatVisible] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)

  // Close all panels helper
  const closeAllPanels = useCallback(() => {
    setIsTextChatVisible(false)
    setShowSettingsMenu(false)
    setShowHistoryPanel(false)
    setShowInfoPanel(false)
  }, [])

  // Close other panels (keeping the specified one open)
  const closeOtherPanels = useCallback(
    (keepOpen: 'chat' | 'settings' | 'history' | 'info') => {
      if (keepOpen !== 'chat') setIsTextChatVisible(false)
      if (keepOpen !== 'settings') setShowSettingsMenu(false)
      if (keepOpen !== 'history') setShowHistoryPanel(false)
      if (keepOpen !== 'info') setShowInfoPanel(false)
    },
    []
  )

  // Listen for settings menu open event from system tray
  useEffect(() => {
    const handleOpenSettingsMenu = () => {
      setShowSettingsMenu(true)
    }

    window.electronAPI?.onOpenSettingsMenu(handleOpenSettingsMenu)

    return () => {
      window.electronAPI?.removeOpenSettingsMenuListener()
    }
  }, [])

  // Listen for chat toggle keyboard shortcut (from Electron global shortcut)
  useEffect(() => {
    const handleChatToggle = () => {
      setIsTextChatVisible((prev) => {
        const newValue = !prev
        if (newValue) {
          closeOtherPanels('chat')
        }
        return newValue
      })
    }

    if (window.electronAPI?.onChatToggle) {
      window.electronAPI.onChatToggle(handleChatToggle)
    }

    return () => {
      if (window.electronAPI?.removeChatToggleListener) {
        window.electronAPI.removeChatToggleListener()
      }
    }
  }, [closeOtherPanels])

  // Listen for history toggle keyboard shortcut
  useEffect(() => {
    const handleHistoryToggle = () => {
      setShowHistoryPanel((prev) => {
        const newValue = !prev
        if (newValue) {
          closeOtherPanels('history')
        }
        return newValue
      })
    }

    if (window.electronAPI?.onHistoryToggle) {
      window.electronAPI.onHistoryToggle(handleHistoryToggle)
    }

    return () => {
      if (window.electronAPI?.removeHistoryToggleListener) {
        window.electronAPI.removeHistoryToggleListener()
      }
    }
  }, [closeOtherPanels])

  // Listen for settings toggle keyboard shortcut
  useEffect(() => {
    const handleSettingsToggle = () => {
      setShowSettingsMenu((prev) => {
        const newValue = !prev
        if (newValue) {
          closeOtherPanels('settings')
        }
        return newValue
      })
    }

    if (window.electronAPI?.onSettingsToggle) {
      window.electronAPI.onSettingsToggle(handleSettingsToggle)
    }

    return () => {
      if (window.electronAPI?.removeSettingsToggleListener) {
        window.electronAPI.removeSettingsToggleListener()
      }
    }
  }, [closeOtherPanels])

  // Listen for new chat keyboard shortcut
  useEffect(() => {
    const handleNewChat = () => {
      onNewChat?.()
    }

    if (window.electronAPI?.onNewChatTrigger) {
      window.electronAPI.onNewChatTrigger(handleNewChat)
    }

    return () => {
      if (window.electronAPI?.removeNewChatTriggerListener) {
        window.electronAPI.removeNewChatTriggerListener()
      }
    }
  }, [onNewChat])

  // Listen for voice chat toggle keyboard shortcut
  useEffect(() => {
    const handleVoiceChatToggle = () => {
      onVoiceChatToggle?.()
    }

    if (window.electronAPI?.onVoiceChatToggle) {
      window.electronAPI.onVoiceChatToggle(handleVoiceChatToggle)
    }

    return () => {
      if (window.electronAPI?.removeVoiceChatToggleListener) {
        window.electronAPI.removeVoiceChatToggleListener()
      }
    }
  }, [onVoiceChatToggle])

  // Toggle functions
  const toggleTextChat = useCallback(() => {
    setIsTextChatVisible((prev) => {
      const newValue = !prev
      if (newValue) {
        closeOtherPanels('chat')
      }
      return newValue
    })
  }, [closeOtherPanels])

  const toggleHistory = useCallback(() => {
    setShowHistoryPanel((prev) => {
      const newValue = !prev
      if (newValue) {
        closeOtherPanels('history')
      }
      return newValue
    })
  }, [closeOtherPanels])

  const toggleSettings = useCallback(() => {
    setShowSettingsMenu((prev) => {
      const newValue = !prev
      if (newValue) {
        closeOtherPanels('settings')
      }
      return newValue
    })
  }, [closeOtherPanels])

  const toggleInfo = useCallback(() => {
    setShowInfoPanel((prev) => {
      const newValue = !prev
      if (newValue) {
        closeOtherPanels('info')
      }
      return newValue
    })
  }, [closeOtherPanels])

  return {
    // State
    isTextChatVisible,
    showSettingsMenu,
    showHistoryPanel,
    showInfoPanel,

    // Setters (for external control)
    setIsTextChatVisible,
    setShowSettingsMenu,
    setShowHistoryPanel,
    setShowInfoPanel,

    // Actions
    toggleTextChat,
    toggleHistory,
    toggleSettings,
    toggleInfo,
    closeAllPanels,
    closeOtherPanels,
  }
}

