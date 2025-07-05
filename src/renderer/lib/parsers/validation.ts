/**
 * Validation Utilities for Conversation Parsing
 *
 * Functions for validating, sanitizing, and normalizing
 * parsed conversation data.
 */

import type { Conversation, Message } from '@common/types';
import type { ParseResult } from './types';

// =============================================================================
// Content Sanitization
// =============================================================================

/**
 * Characters and patterns to remove from content
 */
const SANITIZATION_PATTERNS: Array<[RegExp, string]> = [
  // Remove null bytes
  [/\0/g, ''],
  // Normalize line endings
  [/\r\n/g, '\n'],
  [/\r/g, '\n'],
  // Remove control characters except newline and tab
  // eslint-disable-next-line no-control-regex -- Intentional: sanitizing binary control chars from user input
  [/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''],
  // Normalize multiple spaces to single
  [/ {2,}/g, ' '],
  // Normalize multiple newlines to double
  [/\n{3,}/g, '\n\n'],
  // Remove leading/trailing whitespace from lines
  [/^[ \t]+|[ \t]+$/gm, ''],
];

/**
 * HTML entities to decode
 */
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&#x27;': "'",
  '&#x2F;': '/',
  '&#x60;': '`',
};

/**
 * Sanitize content by removing problematic characters
 * and decoding HTML entities.
 */
export function sanitizeContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  let result = content;

  // Decode HTML entities
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    result = result.replace(new RegExp(entity, 'gi'), char);
  }

  // Decode numeric HTML entities
  result = result.replace(/&#(\d+);/g, (_match, dec) => {
    const code = parseInt(dec, 10);
    return code > 0 && code < 65536 ? String.fromCharCode(code) : '';
  });

  result = result.replace(/&#x([0-9a-f]+);/gi, (_match, hex) => {
    const code = parseInt(hex, 16);
    return code > 0 && code < 65536 ? String.fromCharCode(code) : '';
  });

  // Apply sanitization patterns
  for (const [pattern, replacement] of SANITIZATION_PATTERNS) {
    result = result.replace(pattern, replacement);
  }

  // Trim final result
  return result.trim();
}

/**
 * Strip all HTML tags from content
 */
export function stripHtmlTags(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Remove script and style tags with content
  let result = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  result = result.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove all other HTML tags
  result = result.replace(/<[^>]+>/g, ' ');

  return sanitizeContent(result);
}

// =============================================================================
// Message Validation
// =============================================================================

/**
 * Valid message roles
 */
const VALID_ROLES = new Set(['user', 'assistant', 'system']);

/**
 * Validate a single message
 */
export function validateMessage(message: Message): ParseResult<Message> {
  // Check required fields
  if (!message.id || typeof message.id !== 'string') {
    return {
      success: false,
      error: {
        code: 'MISSING_REQUIRED_FIELD',
        message: 'Message missing required "id" field',
        path: 'id',
        value: message.id,
      },
    };
  }

  if (!VALID_ROLES.has(message.role)) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: `Invalid message role: "${message.role}"`,
        path: 'role',
        value: message.role,
      },
    };
  }

  if (typeof message.content !== 'string') {
    return {
      success: false,
      error: {
        code: 'TYPE_MISMATCH',
        message: 'Message content must be a string',
        path: 'content',
        value: typeof message.content,
      },
    };
  }

  // Validate timestamp if present
  if (message.timestamp !== null && !(message.timestamp instanceof Date)) {
    return {
      success: false,
      error: {
        code: 'TYPE_MISMATCH',
        message: 'Message timestamp must be a Date or null',
        path: 'timestamp',
        value: message.timestamp,
      },
    };
  }

  return { success: true, data: message };
}

/**
 * Validate a conversation object
 */
export function validateConversation(conversation: Conversation): ParseResult<Conversation> {
  const warnings: string[] = [];

  // Check required string fields
  if (!conversation.id || typeof conversation.id !== 'string') {
    return {
      success: false,
      error: {
        code: 'MISSING_REQUIRED_FIELD',
        message: 'Conversation missing required "id" field',
        path: 'id',
        value: conversation.id,
      },
    };
  }

  if (typeof conversation.title !== 'string') {
    return {
      success: false,
      error: {
        code: 'TYPE_MISMATCH',
        message: 'Conversation title must be a string',
        path: 'title',
        value: typeof conversation.title,
      },
    };
  }

  // Validate dates
  if (!(conversation.createdAt instanceof Date)) {
    return {
      success: false,
      error: {
        code: 'TYPE_MISMATCH',
        message: 'Conversation createdAt must be a Date',
        path: 'createdAt',
        value: conversation.createdAt,
      },
    };
  }

  if (!(conversation.updatedAt instanceof Date)) {
    return {
      success: false,
      error: {
        code: 'TYPE_MISMATCH',
        message: 'Conversation updatedAt must be a Date',
        path: 'updatedAt',
        value: conversation.updatedAt,
      },
    };
  }

  // Validate source
  const validSources = new Set(['chatgpt', 'claude', 'generic']);
  if (!validSources.has(conversation.source)) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: `Invalid conversation source: "${conversation.source}"`,
        path: 'source',
        value: conversation.source,
      },
    };
  }

  // Validate messages array
  if (!Array.isArray(conversation.messages)) {
    return {
      success: false,
      error: {
        code: 'TYPE_MISMATCH',
        message: 'Conversation messages must be an array',
        path: 'messages',
        value: typeof conversation.messages,
      },
    };
  }

  // Validate each message
  for (let i = 0; i < conversation.messages.length; i++) {
    const msgResult = validateMessage(conversation.messages[i]);
    if (!msgResult.success) {
      return {
        success: false,
        error: {
          ...msgResult.error,
          path: `messages[${i}].${msgResult.error.path}`,
        },
      };
    }
  }

  // Add warning for empty conversations
  if (conversation.messages.length === 0) {
    warnings.push('Conversation has no messages');
  }

  return { success: true, data: conversation, warnings };
}

// =============================================================================
// Deduplication
// =============================================================================

/**
 * Generate a hash for a message for deduplication
 */
function messageHash(message: Message): string {
  return `${message.role}:${message.content.slice(0, 1000)}`;
}

/**
 * Remove duplicate messages from an array
 * Preserves the first occurrence of each unique message
 */
export function deduplicateMessages(messages: Message[]): Message[] {
  const seen = new Set<string>();
  const result: Message[] = [];

  for (const message of messages) {
    const hash = messageHash(message);
    if (!seen.has(hash)) {
      seen.add(hash);
      result.push(message);
    }
  }

  return result;
}

// =============================================================================
// Sorting
// =============================================================================

/**
 * Sort messages by timestamp in ascending order
 * Messages without timestamps are placed at the end
 */
export function sortMessagesByTimestamp(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => {
    // Both have timestamps
    if (a.timestamp && b.timestamp) {
      return a.timestamp.getTime() - b.timestamp.getTime();
    }
    // Only a has timestamp - a comes first
    if (a.timestamp && !b.timestamp) {
      return -1;
    }
    // Only b has timestamp - b comes first
    if (!a.timestamp && b.timestamp) {
      return 1;
    }
    // Neither has timestamp - preserve order
    return 0;
  });
}

/**
 * Sort conversations by creation date
 */
export function sortConversationsByDate(
  conversations: Conversation[],
  order: 'asc' | 'desc' = 'desc'
): Conversation[] {
  const multiplier = order === 'desc' ? -1 : 1;
  return [...conversations].sort((a, b) => {
    return multiplier * (a.createdAt.getTime() - b.createdAt.getTime());
  });
}

// =============================================================================
// Normalization
// =============================================================================

/**
 * Normalize a role string to standard format
 */
export function normalizeRole(role: string): 'user' | 'assistant' | 'system' {
  const normalized = role.toLowerCase().trim();

  // User role variations
  if (['user', 'human', 'customer', 'person', 'me'].includes(normalized)) {
    return 'user';
  }

  // Assistant role variations
  if (
    ['assistant', 'ai', 'bot', 'chatgpt', 'claude', 'gpt', 'model', 'agent'].includes(normalized)
  ) {
    return 'assistant';
  }

  // System role
  if (['system', 'context', 'instruction'].includes(normalized)) {
    return 'system';
  }

  // Default to assistant for unknown roles
  return 'assistant';
}

/**
 * Parse a timestamp from various formats
 */
export function parseTimestamp(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Already a Date
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Unix timestamp in seconds
  if (typeof value === 'number') {
    // Detect if seconds or milliseconds
    // Unix timestamps in seconds are < 10000000000 (year 2286)
    const ms = value < 10000000000 ? value * 1000 : value;
    const date = new Date(ms);
    return isNaN(date.getTime()) ? null : date;
  }

  // ISO string or other date string
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Normalize content to a string
 */
export function normalizeContent(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string').join('\n');
  }

  if (value && typeof value === 'object' && 'text' in value) {
    return String((value as { text: unknown }).text);
  }

  return String(value ?? '');
}

// =============================================================================
// Filtering
// =============================================================================

/**
 * Filter out empty messages
 */
export function filterEmptyMessages(messages: Message[]): Message[] {
  return messages.filter((msg) => msg.content.trim().length > 0);
}

/**
 * Filter out system messages
 */
export function filterSystemMessages(messages: Message[]): Message[] {
  return messages.filter((msg) => msg.role !== 'system');
}

/**
 * Limit messages to a maximum count
 */
export function limitMessages(messages: Message[], maxCount: number): Message[] {
  if (maxCount <= 0) {
    return messages;
  }
  return messages.slice(0, maxCount);
}
