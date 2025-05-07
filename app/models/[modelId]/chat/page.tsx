'use client';

import { AlertCircle, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { Model } from "@/app/config/models";
import { useChatContext } from "@/app/context/ChatContext";
import { ChatMessages } from '@/components/chat/chat-messages';
import { ModelConfig } from '@/components/model-config';
import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ModelDetailPage( {params}: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Local state
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [model, setModel] = useState<Model | null>(null);
  const [modelNotFound, setModelNotFound] = useState(false);

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
      
      <ChatMessages
        messages={messages}
        input={input}
        isLoading={isLoading}
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
    </>
  );
} 