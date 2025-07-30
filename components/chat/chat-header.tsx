'use client';

import { PanelRightClose, PanelRightOpen, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import { Model } from '@/app/config/models';
import { AkashChatLogo } from '@/components/branding/akash-chat-logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  modelSelection: string;
  setModelSelection: (model: string) => void;
  availableModels: Model[];
  isLoadingModels: boolean;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function ChatHeader({
  modelSelection,
  setModelSelection,
  availableModels,
  isLoadingModels,
  isSidebarOpen,
  setSidebarOpen,
}: ChatHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if we're on a model detail page
  const isModelDetailPage = pathname && pathname.startsWith('/models/') && !pathname.endsWith('/chat/');
  const isChatPage = pathname && pathname.startsWith('/models/') && pathname.endsWith('/chat/');
  
  // Handle model selection with optional redirection
  const handleModelChange = (newModelId: string) => {
    setModelSelection(newModelId);
    
    if (isModelDetailPage) {
      router.push('/models/'+newModelId);
    } else if (isChatPage) {
      router.push('/models/'+newModelId+'/chat/');
    }
  };
  
  return (
    <header className="flex-none flex items-center justify-between gap-2 sm:gap-4 p-2 sm:p-4 border-b border-border bg-background z-10">
      <div className="flex items-center gap-2">
        {!isSidebarOpen ? (
          <PanelRightClose className="w-5 h-5 mr-2" onClick={() => setSidebarOpen(true)} />
        ) : (
          <PanelRightOpen className="w-5 h-5 mr-2" onClick={() => setSidebarOpen(false)} />
        )}
        <Link href="/">
          <AkashChatLogo className="w-28 sm:w-32 md:w-36" />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative min-w-[120px] sm:min-w-[140px]">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "w-full flex items-center gap-2 bg-transparent border border-input rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                isLoadingModels && "opacity-50 cursor-not-allowed"
              )}
              disabled={isLoadingModels}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-muted flex items-center justify-center rounded-md text-xs">
                  {(availableModels.find(model => model.id === modelSelection)?.name || "Model").substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="font-medium text-xs">
                    {availableModels.find(model => model.id === modelSelection)?.name || "Select model"}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {(availableModels.find(model => model.id === modelSelection)?.description || "Select a model").substring(0, 20)}...
                  </span>
                </div>
                <div className="sm:hidden text-xs">
                  {(availableModels.find(model => model.id === modelSelection)?.name || "Select model").substring(0, 6)}...
                </div>
              </div>
              <div className="text-muted-foreground ml-1 flex-shrink-0">
                {isLoadingModels ? (
                  <LoaderCircle className="w-3 h-3 animate-spin" />
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-trigger-width)]">
              <DropdownMenuRadioGroup value={modelSelection} onValueChange={handleModelChange}>
                {availableModels
                  .filter(model => model.available)
                  .map(model => (
                    <DropdownMenuRadioItem
                      key={model.id}
                      value={model.id}
                      className="cursor-pointer"
                      title={model.description}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{model.name}</span>
                          {model.name === "AkashGen" && (
                            <span className="px-2 py-[2px] text-[7px] font-medium bg-primary/20 text-primary rounded-full leading-normal inline-flex items-center">
                              BETA
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {model.description}
                        </span>
                      </div>
                    </DropdownMenuRadioItem>
                  ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </header>
  );
} 