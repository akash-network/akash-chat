'use client';

import { useChat } from '@ai-sdk/react'
import { useUser } from '@auth0/nextjs-auth0/client';
import { DefaultChatTransport, isTextUIPart, type UIMessage } from 'ai';
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWindowSize } from 'usehooks-ts';

import { DEFAULT_SYSTEM_PROMPT } from '@/app/config/api';
import { CACHE_TTL } from '@/app/config/api';
import { models as defaultModels, defaultModel, Model } from '@/app/config/models';
import { ChatHistory } from '@/components/chat/chat-sidebar';
import { useChatHistory } from '@/hooks/use-chat-history';
import { useDatabaseSync } from '@/hooks/use-database-sync';
import { useEncryptedSettings, UserPreferences } from '@/hooks/use-encrypted-settings';
import { Folder, useFolders } from '@/hooks/use-folders';
import { useRateLimit } from '@/hooks/use-rate-limit';
import { safeSetItem } from '@/lib/local-storage-manager';
import { validateAccessToken, processMessages, type ChatMessage as AIMessage } from '@/lib/utils';

const SELECTED_MODEL_KEY = 'selectedModel';
const CURRENT_SYSTEM_PROMPT_KEY = 'currentSystemPrompt';
const CURRENT_TEMPERATURE_KEY = 'currentTemperature';
const CURRENT_TOP_P_KEY = 'currentTopP';

export interface ContextFile {
  id: string;
  name: string;
  content: string;
  type: string;
  preview?: string;
}

interface ChatContextType {
  // Auth state  
  user: any;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  
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
  
  // Saved prompts management
  savedPrompts: any[];
  savePrompt: (name: string, content: string, position?: number) => Promise<any>;
  updatePrompt: (promptId: string, updates: Partial<{ name: string; content: string; position: number }>) => Promise<void>;
  deletePrompt: (promptId: string) => Promise<void>;
  
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
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  contextFiles: ContextFile[];
  setContextFiles: (files: ContextFile[]) => void;
  reload: () => void;
  stop: () => void;
  isPrivateMode: boolean;
  setIsPrivateMode: (isPrivate: boolean) => void;
  handlePrivateModeToggle: () => void;
  
  // Chat management
  selectedChat: string | null;
  setSelectedChat: (chatId: string | null) => void;
  chats: ChatHistory[];
  handleNewChat: () => void;
  handleChatSelect: (chatId: string) => void;
  handleMessagesSelect: (messages: AIMessage[]) => void;
  saveChat: (messages: AIMessage[], model: Model, system: string) => string;
  savePrivateChat: (messages: AIMessage[], model: Model, system: string) => string;
  updateChat: (chatId: string, messages: AIMessage[], model?: Model) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newName: string) => void;
  moveToFolder: (chatId: string, folderId: string | null) => void;
  exportChats: () => void;
  importChats: (file: File) => Promise<void>;
  branchChat: (chatId: string, messageIndex: number) => ChatHistory | null;
  handleBranch: (messageIndex: number) => void;

  getPrivateChatsOnly: () => ChatHistory[];
  getNonPrivateChatsOnly: () => ChatHistory[];
  handleNewPrivateChat: () => void;
  forceUpdateCounter: number;
  syncStatus: 'idle' | 'checking' | 'syncing' | 'loading' | 'complete' | 'error';
  syncProgress: {
    stage: 'checking' | 'loading' | 'merging' | 'syncing' | 'complete';
    message: string;
    percentage: number;
  };
  settingsHasUnsavedChanges: boolean;
  
  // Folder management
  folders: Folder[];
  createFolder: (name: string) => Promise<string>;
  updateFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  refreshFolders: () => void;
  
  // Logout cleanup
  resetAllState: () => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;
  
  // Auth state
  const { user, isLoading: isLoadingAuth } = useUser();
  const isAuthenticated = !!user;
  
  // Rate limiting hook
  const { trackMessageSuccess, trackMessageFailure } = useRateLimit();
  
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
  
  const getSavedSystemPrompt = () => {
    if (typeof window !== 'undefined') {
      const savedPrompt = localStorage.getItem(CURRENT_SYSTEM_PROMPT_KEY);
      return savedPrompt || DEFAULT_SYSTEM_PROMPT;
    }
    return DEFAULT_SYSTEM_PROMPT;
  };

  const getSavedTemperature = () => {
    if (typeof window !== 'undefined') {
      const savedTemp = localStorage.getItem(CURRENT_TEMPERATURE_KEY);
      return savedTemp ? parseFloat(savedTemp) : 0.7;
    }
    return 0.7;
  };

  const getSavedTopP = () => {
    if (typeof window !== 'undefined') {
      const savedTopP = localStorage.getItem(CURRENT_TOP_P_KEY);
      return savedTopP ? parseFloat(savedTopP) : 0.95;
    }
    return 0.95;
  };
  
  const [modelSelection, setModelSelection] = useState(getSavedModel);
  const [availableModels, setAvailableModels] = useState<Model[]>(defaultModels);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  
  // Config state - use encrypted settings hook for system prompt
  const { 
    savedPrompts,
    userPreferences, 
    saveUserPreferences, 
    savePrompt,
    updatePrompt,
    deletePrompt,
    hasUnsavedChanges: settingsHasUnsavedChanges 
  } = useEncryptedSettings();
  
  // Refs to track previous values and prevent unnecessary updates
  const prevUserPreferencesRef = useRef<UserPreferences | null>(null);
  
  // Initialize system prompt from localStorage (userPreferences loads async)
  const [systemPrompt, setSystemPrompt] = useState(() => {
    return getSavedSystemPrompt();
  });
  
  const [temperature, setTemperature] = useState(getSavedTemperature);
  const [topP, setTopP] = useState(getSavedTopP);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // UI state
  const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  // Chat state
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  
  // Custom hooks
  const foldersHook = useFolders();
  const { 
    folders, 
    createFolder, 
    updateFolder, 
    deleteFolder: deleteFolderOnly, 
    refreshFolders,
    mergeDatabaseFolders 
  } = foldersHook;
  
  const chatHistoryHook = useChatHistory(refreshFolders);
  const { 
    chats, 
    saveChat, 
    savePrivateChat,
    updateChat, 
    deleteChat, 
    deleteChatsByFolderId,
    renameChat, 
    moveToFolder, 
    exportChats, 
    importChats, 
    branchChat,
    getPrivateChatsOnly,
    getNonPrivateChatsOnly,
    forceUpdateCounter
  } = chatHistoryHook;

  // Enhanced deleteFolder that also deletes chats in the folder
  const deleteFolder = useCallback((folderId: string) => {
    // First delete all chats in this folder
    deleteChatsByFolderId(folderId);
    // Then delete the folder itself
    deleteFolderOnly(folderId);
  }, [deleteChatsByFolderId, deleteFolderOnly]);
  
  const { syncStatus, progress } = useDatabaseSync({
    mergeDatabaseChats: chatHistoryHook.mergeDatabaseChats,
    mergeDatabaseFolders: mergeDatabaseFolders,
    refreshFolders: refreshFolders
  });

  // Update system prompt when user preferences change
  useEffect(() => {
    if (userPreferences !== null) {
      // userPreferences has been loaded from database
      if (userPreferences.system_prompt !== undefined) {
        // Database has a system prompt - use it
        setSystemPrompt(userPreferences.system_prompt);
      }
      // If system_prompt is undefined, keep the current value (localStorage or default)
    } else if (prevUserPreferencesRef.current !== null) {
      // User logged out - reset to default system prompt
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    }
    prevUserPreferencesRef.current = userPreferences;
  }, [userPreferences]);

  // Reset temperature and topP when user preferences change
  useEffect(() => {
    // Only update if the value has actually changed from the previous userPreferences
    const prevTemp = prevUserPreferencesRef.current?.temperature;
    if (userPreferences?.temperature !== undefined && userPreferences.temperature !== prevTemp) {
      setTemperature(userPreferences.temperature);
    } else if (userPreferences === null && prevUserPreferencesRef.current !== null) {
      // User logged out - reset to default temperature
      setTemperature(0.6);
    }
    prevUserPreferencesRef.current = userPreferences;
  }, [userPreferences?.temperature, userPreferences]);

  useEffect(() => {
    // Only update if the value has actually changed from the previous userPreferences
    const prevTopP = prevUserPreferencesRef.current?.top_p;
    if (userPreferences?.top_p !== undefined && userPreferences.top_p !== prevTopP) {
      setTopP(userPreferences.top_p);
    } else if (userPreferences === null && prevUserPreferencesRef.current !== null) {
      // User logged out - reset to default topP
      setTopP(0.95);
    }
    prevUserPreferencesRef.current = userPreferences;
  }, [userPreferences?.top_p, userPreferences]);

  // Reset model selection when user preferences change
  useEffect(() => {
    // Only update if the value has actually changed from the previous userPreferences
    const prevSelectedModel = prevUserPreferencesRef.current?.selected_model;
    if (userPreferences?.selected_model !== undefined && userPreferences.selected_model !== prevSelectedModel) {
      setModelSelection(userPreferences.selected_model);
    } else if (userPreferences === null && prevUserPreferencesRef.current !== null) {
      // User logged out - reset to default model
      setModelSelection('Qwen3-235B-A22B-FP8');
    }
    prevUserPreferencesRef.current = userPreferences;
  }, [userPreferences?.selected_model, userPreferences]);
  
  // AI chat hook
  const [input, setInput] = useState('');
  // UIMessage carries no timestamp, so remember when each message was first seen
  const messageCreatedAt = useRef(new Map<string, Date>());
  const chatTransport = useMemo(() => new DefaultChatTransport({ api: '/api/chat/' }), []);

  const toChatMessages = useCallback((uiMessages: UIMessage[]): AIMessage[] => uiMessages.map(message => {
    if (!messageCreatedAt.current.has(message.id)) {
      messageCreatedAt.current.set(message.id, new Date());
    }
    return {
      id: message.id,
      role: message.role,
      content: message.parts.filter(isTextUIPart).map(part => part.text).join(''),
      createdAt: messageCreatedAt.current.get(message.id),
    };
  }), []);

  const {
    messages: uiMessages,
    sendMessage,
    regenerate,
    status,
    setMessages: setUIMessages,
    stop,
  } = useChat({
    transport: chatTransport,
    throttle: 250,
    onFinish: async ({ messages: finishedMessages, isAbort, isDisconnect, isError }) => {
      if (isAbort || isDisconnect || isError) {
        return;
      }

      setModelError(null);

      // Track message success for rate limiting
      await trackMessageSuccess();

      const allMessages = toChatMessages(finishedMessages);

      if (!selectedChat) {
        // New chat - save it (private or regular based on mode)
        const chatId = isPrivateMode 
          ? savePrivateChat(allMessages, {
              id: modelSelection,
              name: availableModels.find((m: Model) => m.id === modelSelection)?.name || modelSelection,
            }, systemPrompt)
          : saveChat(allMessages, {
              id: modelSelection,
              name: availableModels.find((m: Model) => m.id === modelSelection)?.name || modelSelection,
            }, systemPrompt);
        setSelectedChat(chatId);
      } else {
        // Existing chat - immediately save to database after model completion
        updateChat(selectedChat, allMessages);
      }
    },
    onError: async (error: Error) => {
      setModelError(error.message);

      // Track message failure for rate limiting
      await trackMessageFailure(error);
    },
  });

  const messages = useMemo(() => toChatMessages(uiMessages), [uiMessages, toChatMessages]);
  const isLoading = status === 'submitted' || status === 'streaming';

  const setMessages = useCallback((chatMessages: AIMessage[]) => {
    setUIMessages(chatMessages.map(message => {
      if (message.createdAt) {
        messageCreatedAt.current.set(message.id, new Date(message.createdAt));
      }
      return { id: message.id, role: message.role, parts: [{ type: 'text', text: message.content }] };
    }));
  }, [setUIMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Sent with each request so the server always gets the current model, prompt and files
  const getRequestBody = () => ({
    model: modelSelection,
    system: systemPrompt,
    temperature,
    topP,
    context: contextFiles.map((f: ContextFile) => ({
      content: f.content,
      name: f.name,
      type: f.type,
    })),
  });

  const reload = () => {
    regenerate({ body: getRequestBody() });
  };

  // Save model selection
  useEffect(() => {
    if (typeof window !== 'undefined' && modelSelection) {
      safeSetItem(SELECTED_MODEL_KEY, modelSelection);
    }
  }, [modelSelection]);

  // Save user preferences to database when authenticated (debounced via useEncryptedSettings)
  useEffect(() => {
    if (user?.sub && sessionInitialized) {
      // Only save if we have actual values to save
      const preferences = {
        selected_model: modelSelection,
        system_prompt: systemPrompt,
        temperature,
        top_p: topP,
        last_selected_chat_id: selectedChat || undefined
      };
      
      // Check if any values have actually changed from current userPreferences
      const hasChanges = !userPreferences || 
        userPreferences.selected_model !== preferences.selected_model ||
        userPreferences.system_prompt !== preferences.system_prompt ||
        userPreferences.temperature !== preferences.temperature ||
        userPreferences.top_p !== preferences.top_p ||
        userPreferences.last_selected_chat_id !== preferences.last_selected_chat_id;
      
      if (hasChanges) {
        saveUserPreferences(preferences);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.sub, sessionInitialized, modelSelection, systemPrompt, temperature, topP, selectedChat]); 

  // Sync messages when they change (but not during streaming)
  // Track if we're currently loading a chat to prevent saves during selection
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // Track the last message length and content to detect actual changes vs. loading
  const prevMessagesRef = useRef<any[]>([]);
  
  useEffect(() => {
    // Only sync if we have a selected chat, messages, and we're not currently streaming or loading
    // Use status to determine if we're streaming: 'streaming' or 'submitted' means don't sync yet
    const isStreaming = status === 'streaming' || status === 'submitted';
    
    // Check if messages have actually changed from the previous state
    const messagesChanged = messages.length !== prevMessagesRef.current.length ||
      JSON.stringify(messages) !== JSON.stringify(prevMessagesRef.current);
    
    // Only update if:
    // 1. We have a selected chat and messages
    // 2. We're not streaming or loading a chat
    // 3. The messages have actually changed (not just loaded)
    // 4. We're not currently loading a chat
    if (selectedChat && messages.length > 0 && !isStreaming && !isLoadingChat && messagesChanged) {
      // Check that this isn't just a chat loading event by ensuring we have a previous messages state
      if (prevMessagesRef.current.length > 0 || messages.length > 1) {
        updateChat(selectedChat, messages, undefined, true);
      }
    }
    
    // Update the ref after checking
    prevMessagesRef.current = [...messages];
  }, [messages, status, updateChat, isLoadingChat, selectedChat]); // Added selectedChat back to detect loading

  // Save system prompt to localStorage (for backward compatibility)
  useEffect(() => {
    if (typeof window !== 'undefined' && systemPrompt !== undefined) {
      safeSetItem(CURRENT_SYSTEM_PROMPT_KEY, systemPrompt);
    }
  }, [systemPrompt]);

  // Save temperature to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && temperature !== undefined) {
      safeSetItem(CURRENT_TEMPERATURE_KEY, temperature.toString());
    }
  }, [temperature]);

  // Save top-p to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && topP !== undefined) {
      safeSetItem(CURRENT_TOP_P_KEY, topP.toString());
    }
  }, [topP]);

  // Cleanup private chats when the component unmounts or page is unloaded
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedChat) {
        const currentChat = chats.find((c: { id: string; }) => c.id === selectedChat);
        // Only cleanup if the chat is private AND private mode is still enabled
        if (currentChat && currentChat.isPrivate && isPrivateMode) {
          // Remove from localStorage when leaving the page
          const privateChats = JSON.parse(localStorage.getItem('privateChats') || '{}');
          delete privateChats[currentChat.id];
          safeSetItem('privateChats', JSON.stringify(privateChats));
        }
      }
      // Only clean up private chats in localStorage if private mode is enabled
      if (isPrivateMode) {
        localStorage.removeItem('privateChats');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also cleanup on component unmount
      if (selectedChat) {
        const currentChat = chats.find((c: { id: string; }) => c.id === selectedChat);
        // Only cleanup if the chat is private AND private mode is still enabled
        if (currentChat && currentChat.isPrivate && isPrivateMode) {
          // Remove from localStorage when component unmounts
          const privateChats = JSON.parse(localStorage.getItem('privateChats') || '{}');
          delete privateChats[currentChat.id];
          safeSetItem('privateChats', JSON.stringify(privateChats));
        }
      }
      // Only clean up private chats in localStorage on unmount if private mode is enabled
      if (isPrivateMode) {
        localStorage.removeItem('privateChats');
      }
    };
  }, [selectedChat, chats, isPrivateMode]);

  // Clean up old private chats from localStorage on app startup only if private mode was enabled
  useEffect(() => {
    if (sessionInitialized) {
      const privateChats = JSON.parse(localStorage.getItem('privateChats') || '{}');
      const privateChatCount = Object.keys(privateChats).length;
      // Only clean up if there are private chats and we're starting in private mode
      // This allows chats that had private mode disabled to persist
      if (privateChatCount > 0 && isPrivateMode) {
        localStorage.removeItem('privateChats');
      }
    }
  }, [sessionInitialized, isPrivateMode]);

  // Effect hooks
  useEffect(() => {
    const init = async () => {
      try {
        const statusResponse = await fetch('/api/auth/status/');
        if (statusResponse.ok) {
          const { requiresAccessToken } = await statusResponse.json();

          // If an access token is required, try to establish session
          // If it fails (no valid session cookie), show the access token dialog
          if (requiresAccessToken) {
            const response = await fetch('/api/auth/session/');
            if (!response.ok) {
              const data = await response.json();
              if (response.status === 403 && data.error === 'Access token required') {
                setIsAccessError(true);
                setSessionInitialized(true);
                return;
              }
            }
          }
        }

        // Try to establish session (works with or without access token requirement)
        const response = await fetch('/api/auth/session/');
        if (!response.ok) {
          const data = await response.json();
          if (response.status === 403 && (data.error === 'Access token required' || data.error === 'Invalid Access token')) {
            setIsAccessError(true);
          } else {
            throw new Error('Failed to initialize session');
          }
        }
        setSessionInitialized(true);
      } catch (error) {
        setSessionError('Unable to establish a secure session. Please try refreshing the page.');
      }
    };
    init();
  }, []);

  // Initialize user when they log in (create LiteLLM API key)
  useEffect(() => {
    const initializeUser = async () => {
      if (!user?.sub || !sessionInitialized || isLoadingAuth) {
        return;
      }

      try {
        const response = await fetch('/api/user/initialize', {
          method: 'POST',
          credentials: 'include'
        });

        if (!response.ok) {
          console.error('Failed to initialize user:', await response.text());
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    initializeUser();
  }, [user?.sub, sessionInitialized, isLoadingAuth]);

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
        setModelError('Unable to load chat models. Please try again later.');
        // Fallback to default models for model pages
        setAvailableModels(defaultModels.map(model => ({
          ...model,
          available: true
        })));
      } finally {
        setIsLoadingModels(false);
      }
    };
    
    fetchModels();
  }, []); 

  useEffect(() => {
    const model = availableModels.find((m: Model) => m.id === modelSelection);
    if (model) {
      setTemperature(model.temperature || 0.7);
      setTopP(model.top_p || 0.95);
    }
  }, [modelSelection, availableModels]);

  // Handle access token submission
  const handleAccessTokenSubmit = async () => {
    if (accessTokenInput.trim()) {
      try {
        const isValid = await validateAccessToken(accessTokenInput.trim());

        if (!isValid) {
          setModelError('Access token is invalid. Please check and try again.');
          return;
        }

        // Token is valid and session created
        setIsAccessError(false);
        setModelError(null);
        setAccessTokenInput('');
        setSessionInitialized(true);
      } catch (error) {
        setModelError('Failed to validate access token. Please try again.');
      }
    }
  };

  const handleNewChat = () => {
    // If currently on a private chat, store it in localStorage when creating a new chat
    if (selectedChat) {
      const currentChat = chats.find((c: { id: string; }) => c.id === selectedChat);
      if (currentChat && currentChat.isPrivate) {
        // Store the private chat in localStorage
        const privateChats = JSON.parse(localStorage.getItem('privateChats') || '{}');
        privateChats[currentChat.id] = currentChat;
        localStorage.setItem('privateChats', JSON.stringify(privateChats));
        // Remove from memory but keep in localStorage
        deleteChat(selectedChat);
      }
    }
    
    setMessages([]);
    setSelectedChat(null);
    setModelError(null);
    setIsPrivateMode(false);
  };

  const handleNewPrivateChat = () => {
    // If currently on a private chat, store it in localStorage when creating a new private chat
    if (selectedChat) {
      const currentChat = chats.find((c: { id: string; }) => c.id === selectedChat);
      if (currentChat && currentChat.isPrivate) {
        // Store the private chat in localStorage
        const privateChats = JSON.parse(localStorage.getItem('privateChats') || '{}');
        privateChats[currentChat.id] = currentChat;
        localStorage.setItem('privateChats', JSON.stringify(privateChats));
        // Remove from memory but keep in localStorage
        deleteChat(selectedChat);
      }
    }
    
    setMessages([]);
    setSelectedChat(null);
    setModelError(null);
    setIsPrivateMode(true);
  };

  const handleChatSelect = (chatId: string) => {
    if (isLoading) {return;}
    
    // Set loading flag to prevent saves during chat switching
    setIsLoadingChat(true);
    
    // If switching away from a private chat, store it in localStorage instead of deleting
    if (selectedChat) {
      const currentChat = chats.find((c: { id: string; }) => c.id === selectedChat);
      if (currentChat && currentChat.isPrivate && selectedChat !== chatId) {
        // Store the private chat in localStorage
        const privateChats = JSON.parse(localStorage.getItem('privateChats') || '{}');
        privateChats[currentChat.id] = currentChat;
        localStorage.setItem('privateChats', JSON.stringify(privateChats));
        // Remove from memory but keep in localStorage
        deleteChat(selectedChat);
      }
    }
    
    // Check if the target chat is a private chat that might be in localStorage
    const privateChats = JSON.parse(localStorage.getItem('privateChats') || '{}');
    const storedPrivateChat = privateChats[chatId];
    
    if (storedPrivateChat) {
      // Remove from localStorage since we're about to restore it
      delete privateChats[chatId];
      localStorage.setItem('privateChats', JSON.stringify(privateChats));
      
      // Restore the private chat by recreating it
      const restoredChatId = savePrivateChat(
        storedPrivateChat.messages,
        storedPrivateChat.model,
        storedPrivateChat.system || ''
      );
      
      setSelectedChat(restoredChatId);
      setModelSelection(storedPrivateChat.model.id);
      setSystemPrompt(storedPrivateChat.system || DEFAULT_SYSTEM_PROMPT);
      setMessages(storedPrivateChat.messages || []);
      setIsPrivateMode(true);
      setModelError(null);
      
      // Clear loading flag after a brief delay
      setTimeout(() => setIsLoadingChat(false), 100);
      return;
    }
    
    const chat = chats.find((c: { id: string; }) => c.id === chatId);
    if (chat) {
      setSelectedChat(chatId);
      setModelSelection(chat.model.id);
      setSystemPrompt(chat.system || DEFAULT_SYSTEM_PROMPT);
      // Load the chat's messages
      setMessages(chat.messages || []);
      // Set private mode based on the selected chat's privacy setting
      setIsPrivateMode(chat.isPrivate || false);
      setModelError(null);
    }
    
    // Clear loading flag after a brief delay to allow state to settle
    setTimeout(() => setIsLoadingChat(false), 100);
  };

  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModelError(null);

    // If there's a selected chat, update the model information before submitting
    if (selectedChat) {
      const currentChat = chats.find((chat: { id: string; }) => chat.id === selectedChat);
      if (currentChat && currentChat.model.id !== modelSelection && messages.length > 0) {
        // Only update if we have messages and they appear to belong to this chat
        // This prevents accidentally updating a chat with the wrong messages during chat switching
        const messagesMatch = messages.length === currentChat.messages.length;
        if (messagesMatch) {
          updateChat(selectedChat, messages, {
            id: modelSelection,
            name: availableModels.find((m: Model) => m.id === modelSelection)?.name || modelSelection,
          });
        }
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

    if (!input) {return;}

    sendMessage({ text: input }, { body: getRequestBody() });
    setInput('');

  };

  const handleMessagesSelect = (messages: AIMessage[]) => {
    setMessages(messages);
  };

  // Handle branching from a specific message
  const handleBranch = (messageIndex: number) => {
    if (!selectedChat || isLoading) {return;}

    const sourceChat = chats.find((chat: { id: string; }) => chat.id === selectedChat);
    if (!sourceChat) {return;}
    
    const branchedChat = branchChat(selectedChat, messageIndex);
    
    if (branchedChat) {
      // Set loading flag to prevent saves during chat switching
      setIsLoadingChat(true);
      
      // Directly switch to the branched chat using the chat object
      setSelectedChat(branchedChat.id);
      setModelSelection(branchedChat.model.id);
      setSystemPrompt(branchedChat.system || DEFAULT_SYSTEM_PROMPT);
      setMessages(branchedChat.messages || []);
      setIsPrivateMode(branchedChat.isPrivate || false);
      setModelError(null);
      
      // Clear loading flag after a brief delay
      setTimeout(() => setIsLoadingChat(false), 100);
    }
  };

  const handlePrivateModeToggle = () => {
    const newPrivateMode = !isPrivateMode;
    
    // If disabling private mode and we have a current private chat with messages
    if (!newPrivateMode && isPrivateMode && selectedChat && messages.length > 0) {
      const currentChat = chats.find((c: { id: string; }) => c.id === selectedChat);
      if (currentChat && currentChat.isPrivate) {
        // Convert private chat to regular chat
        const newChatId = saveChat(messages, {
          id: modelSelection,
          name: availableModels.find((m: Model) => m.id === modelSelection)?.name || modelSelection,
        }, systemPrompt);
        
        // Delete the old private chat
        deleteChat(selectedChat);
        
        // Update to the new regular chat
        setSelectedChat(newChatId);
      }
    }
    
    setIsPrivateMode(newPrivateMode);
  };

  // Centralized state reset function for logout
  const resetAllState = useCallback(() => {
    try {
      // 1. Reset session state
      setSessionInitialized(false);
      setSessionError(null);
      setIsAccessError(false);
      setAccessTokenInput('');
      
      // 2. Reset model state to defaults
      setModelSelection(defaultModel);
      setAvailableModels(defaultModels);
      setIsLoadingModels(true);
      setModelError(null);
      
      // 3. Reset config state to defaults
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
      setTemperature(0.7);
      setTopP(0.95);
      setIsConfigOpen(false);
      
      // 4. Reset UI state
      setSidebarOpen(!isMobile);
      
      // 5. Reset chat state
      setMessages([]);
      setInput('');
      setSelectedChat(null);
      setContextFiles([]);
      setIsPrivateMode(false);
      setIsLoadingChat(false);
      
      // 6. Clear AI chat state by calling stop if needed
      if (isLoading) {
        stop();
      }
      
      // 7. Reset internal tracking refs
      prevMessagesRef.current = [];
      prevUserPreferencesRef.current = null;
      
    } catch (error) {
      console.error('Error during state reset:', error);
    }
  }, [isMobile, isLoading, stop, setMessages, setInput]);

  const value: ChatContextType = {
    // Auth state
    user,
    isAuthenticated,
    isLoadingAuth,
    
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
    
    // Saved prompts management
    savedPrompts,
    savePrompt,
    updatePrompt,
    deletePrompt,
    
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
    status,
    contextFiles,
    setContextFiles,
    reload,
    stop,
    isPrivateMode,
    setIsPrivateMode,
    handlePrivateModeToggle,
    
    // Chat management
    selectedChat,
    setSelectedChat,
    chats,
    handleNewChat,
    handleNewPrivateChat,
    handleChatSelect,
    handleMessagesSelect,
    saveChat,
    savePrivateChat,
    updateChat,
    deleteChat,
    renameChat,
    moveToFolder,
    exportChats,
    importChats,
    branchChat,
    handleBranch,
    getPrivateChatsOnly,
    getNonPrivateChatsOnly,
    forceUpdateCounter,
    syncStatus,
    syncProgress: progress,
    settingsHasUnsavedChanges,
    
    // Folder management
    folders,
    createFolder,
    updateFolder,
    deleteFolder,
    refreshFolders,
    
    // Logout cleanup
    resetAllState,
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