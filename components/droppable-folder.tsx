import { ChevronRight } from 'lucide-react';
import { useState, useRef } from 'react';
import { useDrop } from 'react-dnd';

import { cn } from '@/lib/utils';

interface DroppableFolderProps {
  id: string;
  name: string;
  onRename: () => void;
  onDelete: () => void;
  onDrop: (chatId: string) => void;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  hoveredFolder: string | null;
  setHoveredFolder: (folderId: string | null) => void;
}

export function DroppableFolder({
  id,
  name,
  onRename,
  onDelete,
  onDrop,
  children,
  defaultExpanded = true,
  hoveredFolder,
  setHoveredFolder,
}: DroppableFolderProps) {
  const [isOver, setIsOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOverCurrent }, drop] = useDrop(() => ({
    accept: 'CHAT',
    drop: (item: { id: string; type: string }, monitor) => {
      if (monitor.isOver({ shallow: true })) {
        onDrop(item.id);
        setIsExpanded(true);
      }
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
    }),
    hover: (_, monitor) => {
      setIsOver(monitor.isOver({ shallow: true }));
      if (monitor.isOver({ shallow: true })) {
        setIsExpanded(true);
      }
    },
  }));

  drop(ref);
  
  const isFolderHovered = hoveredFolder === id;

  return (
    <div className="mt-4">
      <div
        ref={ref}
        className={cn(
          "rounded-lg transition-colors",
          isFolderHovered && "hover:bg-white dark:hover:bg-accent",
          isOverCurrent && "hover:bg-white dark:hover:bg-accent"
        )}
        onMouseEnter={() => setHoveredFolder(id)}
        onMouseLeave={() => setHoveredFolder(null)}
      >
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full flex items-center gap-2 p-2 text-sm font-medium group hover:bg-accent/50 rounded-lg",
            isExpanded && "bg-accent/25 dark:bg-transparent"
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="flex-1 text-left">{name}</span>
          <div className="opacity-0 group-hover:opacity-100 flex gap-1" onClick={(e) => e.stopPropagation()}>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onRename();
                }
              }}
              className="p-1 hover:bg-accent rounded cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onDelete();
                }
              }}
              className="p-1 hover:bg-accent rounded cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          </div>
          <ChevronRight className={cn(
            "w-4 h-4 transition-transform",
            isExpanded && "rotate-90"
          )} />
        </button>
        {isExpanded && (
          <div className={cn(
            "pl-4 transition-colors rounded-lg",
            isFolderHovered && "bg-accent/25",
            isOver && "bg-accent/25"
          )}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
} 