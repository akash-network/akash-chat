/**
 * React hook for managing database synchronization
 */

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { 
  loadUserDataFromDatabase, 
  applyDataToLocalStorage,
  hasLocalDataToSync,
  hasDataInDatabase,
  cleanupStaleAccountData,
  markAccountDataOwner,
  type UserData
} from '@/lib/data-sync';

interface UseDatabaseSyncResult {
  isLoading: boolean;
  hasData: boolean;
  userData: UserData | null;
  syncStatus: 'idle' | 'checking' | 'syncing' | 'loading' | 'complete' | 'error';
  error: string | null;
  reloadData: () => Promise<void>;
  progress: {
    stage: 'checking' | 'loading' | 'merging' | 'syncing' | 'complete';
    message: string;
    percentage: number;
  };
}

interface UseDatabaseSyncOptions {
  mergeDatabaseChats?: (chats: any[]) => void;
  mergeDatabaseFolders?: (folders: any[]) => void;
  refreshFolders?: () => void;
}

export function useDatabaseSync(options: UseDatabaseSyncOptions = {}): UseDatabaseSyncResult {
  const { user, isLoading: isAuthLoading } = useUser();
  const { mergeDatabaseChats, mergeDatabaseFolders, refreshFolders } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [syncStatus, setSyncStatus] = useState<UseDatabaseSyncResult['syncStatus']>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedUserId, setLastSyncedUserId] = useState<string | null>(null);
  const [progress, setProgress] = useState<UseDatabaseSyncResult['progress']>({
    stage: 'checking',
    message: 'Checking for data...',
    percentage: 0
  });

  const loadData = async () => {
    if (!user?.sub) return;

    try {
      setIsLoading(true);
      setSyncStatus('loading');
      setError(null);
      setProgress({ stage: 'loading', message: 'Loading your data...', percentage: 25 });

      const data = await loadUserDataFromDatabase(user.sub);

      setUserData(data);
      setHasData(true);
      setProgress({ stage: 'merging', message: 'Merging your data...', percentage: 50 });

      // Apply preferences to localStorage (but not chats/folders - handled separately)
      applyDataToLocalStorage(data);

      // Merge database folders with local folders using the provided function
      if (data.folders && data.folders.length > 0 && mergeDatabaseFolders) {
        try {
          mergeDatabaseFolders(data.folders);
        } catch (error) {
          console.error('🔄 DATABASE SYNC: Error calling mergeDatabaseFolders:', error);
        }
      }

      // Refresh folders after merging
      if (refreshFolders) {
        refreshFolders();
      }

      // Merge database chats with local chats using the provided function
      if (data.chatSessions && data.chatSessions.length > 0 && mergeDatabaseChats) {

        try {
          mergeDatabaseChats(data.chatSessions);
        } catch (error) {
          // console.error('🔄 DATABASE SYNC: Error calling mergeDatabaseChats:', error);
        }
      } else {
      }

      setSyncStatus('complete');
      setProgress({ stage: 'complete', message: 'All done!', percentage: 100 });

    } catch (error) {
      console.error('Failed to load user data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setSyncStatus('error');
      setHasData(false);
    } finally {
      setIsLoading(false);
    }
  };

  const performAutoSync = async () => {
    if (!user?.sub) {
      return;
    }

    try {
      setSyncStatus('checking');
      setProgress({ stage: 'checking', message: 'Checking for existing data...', percentage: 10 });

      // Check if user has database data
      const hasDbData = await hasDataInDatabase();

      // Check if user has local data to sync
      const hasLocalData = hasLocalDataToSync();

      if (hasDbData) {
        // User has database data - load it directly (lazy migration handles any new local data)
        setProgress({ stage: 'loading', message: 'Loading your existing data...', percentage: 25 });
        await loadData();
        return;
      }

      // User has local data but no database data - skip automatic sync with lazy migration approach
      if (hasLocalData) {
        setSyncStatus('complete');
        setProgress({ stage: 'complete', message: 'Ready! Local chats will sync when you use them.', percentage: 100 });
      } else {
        setSyncStatus('complete');
        setProgress({ stage: 'complete', message: 'Ready to start!', percentage: 100 });
      }

    } catch (error) {
      console.error('Auto-sync failed:', error);
      setError(error instanceof Error ? error.message : 'Auto-sync failed');
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    
    if (isAuthLoading) {
      return; // Wait for auth to load
    }

    if (cleanupStaleAccountData(user?.sub)) {
      window.location.reload();
      return;
    }

    if (user?.sub) {
      markAccountDataOwner(user.sub);

      // Prevent duplicate syncs for the same user
      if (lastSyncedUserId === user.sub) {
        return;
      }
      
      setLastSyncedUserId(user.sub);
      
      // Add a small delay to ensure localStorage data is fully loaded
      setTimeout(() => {
        performAutoSync();
      }, 100);
    } else {
            
      // Reset sync state
      setUserData(null);
      setHasData(false);
      setSyncStatus('idle');
      setError(null);
      setLastSyncedUserId(null);
      setProgress({ stage: 'checking', message: 'Checking for data...', percentage: 0 });
      
    }
  }, [user?.sub, isAuthLoading, lastSyncedUserId]);

  return {
    isLoading,
    hasData,
    userData,
    syncStatus,
    error,
    reloadData: loadData,
    progress
  };
}
