import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// The UI, local storage and database keep this flat message shape; ChatContext and the chat route
// convert to and from the AI SDK's parts-based UIMessage
export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt?: Date;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const processMessages = (messages: ChatMessage[]): ChatMessage[] => {
  return messages.map((msg, index) => {
    if (index === messages.length - 1 && msg.role === 'assistant') {
      return msg;
    }

    if (typeof msg.content === 'string') {
      const content = msg.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      return { ...msg, content };
    }

    return msg;
  });
};

/**
 * Validates the access token with the backend
 * On success, the backend creates a session stored in httpOnly cookies
 */
export const validateAccessToken = async (token: string): Promise<boolean> => {
  if (typeof window === 'undefined' || !token.trim()) {
    return false;
  }

  try {
    const response = await fetch('/api/auth/session/', {
      headers: {
        'Authorization': `Bearer ${token.trim()}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Access token validation failed:', error);
    return false;
  }
};