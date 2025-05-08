export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface CompletionRequest {
  model: string;
  prompt: string;
  temperature?: number;
  max_tokens?: number;
}

export interface Provider {
  createChatCompletion(payload: ChatCompletionRequest, res?: any): Promise<any>;
  createCompletion?(payload: CompletionRequest): Promise<any>;
} 