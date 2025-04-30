'use client';

import { useChatContext } from '@/app/context/ChatContext';
import { Message } from '@/components/message';
import { AkashChatLogo } from '@/components/branding/akash-chat-logo';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ModelConfig } from '@/components/model-config';
import { ChatInput } from '@/components/chat-input';
import { MainLayout } from '@/components/layout/MainLayout';
import { useEffect, useRef, useState } from 'react';
import { AI_NOTICE } from '@/app/config/genimg';
import { useWindowSize } from 'usehooks-ts';

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
    setTopP
  } = useChatContext();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [autoScroll, setAutoScroll] = useState(true);
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  // Utility functions
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container && autoScroll) {
      container.scrollTop = container.scrollHeight;
    }
  };

  // Handle scroll events to toggle auto-scroll
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = isMobile ? 50 : 20;
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < threshold;
      if (isAtBottom !== autoScroll) {
        setAutoScroll(isAtBottom);
      }
    }
  };

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);
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
      {/* Chat Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-2 md:p-4 bg-background dark:bg-background"
        id="messages-container"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
              <div className="mb-6 sm:mb-8">
                <AkashChatLogo className="w-48 sm:w-64 md:w-80" />
              </div>
              <h2 className="font-semibold text-xl sm:text-2xl mb-4 sm:mb-6 text-muted-foreground text-center">What can I help you with?</h2>
              <div className="w-full max-w-xl mb-3 sm:mb-4">
                <ChatInput
                  input={input}
                  isLoading={isLoading}
                  onSubmit={handleSubmit}
                  onChange={handleInputChange}
                  onFilesChange={setContextFiles}
                  contextFiles={contextFiles}
                  className="relative"
                  isInitialized={sessionInitialized}
                />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                {AI_NOTICE}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <Message
                  key={message.id}
                  message={message}
                  messageIndex={index}
                  isLoading={isLoading && message.id === messages[messages.length - 1]?.id}
                  onRegenerate={message.role === 'assistant' ? async () => {
                    const precedingUserMessage = messages[index - 1];
                    if (precedingUserMessage?.role === 'user') {
                      reload();
                    }
                  } : undefined}
                  onBranch={selectedChat && !isLoading ? () => handleBranch(index) : undefined}
                />
              ))}
              {modelError && (
                <motion.div
                  className="flex items-center gap-3 p-4 text-destructive bg-destructive/10 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="flex-1">{modelError}</p>
                  {messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                    <button
                      onClick={() => {
                        reload();
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-destructive/20 rounded-md transition-colors"
                      disabled={isLoading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Try again
                    </button>
                  )}
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input Form - Only show when there are messages */}
      {messages.length > 0 && (
        <div className="flex-none border-t border-border p-2 md:p-4 bg-background">
          <ChatInput
            input={input}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onChange={handleInputChange}
            onStop={stop}
            onFilesChange={setContextFiles}
            contextFiles={contextFiles}
            className="max-w-3xl mx-auto"
            showStopButton
            isInitialized={sessionInitialized}
          />
          <p className="text-xs text-muted-foreground text-center mt-2">
            {AI_NOTICE}
          </p>
        </div>
      )}

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