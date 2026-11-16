import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import type { ChatMessage as Message } from '@/lib/utils';
import { safeSetItem } from '@/lib/local-storage-manager';

function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface ChatHistory {
  id: string;
  name: string;
  messages: Message[];
  model: {
    id: string;
    name: string;
  };
  prompt?: string;
  system?: string;
  folderId: string | null;
  parentChatId?: string;
  branchedAtIndex?: number;
  source: 'local' | 'database';
  databaseId?: string; // For tracking sync status
  lastSynced?: string; // ISO timestamp of last sync
  isPrivate?: boolean; // Private chats never sync to database
}

function generateChatName(messages: Message[]): string {
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  if (!firstUserMessage) return 'New Chat';
  
  const content = firstUserMessage.content;
  if (content.length <= 25) return content;
  
  // Try to find a natural break point
  const breakPoints = [
    content.indexOf('.', 20),
    content.indexOf('?', 20),
    content.indexOf('!', 20),
    content.indexOf(',', 20),
    content.indexOf(' ', 20),
  ].filter(point => point !== -1);

  const breakPoint = breakPoints.length > 0 
    ? Math.min(...breakPoints) 
    : (content.length > 25 ? 25 : content.length);

  return content.slice(0, breakPoint) + (breakPoint < content.length ? '...' : '');
}

export function useChatHistory(refreshFolders?: () => void) {
  const { user } = useUser();
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [pendingSyncs, setPendingSyncs] = useState<Set<string>>(new Set());
  const [lastMergedChatIds, setLastMergedChatIds] = useState<Set<string>>(new Set());
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  const [mergeTimeoutId, setMergeTimeoutId] = useState<NodeJS.Timeout | null>(null);



  // Load chats from localStorage on mount with migration
  useEffect(() => {
    const savedChats = localStorage.getItem('chats');
    
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        
        // Migrate existing chats to include source field
        const migratedChats = parsedChats.map((chat: any) => ({
          ...chat,
          source: chat.source || 'local', // Default existing chats to 'local'
        }));
        
        setChats(migratedChats);
        
        // Save migrated chats back to localStorage
        if (migratedChats.some((chat: any) => !chat.source)) {
          safeSetItem('chats', JSON.stringify(migratedChats));
        }
      } catch (error) {
        localStorage.removeItem('chats');
      }
    }
  }, []);

  // Save chats to localStorage whenever they change (with debouncing)
  useEffect(() => {
    // Debounce localStorage saves to avoid conflicts during auth transitions
    const timeoutId = setTimeout(() => {
      try {
        // If user is logged in, save all chats (local + database) for persistence
        // If user is logged out, save only local chats
        const chatsToSave = user?.sub ? chats : chats.filter(chat => chat.source === 'local');
        
        safeSetItem('chats', JSON.stringify(chatsToSave));
      } catch (error) {
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [chats, user?.sub]);

  // Effect to handle auth state changes  
  useEffect(() => {
    if (user?.sub) {
      setForceUpdateCounter(prev => prev + 1);
    } else if (user !== undefined) {
      
      // Clear any pending merge timeout
      if (mergeTimeoutId) {
        clearTimeout(mergeTimeoutId);
        setMergeTimeoutId(null);
      }
      
      setChats(prevChats => {
        const localChats = prevChats.filter(chat => chat.source === 'local');
        return localChats;
      });
      
      setPendingSyncs(new Set());
      setLastMergedChatIds(new Set());
      setForceUpdateCounter(prev => prev + 1);
    }
  }, [user?.sub, user, mergeTimeoutId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (mergeTimeoutId) {
        clearTimeout(mergeTimeoutId);
      }
    };
  }, [mergeTimeoutId]);

  // Database sync functions (defined first to avoid initialization issues)
  const syncChatToDatabase = useCallback(async (chat: ChatHistory): Promise<boolean> => {
    if (!user?.sub) {
      return false;
    }
    
    // Prevent private chats from being synced to database
    if (chat.isPrivate) {
      return false;
    }
    
    // Prevent concurrent syncs of the same chat
    if (pendingSyncs.has(chat.id)) {
      return false;
    }

    try {
      
      // Validate chat data before sending
      if (!chat.id || !chat.name || !chat.model) {
        throw new Error('Invalid chat data: missing required fields');
      }
      
      // Add folder information for lazy migration if chat has a folderId
      let updatedChat = chat;
      
      if (chat.folderId) {
        const localFoldersStr = localStorage.getItem('folders');
        if (localFoldersStr) {
          const localFolders = JSON.parse(localFoldersStr);
          const folder = localFolders.find((f: any) => f.id === chat.folderId);
          if (folder) {
            updatedChat = {
              ...chat,
              folderInfo: {
                name: folder.name
              }
            } as any;
          }
        }
      }
      
      
      const requestBody = JSON.stringify(updatedChat);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
        signal: controller.signal
      });
      
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      
      // Check if a folder was created/migrated during sync
      const folderWasCreated = result.data?.needsFolderUpdate && result.data?.originalFolderId && result.data?.newFolderId;
      const originalFolderId = result.data?.originalFolderId;
      const newFolderId = result.data?.newFolderId;

      // Update chat with database sync metadata and change source to 'database'
      setChats(prevChats => 
        prevChats.map(c => 
          c.id === chat.id 
            ? { 
                ...c, 
                source: 'database', 
                databaseId: result.data?.chatId || result.chatId, 
                lastSynced: result.lastSynced,
                // Update folder ID if a folder was created during sync
                folderId: folderWasCreated ? newFolderId : c.folderId
              }
            : c
        )
      );

      // If a folder was created, update all local references
      if (folderWasCreated && originalFolderId && newFolderId) {
        
        // Update ALL chats in local state that reference the old folder ID
        setChats(prevChats => 
          prevChats.map(c => 
            c.folderId === originalFolderId 
              ? { ...c, folderId: newFolderId }
              : c
          )
        );

        // Update chats in localStorage to use new folder ID
        const savedChats = localStorage.getItem('chats');
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats);
          const updatedChats = parsedChats.map((c: any) =>
            c.folderId === originalFolderId ? { ...c, folderId: newFolderId } : c
          );
          safeSetItem('chats', JSON.stringify(updatedChats));
        }

        // Update folders in localStorage to replace local ID with database ID
        const savedFolders = localStorage.getItem('folders');
        if (savedFolders) {
          const parsedFolders = JSON.parse(savedFolders);
          const updatedFolders = parsedFolders.map((f: any) => 
            f.id === originalFolderId ? { ...f, id: newFolderId } : f
          );
          safeSetItem('folders', JSON.stringify(updatedFolders));
          
          // Refresh folder state to reflect the changes
          if (refreshFolders) {
            refreshFolders();
          }
        }
      }

      return true;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
      } else {
      }
      return false;
    } finally {
      setPendingSyncs(prev => {
        const newSet = new Set(prev);
        newSet.delete(chat.id);
        return newSet;
      });
    }
  }, [user?.sub, pendingSyncs]);

  const deleteChatFromDatabase = useCallback(async (chatId: string): Promise<boolean> => {
    if (!user?.sub) return false;

    // Check if the chat is private before attempting to delete
    const chat = chats.find(c => c.id === chatId || c.databaseId === chatId);
    if (chat?.isPrivate) {
      return false;
    }

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }, [user?.sub, chats]);

  const updateChatInDatabase = useCallback(async (chatId: string, updates: Partial<ChatHistory>): Promise<boolean> => {
    if (!user?.sub) return false;

    // Check if the chat is private before attempting to update
    const chat = chats.find(c => c.id === chatId);
    if (chat?.isPrivate) {
      return false;
    }

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      
      // Update chat with database sync metadata
      setChats(prevChats => 
        prevChats.map(c => 
          c.id === chatId 
            ? { ...c, lastSynced: result.updatedAt }
            : c
        )
      );

      return true;
    } catch (error) {
      return false;
    }
  }, [user?.sub, chats]);

  const saveChat = useCallback((messages: Message[], model: { id: string; name: string }, system: string, isPrivate = false) => {
    const newChat: ChatHistory = {
      id: generateUUID(),
      name: generateChatName(messages),
      messages,
      model,
      system,
      folderId: null,
      source: 'local', // All new chats are local by default
      isPrivate, // Mark if this is a private chat
    };

    setChats(prevChats => [...prevChats, newChat]);
    
    // Sync to database if user is logged in AND chat is not private
    if (user?.sub && !isPrivate) {
      syncChatToDatabase(newChat).catch(error => 
        console.error('Failed to sync new chat to database:', error)
      );
    }
    
    return newChat.id;
  }, [user?.sub, syncChatToDatabase]);

  const savePrivateChat = useCallback((messages: Message[], model: { id: string; name: string }, system: string) => {
    return saveChat(messages, model, system, true);
  }, [saveChat]);

  const updateChat = useCallback((chatId: string, messages: Message[], model?: { id: string; name: string }, shouldSync: boolean = true) => {
    setChats(prevChats => 
      prevChats.map(chat => {
        if (chat.id === chatId) {
          const updatedChat = {
            ...chat,
            messages,
            name: chat.name === 'New Chat' ? generateChatName(messages) : chat.name,
            ...(model ? { model } : {}),
          };
          
          // Check if messages have actually changed
          const messagesChanged = chat.messages.length !== messages.length || 
            JSON.stringify(chat.messages) !== JSON.stringify(messages);
          
          if (shouldSync && user?.sub && messagesChanged && !pendingSyncs.has(chat.id) && !chat.isPrivate) {
            
            // Immediately mark as pending to prevent duplicate syncs
            setPendingSyncs(prev => new Set(prev).add(chat.id));
            // Defer sync slightly to ensure state is updated, but not too long
            setTimeout(() => {
              syncChatToDatabase(updatedChat).catch(error => 
                console.error('Failed to sync updated chat to database:', error)
              );
            }, 50);
          }
          
          return updatedChat;
        }
        return chat;
      })
    );
  }, [user?.sub, syncChatToDatabase, pendingSyncs]);

  const selectChat = useCallback((chatId: string) => {
    // Pure selection - no database operations, no saving
    // This should be used when switching between chats in the sidebar
    const chat = chats.find(c => c.id === chatId);
    return chat || null;
  }, [chats]);

  const branchChat = useCallback((chatId: string, messageIndex: number) => {
    const sourceChat = chats.find(chat => chat.id === chatId);
    if (!sourceChat) return null;

    // Create a new chat with messages up to the specified index
    const branchedMessages = sourceChat.messages.slice(0, messageIndex + 1);
    if (branchedMessages.length === 0) return null;

    // Always create branches as local chats - they will sync to database when a new message is added
    const newChat: ChatHistory = {
      id: generateUUID(),
      name: "Branch of " + sourceChat.name,
      messages: branchedMessages,
      model: sourceChat.model,
      system: sourceChat.system,
      folderId: sourceChat.folderId,
      parentChatId: sourceChat.id,
      branchedAtIndex: messageIndex,
      source: 'local', // Always start as local, sync happens on first new message
      isPrivate: sourceChat.isPrivate, // Inherit privacy setting from source chat
    };

    // Add the new chat to state
    setChats(prevChats => [...prevChats, newChat]);
    
    return newChat;
  }, [chats]);

  const renameChat = useCallback((chatId: string, newName: string) => {
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          const updatedChat = { ...chat, name: newName };
          
          // Sync rename to database if user is logged in AND chat is not private
          if (user?.sub && !chat.isPrivate) {
            updateChatInDatabase(chatId, { name: newName }).catch(error => 
              console.error('Failed to sync chat rename to database:', error)
            );
          }
          
          return updatedChat;
        }
        return chat;
      })
    );
  }, [user?.sub, updateChatInDatabase]);

  const moveToFolder = useCallback((chatId: string, folderId: string | null) => {
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          const updatedChat = { ...chat, folderId };
          
          // Sync folder move to database if user is logged in AND chat is not private
          if (user?.sub && !chat.isPrivate) {
            updateChatInDatabase(chatId, { folderId }).catch(error => 
              console.error('Failed to sync chat folder move to database:', error)
            );
          }
          
          return updatedChat;
        }
        return chat;
      })
    );
  }, [user?.sub, updateChatInDatabase]);

  const deleteChat = useCallback((chatId: string) => {
    const chatToDelete = chats.find(chat => chat.id === chatId);
    
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    
    // Delete from database if user is logged in AND chat is not private
    if (user?.sub && chatToDelete && !chatToDelete.isPrivate) {
      // For database chats, delete directly using the chat ID
      // For local chats that were synced, delete using the database ID if available
      const databaseId = chatToDelete.source === 'database' ? chatToDelete.id : chatToDelete.databaseId;
      if (databaseId) {
        deleteChatFromDatabase(databaseId).catch(error => 
          console.error('Failed to delete chat from database:', error)
        );
      } else if (chatToDelete.source === 'local') {
        // For local chats without database ID, try to delete using the local ID
        // This handles cases where the chat was created locally but never synced
        deleteChatFromDatabase(chatId).catch(error => 
          console.error('Failed to delete local chat from database:', error)
        );
      }
    }
  }, [user?.sub, chats, deleteChatFromDatabase]);

  const cleanupDatabaseChats = useCallback(() => {
    setChats(prevChats => {
      const localChats = prevChats.filter(chat => chat.source === 'local');
      return localChats;
    });
    // Also clear any pending syncs and merge tracking on logout
    setPendingSyncs(new Set());
    setLastMergedChatIds(new Set());
    // Force update to ensure UI re-renders
    setForceUpdateCounter(prev => prev + 1);
  }, []);

  const mergeDatabaseChats = useCallback((databaseChats: any[]) => {
    // Don't merge if user is logged out
    if (!user?.sub) {
      return;
    }
    
    // Clear any existing timeout to prevent multiple merges
    if (mergeTimeoutId) {
      clearTimeout(mergeTimeoutId);
    }
    
    // Debounce the merge to prevent multiple rapid calls
    const timeoutId = setTimeout(() => {
      // Check if we're trying to merge the same chats again
      const incomingChatIds = new Set(databaseChats.map(chat => chat.id));
      const isSameMerge = incomingChatIds.size === lastMergedChatIds.size && 
        Array.from(incomingChatIds).every(id => lastMergedChatIds.has(id));
      
      if (isSameMerge && databaseChats.length > 0) {
        return;
      }
      
      // Update tracking
      setLastMergedChatIds(incomingChatIds);
      
      setChats(prevChats => {
        // Keep only local chats and remove any existing database chats to avoid duplicates
        const localChats = prevChats.filter(chat => chat.source === 'local');
        
        // Format database chats with proper source marking
        const formattedDbChats: ChatHistory[] = databaseChats.map(dbChat => {
          // Check if data is already formatted (from data-sync.ts) or raw (direct API)
          const isAlreadyFormatted = dbChat.model && typeof dbChat.model === 'object' && dbChat.model.id;
          
          if (isAlreadyFormatted) {
            // Data comes from data-sync.ts, already formatted
            return {
              ...dbChat,
              source: 'database' as const,
              databaseId: dbChat.databaseId || dbChat.id,
              lastSynced: dbChat.lastSynced || new Date().toISOString(),
            };
          } else {
            // Raw database format, needs formatting
            return {
              id: dbChat.id || generateUUID(),
              name: dbChat.name || 'Unnamed Chat',
              messages: dbChat.messages || [],
              model: {
                id: dbChat.model_id || 'unknown',
                name: dbChat.model_name || 'Unknown Model'
              },
              system: dbChat.system_prompt_decrypted || '',
              folderId: dbChat.folder_id || null,
              parentChatId: dbChat.parent_chat_id || undefined,
              branchedAtIndex: dbChat.branched_at_index || undefined,
              source: 'database' as const,
              databaseId: dbChat.id,
              lastSynced: new Date().toISOString(),
            };
          }
        });
        
        // Combine local + database chats, ensuring no duplicates
        const allChats = [...localChats, ...formattedDbChats];
        
        // Remove duplicates by ID (in case of any overlap)
        const seenIds = new Set();
        const combinedChats = allChats.filter(chat => {
          if (seenIds.has(chat.id)) {
            return false;
          }
          seenIds.add(chat.id);
          return true;
        });
        
        // Force a sidebar update after successful merge
        setForceUpdateCounter(prev => {
          const newCounter = prev + 1;
          return newCounter;
        });
        
        // Add a small delay to ensure state propagation
        setTimeout(() => {
          setForceUpdateCounter(prev => prev + 1);
        }, 100);
        
        // Return the new state - this should trigger a re-render
        // Use a more explicit state update to ensure React detects the change
        const newState = [...combinedChats];
        return newState;
      });
    }, 50); // 50ms debounce delay
    
    setMergeTimeoutId(timeoutId);
  }, [lastMergedChatIds, user?.sub, mergeTimeoutId]);

  const getLocalChatsOnly = useCallback(() => {
    return chats.filter(chat => chat.source === 'local');
  }, [chats]);

  const getDatabaseChatsOnly = useCallback(() => {
    return chats.filter(chat => chat.source === 'database');
  }, [chats]);

  const getPrivateChatsOnly = useCallback(() => {
    return chats.filter(chat => chat.isPrivate === true);
  }, [chats]);

  const getNonPrivateChatsOnly = useCallback(() => {
    return chats.filter(chat => !chat.isPrivate);
  }, [chats]);

  const toggleChatPrivacy = useCallback((chatId: string) => {
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          const updatedChat = { ...chat, isPrivate: !chat.isPrivate };
          
          // If making chat public and user is logged in, sync to database
          if (!updatedChat.isPrivate && user?.sub && chat.source === 'local') {
            syncChatToDatabase(updatedChat).catch(error => 
              console.error('Failed to sync newly public chat to database:', error)
            );
          }
          
          // If making chat private and it was synced to database, delete it from database
          if (updatedChat.isPrivate && user?.sub && chat.databaseId) {
            deleteChatFromDatabase(chat.databaseId).catch(error => 
              console.error('Failed to delete newly private chat from database:', error)
            );
            // Update the chat to remove database metadata
            updatedChat.source = 'local';
            updatedChat.databaseId = undefined;
            updatedChat.lastSynced = undefined;
          }
          
          return updatedChat;
        }
        return chat;
      })
    );
  }, [user?.sub, syncChatToDatabase, deleteChatFromDatabase]);

  // Manual chat sync disabled - chats use lazy migration on first message
  const syncAllLocalChatsToDatabase = useCallback(async (): Promise<{ success: number; failed: number }> => {
    // Return success without doing anything - lazy migration handles it
    return { success: 0, failed: 0 };
  }, []);

  const exportChats = useCallback(() => {
    // Get folders from localStorage
    const foldersStr = localStorage.getItem('folders');
    const folders = foldersStr ? JSON.parse(foldersStr) : [];

    // Get saved system prompts from localStorage
    const savedPromptsStr = localStorage.getItem('savedSystemPrompts');
    const prompts = savedPromptsStr ? JSON.parse(savedPromptsStr) : [];

    const exportData = {
      version: 1,
      timestamp: new Date().toISOString(),
      folders,
      prompts,
      chats
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [chats]);

  const importChats = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const importData = JSON.parse(content);
          
          // Basic validation
          if (!importData.chats || !Array.isArray(importData.chats)) {
            throw new Error('Invalid chat data format');
          }

          // Import folders if present
          if (importData.folders && Array.isArray(importData.folders)) {
            const existingFoldersStr = localStorage.getItem('folders');
            const existingFolders = existingFoldersStr ? JSON.parse(existingFoldersStr) : [];
            const existingFolderIds = new Set(existingFolders.map((f: any) => f.id));
            
            // Merge folders, avoiding duplicates
            const newFolders = importData.folders.filter(
              (folder: any) => !existingFolderIds.has(folder.id)
            );
            safeSetItem('folders', JSON.stringify([...existingFolders, ...newFolders]));
          }

          // Import saved system prompts if present
          if (importData.prompts && Array.isArray(importData.prompts)) {
            const existingPromptsStr = localStorage.getItem('savedSystemPrompts');
            const existingPrompts = existingPromptsStr ? JSON.parse(existingPromptsStr) : [];
            const existingPromptNames = new Set(existingPrompts.map((p: any) => p.name));
            
            // Merge prompts, avoiding duplicates by name
            const newPrompts = importData.prompts.filter(
              (prompt: any) => !existingPromptNames.has(prompt.name)
            );
            safeSetItem('savedSystemPrompts', JSON.stringify([...existingPrompts, ...newPrompts]));
          }

          // Merge imported chats with existing chats, avoiding duplicates
          setChats(prevChats => {
            const existingIds = new Set(prevChats.map(chat => chat.id));
            const newChats = importData.chats.filter(
              (chat: ChatHistory) => !existingIds.has(chat.id)
            ).map((chat: ChatHistory) => ({
              ...chat,
              source: 'local' // Mark imported chats as local
            }));
            
            const updatedChats = [...prevChats, ...newChats];
            
            // Immediately save to localStorage to ensure persistence
            try {
              safeSetItem('chats', JSON.stringify(updatedChats));
            } catch (error) {
            }
            
            return updatedChats;
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  const deleteChatsByFolderId = useCallback((folderId: string) => {
    // Find all chats in this folder
    const chatsToDelete = chats.filter(chat => 
      chat.folderId === folderId
    );
    
    // Delete each chat
    chatsToDelete.forEach(chat => {
      deleteChat(chat.id);
    });
  }, [chats, deleteChat]);

  return {
    chats,
    saveChat,
    savePrivateChat,
    updateChat,
    selectChat,
    renameChat,
    moveToFolder,
    deleteChat,
    deleteChatsByFolderId,
    exportChats,
    importChats,
    branchChat,
    cleanupDatabaseChats,
    mergeDatabaseChats,
    getLocalChatsOnly,
    getDatabaseChatsOnly,
    getPrivateChatsOnly,
    getNonPrivateChatsOnly,
    toggleChatPrivacy,
    syncChatToDatabase,
    deleteChatFromDatabase,
    updateChatInDatabase,
    syncAllLocalChatsToDatabase,
    forceUpdateCounter,
  };
} 