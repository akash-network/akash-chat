import { Message } from 'ai';
import { useState } from 'react';
import { useDrag } from 'react-dnd';

import { cn } from '@/lib/utils';

interface ChatItem {
  id: string;
  name: string;
  messages: Message[];
  model: {
    id: string;
    name: string;
  };
  folderId: string | null;
  parentChatId?: string;
  branchedAtIndex?: number;
}

interface DraggableChatItemProps {
  chat: ChatItem;
  isSelected: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
  isLoading: boolean;
  setHoveredFolder?: (folderId: string | null) => void;
  hoveredFolder?: string | null;
  allChats?: ChatItem[];
}

export function DraggableChatItem({
  chat,
  isSelected,
  onSelect,
  onRename,
  onDelete,
  isLoading,
  setHoveredFolder,
  hoveredFolder,
  allChats = [],
}: DraggableChatItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CHAT',
    item: { id: chat.id, type: 'CHAT' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isLoading,
  }));

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (chat.folderId && setHoveredFolder) {
      setHoveredFolder(chat.folderId);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const parentChat = chat.parentChatId 
    ? allChats.find(c => c.id === chat.parentChatId) 
    : null;
    
  const branchTooltip = parentChat 
    ? `Branched from "${parentChat.name}" at message ${chat.branchedAtIndex !== undefined ? chat.branchedAtIndex + 1 : '?'}`
    : '';

  const isInHoveredFolder = chat.folderId && chat.folderId === hoveredFolder;

  return (
    <div
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={drag as any}
      className={cn(
        "group relative",
        isSelected
          ? `bg-accent/50 dark:bg-transparent text-accent-foreground`
          : "text-muted-foreground",
        !chat.folderId && "hover:bg-accent/50",
        isInHoveredFolder && "bg-accent/25 dark:bg-accent/10",
        isDragging && "opacity-50",
        isLoading ? "cursor-not-allowed opacity-50" : "cursor-move"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        onClick={onSelect}
        className={cn(
          "w-full flex items-center gap-1 p-3 rounded-lg transition-colors",
          !chat.folderId && "hover:bg-white dark:hover:bg-accent/50",
          isLoading && "cursor-not-allowed"
        )}
        title={chat.parentChatId ? branchTooltip : chat.name}
      >
        <div className={cn(
          "flex-1 text-left min-w-0",
        )}>
          <p className={cn(
            "truncate",
            isHovered && chat.folderId ? "text-sm font-medium" : "text-sm"
          )} title={chat.name}>{chat.name}</p>
          <p className="text-xs text-muted-foreground truncate">{chat.model.name}</p>
        </div>
        <div className={cn(
          "opacity-0 group-hover:opacity-100 flex gap-1 shrink-0",
          isLoading && "pointer-events-none"
        )}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            disabled={isLoading}
            className="p-1 hover:bg-white dark:hover:bg-accent/50 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={isLoading}
            className="p-1 hover:bg-white dark:hover:bg-accent/50 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 