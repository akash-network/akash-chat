'use client';

import type { Message as AIMessage } from 'ai';
import { useChat } from 'ai/react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWindowSize } from 'usehooks-ts';

import { DEFAULT_SYSTEM_PROMPT } from '@/app/config/api';
import { CACHE_TTL } from '@/app/config/api';
import { models as defaultModels, defaultModel, Model } from '@/app/config/models';
import { ChatHistory } from '@/components/chat/chat-sidebar';
import { useChatHistory } from '@/hooks/use-chat-history';
import { Folder, useFolders } from '@/hooks/use-folders';
import { getAccessToken, storeAccessToken, processMessages } from '@/lib/utils';

const SELECTED_MODEL_KEY = 'selectedModel';

export interface ContextFile {
  id: string;
  name: string;
  content: string;
  type: string;
  preview?: string;
}

interface ChatContextType {
  // Session state
  sessionInitialized: boolean;
  sessionError: string | null;
  isAccessError: boolean;
  accessTokenInput: string;
  setAccessTokenInput: (token: string) => void;
  handleAccessTokenSubmit: () => Promise<void>;
  
  // Model state
  modelSelection: string;
  setModelSelection: (model: string) => void;
  availableModels: Model[];
  isLoadingModels: boolean;
  modelError: string | null;
  
  // Config state
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  topP: number;
  setTopP: (topP: number) => void;
  isConfigOpen: boolean;
  setIsConfigOpen: (open: boolean) => void;
  
  // UI state
  isMobile: boolean;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Chat state
  messages: AIMessage[];
  setMessages: (messages: AIMessage[]) => void;
  input: string;
  setInput: (input: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
  contextFiles: ContextFile[];
  setContextFiles: (files: ContextFile[]) => void;
  reload: () => void;
  stop: () => void;
  
  // Chat management
  selectedChat: string | null;
  setSelectedChat: (chatId: string | null) => void;
  chats: ChatHistory[];
  handleNewChat: () => void;
  handleChatSelect: (chatId: string) => void;
  handleMessagesSelect: (messages: AIMessage[]) => void;
  saveChat: (messages: AIMessage[], model: Model, system: string) => string;
  updateChat: (chatId: string, messages: AIMessage[], model?: Model) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newName: string) => void;
  moveToFolder: (chatId: string, folderId: string | null) => void;
  exportChats: () => void;
  importChats: (file: File) => Promise<void>;
  branchChat: (chatId: string, messageIndex: number) => string | null;
  handleBranch: (messageIndex: number) => void;
  
  // Folder management
  folders: Folder[];
  createFolder: (name: string) => string;
  updateFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;
  
  // Session state
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isAccessError, setIsAccessError] = useState(false);
  const [accessTokenInput, setAccessTokenInput] = useState('');
  
  // Model state
  const getSavedModel = () => {
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem(SELECTED_MODEL_KEY);
      return savedModel || defaultModel;
    }
    return defaultModel;
  };
  
  const [modelSelection, setModelSelection] = useState(getSavedModel);
  const [availableModels, setAvailableModels] = useState<Model[]>(defaultModels);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  
  // Config state
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.95);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // UI state
  const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  // Chat state
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  
  // Custom hooks
  const { chats, saveChat, updateChat, deleteChat, renameChat, moveToFolder, exportChats, importChats, branchChat } = useChatHistory();
  const { folders, createFolder, updateFolder, deleteFolder } = useFolders();
  
  // AI chat hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    setMessages,
    setInput,
    reload,
    stop,
  } = useChat({
    api: '/api/chat',
    body: {
      model: modelSelection,
      system: systemPrompt,
      temperature,
      topP,
      context: contextFiles.map((f: ContextFile) => ({ 
        content: f.content,
        name: f.name,
        type: f.type,
      })),
    },
    onFinish: (message: AIMessage) => {
      setModelError(null);
      if (!selectedChat) {
        const chatId = saveChat([...messages, message], {
          id: modelSelection,
          name: availableModels.find((m: Model) => m.id === modelSelection)?.name || modelSelection,
        }, systemPrompt);
        setSelectedChat(chatId);
      }
    },
    onError: (error: Error) => {
      setModelError(error.message);
      console.error('Chat error:', error);
    },
  });

  // Save model selection
  useEffect(() => {
    if (typeof window !== 'undefined' && modelSelection) {
      localStorage.setItem(SELECTED_MODEL_KEY, modelSelection);
    }
  }, [modelSelection]);

  // Effect hooks
  useEffect(() => {
    const init = async () => {
      try {
        const statusResponse = await fetch('/api/auth/status/');
        if (statusResponse.ok) {
          const { requiresAccessToken } = await statusResponse.json();

          // If an access token is required but not present, show the dialog
          if (requiresAccessToken && !getAccessToken()) {
            setIsAccessError(true);
            setSessionInitialized(true);
            return;
          }
        }

        const accessToken = getAccessToken();
        const response = await fetch('/api/auth/session/', accessToken ? {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        } : {});
        if (!response.ok) {
          const data = await response.json();
          if (response.status === 403 && data.error === 'Invalid Access token' ) {
            console.log('Invalid Access token');
            setIsAccessError(true);
          } else {
            throw new Error('Failed to initialize session');
          }
        }
        setSessionInitialized(true);
      } catch (error) {
        console.error('Failed to initialize session:', error);
        setSessionError('Unable to establish a secure session. Please try refreshing the page.');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!sessionInitialized) {return;}

    // Refresh token every 20% of the cache TTL on visibility change
    let lastRefreshTime = 0;
    const MIN_REFRESH_INTERVAL = CACHE_TTL * 0.2 * 1000;

    const refreshToken = async () => {
      try {
        const response = await fetch('/api/auth/session/refresh/', {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            const newSessionResponse = await fetch('/api/auth/session/');
            if (newSessionResponse.ok) {
              return;
            }
          }
          throw new Error('Failed to refresh session');
        }
      } catch (error) {
        console.error('Failed to refresh session:', error);
      }
    };

    // Refresh token when 50% of the TTL has passed
    const refreshInterval = CACHE_TTL * 0.5 * 1000;
    const intervalId = setInterval(refreshToken, refreshInterval);

    // Add visibility change listener with debounce
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastRefreshTime >= MIN_REFRESH_INTERVAL) {
          lastRefreshTime = now;
          refreshToken();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial refresh
    refreshToken();

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionInitialized]);

  // fetch models once on initialization
  useEffect(() => {
    if (!sessionInitialized) {return;}
    
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true);
        const response = await fetch('/api/models/');
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        if (data) {
          setAvailableModels(data);
          // Check if current model selection is available
          const currentModelAvailable = data.some((model: Model) =>
            model.id === modelSelection && model.available
          );
          
          if (!currentModelAvailable) {
            const firstAvailableModel = data.find((model: Model) => model.available);
            if (firstAvailableModel) {
              setModelSelection(firstAvailableModel.id);
            } else {
              throw new Error('No models available');
            }
          }
        } else {
          throw new Error('Invalid model data received');
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        setModelError('Unable to load chat models. Please try again later.');
      } finally {
        setIsLoadingModels(false);
      }
    };
    
    fetchModels();
  }, [sessionInitialized]);

  useEffect(() => {
    const model = availableModels.find((m: Model) => m.id === modelSelection);
    if (model) {
      setTemperature(model.temperature || 0.7);
      setTopP(model.top_p || 0.95);
    }
  }, [modelSelection, availableModels]);

  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      updateChat(selectedChat, messages);
    }
  }, [messages, selectedChat, updateChat]);

  // Handle access token submission
  const handleAccessTokenSubmit = async () => {
    if (accessTokenInput.trim()) {
      try {
        await storeAccessToken(accessTokenInput.trim());

        // Try to validate the token with the server
        const response = await fetch('/api/auth/session/', {
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`
          }
        });
        
        if (!response.ok) {
          const data = await response.json();
          if (response.status === 403 && data.error === 'Invalid Access token') {
            setModelError('Access token is invalid. Please check and try again.');
            return;
          } else {
            throw new Error('Failed to validate access token');
          }
        }
        
        // Token is valid
        setIsAccessError(false);
        setModelError(null);
        
        setSessionInitialized(true);
      } catch (error) {
        console.error('Error validating access token:', error);
        setModelError('Failed to validate access token. Please try again.');
      }
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSelectedChat(null);
    setModelError(null);
  };

  const handleChatSelect = (chatId: string) => {
    if (isLoading) {return;}
    const chat = chats.find((c: { id: string; }) => c.id === chatId);
    if (chat) {
      setSelectedChat(chatId);
      setModelSelection(chat.model.id);
      if (chat.system) {
        setSystemPrompt(chat.system);
      }
      setModelError(null);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModelError(null);

    // If there's a selected chat, update the model information before submitting
    if (selectedChat) {
      const currentChat = chats.find((chat: { id: string; }) => chat.id === selectedChat);
      if (currentChat && currentChat.model.id !== modelSelection) {
        // Update the existing chat with the new model
        updateChat(selectedChat, messages, {
          id: modelSelection,
          name: availableModels.find((m: Model) => m.id === modelSelection)?.name || modelSelection,
        });
      }
    }

    // Check if the model is available
    const model = availableModels.find((m: Model) => m.id === modelSelection);
    if (!model || !model.available) {
      setModelError('Model is not available. Please select a different model.');
      return;
    }

    const processedMessages = processMessages(messages);
    setMessages(processedMessages);

    await originalHandleSubmit(e);
  };

  const handleMessagesSelect = (messages: AIMessage[]) => {
    setMessages(messages);
  };

  // Handle branching from a specific message
  const handleBranch = (messageIndex: number) => {
    if (!selectedChat || isLoading) {return;}

    const sourceChat = chats.find((chat: { id: string; }) => chat.id === selectedChat);
    if (!sourceChat) {return;}
    
    const branchedChatId = branchChat(selectedChat, messageIndex);
    
    if (branchedChatId) {
      const branchedMessages = sourceChat.messages.slice(0, messageIndex + 1);
      
      // Switch to the new branch
      setSelectedChat(branchedChatId);
      setMessages(branchedMessages);
      setModelSelection(sourceChat.model.id);
      if (sourceChat.system) {
        setSystemPrompt(sourceChat.system);
      }
      setModelError(null);
    }
  };

  const value: ChatContextType = {
    // Session state
    sessionInitialized,
    sessionError,
    isAccessError,
    accessTokenInput,
    setAccessTokenInput,
    handleAccessTokenSubmit,
    
    // Model state
    modelSelection,
    setModelSelection,
    availableModels,
    isLoadingModels,
    modelError,
    
    // Config state
    systemPrompt,
    setSystemPrompt,
    temperature,
    setTemperature,
    topP,
    setTopP,
    isConfigOpen,
    setIsConfigOpen,
    
    // UI state
    isMobile,
    isSidebarOpen,
    setSidebarOpen,
    
    // Chat state
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit: handleChatSubmit,
    isLoading,
    contextFiles,
    setContextFiles,
    reload,
    stop,
    
    // Chat management
    selectedChat,
    setSelectedChat,
    chats,
    handleNewChat,
    handleChatSelect,
    handleMessagesSelect,
    saveChat,
    updateChat,
    deleteChat,
    renameChat,
    moveToFolder,
    exportChats,
    importChats,
    branchChat,
    handleBranch,
    
    // Folder management
    folders,
    createFolder,
    updateFolder,
    deleteFolder,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}; 