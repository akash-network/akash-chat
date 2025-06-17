import { Message as AIMessage } from 'ai';
import { motion } from 'framer-motion';
import { Copy, ChevronDown, LoaderCircle, Download, GitBranch, Check } from 'lucide-react';
import { memo, useState, useEffect } from 'react';

import { cn } from '@/lib/utils';
import { parseMessageContent } from '@/utils/message-parser';

import AnimatedMarkdown from './animated-markdown';
import { AkashSignLogo } from './branding/akash-sign-logo';
import { Markdown } from './markdown';

interface MessageProps {
  message: AIMessage;
  isLoading: boolean;
  status?: 'submitted' | 'streaming' | 'ready' | 'error';
  onRegenerate?: () => void;
  onBranch?: () => void;
  messageIndex?: number;
}

const ThoughtsSection = ({ content, isLoading, status }: { content: string, isLoading: boolean, status?: 'submitted' | 'streaming' | 'ready' | 'error' }) => {
  const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(!isLoading);
  const [previousContent, setPreviousContent] = useState(content);
  const isExpanded = !isManuallyCollapsed;

  useEffect(() => {
    if (content !== previousContent) {
      setPreviousContent(content);
    }
  }, [content, previousContent, isManuallyCollapsed]);

  return (
    <div className="w-full">
      <div className="w-full">
        <button
          onClick={() => setIsManuallyCollapsed(!isManuallyCollapsed)}
          className={`flex items-center justify-between w-full p-2 hover:bg-muted/70 rounded-t-lg border border-border ${isManuallyCollapsed ? '' : 'bg-muted/50'}`}
        >
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-muted-foreground">Thoughts</span>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isExpanded && "transform rotate-180"
            )} />
          </div>
          <div className="flex items-center gap-2">
            {isLoading && !isExpanded && (
              <div className="flex items-center">
                <LoaderCircle className="w-3 h-3 text-muted-foreground animate-spin mr-1" />
              </div>
            )}
          </div>
        </button>
        
        {/* Always keep the AnimatedMarkdown mounted, but hide container when collapsed */}
        <motion.div
          initial={false}
          animate={{ 
            height: isExpanded ? "auto" : 0, 
            opacity: isExpanded ? 1 : 0 
          }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="p-3 text-sm text-muted-foreground bg-muted/50 border-x border-b border-border rounded-b-lg">
            {isLoading ? (
              <AnimatedMarkdown isLoading={isLoading} status={status} sectionIndex={0}>{content}</AnimatedMarkdown>
            ) : (
              <Markdown>{content}</Markdown>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const ImageGenerationSection = ({ jobId, prompt, negative }: { jobId: string, prompt: string, negative: string }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/image-status?ids=${jobId}`);
        const data = await response.json();
        
        if (data[0]?.status === 'completed' && data[0]?.result) {
          const imageResponse = await fetch(data[0].result);
          const blob = await imageResponse.blob();
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
          setIsLoading(false);
          clearInterval(interval);
        } else if (data[0]?.status === 'failed') {
          setError('Image generation failed');
          setIsLoading(false);
          clearInterval(interval); 
        } else {
          if (typeof data === 'string' && data.startsWith('Job not found:')) {
            setError('Image not found');
            setIsLoading(false);
            clearInterval(interval); 
          }
        }
      } catch (error) {
        console.error('Error checking image status:', error);
        setError('Failed to check image status');
        setIsLoading(false);
        clearInterval(interval);
      }
    };

    const interval = setInterval(checkStatus, 5000);
    checkStatus(); // Initial check

    return () => clearInterval(interval);
  }, [jobId]);

  const handleSaveImage = async () => {
    if (!imageUrl) {return;}
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="text-sm text-muted-foreground">
        <strong>Prompt:</strong> {prompt}
        {negative && <><br /><strong>Negative:</strong> {negative}</>}
      </div>
      <div className="relative w-full aspect-square max-w-xl bg-muted rounded-lg overflow-hidden group">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoaderCircle className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p>{error}</p>
          </div>
        ) : imageUrl && (
          <>
            <img 
              src={imageUrl} 
              alt={prompt}
              className="w-full h-full object-contain"
            />
            <button
              onClick={handleSaveImage}
              className="absolute top-2 right-2 p-2 bg-background/80 hover:bg-background/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-foreground"
              title="Save image"
            >
              <Download className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const PureMessage = ({ message, isLoading, status, onRegenerate, onBranch }: MessageProps) => {
  const sections = message.content ? parseMessageContent(message.content as string) : [];
  const [copied, setCopied] = useState(false);
  const [regenerated, setRegenerated] = useState(false);
  const [branched, setBranched] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleRegenerate = () => {
    if (onRegenerate) {
      setRegenerated(true);
      onRegenerate();
      setTimeout(() => setRegenerated(false), 2000);
    }
  };
  
  const handleBranch = () => {
    if (onBranch) {
      setBranched(true);
      onBranch();
      setTimeout(() => setBranched(false), 2000);
    }
  };

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message overflow-hidden"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cn(
          'flex gap-4 min-w-0 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
          {
            'group-data-[role=user]/message:w-fit': true,
          },
        )}
      >
        {message.role === 'assistant' && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background mt-1">
            <AkashSignLogo className="w-4 h-4" />
          </div>
        )}

        <div className="flex flex-col gap-2 min-w-0 w-full">
          {message.content && (
            <div className="flex items-start">
              <div
                className={cn('flex flex-col gap-4 w-full', {
                  'bg-muted text-foreground px-3 py-2 rounded-2xl':
                    message.role === 'user',
                })}
              >
                {sections.map((section, index) => (
                  <div key={index}>
                    {section.type === 'thoughts' ? (
                      <ThoughtsSection content={section.content} isLoading={isLoading} status={status} />
                    ) : section.type === 'image_generation' && section.jobId ? (
                      <ImageGenerationSection 
                        jobId={section.jobId} 
                        prompt={section.prompt || ''} 
                        negative={section.negative || ''} 
                      />
                    ) : (
                      message.role === 'assistant' && isLoading ? (
                        <AnimatedMarkdown isLoading={isLoading} status={status} sectionIndex={index}>{section.content}</AnimatedMarkdown>
                      ) : (
                        <Markdown>{section.content}</Markdown>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && (
            <div className={cn(
              "flex flex-wrap gap-2",
              message.role === 'user' && "justify-end"
            )}>
              {/* Copy button for both user and assistant messages */}
              <button 
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md transition-colors hover:bg-accent"
                onClick={handleCopy}
                title={`Copy ${message.role} message`}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="sr-only">Copy</span>
              </button>
              
              {onRegenerate && message.role === 'assistant' && (
                <button 
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md transition-colors",
                    "hover:bg-accent" 
                  )}
                  onClick={handleRegenerate}
                  disabled={isLoading || regenerated}
                  title="Regenerate response"
                >
                  {regenerated ? (
                    <LoaderCircle className="w-4 h-4 animate-spin text-green-500" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  <span className="sr-only">Regenerate</span>
                </button>
              )}
              {onBranch && message.role === 'assistant' && (
                <button 
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md transition-colors hover:bg-accent"
                  onClick={handleBranch}
                  disabled={isLoading || branched}
                  title="Branch from this message"
                >
                  {branched ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <GitBranch className="w-4 h-4" />
                  )}
                  <span className="sr-only">Branch</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const Message = memo(PureMessage);