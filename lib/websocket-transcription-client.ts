interface WebSocketOptions {
  wsUrl?: string;
  model?: string;
  onTranscript?: (text: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError?: (error: any) => void;
  onClose?: () => void;
  onReady?: () => void;
}

interface TranscriptionWord {
  start: number;
  end: number;
  word: string;
  probability: number;
}

export class WebSocketTranscriptionClient {
  private socket: WebSocket | null = null;
  private options: WebSocketOptions;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private isRecording: boolean = false;
  private isConnected: boolean = false;
  private currentTranscript: string = '';
  private pcmBuffer: Int16Array | null = null;

  constructor(options: WebSocketOptions) {
    this.options = {
      wsUrl: undefined,
      model: undefined,
      ...options
    };
  }

  /**
   * Connect to the Audio Transcriptions API via WebSocket
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {return;}
    try {
      // Get WebSocket URL if not provided
      if (!this.options.wsUrl) {
        const infos = await this.getWebSocketInfos();
        if (infos) {
          this.options.wsUrl = infos.url;
          this.options.model = infos.model;
        } else {
          throw new Error('Failed to fetch WebSocket endpoint');
        }
      }
      
      const wsUrl = new URL(`${this.options.wsUrl}/v1/audio/transcriptions`);
      
      // Add configuration parameters to URL
      wsUrl.searchParams.append('model', this.options.model || '');
      wsUrl.searchParams.append('temperature', '0.0');
      wsUrl.searchParams.append('stream', 'true');
      wsUrl.searchParams.append('vad_filter', 'true');
      
      this.socket = new WebSocket(wsUrl.toString());
      
      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error("WebSocket could not be created"));
          return;
        }

        this.socket.onopen = () => {          
          this.isConnected = true;
          if (this.options.onReady) {
            this.options.onReady();
          }
          resolve();
        };
        
        this.socket.onmessage = (event) => {
          // Client side processing and hallucination prevention
          try {
              const text = event.data.trim();
              const data = JSON.parse(text);
              
              // Constant threshold for hallucination prevention
              const PROBABILITY_THRESHOLD = 0.5;
              // Even lower threshold that indicates a clear hallucination start
              const HALLUCINATION_BREAK_THRESHOLD = 0.1;
              // Contextual coherence window size
              const CONTEXT_WINDOW_SIZE = 3;
              
              if (data.words && Array.isArray(data.words)) {
                let hallucination_start_idx = -1;
                let hallucinationDetected = false;
                
                // Detect confidence breaks
                for (let i = 0; i < data.words.length; i++) {
                  const word = data.words[i];
                  
                  // Check for extremely low probability (clear hallucination)
                  if (word.probability < HALLUCINATION_BREAK_THRESHOLD) {
                    hallucination_start_idx = i;
                    hallucinationDetected = true;
                    break;
                  }
                }
                
                // If no hallucination detected through other means, try a sliding window context check
                if (hallucination_start_idx === -1 && data.words.length >= CONTEXT_WINDOW_SIZE + 1) {
                  for (let i = CONTEXT_WINDOW_SIZE; i < data.words.length; i++) {
                    const currentWord = data.words[i];
                    
                    if (currentWord.probability < 0.7) {
                      // Calculate average probability of previous few words
                      let windowSum = 0;
                      for (let j = i - CONTEXT_WINDOW_SIZE; j < i; j++) {
                        windowSum += data.words[j].probability;
                      }
                      const windowAvg = windowSum / CONTEXT_WINDOW_SIZE;
                      
                      if (windowAvg > 0.8 && currentWord.probability < 0.5) {
                        hallucination_start_idx = i;
                        hallucinationDetected = true;
                        break;
                      }
                    }
                  }
                }
                
                // Filter words based on probability threshold and hallucination break
                const highConfidenceWords = hallucination_start_idx >= 0
                  ? data.words.slice(0, hallucination_start_idx).filter((word: TranscriptionWord) => 
                      word.probability >= PROBABILITY_THRESHOLD
                    )
                  : data.words.filter((word: TranscriptionWord) => 
                      word.probability >= PROBABILITY_THRESHOLD
                    );
                
                    // If hallucination detected, disconnect the WebSocket
                if (hallucinationDetected) {
                  this.disconnect();
                  return;
                }
                
                const filteredWords = this.applyContextualFiltering(highConfidenceWords);
                                
                const filteredText = filteredWords.map((word: TranscriptionWord) => word.word).join('').trim();
                
                this.currentTranscript = filteredText;
                
                if (this.options.onTranscript) {
                  this.options.onTranscript(this.currentTranscript);
                }
              } else if (data.text !== undefined) {
                const processedText = data.text.trim().replace(/\s+/g, ' ');
                this.currentTranscript = processedText;
                
                if (this.options.onTranscript) {
                  this.options.onTranscript(this.currentTranscript);
                }
              } else if (data.error && this.options.onError) {
                this.options.onError(data.error);
              }
          } catch (error) {
            console.error("Error handling WebSocket message:", error);
          }
        };
        
        this.socket.onerror = (error) => {
          if (this.options.onError) {
            this.options.onError(error);
          }
          reject(error);
        };
        
        this.socket.onclose = () => {
          this.isConnected = false;
          
          if (this.isRecording) {
            this.stopRecording();
          }
          
          if (this.options.onClose) {
            this.options.onClose();
          }
        };
      });
    } catch (error) {
      if (this.options.onError) {
        this.options.onError(error);
      }
      throw error;
    }
  }
  
  /**
   * Start recording audio from the microphone and sending it to the server
   */
  public async startMicrophoneTranscription(): Promise<void> {
    if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Not connected to server. Call connect() first.");
    }

    if (this.isRecording) {return;}

    try {
      // Quick permission check
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        .catch(() => null);
      
      if (permissionStatus?.state === 'denied') {
        throw new Error("Microphone access has been denied. Please grant permission in your browser settings.");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const browserSampleRate = this.audioContext.sampleRate;
      const targetSampleRate = 16000;
      
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
          } 
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (micError: any) {
        if (micError.name === 'NotAllowedError' || micError.name === 'PermissionDeniedError') {
          throw new Error("Microphone access was denied. Please allow microphone access in your browser settings.");
        } else if (micError.name === 'NotFoundError' || micError.name === 'DevicesNotFoundError') {
          throw new Error("No microphone found. Please connect a microphone and try again.");
        } else {
          throw micError;
        }
      }
      
      this.audioSource = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.audioSource.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording || !this.socket || this.socket.readyState !== WebSocket.OPEN) {return;}
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        let resampledData = inputData;
        if (browserSampleRate !== targetSampleRate) {
          resampledData = this.resampleAudio(inputData, browserSampleRate, targetSampleRate);
        }
        
        if (!this.pcmBuffer || this.pcmBuffer.length !== resampledData.length) {
          this.pcmBuffer = new Int16Array(resampledData.length);
        }
        
        for (let i = 0; i < resampledData.length; i++) {
          this.pcmBuffer[i] = Math.min(1, Math.max(-1, resampledData[i])) * 32767;
        }
        
        try {
          this.socket.send(this.pcmBuffer.buffer);
        } catch (error) {
          if (this.socket?.readyState !== WebSocket.OPEN) {
            this.stopRecording();
            if (this.options.onError) {
              this.options.onError(new Error("WebSocket connection closed unexpectedly"));
            }
          }
        }
      };
      
      this.isRecording = true;
    } catch (error) {
      this.cleanupAudioResources();
      if (this.options.onError) {
        this.options.onError(error);
      }
      throw error;
    }
  }

  /**
   * Simple audio resampler for cross-browser compatibility
   * This is a basic linear interpolation resampler
   */
  private resampleAudio(audioBuffer: Float32Array, originalSampleRate: number, targetSampleRate: number): Float32Array {
    if (originalSampleRate === targetSampleRate) {
      return audioBuffer;
    }
    
    const ratio = originalSampleRate / targetSampleRate;
    const newLength = Math.round(audioBuffer.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const position = i * ratio;
      const index = Math.floor(position);
      const fraction = position - index;
      
      // Simple linear interpolation
      if (index + 1 < audioBuffer.length) {
        result[i] = audioBuffer[index] * (1 - fraction) + audioBuffer[index + 1] * fraction;
      } else {
        result[i] = audioBuffer[index];
      }
    }
    
    return result;
  }

  /**
   * Stop recording audio
   */
  public stopRecording(): void {
    if (!this.isRecording) {return;}
    this.isRecording = false;
    this.cleanupAudioResources();
  }

  /**
   * Disconnect from the server and clean up resources
   */
  public disconnect(): void {
    if (this.isRecording) {
      this.stopRecording();
    }
    
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      try {
        this.socket.close(1000, "Client initiated disconnect");
      } catch (error) {
        console.error("Error closing WebSocket:", error);
      }
      this.socket = null;
    }
    
    this.isConnected = false;
  }

  /**
   * Clean up audio resources
   */
  private cleanupAudioResources(): void {
    // Disconnect and clean up processor
    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch (error) {
        console.error("Error disconnecting processor:", error);
      }
      this.processor = null;
    }
    
    // Disconnect and clean up audio source
    if (this.audioSource) {
      try {
        this.audioSource.disconnect();
      } catch (error) {
        console.error("Error disconnecting audio source:", error);
      }
      this.audioSource = null;
    }
    
    // Stop all media tracks
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error("Error stopping media tracks:", error);
      }
      this.mediaStream = null;
    }
    
    // Close audio context
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (error) {
        console.error("Error closing audio context:", error);
      }
      this.audioContext = null;
    }
  }

  /**
   * Apply contextual filtering to ensure words make sense in sequence
   * This helps prevent nonsensical phrases caused by missing words
   */
  private applyContextualFiltering(words: TranscriptionWord[]): TranscriptionWord[] {
    if (words.length <= 1) {return words;}
    
    const result: TranscriptionWord[] = [];
    let currentPhrase: TranscriptionWord[] = [];
    
    // Group words by phrases based on timing
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      if (i === 0 || (word.start - words[i-1].end) < 0.3) {
        // Words are close in time, likely part of the same phrase
        currentPhrase.push(word);
      } else {
        // Gap between words, treat as separate phrases
        if (currentPhrase.length > 0) {
          // Only keep phrases with sufficient context (at least 2 words)
          // or high confidence (average probability > 0.85)
          const avgProbability = currentPhrase.reduce((sum, w) => sum + w.probability, 0) / currentPhrase.length;
          if (currentPhrase.length >= 2 || avgProbability > 0.85) {
            result.push(...currentPhrase);
          }
          currentPhrase = [word];
        }
      }
    }
    
    // Process the last phrase
    if (currentPhrase.length > 0) {
      const avgProbability = currentPhrase.reduce((sum, w) => sum + w.probability, 0) / currentPhrase.length;
      if (currentPhrase.length >= 2 || avgProbability > 0.85) {
        result.push(...currentPhrase);
      }
    }
    
    return result;
  }

  private async getWebSocketInfos(): Promise<{ url: string, model: string } | null> {
    try {
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/transcription/');
        if (!response.ok) {
          throw new Error('Failed to fetch WebSocket endpoint');
        }
        const data = await response.json();
        return data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching WebSocket endpoint:', error);
      // Fallback to random selection in case of error
      return null;
    }
  }
}