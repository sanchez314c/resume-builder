/**
 * Parser-Specific Type Definitions
 *
 * Internal types for the conversation parsing subsystem.
 * These types support error handling, parsing options, and results.
 */

import type { Conversation, ConversationSource } from '@common/types';

// =============================================================================
// Parse Result Types
// =============================================================================

/**
 * Error codes for parsing operations
 */
export type ParseErrorCode =
  | 'INVALID_FORMAT'
  | 'MISSING_REQUIRED_FIELD'
  | 'MALFORMED_DATA'
  | 'EMPTY_EXPORT'
  | 'TREE_TRAVERSAL_ERROR'
  | 'TYPE_MISMATCH'
  | 'UNKNOWN_FORMAT'
  | 'VALIDATION_FAILED'
  | 'SANITIZATION_ERROR';

/**
 * Detailed error information from parsing
 */
export interface ParseError {
  /** Error classification code */
  code: ParseErrorCode;
  /** Human-readable error message */
  message: string;
  /** Path to the problematic field (e.g., "mapping.node123.message") */
  path?: string;
  /** Original value that caused the error */
  value?: unknown;
  /** Stack trace for debugging */
  stack?: string;
}

/**
 * Result of a parsing operation
 */
export type ParseResult<T> =
  | { success: true; data: T; warnings?: string[] }
  | { success: false; error: ParseError };

/**
 * Result containing multiple conversations with partial success support
 */
export interface MultiParseResult {
  /** Successfully parsed conversations */
  conversations: Conversation[];
  /** Errors encountered during parsing */
  errors: ParseError[];
  /** Non-fatal warnings */
  warnings: string[];
  /** Total items attempted */
  totalAttempted: number;
  /** Successfully parsed count */
  successCount: number;
}

// =============================================================================
// Parser Options
// =============================================================================

/**
 * Configuration options for parsing operations
 */
export interface ParserOptions {
  /** Maximum number of messages to parse per conversation (0 = unlimited) */
  maxMessages?: number;
  /** Skip system messages */
  skipSystemMessages?: boolean;
  /** Deduplicate identical messages */
  deduplicateMessages?: boolean;
  /** Sort messages by timestamp */
  sortByTimestamp?: boolean;
  /** Sanitize HTML and special characters from content */
  sanitizeContent?: boolean;
  /** Include empty messages */
  includeEmpty?: boolean;
  /** Strict mode throws on warnings, lenient mode continues */
  strictMode?: boolean;
  /** Custom ID generator */
  idGenerator?: () => string;
}

/**
 * Default parser options
 */
export const DEFAULT_PARSER_OPTIONS: Required<ParserOptions> = {
  maxMessages: 0,
  skipSystemMessages: false,
  deduplicateMessages: true,
  sortByTimestamp: true,
  sanitizeContent: true,
  includeEmpty: false,
  strictMode: false,
  idGenerator: () => crypto.randomUUID(),
};

// =============================================================================
// Format Detection Types
// =============================================================================

/**
 * Result of format detection
 */
export interface FormatDetectionResult {
  /** Detected format */
  format: ConversationSource | 'unknown';
  /** Confidence level (0-1) */
  confidence: number;
  /** Indicators that led to this detection */
  indicators: string[];
}

// =============================================================================
// Internal Parser Types
// =============================================================================

/**
 * Generic conversation structure for detection
 */
export interface GenericConversationShape {
  title?: string;
  name?: string;
  id?: string;
  messages?: unknown[];
  mapping?: Record<string, unknown>;
  conversation?: unknown[];
  chat_messages?: unknown[];
}

/**
 * Claude export format variations
 */
export interface ClaudeExportFormat {
  /** Array of messages with human/assistant roles */
  messages?: Array<{
    role?: string;
    content?: string;
    timestamp?: string;
  }>;
  /** Conversation metadata */
  name?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  uuid?: string;
}
