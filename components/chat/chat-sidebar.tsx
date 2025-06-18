'use client';

import { Message } from 'ai';
import { AnimatePresence, motion } from 'framer-motion';
import { FolderPlus, CirclePlus, PanelRightOpen, Heart, Ellipsis, PlugZap, Globe, ChartBarBig, ChartColumnIncreasing, Settings, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';

import { Folder } from '@/hooks/use-folders';
import { cn } from '@/lib/utils';

import { DraggableChatItem } from '../draggable-chat-item';
import { DroppableFolder } from '../droppable-folder';
import { Button } from '../ui/button';

export interface ChatHistory {
  id: string;
  name: string;
  messages: Message[];
  model: {
    id: string;
    name: string;
  };
  prompt?: string;
  folderId: string | null;
}

interface ChatSidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedChat: string | null;
  setSelectedChat: (chatId: string) => void;
  isMobile: boolean;
  onNewChat: () => void;
  onSelectChat: (messages: Message[]) => void;
  chats: ChatHistory[];
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newName: string) => void;
  onMoveToFolder: (chatId: string, folderId: string | null) => void;
  folders: Folder[];
  onCreateFolder: (name: string) => void;
  onUpdateFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  isLoading: boolean;
  onExportChats: () => void;
  onImportChats: (file: File) => Promise<void>;
  onConfigureModel: () => void;
}

export function ChatSidebar({
  isSidebarOpen,
  setSidebarOpen,
  selectedChat,
  setSelectedChat,
  isMobile,
  onNewChat,
  onSelectChat,
  chats,
  onDeleteChat,
  onRenameChat,
  onMoveToFolder,
  folders,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  isLoading,
  onExportChats,
  onImportChats,
  onConfigureModel,
}: ChatSidebarProps) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const [isFollowOpen, setIsFollowOpen] = useState(false);
  const [isMoreInfoOpen, setIsMoreInfoOpen] = useState(false);
  const [importExportMenuOpen, setImportExportMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeAllMenus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeAllMenus = () => {
    setImportExportMenuOpen(false);
    setIsFollowOpen(false);
    setIsMoreInfoOpen(false);
  };

  const handleMenuInteraction = (menu: 'importExport' | 'follow' | 'moreInfo', isHovering: boolean = false) => {
    if (isMobile) {
      // On mobile, toggle the menu on click
      switch (menu) {
        case 'importExport':
          setImportExportMenuOpen(!importExportMenuOpen);
          setIsFollowOpen(false);
          setIsMoreInfoOpen(false);
          break;
        case 'follow':
          setIsFollowOpen(!isFollowOpen);
          setImportExportMenuOpen(false);
          setIsMoreInfoOpen(false);
          break;
        case 'moreInfo':
          setIsMoreInfoOpen(!isMoreInfoOpen);
          setImportExportMenuOpen(false);
          setIsFollowOpen(false);
          break;
      }
    } else {
      // On desktop, use hover behavior
      setImportExportMenuOpen(menu === 'importExport' && isHovering);
      setIsFollowOpen(menu === 'follow' && isHovering);
      setIsMoreInfoOpen(menu === 'moreInfo' && isHovering);
    }
  };

  const [{ }, dropRef] = useDrop<{ id: string; type: string }, void, { isOver: boolean }>(() => ({
    accept: 'CHAT',
    drop: (item, monitor) => {
      if (monitor.isOver({ shallow: true })) {
        onMoveToFolder(item.id, null);
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }));

  const dropRefElement = useRef<HTMLDivElement>(null);
  dropRef(dropRefElement);

  const handleChatSelect = (chatId: string) => {
    if (isLoading) { return; }
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setSelectedChat(chatId);
      onSelectChat(chat.messages);

      // Check if we're on a model detail page
      const isModelPage = pathname && pathname.startsWith('/models/') && !pathname.endsWith('/chat/');
      const isChatPage = pathname && pathname.endsWith('/chat/');
      if (isModelPage) {
        // If on models page, redirect to root
        router.push('/');
      } else if (isChatPage && chat.model && chat.model.id) {
        // If on chat page and the chat has a model, update the URL to reflect the model
        router.push(`/models/${chat.model.id}/chat/`);
      }

      if (isMobile) {
        setSidebarOpen(false);
      }
    }
  };

  const handleRenameSubmit = (chatId: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) { return; }

    // Limit name length to 20 characters
    const limitedName = trimmedName.length > 20
      ? trimmedName.slice(0, 20) + '...'
      : trimmedName;

    onRenameChat(chatId, limitedName);
    setEditingChatId(null);
  };

  const handleFolderRenameSubmit = (folderId: string, newName: string) => {
    onUpdateFolder(folderId, newName);
    setEditingFolderId(null);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const renderChatList = (folderId: string | null = null) => {
    const filteredChats = chats
      .filter(chat => chat.folderId === folderId)
      .reverse();

    return (
      <div className="space-y-1">
        {filteredChats.map((chat) => (
          editingChatId === chat.id ? (
            <form
              key={chat.id}
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector('input');
                if (input) { handleRenameSubmit(chat.id, input.value); }
              }}
              className="p-2"
            >
              <input
                type="text"
                defaultValue={chat.name}
                maxLength={20}
                className="w-full bg-background p-1 rounded border border-input"
                autoFocus
                onBlur={(e) => handleRenameSubmit(chat.id, e.target.value)}
              />
            </form>
          ) : (
            <DraggableChatItem
              key={chat.id}
              chat={chat}
              isSelected={selectedChat === chat.id}
              onSelect={() => handleChatSelect(chat.id)}
              onRename={() => setEditingChatId(chat.id)}
              onDelete={() => {
                onDeleteChat(chat.id);
                if (selectedChat === chat.id) {
                  onNewChat();
                }
              }}
              isLoading={isLoading}
              setHoveredFolder={setHoveredFolder}
              hoveredFolder={hoveredFolder}
              allChats={chats}
            />
          )
        ))}
      </div>
    );
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportChats(file).catch(error => {
        alert('Failed to import chats: ' + error.message);
      });
      e.target.value = ''; // Reset the input
      setImportExportMenuOpen(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isSidebarOpen && (
        <>
          <motion.div
            className="fixed md:relative bg-muted dark:bg-background flex flex-col border-r border-border h-full"
            initial={{
              translateX: isMobile ? "-100%" : 0,
            }}
            animate={{
              translateX: 0,
              width: isMobile ? "100%" : "280px",
            }}
            exit={{
              translateX: isMobile ? "-100%" : "-280px",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.2
            }}
            style={{
              zIndex: 50,
              width: isMobile ? "100%" : "280px"
            }}
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="shrink-0 p-4 border-b border-border">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onNewChat();
                      if (isMobile) {
                        setSidebarOpen(false);
                      }
                    }}
                    disabled={isLoading}
                    className={cn(
                      "flex-1 flex items-center gap-2 px-4 py-2.5 bg-background hover:bg-white dark:hover:bg-accent text-foreground rounded-lg transition-colors border border-border",
                      isLoading && "opacity-50 cursor-not-allowed hover:bg-background"
                    )}
                  >
                    <CirclePlus className="w-5 h-5" />
                    <span>New Chat</span>
                  </button>
                </div>
              </div>

              {/* Chat List */}
              <div
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ref={dropRef as any}
                className="flex-1 overflow-y-auto p-2"
              >
                {isCreatingFolder ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateFolder();
                    }}
                    className="mb-2 p-2 bg-accent/50 rounded-lg"
                  >
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name..."
                      className="w-full bg-background p-2 rounded border border-input mb-2"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingFolder(false)}
                        className="px-3 py-1 text-sm hover:bg-accent rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                ) : null}

                {/* Combined folders and chats in a unified list */}
                <div className="space-y-1">
                  {/* Create a combined array of folders and ungrouped chats */}
                  {(() => {
                    // Helper function to get the timestamp of the most recent message in a chat
                    const getLatestMessageTimestamp = (chat: ChatHistory): number => {
                      if (!chat.messages || chat.messages.length === 0) {
                        return 0; // No messages, use lowest priority
                      }
                      // Find the latest message and get its timestamp
                      const latestMessage = chat.messages[chat.messages.length - 1];
                      // Use createdAt if available, otherwise fallback to id
                      return latestMessage.createdAt
                        ? new Date(latestMessage.createdAt).getTime()
                        : 0;
                    };

                    // Get the latest activity timestamp for a folder (based on its chats)
                    const getFolderLatestActivity = (folderId: string): number => {
                      const folderChats = chats.filter(chat => chat.folderId === folderId);
                      if (folderChats.length === 0) {
                        return 0; // Empty folder
                      }
                      // Get the latest timestamp from any chat in the folder
                      return Math.max(...folderChats.map(getLatestMessageTimestamp));
                    };

                    // Get ungrouped chats
                    const ungroupedChats = chats
                      .filter(chat => chat.folderId === null)
                      .map(chat => ({
                        type: 'chat' as const,
                        item: chat,
                        // Sort by latest message timestamp
                        sortKey: getLatestMessageTimestamp(chat)
                      }));

                    // Get folders
                    const folderItems = folders.map(folder => ({
                      type: 'folder' as const,
                      item: folder,
                      // Sort by latest activity in any chat within the folder
                      sortKey: getFolderLatestActivity(folder.id)
                    }));

                    // Combine and sort by the most recent activity timestamp (newest first)
                    const combinedItems = [...ungroupedChats, ...folderItems]
                      .sort((a, b) => b.sortKey - a.sortKey);

                    // Function to get a readable time category for a timestamp
                    const getTimeCategory = (timestamp: number): string => {
                      if (timestamp === 0) { return "No Recent Activity"; }

                      const now = new Date();
                      const date = new Date(timestamp);

                      // Reset hours to compare just the dates
                      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);

                      // Calculate start of this week (starting Sunday)
                      const thisWeekStart = new Date(today);
                      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());

                      // Calculate start of last week
                      const lastWeekStart = new Date(thisWeekStart);
                      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

                      // Calculate 30 days ago
                      const thirtyDaysAgo = new Date(today);
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                      // Simple date comparison
                      const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

                      if (itemDate.getTime() === today.getTime()) {
                        return "Today";
                      } else if (itemDate.getTime() === yesterday.getTime()) {
                        return "Yesterday";
                      } else if (itemDate >= thisWeekStart) {
                        return "This Week";
                      } else if (itemDate >= lastWeekStart) {
                        return "Last Week";
                      } else if (itemDate >= thirtyDaysAgo) {
                        return "Previous 30 Days";
                      } else {
                        // Format month and year for older items
                        const monthNames = [
                          "January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"
                        ];
                        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                      }
                    };

                    // Group items by time category
                    const itemsByCategory: Record<string, typeof combinedItems> = {};

                    combinedItems.forEach(item => {
                      const category = getTimeCategory(item.sortKey);
                      if (!itemsByCategory[category]) {
                        itemsByCategory[category] = [];
                      }
                      itemsByCategory[category].push(item);
                    });

                    // Order of categories to display
                    const categoryOrder = [
                      "Today",
                      "Yesterday",
                      "This Week",
                      "Last Week",
                      "Previous 30 Days",
                      // Months will be sorted alphabetically after these
                    ];

                    // Sort the categories
                    const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => {
                      const indexA = categoryOrder.indexOf(a);
                      const indexB = categoryOrder.indexOf(b);

                      // If both are in our predefined order
                      if (indexA !== -1 && indexB !== -1) {
                        return indexA - indexB;
                      }
                      // If only a is in predefined order, it comes first
                      if (indexA !== -1) {return -1;}
                      // If only b is in predefined order, it comes first
                      if (indexB !== -1) {return 1;}
                      // Otherwise sort alphabetically (for month categories)
                      return a.localeCompare(b);
                    });

                    // Render categories and their items
                    return (
                      <>
                        {sortedCategories.map(category => (
                          <div key={category} className="mb-4">
                            <h3 className="text-xs font-semibold text-muted-foreground px-2 py-1">{category}</h3>
                            {itemsByCategory[category].map(combinedItem => {
                              if (combinedItem.type === 'chat') {
                                const chat = combinedItem.item;
                                return editingChatId === chat.id ? (
                                  <form
                                    key={`chat-${chat.id}`}
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      const input = e.currentTarget.querySelector('input');
                                      if (input) { handleRenameSubmit(chat.id, input.value); }
                                    }}
                                    className="p-2"
                                  >
                                    <input
                                      type="text"
                                      defaultValue={chat.name}
                                      maxLength={20}
                                      className="w-full bg-background p-1 rounded border border-input"
                                      autoFocus
                                      onBlur={(e) => handleRenameSubmit(chat.id, e.target.value)}
                                    />
                                  </form>
                                ) : (
                                  <DraggableChatItem
                                    key={`chat-${chat.id}`}
                                    chat={chat}
                                    isSelected={selectedChat === chat.id}
                                    onSelect={() => handleChatSelect(chat.id)}
                                    onRename={() => setEditingChatId(chat.id)}
                                    onDelete={() => {
                                      onDeleteChat(chat.id);
                                      if (selectedChat === chat.id) {
                                        onNewChat();
                                      }
                                    }}
                                    isLoading={isLoading}
                                    setHoveredFolder={setHoveredFolder}
                                    hoveredFolder={hoveredFolder}
                                    allChats={chats}
                                  />
                                );
                              } else {
                                // It's a folder
                                const folder = combinedItem.item;
                                return editingFolderId === folder.id ? (
                                  <form
                                    key={`folder-${folder.id}`}
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      const input = e.currentTarget.querySelector('input');
                                      if (input) { handleFolderRenameSubmit(folder.id, input.value); }
                                    }}
                                    className="mt-4"
                                  >
                                    <input
                                      type="text"
                                      defaultValue={folder.name}
                                      className="w-full bg-background p-1 rounded border border-input"
                                      autoFocus
                                      onBlur={(e) => handleFolderRenameSubmit(folder.id, e.target.value)}
                                    />
                                  </form>
                                ) : (
                                  <DroppableFolder
                                    key={`folder-${folder.id}`}
                                    id={folder.id}
                                    name={folder.name}
                                    onRename={() => setEditingFolderId(folder.id)}
                                    onDelete={() => onDeleteFolder(folder.id)}
                                    onDrop={(chatId) => onMoveToFolder(chatId, folder.id)}
                                    defaultExpanded={expandedFolders[folder.id]}
                                    hoveredFolder={hoveredFolder}
                                    setHoveredFolder={setHoveredFolder}
                                  >
                                    {renderChatList(folder.id)}
                                  </DroppableFolder>
                                );
                              }
                            })}
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Bottom Actions */}
              <div ref={menuRef} className="shrink-0 px-2 space-y-0.5 border-t border-border bg-muted dark:bg-background sticky bottom-0 py-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-white dark:hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setIsCreatingFolder(true)}
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>New Folder</span>
                </Button>

                <div className="relative">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-white dark:hover:bg-accent hover:text-accent-foreground"
                    onClick={() => isMobile && handleMenuInteraction('importExport')}
                    onMouseEnter={() => !isMobile && handleMenuInteraction('importExport', true)}
                    onMouseLeave={() => !isMobile && handleMenuInteraction('importExport', false)}
                  >
                    <div className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 18 18" fill="none" className="text-foreground">
                        <path d="M5.25 3L5.25 3.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5.25 6.75L5.25 7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12.75 15V3M12.75 3L15 5.25M12.75 3L10.5 5.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5.25 10.5V15M5.25 15L7.5 12.75M5.25 15L3 12.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span>Import/Export</span>
                  </Button>

                  {importExportMenuOpen && (
                    <div
                      className={cn(
                        "absolute pl-1 z-50",
                        isMobile ? "right-0 top-0 pl-0" : "left-full bottom-0"
                      )}
                      onMouseEnter={() => !isMobile && handleMenuInteraction('importExport', true)}
                      onMouseLeave={() => !isMobile && handleMenuInteraction('importExport', false)}
                    >
                      <div className={cn(
                        "bg-popover border rounded-md p-1 min-w-[160px] shadow-md backdrop-blur-sm",
                        isMobile && "absolute right-0 w-[calc(100vw-1rem)] mr-2 bg-popover/100"
                      )}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                          onClick={handleImportClick}
                        >
                          <span>Import Chats</span>
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            setImportExportMenuOpen(false);
                            onExportChats();
                          }}
                        >
                          <span>Export Chats</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".json"
                    onChange={handleFileChange}
                  />
                </div>

                <Link href="https://chatapi.akash.network" target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-white dark:hover:bg-accent hover:text-accent-foreground"
                  >
                    <PlugZap className="w-3.5 h-3.5" />
                    <span>AkashChat API</span>
                  </Button>
                </Link>

                <div className="h-px bg-border my-0.5" />

                <div className="relative">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-white dark:hover:bg-accent hover:text-accent-foreground"
                    onClick={() => isMobile && handleMenuInteraction('follow')}
                    onMouseEnter={() => !isMobile && handleMenuInteraction('follow', true)}
                    onMouseLeave={() => !isMobile && handleMenuInteraction('follow', false)}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Follow Akash</span>
                  </Button>

                  {isFollowOpen && (
                    <div
                      className={cn(
                        "absolute pl-1 z-50",
                        isMobile
                          ? "right-0 bottom-full pl-0 w-full mb-1"
                          : "left-full bottom-0"
                      )}
                      onMouseEnter={() => !isMobile && handleMenuInteraction('follow', true)}
                      onMouseLeave={() => !isMobile && handleMenuInteraction('follow', false)}
                    >
                      <div className={cn(
                        "bg-popover border rounded-md p-1 min-w-[160px] shadow-md backdrop-blur-sm",
                        isMobile && "w-full bg-popover/100 max-h-[40vh] overflow-y-auto"
                      )}>
                        <Link href="https://github.com/akash-network" target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsFollowOpen(false)}
                          >
                            <svg viewBox="0 0 438.549 438.549" className="w-3.5 h-3.5">
                              <path fill="currentColor" d="M409.132 114.573c-19.608-33.596-46.205-60.194-79.798-79.8-33.598-19.607-70.277-29.408-110.063-29.408-39.781 0-76.472 9.804-110.063 29.408-33.596 19.605-60.192 46.204-79.8 79.8C9.803 148.168 0 184.854 0 224.63c0 47.78 13.94 90.745 41.827 128.906 27.884 38.164 63.906 64.572 108.063 79.227 5.14.954 8.945.283 11.419-1.996 2.475-2.282 3.711-5.14 3.711-8.562 0-.571-.049-5.708-.144-15.417a2549.81 2549.81 0 01-.144-25.406l-6.567 1.136c-4.187.767-9.469 1.092-15.846 1-6.374-.089-12.991-.757-19.842-1.999-6.854-1.231-13.229-4.086-19.13-8.559-5.898-4.473-10.085-10.328-12.56-17.556l-2.855-6.57c-1.903-4.374-4.899-9.233-8.992-14.559-4.093-5.331-8.232-8.945-12.419-10.848l-1.999-1.431c-1.332-.951-2.568-2.098-3.711-3.429-1.142-1.331-1.997-2.663-2.568-3.997-.572-1.335-.098-2.43 1.427-3.289 1.525-.859 4.281-1.276 8.28-1.276l5.708.853c3.807.763 8.516 3.042 14.133 6.851 5.614 3.806 10.229 8.754 13.846 14.842 4.38 7.806 9.657 13.754 15.846 17.847 6.184 4.093 12.419 6.136 18.699 6.136 6.28 0 11.704-.476 16.274-1.423 4.565-.952 8.848-2.383 12.847-4.285 1.713-12.758 6.377-22.559 13.988-29.41-10.848-1.14-20.601-2.857-29.264-5.14-8.658-2.286-17.605-5.996-26.835-11.14-9.235-5.137-16.896-11.516-22.985-19.126-6.09-7.614-11.088-17.61-14.987-29.979-3.901-12.374-5.852-26.648-5.852-42.826 0-23.035 7.52-42.637 22.557-58.817-7.044-17.318-6.379-36.732 1.997-58.24 5.52-1.715 13.706-.428 24.554 3.853 10.85 4.283 18.794 7.952 23.84 10.994 5.046 3.041 9.089 5.618 12.135 7.708 17.705-4.947 35.976-7.421 54.818-7.421s37.117 2.474 54.823 7.421l10.849-6.849c7.419-4.57 16.18-8.758 26.262-12.565 10.088-3.805 17.802-4.853 23.134-3.138 8.562 21.509 9.325 40.922 2.279 58.24 15.036 16.18 22.559 35.787 22.559 58.817 0 16.178-1.958 30.497-5.853 42.966-3.9 12.471-8.941 22.457-15.125 29.979-6.191 7.521-13.901 13.85-23.131 18.986-9.232 5.14-18.182 8.85-26.84 11.136-8.662 2.286-18.415 4.004-29.263 5.146 9.894 8.562 14.842 22.077 14.842 40.539v60.237c0 3.422 1.19 6.279 3.572 8.562 2.379 2.279 6.136 2.95 11.276 1.995 44.163-14.653 80.185-41.062 108.068-79.226 27.88-38.161 41.825-81.126 41.825-128.906-.01-39.771-9.818-76.454-29.414-110.049z" />
                            </svg>
                            <span>Akash Github</span>
                          </Button>
                        </Link>
                        <Link href="https://twitter.com/akashnet_" target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsFollowOpen(false)}
                          >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                              <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <span>Akash on X</span>
                          </Button>
                        </Link>
                        <Link href="https://discord.com/invite/akash" target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsFollowOpen(false)}
                          >
                            <svg viewBox="0 -28.5 256 256" className="w-3.5 h-3.5">
                              <path fill="currentColor" d="M216.856 16.597A208.502 208.502 0 00164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 00-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0079.735 175.3a136.413 136.413 0 01-21.846-10.632 108.636 108.636 0 005.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 005.355 4.237 136.07 136.07 0 01-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36zM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18z" />
                            </svg>
                            <span>Akash Discord</span>
                          </Button>
                        </Link>
                        <Link href="https://www.youtube.com/@AkashNetwork" target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsFollowOpen(false)}
                          >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                              <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                            <span>Akash Youtube</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <Link href="/models">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-white dark:hover:bg-accent hover:text-accent-foreground"
                    onClick={() => isMobile && setSidebarOpen(false)}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Models</span>
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-white dark:hover:bg-accent hover:text-accent-foreground"
                  onClick={onConfigureModel}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure Model</span>
                </Button>

                <div className="relative">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-white dark:hover:bg-accent hover:text-accent-foreground"
                    onClick={() => isMobile && handleMenuInteraction('moreInfo')}
                    onMouseEnter={() => !isMobile && handleMenuInteraction('moreInfo', true)}
                    onMouseLeave={() => !isMobile && handleMenuInteraction('moreInfo', false)}
                  >
                    <Ellipsis className="w-3.5 h-3.5" />
                    <span>More info</span>
                  </Button>

                  {isMoreInfoOpen && (
                    <div
                      className={cn(
                        "absolute pl-1 z-50",
                        isMobile
                          ? "right-0 bottom-full pl-0 w-full mb-1"
                          : "left-full bottom-0"
                      )}
                      onMouseEnter={() => !isMobile && handleMenuInteraction('moreInfo', true)}
                      onMouseLeave={() => !isMobile && handleMenuInteraction('moreInfo', false)}
                    >
                      <div className={cn(
                        "bg-popover border rounded-md p-1 min-w-[160px] shadow-md backdrop-blur-sm",
                        isMobile && "w-full bg-popover/100 max-h-[40vh] overflow-y-auto"
                      )}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Website</div>
                        <Link href="https://akash.network" target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsMoreInfoOpen(false)}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>akash.network</span>
                          </Button>
                        </Link>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-1">Resources</div>
                        <Link href="https://stats.akash.network" target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsMoreInfoOpen(false)}
                          >
                            <ChartColumnIncreasing className="w-3.5 h-3.5" />
                            <span>Akash Stats</span>
                          </Button>
                        </Link>
                        <Link href="https://akash.network/pricing/gpus" target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsMoreInfoOpen(false)}
                          >
                            <ChartBarBig className="w-3.5 h-3.5" />
                            <span>Price Compare</span>
                          </Button>
                        </Link>
                        <Link href="https://docs.akash.network" target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsMoreInfoOpen(false)}
                          >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                              <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                            </svg>
                            <span>Akash Docs</span>
                          </Button>
                        </Link>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-1">Legal</div>
                        <Link href="/terms" target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsMoreInfoOpen(false)}
                          >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                              <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Terms of Service</span>
                          </Button>
                        </Link>
                        <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsMoreInfoOpen(false)}
                          >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                              <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Privacy Policy</span>
                          </Button>
                        </Link>
                        <div className="h-px bg-border my-0.5" />
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          Version {process.env.NEXT_PUBLIC_VERSION}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-border my-0.5" />

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-white dark:hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setSidebarOpen(false)}
                >
                  <PanelRightOpen className="w-3.5 h-3.5" />
                  <span>Collapse Sidebar</span>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Mobile overlay */}
          {isMobile && (
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              transition={{ duration: 0.2 }}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
} 