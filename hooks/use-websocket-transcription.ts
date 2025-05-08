import { useState, useRef, useCallback, useEffect } from 'react';
import { WebSocketTranscriptionClient } from '../lib/websocket-transcription-client';
import { MAX_RECORDING_TIME } from '@/app/config/api';
import { trackEvent } from '@/lib/analytics';


interface UseWebSocketTranscriptionProps {
  onTranscription: (text: string) => void;
  onConnectionClosed?: () => void;
  onError?: (error: any) => void;
  isInitialized?: boolean;
}

export function useWebSocketTranscription({
  onTranscription,
  onConnectionClosed,
  onError,
  isInitialized = false,
}: UseWebSocketTranscriptionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionPossible, setConnectionPossible] = useState<boolean | null>(null);
  const clientRef = useRef<WebSocketTranscriptionClient | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const manuallyStoppedRef = useRef<boolean>(false);

  // Check if connection is possible
  const checkConnectionPossible = useCallback(async (): Promise<boolean> => {
    try {
      // Check if initialized before proceeding
      if (!isInitialized) {
        console.warn('WebSocket transcription not initialized');
        return false;
      }

      // Check if the backend can provide a WebSocket URL
      try {
        const response = await fetch('/api/transcription/');
        if (!response.ok) {
          console.warn('Backend transcription API is not available');
          return false;
        }
        
        const data = await response.json();
        if (!data.url || !data.model) {
          console.warn('Backend did not provide valid WebSocket configuration');
          return false;
        }
        
        return true;
      } catch (error) {
        console.warn('Failed to fetch WebSocket configuration:', error);
        return false;
      }
    } catch (error) {
      console.error('Error checking connection possibility:', error);
      return false;
    }
  }, [isInitialized]);

  // Clean up resources
  const cleanupResources = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    cleanupResources();
    manuallyStoppedRef.current = true;

    if (clientRef.current) {
      try {
        trackEvent.speechToText('complete');
        clientRef.current.stopRecording();
        clientRef.current.disconnect();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
      clientRef.current = null;
    }
    
    setIsRecording(false);
  }, [cleanupResources]);

  const startRecording = useCallback(async () => {
    try {
      trackEvent.speechToText('start');
      // Check if initialized before proceeding
      if (!isInitialized) {
        console.warn('WebSocket transcription not initialized');
        return;
      }

      setIsConnecting(true);
      manuallyStoppedRef.current = false;

      // Check if browser supports required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording. Please try a different browser.');
      }

      if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
        throw new Error('Your browser does not support Web Audio API. Please try a different browser.');
      }

      // Initialize the WebSocket client
      clientRef.current = new WebSocketTranscriptionClient({
        onTranscript: (text) => {
          onTranscription(text);
        },
        onError: (error) => {
          console.error('Error:', error);
          if (onError) {
            onError(error);
          }
        },
        onClose: () => {
          cleanupResources();
          setIsRecording(false);
          setIsConnecting(false);
          
          if (onConnectionClosed && !manuallyStoppedRef.current) {
            onConnectionClosed();
          }
        },
        onReady: () => {
          setIsConnecting(false);
          setIsRecording(true);
        }
      });

      await clientRef.current.connect();
      await clientRef.current.startMicrophoneTranscription();

      // Set a timeout to stop recording after maxRecordingTime
      timeoutRef.current = setTimeout(() => {
        console.log(`Maximum recording time of ${MAX_RECORDING_TIME}ms reached`);
        stopRecording();
      }, MAX_RECORDING_TIME);

    } catch (error) {
      console.error('Failed to start recording:', error);
      if (clientRef.current) {
        try {
          clientRef.current.disconnect();
        } catch (disconnectError) {
          console.error('Error disconnecting client:', disconnectError);
        }
        clientRef.current = null;
      }
      cleanupResources();
      setIsConnecting(false);
      setIsRecording(false);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }, [
    onTranscription,
    onConnectionClosed,
    onError,
    stopRecording,
    cleanupResources,
    isInitialized,
  ]);

  // Run connection check when isInitialized changes
  useEffect(() => {
    if (isInitialized) {
      checkConnectionPossible().then(possible => {
        setConnectionPossible(possible);
      });
    } else {
      setConnectionPossible(null);
    }
  }, [isInitialized, checkConnectionPossible]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      cleanupResources();
      if (clientRef.current) {
        try {
          clientRef.current.disconnect();
        } catch (error) {
          console.error('Error disconnecting client on unmount:', error);
        }
        clientRef.current = null;
      }
    };
  }, [cleanupResources]);

  return {
    isRecording,
    isConnecting,
    connectionPossible,
    checkConnectionPossible,
    startRecording,
    stopRecording
  };
}