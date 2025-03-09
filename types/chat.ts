import { LLM } from './llms';

export interface Message {
  role: Role;
  content: string;
  image?: string; // Optional image data URL
}

export type Role = 'assistant' | 'user';

export interface ChatBody {
  model: LLM;
  messages: Message[];
  key: string;
  prompt: string;
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  model: LLM;
  prompt: string;
  folderId: string | null;
}
