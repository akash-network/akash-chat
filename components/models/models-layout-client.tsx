'use client';

import { useChatContext } from '@/app/context/ChatContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { ModelConfig } from '@/components/model-config';

interface ModelsLayoutClientProps {
  children: React.ReactNode;
}

export function ModelsLayoutClient({ children }: ModelsLayoutClientProps) {
  const {
    isSidebarOpen,
    setSidebarOpen,
    modelSelection,
    setModelSelection,
    availableModels,
    isLoadingModels,
    selectedChat,
    handleChatSelect,
    handleMessagesSelect,
    handleNewChat,
    chats,
    deleteChat,
    renameChat,
    moveToFolder,
    folders,
    createFolder,
    updateFolder,
    deleteFolder,
    isLoading,
    exportChats, 
    importChats,
    isConfigOpen,
    setIsConfigOpen,
    systemPrompt,
    setSystemPrompt,
    setTemperature,
    setTopP,
    sessionInitialized,
    sessionError,
    isAccessError,
    accessTokenInput,
    setAccessTokenInput,
    handleAccessTokenSubmit,
    modelError
  } = useChatContext();

  return (
    <>
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
        {children}
      </MainLayout>
      
      <ModelConfig
        open={isConfigOpen}
        onOpenChange={setIsConfigOpen}
        currentModel={modelSelection}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        onTemperatureChange={setTemperature}
        onTopPChange={setTopP}
      />
    </>
  );
} 