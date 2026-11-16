'use client';

import type { ChatMessage as AIMessage } from '@/lib/utils';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useSwipeable } from 'react-swipeable';
import { useWindowSize } from 'usehooks-ts';

import { Model } from '@/app/config/models';
import { useChatContext } from '@/app/context/ChatContext';
import { AkashChatLogo } from '@/components/branding/akash-chat-logo';
import { ChatHeader } from '@/components/chat/chat-header';
import { ChatHistory, ChatSidebar } from '@/components/chat/chat-sidebar';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Folder } from '@/hooks/use-folders';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  modelSelection: string;
  setModelSelection: (model: string) => void;
  availableModels: Model[];
  isLoadingModels: boolean;
  selectedChat: string | null;
  setSelectedChat: (chatId: string) => void;
  handleMessagesSelect: (messages: AIMessage[]) => void;
  handleNewChat: () => void;
  chats: ChatHistory[];
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newName: string) => void;
  moveToFolder: (chatId: string, folderId: string | null) => void;
  folders: Folder[];
  createFolder: (name: string) => Promise<string>;
  updateFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  isLoading: boolean;
  exportChats: () => void;
  importChats: (file: File) => void;
  onConfigureModel: () => void;
  sessionInitialized: boolean;
  sessionError: string | null;
  isAccessError: boolean;
  accessTokenInput: string;
  setAccessTokenInput: (token: string) => void;
  handleAccessTokenSubmit: () => Promise<void>;
  modelError?: string | null;
  // Additional props for keyboard shortcuts
  messages?: AIMessage[];
  stop?: () => void;
  reload?: () => void;
  isRecording?: boolean;
  toggleVoiceRecording?: () => void;
  contextFiles?: any[];
  setContextFiles?: (files: any[]) => void;
  forceUpdateCounter?: number;
  syncProgress?: {
    stage: 'checking' | 'loading' | 'merging' | 'syncing' | 'complete';
    message: string;
    percentage: number;
  };
  user?: any;
}

export function MainLayout({
  children,
  isSidebarOpen,
  setSidebarOpen,
  modelSelection,
  setModelSelection,
  availableModels,
  isLoadingModels,
  selectedChat,
  setSelectedChat,
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
  onConfigureModel,
  sessionInitialized,
  sessionError,
  isAccessError,
  accessTokenInput,
  setAccessTokenInput,
  handleAccessTokenSubmit,
  modelError,
  messages,
  stop,
  reload,
  isRecording,
  toggleVoiceRecording: _toggleVoiceRecording,
  contextFiles: _contextFiles,
  setContextFiles,
  forceUpdateCounter = 0,
  syncProgress,
  user
}: MainLayoutProps) {
  // State to track when loading should end (with delay)
  const [shouldShowLoader, setShouldShowLoader] = useState(true);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;
  const router = useRouter();
  const pathname = usePathname();

  // Get sync status from ChatContext
  const { syncStatus } = useChatContext();

  // Handle Ctrl+Shift+? to open the shortcuts modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
        event.preventDefault();
        // Only open if not already open
        if (!isShortcutsModalOpen) {
          setIsShortcutsModalOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsModalOpen]);

  // Onboarding enforcement
  useEffect(() => {
    const checkOnboarding = async () => {
      // If not logged in, no need to check onboarding
      if (!user) {return;}

      // If already on profile page, don't redirect
      if (pathname === '/profile') {return;}

      // Check verification via API
      try {
        const res = await fetch('/api/user/verification-status', {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.isFullyVerified) {
            router.replace('/profile');
            return;
          }
        } else {
          // If API fails, redirect to profile to be safe
          router.replace('/profile');
          return;
        }
      } catch (error) {
        // If API fails, redirect to profile to be safe
        router.replace('/profile');
        return;
      }
    };

    checkOnboarding();
  }, [user, pathname, router]);

  // Determine if loading conditions are met
  const isLoadingConditions = !sessionInitialized || isLoadingModels || (user && syncStatus !== 'idle' && syncStatus !== 'complete' && syncStatus !== 'error');

  // Handle loading state with delay
  useEffect(() => {
    if (isLoadingConditions) {
      // Show loader immediately when loading starts
      setShouldShowLoader(true);
    } else {
      // Delay hiding the loader by 500ms
      const timeoutId = setTimeout(() => {
        setShouldShowLoader(false);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [isLoadingConditions]);

  // Swipe hook
  const swipeHandlers = useSwipeable({
    onSwipedRight: () => {
      if (isMobile && !isSidebarOpen) {
        setSidebarOpen(true);
      }
    },
    onSwipedLeft: () => {
      if (isMobile && isSidebarOpen) {
        setSidebarOpen(false);
      }
    },
    trackMouse: false,
    delta: 100,
  });

  // Helper functions for keyboard shortcuts
  const selectNextChat = () => {
    if (!chats.length || isLoading) {return;}
    const currentIndex = chats.findIndex(chat => chat.id === selectedChat);
    const nextIndex = currentIndex < chats.length - 1 ? currentIndex + 1 : 0;
    const nextChat = chats[nextIndex];
    if (nextChat) {
      // setSelectedChat is actually handleChatSelect from context, which properly manages private mode
      setSelectedChat(nextChat.id);
      handleMessagesSelect(nextChat.messages);
    }
  };

  const selectPreviousChat = () => {
    if (!chats.length || isLoading) {return;}
    const currentIndex = chats.findIndex(chat => chat.id === selectedChat);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : chats.length - 1;
    const prevChat = chats[prevIndex];
    if (prevChat) {
      // setSelectedChat is actually handleChatSelect from context, which properly manages private mode
      setSelectedChat(prevChat.id);
      handleMessagesSelect(prevChat.messages);
    }
  };

  const selectNextModel = () => {
    if (!availableModels.length || isLoadingModels) {return;}
    const availableAvailableModels = availableModels.filter(m => m.available);
    const currentIndex = availableAvailableModels.findIndex(model => model.id === modelSelection);
    const nextIndex = currentIndex < availableAvailableModels.length - 1 ? currentIndex + 1 : 0;
    const nextModel = availableAvailableModels[nextIndex];
    if (nextModel) {
      setModelSelection(nextModel.id);
    }
  };

  const selectPreviousModel = () => {
    if (!availableModels.length || isLoadingModels) {return;}
    const availableAvailableModels = availableModels.filter(m => m.available);
    const currentIndex = availableAvailableModels.findIndex(model => model.id === modelSelection);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : availableAvailableModels.length - 1;
    const prevModel = availableAvailableModels[prevIndex];
    if (prevModel) {
      setModelSelection(prevModel.id);
    }
  };

  const focusInput = () => {
    // Try to find and focus the chat input
    const chatInput = document.querySelector('textarea[placeholder*="Message"]') as HTMLTextAreaElement;
    if (chatInput) {
      chatInput.focus();
    }
  };

  const addFiles = () => {
    // Trigger file upload
    const fileButton = document.querySelector('[aria-label="Add files and photos"]') as HTMLButtonElement;
    if (fileButton) {
      fileButton.click();
    }
  };

  const clearContext = () => {
    if (setContextFiles) {
      setContextFiles([]);
    }
  };

  const canRegenerateLastMessage = () => {
    return messages && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && !isLoading;
  };

  const regenerateLastMessage = () => {
    if (reload && canRegenerateLastMessage()) {
      reload();
    }
  };

  const triggerImportChats = () => {
    // Trigger import chats
    const fileInput = document.querySelector('input[type="file"][accept=".json"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  // Keyboard shortcuts configuration
  const { shortcuts } = useKeyboardShortcuts({
    newChat: handleNewChat,
    toggleSidebar: () => setSidebarOpen(!isSidebarOpen),
    focusInput,
    sendMessage: () => {
      // This will be handled by the input component itself
    },
    stopGeneration: stop,
    regenerateLastMessage,
    selectNextChat,
    selectPreviousChat,
    selectNextModel,
    selectPreviousModel,
    addFiles,
    clearContext,
    createFolder: async () => {
      // Trigger create folder in sidebar - more specific selector
      const createFolderButton = Array.from(document.querySelectorAll('button')).find(
        button => button.textContent?.includes('New Folder')
      );
      if (createFolderButton) {
        createFolderButton.click();
      } else if (createFolder) {
        // Fallback: trigger create folder directly
        const folderName = prompt('Enter folder name:');
        if (folderName && folderName.trim()) {
          await createFolder(folderName.trim());
        }
      }
    },
    exportChats,
    importChats: triggerImportChats,
    openSettings: onConfigureModel,
    jumpToHome: () => router.push('/'),
    jumpToModels: () => router.push('/models'),
    toggleVoiceRecording: () => {
      // Try to trigger voice recording button
      const voiceButton = document.querySelector('[aria-label*="recording"]') as HTMLButtonElement;
      if (voiceButton && !voiceButton.disabled) {
        voiceButton.click();
      }
    },
    isLoading,
    isRecording,
    hasMessages: !!(messages && messages.length > 0),
    isSidebarOpen,
    canRegenerateLastMessage: canRegenerateLastMessage(),
  });

  // Show loading screen while initializing (with delay)
  if (shouldShowLoader) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-lg z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AkashChatLogo className="w-48 animate-pulse" />
          <LoaderCircle className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Show error screen if session initialization failed
  if (sessionError) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-lg z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md mx-4 text-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 className="text-xl font-semibold text-foreground">Session Error</h2>
          <p className="text-muted-foreground">{sessionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Access Token Dialog */}
      <Dialog open={isAccessError} onOpenChange={(open) => !open && window.location.reload()}>
        <DialogContent className="sm:max-w-[425px] z-[100]">
          <DialogHeader>
            <DialogTitle>Access Required</DialogTitle>
            <DialogDescription>
              This application requires an access token to continue. Please enter your token below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter your access token"
                value={accessTokenInput}
                onChange={(e) => setAccessTokenInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A hash of this token will be stored locally in your browser. If you don't have a token, please contact the administrator.
              </p>
              {modelError?.includes("Access token") && (
                <div className="text-sm text-destructive mt-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{modelError}</span>
                </div>
              )}
            </div>
            <Button onClick={handleAccessTokenSubmit} className="w-full">
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Loading screen with z-index 50 */}
      {!sessionInitialized && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-lg z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <AkashChatLogo className="w-48 animate-pulse" />
            <LoaderCircle className="w-6 h-6 animate-spin text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Initializing secure session...
            </div>
          </div>
        </div>
      )}
      
      {/* Sync loading screen for authenticated users */}
      {sessionInitialized && user && syncStatus !== 'idle' && syncStatus !== 'complete' && syncStatus !== 'error' && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-lg z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-md mx-auto px-6">
            <AkashChatLogo className="w-48 animate-pulse" />
            <LoaderCircle className="w-6 h-6 animate-spin text-muted-foreground" />
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">
                {syncProgress?.message || 'Loading your data...'}
              </div>
              {syncProgress?.percentage !== undefined && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${syncProgress.percentage}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <DndProvider backend={HTML5Backend}>
        <div className="fixed inset-0 flex flex-col bg-background text-foreground overflow-hidden">
          {/* Header */}
          <ChatHeader
            modelSelection={modelSelection}
            setModelSelection={setModelSelection}
            availableModels={availableModels}
            isLoadingModels={isLoadingModels}
            isSidebarOpen={isSidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          {/* Content area with sidebar */}
          <div className="flex-1 flex relative overflow-hidden" {...swipeHandlers}>
            <div className={cn(
              "absolute z-20 transition-transform w-[280px] h-full",
              isMobile ? (
                isSidebarOpen ? "translate-x-0 w-full" : "-translate-x-full"
              ) : (
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
              )
            )}>
              <ChatSidebar
                key={`sidebar-${chats.length}-${forceUpdateCounter}-${syncStatus}-${user?.sub || 'anonymous'}-${chats.map(c => c.id).join('-').slice(0, 50)}`}
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
                selectedChat={selectedChat}
                setSelectedChat={setSelectedChat}
                isMobile={isMobile}
                onNewChat={handleNewChat}
                onSelectChat={handleMessagesSelect}
                chats={chats}
                onDeleteChat={deleteChat}
                onRenameChat={renameChat}
                onMoveToFolder={moveToFolder}
                folders={folders}
                onCreateFolder={createFolder}
                onUpdateFolder={updateFolder}
                onDeleteFolder={deleteFolder}
                isLoading={isLoading}
                onExportChats={exportChats}
                onImportChats={(file: File) => Promise.resolve(importChats(file))}
                onConfigureModel={onConfigureModel}
                shortcuts={shortcuts}
                user={user}
                forceUpdateCounter={forceUpdateCounter}
                isShortcutsModalOpen={isShortcutsModalOpen}
                setIsShortcutsModalOpen={setIsShortcutsModalOpen}
              />
            </div>

            {/* Main Content */}
            <div className={cn(
              "flex-1 flex flex-col overflow-hidden relative transition-all duration-300 ease-spring",
              !isMobile && isSidebarOpen ? "ml-[280px]" : ""
            )}>
              {/* Child components are rendered here */}
              {children}
            </div>
          </div>
        </div>
      </DndProvider>

    </>
  );
} 