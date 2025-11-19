import { useState, useEffect, useMemo } from 'react'

// Helper function to convert keybind string to useKeyboardToggle format
function parseKeybind(keybind: string) {
  const parts = keybind.split('+')
  const modifiers: {
    shift?: boolean
    ctrl?: boolean
    alt?: boolean
    meta?: boolean
  } = {}
  let key = ''

  for (const part of parts) {
    const lowerPart = part.toLowerCase()
    if (lowerPart === 'shift') {
      modifiers.shift = true
    } else if (lowerPart === 'ctrl' || lowerPart === 'control') {
      modifiers.ctrl = true
    } else if (lowerPart === 'alt') {
      modifiers.alt = true
    } else if (lowerPart === 'meta' || lowerPart === 'cmd') {
      modifiers.meta = true
    } else {
      // Convert special keys to the format expected by useKeyboardToggle
      if (part === '\\') {
        key = 'Backslash'
      } else if (part === ' ') {
        key = 'Space'
      } else if (part.length === 1) {
        key = `Key${part.toUpperCase()}`
      } else {
        key = part
      }
    }
  }

  return { key, modifiers }
}

interface KeybindConfig {
  key: string
  storageKey: string
  defaultValue: string
  electronUpdateFn?: (keybind: string) => Promise<void>
}

const KEYBIND_CONFIGS: Record<string, KeybindConfig> = {
  navigation: {
    key: 'navigation',
    storageKey: 'navigation-keybind',
    defaultValue: 'Shift+\\',
  },
  chat: {
    key: 'chat',
    storageKey: 'chat-keybind',
    defaultValue: '',
  },
  history: {
    key: 'history',
    storageKey: 'history-keybind',
    defaultValue: '',
  },
  settings: {
    key: 'settings',
    storageKey: 'settings-keybind',
    defaultValue: '',
  },
  newChat: {
    key: 'newChat',
    storageKey: 'new-chat-keybind',
    defaultValue: '',
  },
  voiceChat: {
    key: 'voiceChat',
    storageKey: 'voice-chat-keybind',
    defaultValue: '',
  },
}

export function useKeybinds() {
  // Load all keybinds from localStorage
  const [keybinds, setKeybinds] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') {
      return Object.fromEntries(
        Object.entries(KEYBIND_CONFIGS).map(([key, config]) => [
          key,
          config.defaultValue,
        ])
      )
    }

    return Object.fromEntries(
      Object.entries(KEYBIND_CONFIGS).map(([key, config]) => [
        key,
        localStorage.getItem(config.storageKey) ?? config.defaultValue,
      ])
    )
  })

  // Parse navigation keybind for useKeyboardToggle
  const parsedNavigationKeybind = useMemo(
    () => parseKeybind(keybinds.navigation),
    [keybinds.navigation]
  )

  // Sync initial keybinds with Electron on app start
  useEffect(() => {
    const syncKeybinds = async () => {
      try {
        // Sync navigation shortcut if it's not the default
        if (keybinds.navigation !== 'Shift+\\') {
          await window.electronAPI?.updateNavigationShortcut(
            keybinds.navigation
          )
        }
        // Sync other shortcuts if user has set them
        if (keybinds.chat) {
          await window.electronAPI?.updateChatShortcut(keybinds.chat)
        }
        if (keybinds.history) {
          await window.electronAPI?.updateHistoryShortcut(keybinds.history)
        }
        if (keybinds.settings) {
          await window.electronAPI?.updateSettingsShortcut(keybinds.settings)
        }
        if (keybinds.newChat) {
          await window.electronAPI?.updateNewChatShortcut(keybinds.newChat)
        }
        if (keybinds.voiceChat) {
          await window.electronAPI?.updateVoiceChatShortcut(keybinds.voiceChat)
        }
      } catch {
        // Failed to sync shortcuts
      }
    }
    void syncKeybinds()
  }, [
    keybinds.navigation,
    keybinds.chat,
    keybinds.history,
    keybinds.settings,
    keybinds.newChat,
    keybinds.voiceChat,
  ])

  // Handler factory for updating keybinds
  const createKeybindHandler = (
    key: keyof typeof KEYBIND_CONFIGS,
    electronUpdateFn?: (keybind: string) => Promise<void>
  ) => {
    return async (newKeybind: string) => {
      setKeybinds((prev) => ({ ...prev, [key]: newKeybind }))

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line security/detect-object-injection
        const config = KEYBIND_CONFIGS[key]
        localStorage.setItem(config.storageKey, newKeybind)
      }

      // Update Electron global shortcut
      if (electronUpdateFn) {
        try {
          await electronUpdateFn(newKeybind)
        } catch {
          // Failed to update global shortcut
        }
      }
    }
  }

  return {
    keybinds,
    parsedNavigationKeybind,
    handlers: {
      handleNavigationKeybindChange: createKeybindHandler(
        'navigation',
        window.electronAPI?.updateNavigationShortcut
      ),
      handleChatKeybindChange: createKeybindHandler(
        'chat',
        window.electronAPI?.updateChatShortcut
      ),
      handleHistoryKeybindChange: createKeybindHandler(
        'history',
        window.electronAPI?.updateHistoryShortcut
      ),
      handleSettingsKeybindChange: createKeybindHandler(
        'settings',
        window.electronAPI?.updateSettingsShortcut
      ),
      handleNewChatKeybindChange: createKeybindHandler(
        'newChat',
        window.electronAPI?.updateNewChatShortcut
      ),
      handleVoiceChatKeybindChange: createKeybindHandler(
        'voiceChat',
        window.electronAPI?.updateVoiceChatShortcut
      ),
    },
  }
}

