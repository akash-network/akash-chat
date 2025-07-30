import { Message as AIMessage } from 'ai';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useWindowSize } from 'usehooks-ts';

import { AI_NOTICE } from '@/app/config/genimg';
import { ContextFile } from '@/app/context/ChatContext';
import { AkashChatLogo } from '@/components/branding/akash-chat-logo';
import { ChatInput } from '@/components/chat/chat-input';
import { Message } from '@/components/message';

interface ChatMessagesProps {
  messages: AIMessage[];
  input: string;
  isLoading: boolean;
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  contextFiles: ContextFile[];
  setContextFiles: (files: ContextFile[]) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  stop: () => void;
  reload: () => void;
  modelError: string | null;
  selectedChat: string | null;
  handleBranch: (index: number) => void;
  sessionInitialized: boolean;
  showStopButton?: boolean;
  setMessages: (messages: AIMessage[]) => void;
}

export function ChatMessages({
  messages,
  input,
  isLoading,
  status,
  contextFiles,
  setContextFiles,
  handleInputChange,
  handleSubmit,
  stop,
  reload,
  modelError,
  selectedChat,
  handleBranch,
  sessionInitialized,
  showStopButton = false,
  setMessages
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastStatusRef = useRef<string>(status);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container && autoScroll) {
      container.scrollTop = container.scrollHeight;
    }
  }, [autoScroll]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = isMobile ? 50 : 20;
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < threshold;
      if (isAtBottom !== autoScroll) {
        setAutoScroll(isAtBottom);
      }
    }
  };

  // Smooth scroll during animation
  const scheduleScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (isLoading || status === 'streaming') {
        scrollToBottom();
        // Continue checking while streaming
        scheduleScroll();
      }
    });
  }, [isLoading, status, scrollToBottom]);

  // Enhanced scroll trigger for delayed DOM updates
  const triggerDelayedScroll = useCallback((delay: number = 150) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    if (autoScroll) {
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToBottom();
        // Double-check after a longer delay for complex DOM updates
        setTimeout(() => {
          if (autoScroll) {
            scrollToBottom();
          }
        }, 100);
      }, delay);
    }
  }, [autoScroll, scrollToBottom]);

  // Scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Handle streaming auto-scroll and status changes
  useEffect(() => {
    const currentStatus = status;
    const previousStatus = lastStatusRef.current;
    
    if ((isLoading || status === 'streaming') && autoScroll) {
      scheduleScroll();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      
      // Handle status transitions that might affect content rendering
      if (autoScroll) {
        if (previousStatus === 'streaming' && (currentStatus === 'ready' || currentStatus === 'error')) {
          // Status changed from streaming to complete - trigger extended delay scroll
          triggerDelayedScroll(200);
        } else {
          // Regular completion scroll
          triggerDelayedScroll(100);
        }
      }
    }

    lastStatusRef.current = currentStatus;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isLoading, status, autoScroll, scheduleScroll, triggerDelayedScroll]);

  // Enhanced ResizeObserver to detect height changes from all content updates
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) { return; }

    // Clean up previous observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    // Create ResizeObserver to watch for container size changes
    resizeObserverRef.current = new ResizeObserver(() => {
      if (autoScroll) {
        // During active streaming/loading, scroll immediately
        if (isLoading || status === 'streaming') {
          scrollToBottom();
        } else {
          // For post-completion changes (like animation finishing), use delayed scroll
          triggerDelayedScroll(50);
        }
      }
    });

    // Observe the messages container
    resizeObserverRef.current.observe(container);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [autoScroll, isLoading, status, scrollToBottom, triggerDelayedScroll]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-2 md:p-4 bg-background dark:bg-background"
        id="messages-container"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
              <div className="mb-6 sm:mb-8">
                <AkashChatLogo className="w-48 sm:w-64 md:w-80" />
              </div>
              <h2 className="font-semibold text-xl sm:text-2xl mb-4 sm:mb-6 text-muted-foreground text-center">What can I help you with?</h2>
              <div className="w-full max-w-xl mb-3 sm:mb-4">
                <ChatInput
                  input={input}
                  isLoading={isLoading}
                  onSubmit={handleSubmit}
                  onChange={handleInputChange}
                  onFilesChange={setContextFiles}
                  contextFiles={contextFiles}
                  className="relative"
                  isInitialized={sessionInitialized}
                />
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <Message
                  key={message.id}
                  message={message}
                  messageIndex={index}
                  isLoading={isLoading && message.id === messages[messages.length - 1]?.id}
                  status={status}
                  onRegenerate={message.role === 'assistant' ? async () => {
                    const precedingUserMessage = messages[index - 1];
                    if (precedingUserMessage?.role === 'user') {
                      const truncatedMessages = messages.slice(0, index);
                      setMessages(truncatedMessages);
                      reload();
                    }
                  } : undefined}
                  onBranch={selectedChat && !isLoading ? () => handleBranch(index) : undefined}
                />
              ))}
              {modelError && (
                <motion.div
                  className="flex items-center gap-3 p-4 text-destructive bg-destructive/10 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="flex-1">{modelError}</p>
                  {messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                    <button
                      onClick={() => {
                        reload();
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-destructive/20 rounded-md transition-colors"
                      disabled={isLoading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Try again
                    </button>
                  )}
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {messages.length > 0 && (
        <div className="flex-none border-t border-border p-2 md:p-4 bg-background">
          <ChatInput
            input={input}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onChange={handleInputChange}
            onStop={stop}
            onFilesChange={setContextFiles}
            contextFiles={contextFiles}
            className="max-w-3xl mx-auto"
            showStopButton={showStopButton}
            isInitialized={sessionInitialized}
          />
          <p className="text-xs text-muted-foreground text-center mt-2">
            {AI_NOTICE}
          </p>
        </div>
      )}
    </>
  );
} 