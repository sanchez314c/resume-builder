/**
 * Generic Conversation Parser
 *
 * Fallback parser for unknown or custom conversation formats.
 * Attempts to extract messages using common field name patterns.
 *
 * This parser tries multiple strategies to find conversational content
 * in JSON data that doesn't match ChatGPT or Claude formats.
 */

import type { Conversation, Message } from '@common/types';
import type {
  ParseResult,
  ParseError,
  ParserOptions,
  MultiParseResult,
  GenericConversationShape,
} from './types';
import { DEFAULT_PARSER_OPTIONS } from './types';
import {
  sanitizeContent,
  deduplicateMessages,
  sortMessagesByTimestamp,
  filterEmptyMessages,
  filterSystemMessages,
  limitMessages,
  parseTimestamp,
  normalizeRole,
  normalizeContent,
} from './validation';

// =============================================================================
// Field Name Patterns
// =============================================================================

/**
 * Common field names for user content
 */
const USER_CONTENT_FIELDS = [
  'user',
  'human',
  'question',
  'input',
  'prompt',
  'query',
  'request',
  'user_message',
  'human_message',
  'user_input',
  'customer',
  'sender',
];

/**
 * Common field names for assistant content
 */
const ASSISTANT_CONTENT_FIELDS = [
  'assistant',
  'ai',
  'bot',
  'response',
  'answer',
  'output',
  'reply',
  'assistant_message',
  'ai_message',
  'bot_response',
  'agent',
  'gpt',
];

/**
 * Common field names for message arrays
 */
const MESSAGES_ARRAY_FIELDS = [
  'messages',
  'conversation',
  'conversations',
  'chat',
  'chats',
  'history',
  'chat_history',
  'message_history',
  'exchanges',
  'turns',
  'dialog',
  'dialogue',
  'thread',
];

/**
 * Common field names for role
 */
const ROLE_FIELDS = ['role', 'type', 'sender', 'author', 'from', 'speaker'];

/**
 * Common field names for content
 */
const CONTENT_FIELDS = ['content', 'text', 'message', 'body', 'value', 'data', 'payload'];

// =============================================================================
// Type Detection
// =============================================================================

/**
 * Check if value looks like a generic conversation
 */
export function isGenericFormat(value: unknown): value is GenericConversationShape {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  // Has a messages-like array
  for (const field of MESSAGES_ARRAY_FIELDS) {
    if (Array.isArray(obj[field]) && obj[field].length > 0) {
      return true;
    }
  }

  // Is itself an array of objects
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
    return true;
  }

  // Has user/assistant style paired fields
  for (const userField of USER_CONTENT_FIELDS) {
    for (const assistantField of ASSISTANT_CONTENT_FIELDS) {
      if (obj[userField] !== undefined && obj[assistantField] !== undefined) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Find the messages array in an object
 */
function findMessagesArray(obj: Record<string, unknown>): unknown[] | null {
  for (const field of MESSAGES_ARRAY_FIELDS) {
    if (Array.isArray(obj[field])) {
      return obj[field];
    }
  }
  return null;
}

/**
 * Find role field in a message object
 */
function findRole(msg: Record<string, unknown>): string | null {
  for (const field of ROLE_FIELDS) {
    const value = msg[field];
    if (typeof value === 'string') {
      return value;
    }
    if (value && typeof value === 'object' && 'role' in value) {
      return String((value as Record<string, unknown>).role);
    }
  }
  return null;
}

/**
 * Find content field in a message object
 */
function findContent(msg: Record<string, unknown>): string | null {
  for (const field of CONTENT_FIELDS) {
    const value = msg[field];
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.filter((v) => typeof v === 'string').join('\n');
    }
    if (value && typeof value === 'object' && 'text' in value) {
      return String((value as Record<string, unknown>).text);
    }
  }
  return null;
}

/**
 * Find timestamp field in a message object
 */
function findTimestamp(msg: Record<string, unknown>): unknown | null {
  const timestampFields = [
    'timestamp',
    'time',
    'created_at',
    'createdAt',
    'create_time',
    'createTime',
    'date',
    'datetime',
    'sent_at',
    'sentAt',
  ];

  for (const field of timestampFields) {
    if (msg[field] !== undefined && msg[field] !== null) {
      return msg[field];
    }
  }
  return null;
}

// =============================================================================
// Extraction Strategies
// =============================================================================

/**
 * Strategy 1: Extract from messages array with role/content structure
 */
function extractFromMessagesArray(messages: unknown[], options: ParserOptions): Message[] {
  const result: Message[] = [];

  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') continue;

    const msgObj = msg as Record<string, unknown>;
    const roleStr = findRole(msgObj);
    const contentStr = findContent(msgObj);

    if (!contentStr && !options.includeEmpty) continue;

    let content = contentStr || '';
    if (options.sanitizeContent !== false) {
      content = sanitizeContent(content);
    }

    const role = roleStr ? normalizeRole(roleStr) : 'assistant';

    if (role === 'system' && options.skipSystemMessages) continue;

    result.push({
      id:
        (typeof msgObj.id === 'string' ? msgObj.id : null) ||
        options.idGenerator?.() ||
        crypto.randomUUID(),
      role,
      content,
      timestamp: parseTimestamp(findTimestamp(msgObj)),
    });
  }

  return result;
}

/**
 * Strategy 2: Extract from paired user/assistant fields
 */
function extractFromPairedFields(obj: Record<string, unknown>, options: ParserOptions): Message[] {
  const result: Message[] = [];

  // Find user content
  for (const userField of USER_CONTENT_FIELDS) {
    const userContent = obj[userField];
    if (userContent !== undefined) {
      let content = normalizeContent(userContent);
      if (options.sanitizeContent !== false) {
        content = sanitizeContent(content);
      }
      if (content.trim().length > 0 || options.includeEmpty) {
        result.push({
          id: options.idGenerator?.() || crypto.randomUUID(),
          role: 'user',
          content,
          timestamp: parseTimestamp(obj.timestamp || obj.time),
        });
      }
      break;
    }
  }

  // Find assistant content
  for (const assistantField of ASSISTANT_CONTENT_FIELDS) {
    const assistantContent = obj[assistantField];
    if (assistantContent !== undefined) {
      let content = normalizeContent(assistantContent);
      if (options.sanitizeContent !== false) {
        content = sanitizeContent(content);
      }
      if (content.trim().length > 0 || options.includeEmpty) {
        result.push({
          id: options.idGenerator?.() || crypto.randomUUID(),
          role: 'assistant',
          content,
          timestamp: parseTimestamp(obj.timestamp || obj.time),
        });
      }
      break;
    }
  }

  return result;
}

/**
 * Strategy 3: Extract from array of paired objects
 */
function extractFromPairedArray(array: unknown[], options: ParserOptions): Message[] {
  const result: Message[] = [];

  for (const item of array) {
    if (!item || typeof item !== 'object') continue;
    const itemObj = item as Record<string, unknown>;
    result.push(...extractFromPairedFields(itemObj, options));
  }

  return result;
}

/**
 * Strategy 4: Infer alternating roles from raw strings
 */
function extractFromStringArray(array: unknown[], options: ParserOptions): Message[] {
  const result: Message[] = [];
  const strings = array.filter((v): v is string => typeof v === 'string');

  // Alternate between user and assistant
  let role: 'user' | 'assistant' = 'user';

  for (const str of strings) {
    let content = str;
    if (options.sanitizeContent !== false) {
      content = sanitizeContent(content);
    }

    if (content.trim().length > 0 || options.includeEmpty) {
      result.push({
        id: options.idGenerator?.() || crypto.randomUUID(),
        role,
        content,
        timestamp: null,
      });
      role = role === 'user' ? 'assistant' : 'user';
    }
  }

  return result;
}

// =============================================================================
// Parsing Functions
// =============================================================================

/**
 * Parse a generic conversation format
 */
export function parseGenericFormat(
  json: unknown,
  options: ParserOptions = {}
): ParseResult<Conversation> {
  const opts = { ...DEFAULT_PARSER_OPTIONS, ...options };
  const warnings: string[] = [];
  let messages: Message[] = [];

  // Handle array input
  if (Array.isArray(json)) {
    // Check if array of string messages
    if (json.length > 0 && typeof json[0] === 'string') {
      messages = extractFromStringArray(json, opts);
      warnings.push('Parsed as alternating string messages');
    }
    // Check if array has role/content structure
    else if (
      json.length > 0 &&
      json[0] &&
      typeof json[0] === 'object' &&
      findRole(json[0] as Record<string, unknown>)
    ) {
      messages = extractFromMessagesArray(json, opts);
    }
    // Try paired fields extraction
    else if (json.length > 0 && json[0] && typeof json[0] === 'object') {
      messages = extractFromPairedArray(json, opts);
      if (messages.length > 0) {
        warnings.push('Parsed using paired field detection');
      }
    }
  }
  // Handle object input
  else if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;

    // Try to find messages array
    const messagesArray = findMessagesArray(obj);
    if (messagesArray) {
      // First try standard role/content extraction
      messages = extractFromMessagesArray(messagesArray, opts);

      // If no messages extracted, try paired fields on each item
      if (messages.length === 0) {
        messages = extractFromPairedArray(messagesArray, opts);
        if (messages.length > 0) {
          warnings.push('Parsed using paired field detection within messages array');
        }
      }
    }
    // Try paired fields on root object
    else {
      messages = extractFromPairedFields(obj, opts);
      if (messages.length > 0) {
        warnings.push('Parsed using paired field detection');
      }
    }
  }

  // No messages extracted
  if (messages.length === 0) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_FORMAT',
        message: 'Could not extract messages from unknown format',
        value: typeof json,
      },
    };
  }

  // Apply post-processing
  if (!opts.includeEmpty) {
    messages = filterEmptyMessages(messages);
  }

  if (opts.skipSystemMessages) {
    messages = filterSystemMessages(messages);
  }

  if (opts.deduplicateMessages) {
    const beforeCount = messages.length;
    messages = deduplicateMessages(messages);
    const removed = beforeCount - messages.length;
    if (removed > 0) {
      warnings.push(`Removed ${removed} duplicate messages`);
    }
  }

  if (opts.sortByTimestamp) {
    messages = sortMessagesByTimestamp(messages);
  }

  if (opts.maxMessages && opts.maxMessages > 0) {
    messages = limitMessages(messages, opts.maxMessages);
  }

  // Extract metadata
  let title = 'Imported Conversation';
  const obj = json as Record<string, unknown> | null;
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    title =
      (typeof obj.title === 'string' ? obj.title : null) ||
      (typeof obj.name === 'string' ? obj.name : null) ||
      (typeof obj.subject === 'string' ? obj.subject : null) ||
      title;
  }

  // Build conversation
  const conversation: Conversation = {
    id: opts.idGenerator?.() || crypto.randomUUID(),
    title,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: 'generic',
    messages,
  };

  return {
    success: true,
    data: conversation,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Parse an array of generic conversations
 */
export function parseGenericFormatArray(
  json: unknown,
  options: ParserOptions = {}
): MultiParseResult {
  const opts = { ...DEFAULT_PARSER_OPTIONS, ...options };

  // If array where each item is a conversation
  if (!Array.isArray(json)) {
    // Try single parse
    const result = parseGenericFormat(json, opts);
    return {
      conversations: result.success ? [result.data] : [],
      errors: result.success ? [] : [result.error],
      warnings: result.success && result.warnings ? result.warnings : [],
      totalAttempted: 1,
      successCount: result.success ? 1 : 0,
    };
  }

  const conversations: Conversation[] = [];
  const errors: ParseError[] = [];
  const warnings: string[] = [];

  // Check if array items look like individual conversations
  const firstItem = json[0];
  if (firstItem && typeof firstItem === 'object' && !Array.isArray(firstItem)) {
    const firstItemObj = firstItem as Record<string, unknown>;

    // If items have messages arrays, treat each as a conversation
    if (findMessagesArray(firstItemObj)) {
      for (let i = 0; i < json.length; i++) {
        const result = parseGenericFormat(json[i], opts);
        if (result.success) {
          conversations.push(result.data);
          if (result.warnings) {
            warnings.push(...result.warnings.map((w) => `Item ${i + 1}: ${w}`));
          }
        } else {
          errors.push({
            ...result.error,
            path: `[${i}]`,
          });
        }
      }

      return {
        conversations,
        errors,
        warnings,
        totalAttempted: json.length,
        successCount: conversations.length,
      };
    }
  }

  // Otherwise treat entire array as single conversation
  const result = parseGenericFormat(json, opts);
  return {
    conversations: result.success ? [result.data] : [],
    errors: result.success ? [] : [result.error],
    warnings: result.success && result.warnings ? result.warnings : [],
    totalAttempted: 1,
    successCount: result.success ? 1 : 0,
  };
}

/**
 * Attempt to detect format and extract metadata
 */
export function analyzeGenericFormat(json: unknown): {
  hasMessages: boolean;
  messageCount: number;
  hasTimestamps: boolean;
  hasRoles: boolean;
  detectedFields: string[];
  structure: 'array' | 'object' | 'unknown';
} {
  const result = {
    hasMessages: false,
    messageCount: 0,
    hasTimestamps: false,
    hasRoles: false,
    detectedFields: [] as string[],
    structure: 'unknown' as 'array' | 'object' | 'unknown',
  };

  if (Array.isArray(json)) {
    result.structure = 'array';
    result.messageCount = json.length;
    result.hasMessages = json.length > 0;

    if (json.length > 0 && json[0] && typeof json[0] === 'object') {
      const sample = json[0] as Record<string, unknown>;
      result.hasRoles = findRole(sample) !== null;
      result.hasTimestamps = findTimestamp(sample) !== null;
      result.detectedFields = Object.keys(sample);
    }
  } else if (json && typeof json === 'object') {
    result.structure = 'object';
    const obj = json as Record<string, unknown>;
    result.detectedFields = Object.keys(obj);

    const messagesArray = findMessagesArray(obj);
    if (messagesArray) {
      result.hasMessages = true;
      result.messageCount = messagesArray.length;

      if (messagesArray.length > 0 && typeof messagesArray[0] === 'object') {
        const sample = messagesArray[0] as Record<string, unknown>;
        result.hasRoles = findRole(sample) !== null;
        result.hasTimestamps = findTimestamp(sample) !== null;
      }
    }
  }

  return result;
}
