import type { Message as AIMessage } from 'ai';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const processMessages = (messages: AIMessage[]): AIMessage[] => {
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
 * Gets the access token from localStorage
 * @returns The raw access token or null if not found
 */
export const getAccessToken = () => {
  if (typeof window === 'undefined') {return null;}
  
  const currentToken = localStorage.getItem('akt_priv_access');
  return currentToken;
};

/**
 * Hashes the access token with SHA-256 and stores it in localStorage
 * @param token The raw access token to hash and store
 */
export const storeAccessToken = async (token: string): Promise<void> => {
  if (typeof window === 'undefined' || !token.trim()) {return;}
  
  try {
    // Use SubtleCrypto API for client-side hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(token.trim());
    
    // Hash the token
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    
    // Convert hash to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Store the hashed token
    localStorage.setItem('akt_priv_access', hashedToken);
  } catch (error) {
    console.error('Error storing hashed token:', error);
  }
};