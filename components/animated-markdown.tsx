import React, { useState, useEffect, useRef, memo } from 'react';

import { Markdown } from './markdown';

interface AnimatedMarkdownProps {
  children: string;
  isLoading: boolean;
  status?: 'submitted' | 'streaming' | 'ready' | 'error';
  wordsPerSecond?: number;
  sectionIndex?: number;
}

const AnimatedMarkdown = ({ 
  children, 
  isLoading, 
  status = 'ready',
  wordsPerSecond = 15,
  sectionIndex = 0
}: AnimatedMarkdownProps) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [delayedStart, setDelayedStart] = useState(false);
  const previousContentRef = useRef('');
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentWordIndexRef = useRef(0);
  const throttleDelay = 250;

  const shouldAnimate = status === 'streaming' || (isLoading && status !== 'ready');

  // Clear animation timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, []);

  // Handle sequential animation delays
  useEffect(() => {
    if (!shouldAnimate) {
      setDelayedStart(false);
      return;
    }

    // Clear any existing delay
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
    }

    const delay = sectionIndex === 0 ? 0 : 500;

    delayTimeoutRef.current = setTimeout(() => {
      setDelayedStart(true);
    }, delay);

    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, [shouldAnimate, sectionIndex]);

  // Split text into words while preserving whitespace
  const splitIntoWords = (text: string) => {
    return text.match(/\S+|\s+/g) || [];
  };

  // Main animation logic
  useEffect(() => {
    const currentContent = children;
    const previousContent = previousContentRef.current;

    // If content is completely different or shorter (regeneration), reset
    if (currentContent.length < previousContent.length || 
        (previousContent.length > 0 && !currentContent.startsWith(previousContent))) {
      
      // Clear existing animation
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      setDisplayedContent('');
      previousContentRef.current = '';
      currentWordIndexRef.current = 0;
      
      if (currentContent.length > 0 && shouldAnimate && delayedStart) {
        setTimeout(() => startAnimation(currentContent), 50);
      } else if (currentContent.length > 0) {
        // Show immediately if not animating
        setDisplayedContent(currentContent);
        previousContentRef.current = currentContent;
      }
      return;
    }

    if (currentContent.length > previousContent.length && shouldAnimate && delayedStart) {
      startAnimation(currentContent);
    }

    // If not loading/streaming and content hasn't changed, show everything immediately
    if (!shouldAnimate && currentContent === previousContent && displayedContent !== currentContent) {
      setDisplayedContent(currentContent);
      previousContentRef.current = currentContent;
    }
    
    // Only show content immediately on error, not on ready
    if (status === 'error' && displayedContent !== currentContent) {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      setDisplayedContent(currentContent);
      previousContentRef.current = currentContent;
    }
  }, [children, isLoading, status, shouldAnimate, delayedStart]);

  const startAnimation = (targetContent: string) => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Update the previous content reference immediately to prevent race conditions
    previousContentRef.current = targetContent;
    
    const currentWords = splitIntoWords(displayedContent);
    const targetWords = splitIntoWords(targetContent);
    
    const startWordIndex = currentWords.length;
    currentWordIndexRef.current = startWordIndex;

    // Calculate adaptive animation speed based on remaining words and throttle timing
    const remainingWords = targetWords.length - startWordIndex;
    const adaptiveWordsPerSecond = Math.max(wordsPerSecond, remainingWords / (throttleDelay / 1000) * 0.7); // Complete in 70% of throttle time

    const animateNextWord = () => {
      const currentWordIndex = currentWordIndexRef.current;
      
      if (currentWordIndex < targetWords.length) {
        // Add the next word to displayed content
        const wordsToShow = targetWords.slice(0, currentWordIndex + 1);
        const newDisplayed = wordsToShow.join('');
        setDisplayedContent(newDisplayed);
        currentWordIndexRef.current = currentWordIndex + 1;
        
        const delay = 1000 / adaptiveWordsPerSecond;
        animationTimeoutRef.current = setTimeout(animateNextWord, delay);
      } else {
        // Animation complete
        setDisplayedContent(targetContent);
      }
    };

    animateNextWord();
  };

  // Reset when starting a new message
  useEffect(() => {
    if ((isLoading || status === 'submitted') && children === '') {
      setDisplayedContent('');
      previousContentRef.current = '';
      currentWordIndexRef.current = 0;
      
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    }
  }, [isLoading, status, children]);

  return (
    <div className="relative">
      <Markdown>{displayedContent}</Markdown>
    </div>
  );
};

export default memo(AnimatedMarkdown); 