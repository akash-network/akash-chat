import { useState, useEffect, useCallback } from 'react';
import { Message } from 'ai';

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

export function useChatHistory() {
  const [chats, setChats] = useState<ChatHistory[]>([]);

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
      try {
        setChats(JSON.parse(savedChats));
      } catch (error) {
        console.error('Failed to parse saved chats:', error);
        localStorage.removeItem('chats');
      }
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  const saveChat = useCallback((messages: Message[], model: { id: string; name: string }, system: string) => {
    const newChat: ChatHistory = {
      id: generateUUID(),
      name: generateChatName(messages),
      messages,
      model,
      system,
      folderId: null,
    };

    setChats(prevChats => [...prevChats, newChat]);
    return newChat.id;
  }, []);

  const updateChat = useCallback((chatId: string, messages: Message[], model?: { id: string; name: string }) => {
    setChats(prevChats => 
      prevChats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages,
            name: chat.name === 'New Chat' ? generateChatName(messages) : chat.name,
            ...(model ? { model } : {}),
          };
        }
        return chat;
      })
    );
  }, []);

  const branchChat = useCallback((chatId: string, messageIndex: number) => {
    const sourceChat = chats.find(chat => chat.id === chatId);
    if (!sourceChat) return null;

    // Create a new chat with messages up to the specified index
    const branchedMessages = sourceChat.messages.slice(0, messageIndex + 1);
    if (branchedMessages.length === 0) return null;

    const newChat: ChatHistory = {
      id: generateUUID(),
      name: "Branch of " + sourceChat.name,
      messages: branchedMessages,
      model: sourceChat.model,
      system: sourceChat.system,
      folderId: sourceChat.folderId,
      parentChatId: sourceChat.id,
      branchedAtIndex: messageIndex,
    };

    setChats(prevChats => [...prevChats, newChat]);
    return newChat.id;
  }, [chats]);

  const renameChat = useCallback((chatId: string, newName: string) => {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId ? { ...chat, name: newName } : chat
      )
    );
  }, []);

  const moveToFolder = useCallback((chatId: string, folderId: string | null) => {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId ? { ...chat, folderId } : chat
      )
    );
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
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
            localStorage.setItem('folders', JSON.stringify([...existingFolders, ...newFolders]));
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
            localStorage.setItem('savedSystemPrompts', JSON.stringify([...existingPrompts, ...newPrompts]));
          }

          // Merge imported chats with existing chats, avoiding duplicates
          setChats(prevChats => {
            const existingIds = new Set(prevChats.map(chat => chat.id));
            const newChats = importData.chats.filter(
              (chat: ChatHistory) => !existingIds.has(chat.id)
            );
            return [...prevChats, ...newChats];
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

  return {
    chats,
    saveChat,
    updateChat,
    renameChat,
    moveToFolder,
    deleteChat,
    exportChats,
    importChats,
    branchChat,
  };
} 