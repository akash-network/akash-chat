import { Mic, MicOff, LoaderCircle, Paperclip, X } from 'lucide-react';
import { useState, useRef, useEffect } from "react";

import { ContextFile } from "@/app/context/ChatContext";
import { Textarea } from "@/components/ui/textarea";
import { useWebSocketTranscription } from '@/hooks/use-websocket-transcription';
import { cn } from "@/lib/utils";
import { handleFileSelect } from '@/utils/file-handler';

import { FileUpload } from '../file-upload';
import { Button } from "../ui/button";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onStop?: () => void;
  className?: string;
  showStopButton?: boolean;
  onFilesChange?: (files: ContextFile[]) => void;
  contextFiles?: ContextFile[];
  isInitialized?: boolean;
}

export function ChatInput({
  input,
  isLoading,
  onSubmit,
  onChange,
  onStop,
  className,
  showStopButton = false,
  onFilesChange,
  contextFiles = [],
  isInitialized = false,
}: ChatInputProps) {
  const { isRecording, isConnecting, connectionPossible, startRecording, stopRecording } = useWebSocketTranscription({
    onTranscription: (transcriptionText:string) => {
      let newChatContent = input;
      // Add spacing unless the new text starts with punctuation
      const needsSpace = 
        input && 
        !input.endsWith(' ') && 
        !input.endsWith('\n') &&
        !/^[.,!?;:]/.test(transcriptionText);
        
      newChatContent = input + (needsSpace ? ' ' : '') + transcriptionText;
      const event = {
        target: { value: newChatContent }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      
      onChange(event);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.error('Transcription error:', error);
    },
    isInitialized: isInitialized
  });
  
  const [showFileUpload, setShowFileUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [previousInput, setPreviousInput] = useState(input);

  const isVoiceFeatureAvailable = isInitialized && connectionPossible === true;
  const isCheckingVoiceAvailability = isInitialized && connectionPossible === null;

  const handleRemoveFile = (fileId: string) => {
    if (onFilesChange) {
      const updatedFiles = contextFiles.filter(f => f.id !== fileId);
      onFilesChange(updatedFiles);
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    if (onFilesChange) {
      const newFiles = await handleFileSelect(files);
      const updatedFiles = [...contextFiles, ...newFiles];
      onFilesChange(updatedFiles);
      setShowFileUpload(false);
    }
  };

  // Watch for input changes and reset height when input becomes empty
  useEffect(() => {
    if (previousInput && !input && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const minHeight = window.getComputedStyle(textareaRef.current).getPropertyValue('min-height');
      textareaRef.current.style.height = minHeight;
    }
    
    setPreviousInput(input);
  }, [input, previousInput]);

  return (
    <div className={cn("space-y-4", className)}>
      {(showFileUpload || contextFiles.length > 0) && (
        <div className="rounded-lg border bg-card">
          <div className="p-2 space-y-2">
            {contextFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {contextFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 max-w-full"
                  >
                    <Paperclip className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-xs truncate flex-1" title={file.name}>
                      {file.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 hover:bg-background/80"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* File Upload Area */}
            {showFileUpload && (
              <div className="pt-2">
                <FileUpload
                  onFileSelect={handleFilesSelected}
                  acceptedFileTypes={['application/pdf', 'text/plain', 'text/markdown', 'application/json']}
                  maxFiles={5 - contextFiles.length}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Hide scrollbar in textarea */}
      <style>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* Remove focus ring but keep the border when focused */
        textarea:focus-visible {
          outline: none !important;
          box-shadow: none !important;
          ring-width: 0 !important;
          ring-color: transparent !important;
          ring-offset-width: 0 !important;
        }
      `}</style>
      <form onSubmit={(e) => {
        if (isRecording) {
          stopRecording();
        }
        onSubmit(e);
    }} className={cn("relative", className)}>
          <Textarea
          ref={textareaRef}
          className={cn(
            "w-full pt-[10px] px-3 sm:p-3 md:p-4 bg-muted rounded-lg sm:pr-[100px] md:pr-[100px] pr-[100px] border border-input focus:outline-none focus:border focus:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border focus-visible:border-input resize-none min-h-[44px] sm:min-h-[56px]",
            "hide-scrollbar"
          )}
          value={input}
          placeholder="Message AkashChat"
          onChange={(e) => {
            if (isRecording && e.target.value !== input) {
              stopRecording();
            }
            
            onChange(e);
            // Adjust height
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (input.trim() && !isLoading) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onSubmit(e as any);
              }
            }
          }}
          rows={1}
          style={{
            lineHeight: '1.5rem',
            maxHeight: '120px',
            overflowY: 'auto'
          }}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
          {/* File upload button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 text-muted-foreground hover:text-accent-foreground",
              (showFileUpload || contextFiles.length > 0) && "text-primary"
            )}
            onClick={() => setShowFileUpload(!showFileUpload)}
            title={showFileUpload ? "Hide file upload" : "Add files for context"}
          >
            <Paperclip className="w-4 h-4" strokeWidth={1.75}/>
          </Button>

          {/* Voice recording button loading state */}
          {isCheckingVoiceAvailability && (
            <div className="relative">
              <button
                type="button"
                disabled={true}
                className="p-1.5 rounded-lg flex items-center justify-center transition-all duration-200 text-muted-foreground opacity-50"
                title="Checking microphone availability..."
              >
                <LoaderCircle className="h-5 w-5 animate-spin" />
              </button>
            </div>
          )}

          {/* Voice recording button - show only if transcription is available */}
          {isVoiceFeatureAvailable && (
            <div className="relative">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || isConnecting}
                className={cn(
                  "p-1.5 rounded-lg flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-accent-foreground hover:bg-accent/10",
                  isRecording && "text-destructive hover:text-accent-foreground",
                  (isLoading || isConnecting) && "opacity-50 cursor-not-allowed"
                )}
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                {isConnecting ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : isRecording ? (
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-full border border-destructive scale-[1.3] group-hover:border-accent-foreground transition-colors duration-200 overflow-hidden">
                      <div className="absolute inset-0 bg-destructive/25 [animation:pulse_3s_ease-in-out_infinite] group-hover:animate-none group-hover:opacity-0 transition-opacity duration-200" />
                    </div>
                    <Mic className="h-5 w-5 relative z-10 text-destructive group-hover:opacity-0 transition-opacity duration-300" />
                    <MicOff className="absolute inset-0 h-5 w-5 z-10 text-accent-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                ) : (
                  <Mic className="h-5 w-5" strokeWidth={1.75}/>
                )}
              </button>
            </div>
          )}

          {/* Submit/Stop button */}
          {showStopButton && isLoading ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStop?.();
              }}
              className="p-1 hover:bg-accent/10 rounded flex items-center justify-center transition-colors text-muted-foreground hover:text-accent-foreground"
              title="Stop generating"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={1.75} />
                <rect x="9" y="9" width="6" height="6" fill="currentColor" strokeWidth={1.75}/>
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={cn(
                "p-1 hover:bg-accent rounded flex items-center justify-center transition-colors",
                isLoading || !input.trim() ? "opacity-50 cursor-not-allowed" : ""
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth={1.75} d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 