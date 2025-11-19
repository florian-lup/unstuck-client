import { useState, useCallback } from 'react'
import { type Conversation } from '../../components/conversation-history'
import { type Game } from '../../lib/games'
import { useAuth } from '../use-auth'
import { useClickThrough } from '../use-click-through'
import { useKeyboardToggle } from '../use-keyboard-toggle'
import { useSubscription } from '../use-subscription'
import { useVoiceChat } from '../use-voice-chat'
import { useConversation } from './use-conversation'
import { useKeybinds } from './use-keybinds'
import { usePanels } from './use-panels'
import { useTransparency } from './use-transparency'

export function useAppLogic() {
  // Authentication state
  const { user, signOut } = useAuth()

  // Subscription state
  const {
    isSubscribed,
    isLoading: subscriptionLoading,
    handleUpgrade,
    handleCancel,
  } = useSubscription()

  // Core application state
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  // Keybinds management
  const { keybinds, parsedNavigationKeybind, handlers: keybindHandlers } =
    useKeybinds()

  // Transparency management
  const { transparency, handleTransparencyChange } = useTransparency()

  // Conversation management
  const {
    messages,
    isLoadingMessage,
    currentConversationId,
    startNewConversation,
    sendMessage,
    loadConversation,
  } = useConversation()

  // Voice chat hook
  const voiceChat = useVoiceChat({
    selectedGame,
    onError: () => {
      // Optionally show error to user
    },
  })

  // Panels management (defined early for use in callbacks)
  const panels = usePanels({
    onNewChat: startNewConversation,
    onVoiceChatToggle: () => {
      // Async wrapper for voice chat toggle
      void (async () => {
        if (voiceChat.isConnected || voiceChat.isConnecting) {
          await voiceChat.stopVoiceChat()
        } else {
          panels.closeAllPanels()
          try {
            await voiceChat.startVoiceChat()
          } catch {
            // Failed to start voice chat
          }
        }
      })()
    },
  })

  // Voice chat toggle handler
  const handleVoiceClick = useCallback(async () => {
    // Toggle voice chat based on connection state
    if (voiceChat.isConnected || voiceChat.isConnecting) {
      // If already connected or connecting, stop it
      await voiceChat.stopVoiceChat()
    } else {
      // Close all panels and start voice chat
      panels.closeAllPanels()

      // Start voice chat connection
      try {
        await voiceChat.startVoiceChat()
      } catch {
        // Failed to start voice chat
      }
    }
  }, [voiceChat, panels])

  // Navigation bar visibility toggle with dynamic keybind
  const { isVisible: isNavigationBarVisible } = useKeyboardToggle({
    key: parsedNavigationKeybind.key,
    modifiers: parsedNavigationKeybind.modifiers,
  })

  // Global click-through management
  useClickThrough({
    interactiveSelectors:
      isNavigationBarVisible ||
      panels.isTextChatVisible ||
      panels.showSettingsMenu ||
      panels.showHistoryPanel ||
      panels.showInfoPanel
        ? ['[data-interactive-area]']
        : [],
  })

  // Event handlers
  const handleTextClick = () => {
    // Stop voice chat if opening text chat
    if (!panels.isTextChatVisible && (voiceChat.isConnected || voiceChat.isConnecting)) {
      void voiceChat.stopVoiceChat()
    }
    panels.toggleTextChat()
  }

  const handleHistoryClick = () => {
    // Stop voice chat if opening history
    if (!panels.showHistoryPanel && (voiceChat.isConnected || voiceChat.isConnecting)) {
      void voiceChat.stopVoiceChat()
    }
    panels.toggleHistory()
  }

  const handleSettingsClick = () => {
    // Stop voice chat if opening settings
    if (!panels.showSettingsMenu && (voiceChat.isConnected || voiceChat.isConnecting)) {
      void voiceChat.stopVoiceChat()
    }
    panels.toggleSettings()
  }

  const handleInfoClick = () => {
    // Stop voice chat if opening info
    if (!panels.showInfoPanel && (voiceChat.isConnected || voiceChat.isConnecting)) {
      void voiceChat.stopVoiceChat()
    }
    panels.toggleInfo()
  }

  const handleLogout = async () => {
    try {
      await signOut()
      // Send message to main process to show auth window again
      window.ipcRenderer.send('user-logout')
    } catch {
      // Logout error
    }
  }

  const handleGameSelect = (game: Game | null) => {
    setSelectedGame(game)
    // Handle game selection functionality here
    // TODO: Implement game-specific initialization
  }

  const handleSendMessage = async (
    messageContent: string,
    _activeToggle?: 'guides' | 'builds' | 'lore' | 'fix' | null
  ) => {
    await sendMessage(messageContent, selectedGame, _activeToggle)
  }

  const handleTextChatClose = () => {
    panels.setIsTextChatVisible(false)
  }

  const handleConversationSelect = async (conversation: Conversation) => {
    await loadConversation(conversation)
    // Show text chat and close history panel
    panels.setIsTextChatVisible(true)
    panels.setShowHistoryPanel(false)
  }

  const handleDropdownOpenChange = (open: boolean) => {
    if (open) {
      // Close all panels and stop voice chat when dropdown opens
      panels.closeAllPanels()
      if (voiceChat.isConnected || voiceChat.isConnecting) {
        void voiceChat.stopVoiceChat()
      }
    }
  }

  return {
    // State
    selectedGame,
    isTextChatVisible: panels.isTextChatVisible,
    messages,
    isNavigationBarVisible,
    showSettingsMenu: panels.showSettingsMenu,
    showHistoryPanel: panels.showHistoryPanel,
    showInfoPanel: panels.showInfoPanel,
    user,
    customKeybind: keybinds.navigation,
    chatKeybind: keybinds.chat,
    historyKeybind: keybinds.history,
    settingsKeybind: keybinds.settings,
    newChatKeybind: keybinds.newChat,
    voiceChatKeybind: keybinds.voiceChat,
    transparency,
    isLoadingMessage,
    currentConversationId,
    isSubscribed,
    subscriptionLoading,
    voiceChatState: {
      isConnected: voiceChat.isConnected,
      isConnecting: voiceChat.isConnecting,
    },

    // Actions
    handleVoiceClick,
    handleTextClick,
    handleHistoryClick,
    handleSettingsClick,
    handleInfoClick,
    handleGameSelect,
    handleSendMessage,
    handleTextChatClose,
    handleStartNewConversation: startNewConversation,
    handleConversationSelect,
    handleDropdownOpenChange,
    handleLogout,
    handleKeybindChange: keybindHandlers.handleNavigationKeybindChange,
    handleChatKeybindChange: keybindHandlers.handleChatKeybindChange,
    handleHistoryKeybindChange: keybindHandlers.handleHistoryKeybindChange,
    handleSettingsKeybindChange: keybindHandlers.handleSettingsKeybindChange,
    handleNewChatKeybindChange: keybindHandlers.handleNewChatKeybindChange,
    handleVoiceChatKeybindChange: keybindHandlers.handleVoiceChatKeybindChange,
    handleTransparencyChange,
    handleUpgrade,
    handleCancel,
    setShowSettingsMenu: panels.setShowSettingsMenu,
    setShowHistoryPanel: panels.setShowHistoryPanel,
    setShowInfoPanel: panels.setShowInfoPanel,
  }
}
