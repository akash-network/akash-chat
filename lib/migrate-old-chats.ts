import { Message } from 'ai';

interface OldChatHistory {
  id: string;
  name: string;
  messages: Message[];
  model: {
    id: string;
    name: string;
    maxLength: number;
    tokenLimit: number;
    temperature: number;
    top_p: number;
  };
  prompt: string;
  folderId: string | null;
}

export function migrateOldChats() {
  try {
    // Check if we've already migrated
    if (localStorage.getItem('migrationCompleted') === '2.0.0') {
      return;
    }

    // Check for old conversation history
    const oldConversationHistory = localStorage.getItem('conversationHistory');
    if (oldConversationHistory) {
      const oldChats: OldChatHistory[] = JSON.parse(oldConversationHistory);
      
      // Convert old chats to new format
      const newChats = oldChats.map(chat => ({
        id: chat.id,
        name: chat.name,
        messages: chat.messages,
        model: {
          id: chat.model.id,
          name: chat.model.name,
        },
        system: chat.prompt, // Map old prompt to new system field
        folderId: chat.folderId,
      }));

      // Save to new format
      localStorage.setItem('chats', JSON.stringify(newChats));
      
      // Migrate folders if they exist
      const oldFolders = localStorage.getItem('folders');
      if (oldFolders) {
        // The folder format is compatible, so we can just keep it
        localStorage.setItem('folders', oldFolders);
      }

      // Clean up old data
      localStorage.removeItem('conversationHistory');
      localStorage.removeItem('selectedConversation');

      // Mark migration as completed
      localStorage.setItem('migrationCompleted', '2.0.0');
      
      // Reload the page to show migrated data
      window.location.reload();
    }
  } catch (error) {
    console.error('Failed to migrate old chat data:', error);
  }
} 