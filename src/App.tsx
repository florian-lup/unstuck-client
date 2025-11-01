import { AppInfo } from './components/app-info'
import { ConversationHistory } from './components/conversation-history'
import { NavigationBar } from './components/navigation-bar'
import { SettingsMenu } from './components/settings-menu'
import { TextChat } from './components/text-chat'
import { useAppLogic } from './hooks/use-app-logic'
import './index.css'
import './overlay.css'

function App() {
  const {
    // State
    selectedGame,
    isTextChatVisible,
    messages,
    isNavigationBarVisible,
    showSettingsMenu,
    showHistoryPanel,
    showInfoPanel,
    user,
    customKeybind,
    chatKeybind,
    historyKeybind,
    settingsKeybind,
    newChatKeybind,
    voiceChatKeybind,
    transparency,
    isLoadingMessage,
    isSubscribed,
    subscriptionLoading,
    voiceChatState,

    // Actions
    handleVoiceClick,
    handleTextClick,
    handleHistoryClick,
    handleSettingsClick,
    handleInfoClick,
    handleGameSelect,
    handleSendMessage,
    handleTextChatClose,
    handleDropdownOpenChange,
    handleLogout,
    handleKeybindChange,
    handleChatKeybindChange,
    handleHistoryKeybindChange,
    handleSettingsKeybindChange,
    handleNewChatKeybindChange,
    handleVoiceChatKeybindChange,
    handleTransparencyChange,
    handleUpgrade,
    handleCancel,
    setShowSettingsMenu,
    setShowHistoryPanel,
    setShowInfoPanel,
    handleStartNewConversation,
    handleConversationSelect,
  } = useAppLogic()


  return (
    <>
      {isNavigationBarVisible && (
        <div className="relative">
          <NavigationBar
            onSpeakClick={handleVoiceClick}
            onTextClick={handleTextClick}
            onHistoryClick={handleHistoryClick}
            onSettingsClick={handleSettingsClick}
            onInfoClick={handleInfoClick}
            onGameSelect={handleGameSelect}
            selectedGame={selectedGame}
            onDropdownOpenChange={handleDropdownOpenChange}
            voiceState={voiceChatState}
          />
          {showSettingsMenu && (
            <SettingsMenu
              user={user}
              isOpen={showSettingsMenu}
              onLogout={handleLogout}
              onClose={() => {
                setShowSettingsMenu(false)
              }}
              currentKeybind={customKeybind}
              onKeybindChange={handleKeybindChange}
              currentChatKeybind={chatKeybind}
              onChatKeybindChange={handleChatKeybindChange}
              currentHistoryKeybind={historyKeybind}
              onHistoryKeybindChange={handleHistoryKeybindChange}
              currentSettingsKeybind={settingsKeybind}
              onSettingsKeybindChange={handleSettingsKeybindChange}
              currentNewChatKeybind={newChatKeybind}
              onNewChatKeybindChange={handleNewChatKeybindChange}
              currentVoiceChatKeybind={voiceChatKeybind}
              onVoiceChatKeybindChange={handleVoiceChatKeybindChange}
              currentTransparency={transparency}
              onTransparencyChange={handleTransparencyChange}
              isSubscribed={isSubscribed}
              subscriptionLoading={subscriptionLoading}
              onUpgrade={handleUpgrade}
              onCancel={handleCancel}
            />
          )}
          {showHistoryPanel && (
            <ConversationHistory
              isOpen={showHistoryPanel}
              onClose={() => {
                setShowHistoryPanel(false)
              }}
              onConversationSelect={handleConversationSelect}
            />
          )}
          {showInfoPanel && (
            <AppInfo
              isOpen={showInfoPanel}
              onClose={() => {
                setShowInfoPanel(false)
              }}
            />
          )}
        </div>
      )}
      {isNavigationBarVisible && isTextChatVisible && (
        <TextChat
          onClose={handleTextChatClose}
          onSendMessage={handleSendMessage}
          onStartNewConversation={handleStartNewConversation}
          messages={messages}
          isLoading={isLoadingMessage}
        />
      )}
    </>
  )
}

export default App
