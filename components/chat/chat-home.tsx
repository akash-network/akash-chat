'use client';

import { useChatContext } from '@/app/context/ChatContext';
import { ChatMessages } from '@/components/chat/chat-messages';
import { MainLayout } from '@/components/layout/MainLayout';
import { ModelConfig } from '@/components/model-config';

export function ChatHome() {
  const {
    // Session and model state
    sessionInitialized,
    sessionError,
    isAccessError,
    accessTokenInput,
    setAccessTokenInput,
    handleAccessTokenSubmit,
    modelSelection,
    setModelSelection,
    availableModels,
    isLoadingModels,
    modelError,
    
    // UI state
    isSidebarOpen,
    setSidebarOpen,
    isConfigOpen,
    setIsConfigOpen,
    
    // Chat state
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
    contextFiles,
    setContextFiles,
    reload,
    stop,
    
    // Chat management
    selectedChat,
    handleChatSelect,
    handleMessagesSelect,
    handleNewChat,
    chats,
    deleteChat,
    renameChat,
    moveToFolder,
    exportChats,
    importChats,
    handleBranch,
    
    // Folder management
    folders,
    createFolder,
    updateFolder,
    deleteFolder,
    
    // Config state
    systemPrompt,
    setSystemPrompt,
    setTemperature,
    setTopP,
    setMessages
  } = useChatContext();

  return (
    <MainLayout
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      modelSelection={modelSelection}
      setModelSelection={setModelSelection}
      availableModels={availableModels}
      isLoadingModels={isLoadingModels}
      selectedChat={selectedChat}
      setSelectedChat={handleChatSelect}
      handleMessagesSelect={handleMessagesSelect}
      handleNewChat={handleNewChat}
      chats={chats}
      deleteChat={deleteChat}
      renameChat={renameChat}
      moveToFolder={moveToFolder}
      folders={folders}
      createFolder={createFolder}
      updateFolder={updateFolder}
      deleteFolder={deleteFolder}
      isLoading={isLoading}
      exportChats={exportChats}
      importChats={importChats}
      onConfigureModel={() => setIsConfigOpen(true)}
      sessionInitialized={sessionInitialized}
      sessionError={sessionError}
      isAccessError={isAccessError}
      accessTokenInput={accessTokenInput}
      setAccessTokenInput={setAccessTokenInput}
      handleAccessTokenSubmit={handleAccessTokenSubmit}
      modelError={modelError}
    >
      <ChatMessages
        messages={messages}
        input={input}
        isLoading={isLoading}
        status={status}
        contextFiles={contextFiles}
        setContextFiles={setContextFiles}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        stop={stop}
        reload={reload}
        modelError={modelError}
        selectedChat={selectedChat}
        handleBranch={handleBranch}
        sessionInitialized={sessionInitialized}
        showStopButton
        setMessages={setMessages}
      />

      <ModelConfig
        open={isConfigOpen}
        onOpenChange={setIsConfigOpen}
        currentModel={modelSelection}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        onTemperatureChange={setTemperature}
        onTopPChange={setTopP}
      />
    </MainLayout>
  );
} 