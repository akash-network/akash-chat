'use client';

import { Message as AIMessage } from 'ai';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useSwipeable } from 'react-swipeable';
import { useWindowSize } from 'usehooks-ts';

import { Model } from '@/app/config/models';
import { AkashChatLogo } from '@/components/branding/akash-chat-logo';
import { ChatHeader } from '@/components/chat/chat-header';
import { ChatHistory, ChatSidebar } from '@/components/chat/chat-sidebar';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Folder } from '@/hooks/use-folders';
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
  createFolder: (name: string) => void;
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
  modelError
}: MainLayoutProps) {
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

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

  // Show loading screen while initializing
  if (!sessionInitialized || isLoadingModels) {
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