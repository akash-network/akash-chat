import { generateUserMasterKey, type EncryptedData } from '../encryption';

export interface DatabaseEncryptedData {
  content_encrypted: string;
  content_iv: string;
  content_tag: string;
}

export interface ClientEncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

const MAX_CACHED_KEYS = 1000;

// Shared across instances: the name helpers below create a new service per call, and each
// derivation is a synchronous 100k-iteration PBKDF2 that blocks the event loop
const derivedKeyCache = new Map<string, Buffer>();

/**
 * Centralized encryption service for consistent data handling
 */
export class EncryptionService {
  private masterKey: string;

  constructor(userId: string) {
    this.masterKey = generateUserMasterKey(userId);
  }

  /**
   * Get or derive encryption key with caching
   */
  private getDerivedKey(salt: Buffer): Buffer {
    const cacheKey = `${this.masterKey}:${salt.toString('base64')}`;

    // Check cache first
    const cached = derivedKeyCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - derive the key
    const crypto = require('crypto');
    const key = crypto.pbkdf2Sync(this.masterKey, salt, 100000, 32, 'sha512');

    // Cache the derived key, evicting the oldest entry once full
    const oldestKey = derivedKeyCache.keys().next().value;
    if (derivedKeyCache.size >= MAX_CACHED_KEYS && oldestKey !== undefined) {
      derivedKeyCache.delete(oldestKey);
    }
    derivedKeyCache.set(cacheKey, key);

    return key;
  }

  /**
   * Encrypt text content for database storage
   */
  async encryptForDatabase(content: string): Promise<DatabaseEncryptedData> {
    // Handle empty content with a placeholder
    const contentToEncrypt = content && content.trim() !== '' ? content : '[EMPTY_MESSAGE]';

    // Use deterministic salt for new format to avoid storing salt separately
    const deterministicSalt = Buffer.from(this.masterKey.substring(0, 32).padEnd(32, '0'), 'utf8');
    const encrypted = this.encryptWithSalt(contentToEncrypt, this.masterKey, deterministicSalt);
    
    return {
      content_encrypted: encrypted.encrypted.toString('base64'),
      content_iv: encrypted.iv.toString('base64'),
      content_tag: encrypted.tag.toString('base64')
    };
  }

  /**
   * Encrypt text with a specific salt (for deterministic encryption)
   */
  private encryptWithSalt(text: string, masterKey: string, salt: Buffer): EncryptedData {
    if (!text || !masterKey) {
      throw new Error('Text and master key are required for encryption');
    }

    const crypto = require('crypto');
    const ALGORITHM = 'aes-256-cbc';
    const IV_LENGTH = 16;
    const TAG_LENGTH = 16;

    // Generate random IV (still random for security)
    const iv = crypto.randomBytes(IV_LENGTH);

    // Use cached key derivation
    const key = this.getDerivedKey(salt);

    // Create cipher using CBC mode
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // For CBC mode, use a hash of the encrypted data as integrity check
    const tag = crypto.createHash('sha256').update(encrypted).digest().slice(0, TAG_LENGTH);

    return {
      encrypted,
      iv,
      tag,
      salt
    };
  }

  /**
   * Decrypt content from database format
   */
  async decryptFromDatabase(data: DatabaseEncryptedData): Promise<string> {
    if (!data.content_encrypted || !data.content_iv || !data.content_tag) {
      throw new Error('Invalid encrypted data format - missing required fields');
    }

    const encryptedBuffer = Buffer.from(data.content_encrypted, 'base64');
    const ivBuffer = Buffer.from(data.content_iv, 'base64');
    const tagBuffer = Buffer.from(data.content_tag, 'base64');

    // Use deterministic salt derived from user ID for new format
    const deterministicSalt = Buffer.from(this.masterKey.substring(0, 32).padEnd(32, '0'), 'utf8');

    try {
      const crypto = require('crypto');
      const ALGORITHM = 'aes-256-cbc';
      const TAG_LENGTH = 16;

      // Use cached key derivation instead of calling decryptText
      const key = this.getDerivedKey(deterministicSalt);

      // Create decipher for CBC mode
      const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);

      // Decrypt the data
      const decryptedPart1 = decipher.update(encryptedBuffer);
      const decryptedPart2 = decipher.final();
      const decrypted = Buffer.concat([decryptedPart1, decryptedPart2]);
      const decryptedText = decrypted.toString('utf8');

      // Verify integrity using the tag (basic check for CBC mode)
      const expectedTag = crypto.createHash('sha256').update(encryptedBuffer).digest().slice(0, TAG_LENGTH);
      if (!tagBuffer.equals(expectedTag)) {
        throw new Error('Data integrity check failed');
      }

      // Convert placeholder back to empty string
      return decryptedText === '[EMPTY_MESSAGE]' ? '' : decryptedText;
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      throw new Error('Decryption failed - data may be corrupted or encryption key changed');
    }
  }

  /**
   * Safely decrypt optional content (returns null for missing data)
   */
  async decryptOptional(data: DatabaseEncryptedData | null | undefined): Promise<string | null> {
    if (!data) {
      return null;
    }
    
    try {
      return await this.decryptFromDatabase(data);
    } catch (error) {
      console.error('Failed to decrypt optional content:', error);
      return null;
    }
  }

  /**
   * Batch decrypt with error handling - returns result objects with success status
   */
  async decryptBatchSafe(dataArray: DatabaseEncryptedData[]): Promise<Array<{success: boolean, content: string, error?: string}>> {
    const results: Array<{success: boolean, content: string, error?: string}> = [];

    for (const data of dataArray) {
      try {
        const decrypted = await this.decryptFromDatabase(data);
        results.push({
          success: true,
          content: decrypted === '[ENCRYPTED_DATA_UNRECOVERABLE]' ? '[Message content unavailable - encryption key changed]' : decrypted
        });
      } catch (error) {
        results.push({
          success: false,
          content: '[Decryption failed]',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }
}

/**
 * Factory function to create encryption service instances
 */
export function createEncryptionService(userId: string): EncryptionService {
  return new EncryptionService(userId);
}

/**
 * Helper function to encrypt system prompt with proper null handling
 */
export async function encryptSystemPrompt(
  systemPrompt: string | null | undefined,
  userId: string
): Promise<DatabaseEncryptedData | null> {
  if (!systemPrompt || systemPrompt.trim() === '') {
    return null;
  }
  
  const service = new EncryptionService(userId);
  return service.encryptForDatabase(systemPrompt);
}

/**
 * Helper function to decrypt system prompt with proper null handling
 */
export async function decryptSystemPrompt(
  encryptedData: DatabaseEncryptedData | null | undefined,
  userId: string
): Promise<string | null> {
  if (!encryptedData) {
    return null;
  }
  
  const service = new EncryptionService(userId);
  return service.decryptOptional(encryptedData);
}

/**
 * Helper function to encrypt chat session name with proper null handling
 */
export async function encryptChatName(
  chatName: string | null | undefined,
  userId: string
): Promise<DatabaseEncryptedData | null> {
  if (!chatName || chatName.trim() === '') {
    return null;
  }
  
  const service = new EncryptionService(userId);
  return service.encryptForDatabase(chatName);
}

/**
 * Helper function to decrypt chat session name with proper null handling
 */
export async function decryptChatName(
  encryptedData: DatabaseEncryptedData | null | undefined,
  userId: string
): Promise<string | null> {
  if (!encryptedData) {
    return null;
  }
  
  const service = new EncryptionService(userId);
  return service.decryptOptional(encryptedData);
}

/**
 * Helper function to encrypt folder name with proper null handling
 */
export async function encryptFolderName(
  folderName: string | null | undefined,
  userId: string
): Promise<DatabaseEncryptedData | null> {
  if (!folderName || folderName.trim() === '') {
    return null;
  }
  
  const service = new EncryptionService(userId);
  return service.encryptForDatabase(folderName);
}

/**
 * Helper function to decrypt folder name with proper null handling
 */
export async function decryptFolderName(
  encryptedData: DatabaseEncryptedData | null | undefined,
  userId: string
): Promise<string | null> {
  if (!encryptedData) {
    return null;
  }
  
  const service = new EncryptionService(userId);
  return service.decryptOptional(encryptedData);
}