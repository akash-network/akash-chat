'use client';

import { useChatContext } from "@/app/context/ChatContext";
import { Message } from '@/components/message';
import { AkashChatLogo } from '@/components/branding/akash-chat-logo';
import { AlertCircle, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import { Model } from "@/app/config/models";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AI_NOTICE } from '@/app/config/genimg';
import { ModelConfig } from '@/components/model-config';
import { ChatInput } from '@/components/chat-input';
import { useWindowSize } from "usehooks-ts";

export default function ModelDetailPage( {params}: any) {
  const promiseParams: any = use(params);
  const modelId = promiseParams?.modelId || '';
  const router = useRouter();
  
  const {
    // Session and model state
    sessionInitialized,
    modelSelection,
    setModelSelection,
    availableModels,
    modelError,
    
    // UI state
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
    handleNewChat,
    handleBranch,
    // Config state
    isConfigOpen,
    systemPrompt,
    setSystemPrompt,
    setTemperature,
    setTopP
  } = useChatContext();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Local state
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [model, setModel] = useState<Model | null>(null);
  const [modelNotFound, setModelNotFound] = useState(false);
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

  // Effect to set model on mount
  useEffect(() => {
    if (availableModels.length > 0 && modelId) {
      const foundModel = availableModels.find(m => m.id.toLowerCase() === modelId.toLowerCase());
      
      if (foundModel) {
        setModel(foundModel);
        
        if (foundModel.available) {
          // Set the model but don't redirect
          setModelSelection(foundModel.id);
          
          // Only create a new chat if there isn't one already
          if (messages.length === 0 && !selectedChat) {
            handleNewChat();
          }
        }
        
        setIsModelLoading(false);
      } else {
        // Model not found
        setModelNotFound(true);
        setIsModelLoading(false);
      }
    }
  }, [availableModels, modelId, setModelSelection, handleNewChat, messages.length, selectedChat]);

  // Model loading state
  if (isModelLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Model not found
  if (modelNotFound) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Model Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested model could not be found or is unavailable.</p>
          <Button onClick={() => router.push('/models')}>Browse Available Models</Button>
        </div>
      </div>
    );
  }

  // Model is unavailable
  if (model && !model.available) {
    return (
      <div className="flex-1 overflow-auto p-4 bg-background dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">{model.name}</h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium text-sm mb-4 bg-red-500/10 text-red-500">
              <AlertCircle className="w-4 h-4" />
              Currently Unavailable
            </div>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">{model.description || "No description available"}</p>
            
            <Button onClick={() => router.push('/models')}>
              Browse Other Models
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Model Info Banner */}
      {model && (
        <div className="border-b border-border bg-muted/30 py-2 relative flex-none">
          <div className="max-w-3xl mx-auto px-4 text-center relative">
            <p className="text-sm text-muted-foreground pr-8 sm:pr-0">
              You're chatting with <span className="font-medium text-foreground" itemProp="name">{model.name}</span>
              {model.description && <span itemProp="description"> - {model.description}</span>}
            </p>
            <button 
              onClick={() => router.push("/")}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            {/* Enhanced semantic details for SEO crawlers */}
            <div className="hidden">
              <article itemScope itemType="https://schema.org/WebApplication">
                <meta itemProp="name" content="AkashChat" />
                <meta itemProp="description" content="A platform for chatting with various AI language models" />
                <meta itemProp="applicationCategory" content="ChatApplication" />
                <meta itemProp="operatingSystem" content="Any" />
                <meta itemProp="url" content={`https://chat.akash.network/models/${modelId}/chat`} />
                
                {/* Chat Service Properties */}
                <div itemProp="offers" itemScope itemType="https://schema.org/Service">
                  <meta itemProp="name" content={`Chat with ${model.name}`} />
                  <meta itemProp="description" content={model.aboutContent || model.description} />
                  <meta itemProp="serviceType" content="AI Chat Service" />
                  <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
                    <meta itemProp="price" content="0" />
                    <meta itemProp="priceCurrency" content="USD" />
                  </div>
                </div>

                {/* AI Model Properties */}
                <div itemProp="about" itemScope itemType="https://schema.org/SoftwareApplication">
                  <meta itemProp="name" content={model.name} />
                  <meta itemProp="description" content={model.aboutContent || model.description} />
                  <meta itemProp="applicationCategory" content="ArtificialIntelligenceApplication" />
                  <meta itemProp="featureList" content={`Parameters: ${model.parameters}, Architecture: ${model.architecture}, Token Limit: ${model.tokenLimit}, Hugging Face Repo: ${model.hf_repo}`} />
                  <meta itemProp="softwareVersion" content="1.0" />
                </div>

                {/* Publisher Information */}
                <div itemProp="publisher" itemScope itemType="https://schema.org/Organization">
                  <meta itemProp="name" content="Akash Network" />
                  <meta itemProp="url" content="https://akash.network" />
                </div>

                {/* Additional Model Details */}
                <div className="sr-only">
                  <p>Model ID: {model.id}</p>
                  <p>Token Limit: {model.tokenLimit ? `${(model.tokenLimit / 1000).toFixed(0)}K` : 'Standard'}</p>
                  <p>Availability: {model.available ? 'Available' : 'Currently Unavailable'}</p>
                  <p>Parameters: {model.parameters}</p>
                  <p>Architecture: {model.architecture}</p>
                  <p>Temperature: {model.temperature}</p>
                  <p>Top P: {model.top_p}</p>
                  <p>Hugging Face Repo: {model.hf_repo}</p>
                </div>
              </article>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Messages - same as main page */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-auto p-2 md:p-4 bg-background dark:bg-background"
        id="messages-container"
        onScroll={handleScroll}
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
              <div className="mb-6 sm:mb-8">
                <AkashChatLogo className="w-48 sm:w-64 md:w-80" />
              </div>
              {/* Add model-specific welcome message */}
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
        <div className="flex-none sticky bottom-0 border-t border-border p-2 md:p-4 bg-background">
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
    </>
  );
} 