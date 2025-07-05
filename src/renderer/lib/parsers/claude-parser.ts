/**
 * Claude Export Parser
 *
 * Claude exports are typically simpler than ChatGPT exports,
 * usually consisting of flat arrays of messages with role/content pairs.
 *
 * Supported formats:
 * 1. Array of {role, content} messages
 * 2. Object with conversations array containing messages
 * 3. Single conversation object with messages array
 */

import type { Conversation, Message } from '@common/types';
import type {
  ParseResult,
  ParseError,
  ParserOptions,
  MultiParseResult,
  ClaudeExportFormat,
} from './types';
import { DEFAULT_PARSER_OPTIONS } from './types';
import {
  sanitizeContent,
  deduplicateMessages,
  sortMessagesByTimestamp,
  filterEmptyMessages,
  limitMessages,
  parseTimestamp,
  normalizeRole,
  normalizeContent,
} from './validation';

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if a value looks like a Claude message
 */
function isClaudeMessage(value: unknown): value is { role: string; content: string } {
  if (!value || typeof value !== 'object') return false;
  const msg = value as Record<string, unknown>;

  // Must have role as string
  if (typeof msg.role !== 'string') return false;

  // Content can be string or array
  if (typeof msg.content !== 'string' && !Array.isArray(msg.content)) {
    return false;
  }

  // Role should be human/assistant or user/assistant
  const role = msg.role.toLowerCase();
  const validRoles = ['human', 'assistant', 'user', 'system', 'ai'];
  if (!validRoles.includes(role)) return false;

  return true;
}

/**
 * Check if a value is a Claude export format
 */
export function isClaudeExport(value: unknown): value is ClaudeExportFormat {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  // Format 1: Object with messages array
  if (Array.isArray(obj.messages) && obj.messages.length > 0) {
    return isClaudeMessage(obj.messages[0]);
  }

  // Format 2: Object with conversation/chat_messages array
  const messagesKey = ['conversation', 'chat_messages', 'chat'].find(
    (key) => Array.isArray(obj[key]) && (obj[key] as unknown[]).length > 0
  );

  if (messagesKey) {
    const messages = obj[messagesKey] as unknown[];
    return isClaudeMessage(messages[0]);
  }

  return false;
}

/**
 * Check if value is a direct array of Claude messages
 */
export function isClaudeMessageArray(
  value: unknown
): value is Array<{ role: string; content: string }> {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return false;
  return isClaudeMessage(value[0]);
}

/**
 * Check if value is an array of Claude conversation objects
 */
export function isClaudeConversationArray(value: unknown): value is ClaudeExportFormat[] {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return false;
  return isClaudeExport(value[0]);
}

// =============================================================================
// Message Extraction
// =============================================================================

/**
 * Extract messages from a Claude export
 */
function extractMessagesFromClaudeExport(
  export_: ClaudeExportFormat,
  options: ParserOptions
): Message[] {
  const messages: Message[] = [];
  const obj = export_ as Record<string, unknown>;

  // Find the messages array
  let rawMessages: unknown[] | undefined;

  if (Array.isArray(obj.messages)) {
    rawMessages = obj.messages;
  } else if (Array.isArray(obj.conversation)) {
    rawMessages = obj.conversation;
  } else if (Array.isArray(obj.chat_messages)) {
    rawMessages = obj.chat_messages;
  } else if (Array.isArray(obj.chat)) {
    rawMessages = obj.chat;
  }

  if (!rawMessages) {
    return messages;
  }

  // Process each message
  for (const rawMsg of rawMessages) {
    if (!rawMsg || typeof rawMsg !== 'object') continue;

    const msg = rawMsg as Record<string, unknown>;
    const roleStr = String(msg.role || msg.type || '');
    const normalizedRole = normalizeRole(roleStr);

    // Skip system messages if configured
    if (normalizedRole === 'system' && options.skipSystemMessages) {
      continue;
    }

    // Extract content
    let content = normalizeContent(msg.content || msg.text || msg.message || '');

    // Sanitize if enabled
    if (options.sanitizeContent !== false) {
      content = sanitizeContent(content);
    }

    // Skip empty if configured
    if (content.trim().length === 0 && !options.includeEmpty) {
      continue;
    }

    // Extract timestamp
    const timestamp = parseTimestamp(
      msg.timestamp || msg.created_at || msg.create_time || msg.time
    );

    // Extract or generate ID
    const id =
      (typeof msg.id === 'string' ? msg.id : null) ||
      (typeof msg.uuid === 'string' ? msg.uuid : null) ||
      options.idGenerator?.() ||
      crypto.randomUUID();

    messages.push({
      id,
      role: normalizedRole,
      content,
      timestamp,
    });
  }

  return messages;
}

// =============================================================================
// Parsing Functions
// =============================================================================

/**
 * Parse a single Claude export object
 */
export function parseClaudeExport(
  json: unknown,
  options: ParserOptions = {}
): ParseResult<Conversation> {
  const opts = { ...DEFAULT_PARSER_OPTIONS, ...options };
  const warnings: string[] = [];

  // Handle direct message array
  if (isClaudeMessageArray(json)) {
    const fakeExport: ClaudeExportFormat = { messages: json };
    return parseClaudeExport(fakeExport, options);
  }

  // Type check
  if (!isClaudeExport(json)) {
    return {
      success: false,
      error: {
        code: 'INVALID_FORMAT',
        message: 'Input is not a valid Claude export format',
        value: typeof json,
      },
    };
  }

  // Extract messages
  let messages: Message[];
  try {
    messages = extractMessagesFromClaudeExport(json, opts);
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'MALFORMED_DATA',
        message: `Failed to extract messages: ${err instanceof Error ? err.message : String(err)}`,
        stack: err instanceof Error ? err.stack : undefined,
      },
    };
  }

  // Apply post-processing
  if (!opts.includeEmpty) {
    messages = filterEmptyMessages(messages);
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
  const title =
    json.title ||
    json.name ||
    (messages.length > 0
      ? `Claude Chat: ${messages[0].content.slice(0, 50)}...`
      : 'Untitled Claude Chat');

  const createdAt = parseTimestamp(json.created_at) || new Date();
  const updatedAt = parseTimestamp(json.updated_at) || createdAt;

  // Build conversation object
  const conversation: Conversation = {
    id: json.uuid || opts.idGenerator?.() || crypto.randomUUID(),
    title,
    createdAt,
    updatedAt,
    source: 'claude',
    messages,
  };

  // Add warning if no messages
  if (messages.length === 0) {
    warnings.push('No messages extracted from conversation');
  }

  return {
    success: true,
    data: conversation,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Parse an array of Claude exports
 */
export function parseClaudeExportArray(
  json: unknown,
  options: ParserOptions = {}
): MultiParseResult {
  const opts = { ...DEFAULT_PARSER_OPTIONS, ...options };

  // Check if it's a direct array of messages (single conversation)
  if (isClaudeMessageArray(json)) {
    const result = parseClaudeExport({ messages: json }, opts);
    return {
      conversations: result.success ? [result.data] : [],
      errors: result.success ? [] : [result.error],
      warnings: result.success && result.warnings ? result.warnings : [],
      totalAttempted: 1,
      successCount: result.success ? 1 : 0,
    };
  }

  // Check if it's an array of conversation objects
  if (!Array.isArray(json)) {
    return {
      conversations: [],
      errors: [
        {
          code: 'INVALID_FORMAT',
          message: 'Expected an array of Claude exports',
          value: typeof json,
        },
      ],
      warnings: [],
      totalAttempted: 0,
      successCount: 0,
    };
  }

  const conversations: Conversation[] = [];
  const errors: ParseError[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < json.length; i++) {
    const item = json[i];
    const result = parseClaudeExport(item, opts);

    if (result.success) {
      conversations.push(result.data);
      if (result.warnings) {
        warnings.push(...result.warnings.map((w) => `Conversation ${i + 1}: ${w}`));
      }
    } else {
      errors.push({
        ...result.error,
        path: `[${i}]${result.error.path ? '.' + result.error.path : ''}`,
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

// =============================================================================
// Additional Claude Formats
// =============================================================================

/**
 * Parse Claude API conversation format
 * (For conversations captured from Claude API responses)
 */
export function parseClaudeAPIFormat(
  json: unknown,
  options: ParserOptions = {}
): ParseResult<Conversation> {
  const opts = { ...DEFAULT_PARSER_OPTIONS, ...options };

  if (!json || typeof json !== 'object') {
    return {
      success: false,
      error: {
        code: 'INVALID_FORMAT',
        message: 'Invalid Claude API format',
        value: typeof json,
      },
    };
  }

  const obj = json as Record<string, unknown>;
  const messages: Message[] = [];

  // Handle nested content blocks (Claude API format)
  if (obj.content && Array.isArray(obj.content)) {
    for (const block of obj.content) {
      if (
        block &&
        typeof block === 'object' &&
        (block as Record<string, unknown>).type === 'text'
      ) {
        let content = String((block as Record<string, unknown>).text || '');
        if (opts.sanitizeContent !== false) {
          content = sanitizeContent(content);
        }
        messages.push({
          id: opts.idGenerator?.() || crypto.randomUUID(),
          role: 'assistant',
          content,
          timestamp: parseTimestamp(obj.created_at || obj.timestamp),
        });
      }
    }
  }

  // If we got messages, wrap in conversation
  if (messages.length > 0) {
    return {
      success: true,
      data: {
        id: String(obj.id || opts.idGenerator?.() || crypto.randomUUID()),
        title: 'Claude API Response',
        createdAt: parseTimestamp(obj.created_at) || new Date(),
        updatedAt: new Date(),
        source: 'claude',
        messages,
      },
    };
  }

  return {
    success: false,
    error: {
      code: 'EMPTY_EXPORT',
      message: 'No messages found in Claude API format',
    },
  };
}
