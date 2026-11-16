import { DEFAULT_SYSTEM_PROMPT } from "@/app/config/api";
import { safeSetItem } from '@/lib/local-storage-manager';

// Simple in-memory cache for user data
const userDataCache = new Map<string, { data: UserData; timestamp: number; ttl: number }>();

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

// Cache cleanup interval: 10 minutes
const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000;

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userDataCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      userDataCache.delete(key);
    }
  }
}, CACHE_CLEANUP_INTERVAL);

export interface UserData {
  preferences: {
    selectedModel?: string;
    systemPrompt?: string;
    temperature?: number;
    topP?: number;
  };
  chatSessions: any[];
  folders: any[];
  savedPrompts: any[];
}

/**
 * Load user data from database via API routes with caching
 */
export async function loadUserDataFromDatabase(userId: string): Promise<UserData> {
    const cached = userDataCache.get(userId);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < cached.ttl) {
     return cached.data;
    }

    // Use the new optimized unified API endpoint
    const response = await fetch('/api/user/data');

    if (!response.ok) {
      throw new Error(`Failed to load user data: ${response.statusText}`);
    }

    const responseData = await response.json();

    const { data } = responseData;

    if (!data) {
      throw new Error('Invalid response format: missing data field');
    }

    const { preferences, chatSessions, folders, savedPrompts } = data;

    const userData = {
      preferences: preferences || {},
      chatSessions: chatSessions || [],
      folders: folders || [],
      savedPrompts: savedPrompts || []
    };

    userDataCache.set(userId, {
      data: userData,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    });

    return userData;

}

/**
 * Deduplicate saved prompts by name and content, keeping the latest version
 */
function deduplicatePrompts(prompts: any[]): any[] {
  const seen = new Map<string, any>();
  
  // Process prompts in reverse order to keep the latest ones
  for (let i = prompts.length - 1; i >= 0; i--) {
    const prompt = prompts[i];
    if (!prompt.name || !prompt.content) {continue;}
    
    // Create a key based on name and content (case-insensitive)
    const key = `${prompt.name.toLowerCase().trim()}|${prompt.content.trim()}`;
    
    // Only keep if we haven't seen this exact prompt before
    if (!seen.has(key)) {
      seen.set(key, prompt);
    }
  }
  
  // Return deduplicated prompts in original order
  return Array.from(seen.values()).reverse();
}

/**
 * Apply loaded data to localStorage for backward compatibility
 */
export function applyDataToLocalStorage(userData: UserData) {
    // Apply preferences
    if (userData.preferences.selectedModel) {
      safeSetItem('selectedModel', userData.preferences.selectedModel);
    }
    if (userData.preferences.systemPrompt) {
      safeSetItem('currentSystemPrompt', userData.preferences.systemPrompt);
    }
    if (userData.preferences.temperature !== undefined && userData.preferences.temperature !== null) {
      safeSetItem('currentTemperature', userData.preferences.temperature.toString());
    }
    if (userData.preferences.topP !== undefined && userData.preferences.topP !== null) {
      safeSetItem('currentTopP', userData.preferences.topP.toString());
    }

    // Apply folders (merge database folders with existing local folders)
    if (userData.folders.length > 0) {
      // Get existing local folders
      const existingFoldersStr = localStorage.getItem('folders');
      const existingFolders = existingFoldersStr ? JSON.parse(existingFoldersStr) : [];
      
      // Convert database folders to localStorage format with proper source tagging
      const databaseFolders = userData.folders.map(folder => ({
        ...folder,
        source: 'database' as const,
        databaseId: folder.id,
        lastSynced: folder.updated_at || new Date().toISOString(),
      }));
      
      // Create a Set of database folder IDs for deduplication
      const dbFolderIds = new Set(databaseFolders.map(f => f.id));
      
      // Preserve existing local folders that don't conflict with database folders
      const preservedLocalFolders = existingFolders.filter((localFolder: any) => 
        localFolder.source === 'local' && !dbFolderIds.has(localFolder.id)
      );
      
      // Merge database folders with preserved local folders
      const mergedFolders = [...databaseFolders, ...preservedLocalFolders];
      
      safeSetItem('folders', JSON.stringify(mergedFolders));
    }

    // Apply saved prompts from database to localStorage (preserving existing local prompts)
    if (userData.savedPrompts.length > 0) {
      // Get existing local prompts
      const existingPromptsStr = localStorage.getItem('savedSystemPrompts');
      const existingPrompts = existingPromptsStr ? JSON.parse(existingPromptsStr) : [];
      
      // Convert database prompts to localStorage format with consistent source tagging
      const databasePrompts = userData.savedPrompts.map(prompt => ({
        id: prompt.id,
        name: prompt.name,
        content: prompt.content,
        source: 'database' as const, // Use consistent source tagging
        synced: true // Legacy field for backward compatibility
      }));
      
      // Create a Set of database prompt names for deduplication (case-insensitive)
      const dbPromptNames = new Set(databasePrompts.map(p => p.name.toLowerCase().trim()));
      
      // Preserve existing local prompts that don't conflict with database prompts
      const preservedLocalPrompts = existingPrompts.filter((localPrompt: any) => 
        localPrompt.source === 'local' && !dbPromptNames.has(localPrompt.name.toLowerCase().trim())
      );
      
      // Merge database prompts with preserved local prompts
      const rawMergedPrompts = [...databasePrompts, ...preservedLocalPrompts];
      
      // Deduplicate the merged prompts to remove any duplicates that only differ by ID
      const mergedPrompts = deduplicatePrompts(rawMergedPrompts);
      
      safeSetItem('savedSystemPrompts', JSON.stringify(mergedPrompts));
    }
}

/**
 * Check if user has local data that needs syncing
 */
export function hasLocalDataToSync(): boolean {
    const allKeys = Object.keys(localStorage);
    
    const relevantKeys = allKeys.filter(key => 
      key.startsWith('selectedModel') ||
      key.startsWith('currentSystemPrompt') ||
      key.startsWith('currentTemperature') ||
      key.startsWith('currentTopP') ||
      key === 'chats' ||
      key === 'folders' ||
      key.startsWith('chat-') ||
      key.startsWith('folder-') ||
      key.startsWith('chatHistory')
    );
    
    return relevantKeys.length > 0;
}

/**
 * Check if user has data in database
 */
export async function hasDataInDatabase(): Promise<boolean> {
    const response = await fetch('/api/user/data');

    if (!response.ok) {
      return false;
    }

    const responseData = await response.json();

    const { data } = responseData;

    if (!data || !data.summary) {
      return false;
    }

    const { summary } = data;

    const hasData = !!(summary.hasPreferences || summary.chatCount > 0 || summary.folderCount > 0);

    return hasData;
}

/**
 * Clear all user data cache
 */
export function clearUserDataCache(): void {
  userDataCache.clear();
}

/**
 * Clean up duplicate saved prompts in localStorage
 * This can be called to fix existing duplicate issues
 */
export function cleanupDuplicatePrompts(): void {
  try {
    if (typeof window === 'undefined') {return;}
    
    const savedPromptsStr = localStorage.getItem('savedSystemPrompts');
    if (!savedPromptsStr) {return;}
    
    const existingPrompts = JSON.parse(savedPromptsStr);
    if (!Array.isArray(existingPrompts) || existingPrompts.length === 0) {return;}
    
    const deduplicatedPrompts = deduplicatePrompts(existingPrompts);
    
    // Only update localStorage if we actually removed duplicates
    if (deduplicatedPrompts.length !== existingPrompts.length) {
      safeSetItem('savedSystemPrompts', JSON.stringify(deduplicatedPrompts));
    }
  } catch (error) {
    console.error('Error cleaning up duplicate prompts:', error);
  }
}

/**
 * Clear user's database-synced chats from localStorage while keeping local chats
 * Used when user deletes chat history from profile page
 */
export function clearUserChatsFromLocalStorage(): void {
  try {
    const chatsStr = localStorage.getItem('chats');
    if (chatsStr) {
      try {
        const chats = JSON.parse(chatsStr);
        // Keep only local chats that haven't been synced to database
        const localChats = chats.filter((chat: any) =>
          chat.source === 'local' && !chat.databaseId
        );

        if (localChats.length > 0) {
          safeSetItem('chats', JSON.stringify(localChats));
        } else {
          localStorage.removeItem('chats');
        }
      } catch (error) {
        localStorage.removeItem('chats');
      }
    }
  } catch (error) {
    console.error('Error clearing user chats from localStorage:', error);
  }
}

// Removed by cleanupUserDataOnLogout along with the other 'sync-' keys
const ACCOUNT_DATA_OWNER_KEY = 'sync-account';

/**
 * Record which account the synced data in localStorage belongs to
 */
export function markAccountDataOwner(userId: string): void {
  safeSetItem(ACCOUNT_DATA_OWNER_KEY, userId);
}

/**
 * Sessions that end by expiry or a direct /api/auth/logout skip the logout button's cleanup, so the
 * previous account's prompts would be shown to (and sent by) whoever uses the browser next.
 * Returns true when stale data was removed and the page must reload to drop it from React state.
 */
export function cleanupStaleAccountData(currentUserId: string | null | undefined): boolean {
  const owner = localStorage.getItem(ACCOUNT_DATA_OWNER_KEY);
  if (!owner || owner === currentUserId) {
    return false;
  }
  cleanupUserDataOnLogout();
  localStorage.removeItem(ACCOUNT_DATA_OWNER_KEY);
  return true;
}

/**
 * Comprehensive cleanup of all user data on logout
 * This ensures no sensitive data persists between user sessions
 */
export function cleanupUserDataOnLogout(): void {
  try {
    // 1. Reset user preferences to defaults
    safeSetItem('currentSystemPrompt', DEFAULT_SYSTEM_PROMPT);
    safeSetItem('currentTemperature', '0.7');
    safeSetItem('currentTopP', '0.95');
    localStorage.removeItem('selectedModel');
    localStorage.removeItem('selectedChat');

    // 2. Clean up synced prompts (keep only local prompts)
    const savedPromptsStr = localStorage.getItem('savedSystemPrompts');
    if (savedPromptsStr) {
      try {
        const savedPrompts = JSON.parse(savedPromptsStr);
        // Keep only local prompts (new source-based approach + legacy compatibility)
        const localPrompts = savedPrompts.filter((p: any) => 
          p.source === 'local' || (p.synced === false || (!p.id && p.synced !== true))
        );
        
        if (localPrompts.length > 0) {
          safeSetItem('savedSystemPrompts', JSON.stringify(localPrompts));
        } else {
          localStorage.removeItem('savedSystemPrompts');
        }
      } catch (error) {
        localStorage.removeItem('savedSystemPrompts');
      }
    }

    // 3. Clean up chat data (remove database chats, keep only local chats)
    const chatsStr = localStorage.getItem('chats');
    if (chatsStr) {
      try {
        const chats = JSON.parse(chatsStr);
        const localChats = chats.filter((chat: any) =>
          chat.source !== 'database' && !chat.databaseId
        );

        if (localChats.length > 0) {
          safeSetItem('chats', JSON.stringify(localChats));
        } else {
          localStorage.removeItem('chats');
        }
      } catch (error) {
        localStorage.removeItem('chats');
      }
    }

    // 4. Clean up folders (keep local folders AND database folders that contain local chats)
    const foldersStr = localStorage.getItem('folders');
    if (foldersStr) {
      try {
        const folders = JSON.parse(foldersStr);
        
        // Helper function to count local chats in a folder
        const getLocalChatCountInFolder = (folderId: string): number => {
          try {
            const chatsStr = localStorage.getItem('chats');
            if (!chatsStr) {return 0;}
            
            const chats = JSON.parse(chatsStr);
            return chats.filter((chat: any) => 
              chat.folderId === folderId && 
              (chat.source === 'local' || (!chat.source && !chat.databaseId))
            ).length;
          } catch (error) {
            return 0;
          }
        };
        
        // Keep local folders AND database folders that contain local chats
        const foldersToPreserve = folders.filter((folder: any) => 
          folder.source !== 'database' || 
          !folder.databaseId || 
          getLocalChatCountInFolder(folder.id) > 0
        );
        
        if (foldersToPreserve.length > 0) {
          safeSetItem('folders', JSON.stringify(foldersToPreserve));
        } else {
          localStorage.removeItem('folders');
        }
      } catch (error) {
        localStorage.removeItem('folders');
      }
    }

    // 5. Clean up private chats (stored separately from regular chats)
    localStorage.removeItem('privateChats');

    // 6. Clear any cached access tokens or auth data
    localStorage.removeItem('access_token');
    localStorage.removeItem('authToken');

    // 7. Clear any other user-specific localStorage keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('user-') || 
        key.startsWith('encrypted-') ||
        key.startsWith('sync-') ||
        key.includes('userId') ||
        key.includes('database')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // 8. Clear user data cache
    clearUserDataCache();
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    // Fallback: clear all localStorage if cleanup fails
    try {
      localStorage.clear();
    } catch (clearError) {
      console.error('Failed to clear localStorage:', clearError);
    }
  }
}