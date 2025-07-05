/**
 * Conversation Parser Module
 *
 * Main entry point for parsing conversation exports from
 * ChatGPT, Claude, and other AI chat platforms.
 *
 * Usage:
 *   import { parseConversations, detectFormat } from './parsers';
 *
 *   const json = JSON.parse(fileContents);
 *   const format = detectFormat(json);
 *   const result = parseConversations(json);
 */

import type { Conversation } from '@common/types';
import type { ParseResult, ParserOptions, MultiParseResult, FormatDetectionResult } from './types';
import { DEFAULT_PARSER_OPTIONS } from './types';

// ChatGPT parser
import {
  isChatGPTExport,
  isChatGPTExportArray,
  parseChatGPTExport,
  parseChatGPTExportArray,
} from './chatgpt-parser';

// Claude parser
import {
  isClaudeExport,
  isClaudeConversationArray,
  isClaudeMessageArray,
  parseClaudeExport,
  parseClaudeExportArray,
} from './claude-parser';

// Generic parser
import { isGenericFormat, parseGenericFormat, parseGenericFormatArray } from './generic-parser';

// =============================================================================
// Format Detection
// =============================================================================

/**
 * Auto-detect the format of a JSON export
 *
 * Detection order (most specific first):
 * 1. ChatGPT (has `mapping` with tree structure)
 * 2. Claude (has `messages` array with human/assistant roles)
 * 3. Generic (fallback for other formats)
 */
export function detectFormat(json: unknown): FormatDetectionResult {
  const indicators: string[] = [];

  // Check for ChatGPT format (highest specificity)
  if (isChatGPTExport(json)) {
    indicators.push('Has mapping object with tree structure');
    indicators.push('Has title, create_time, update_time fields');
    return {
      format: 'chatgpt',
      confidence: 1.0,
      indicators,
    };
  }

  if (isChatGPTExportArray(json)) {
    indicators.push('Array of ChatGPT export objects');
    return {
      format: 'chatgpt',
      confidence: 1.0,
      indicators,
    };
  }

  // Check for Claude format
  if (isClaudeExport(json)) {
    indicators.push('Has messages array with role/content structure');
    return {
      format: 'claude',
      confidence: 0.9,
      indicators,
    };
  }

  if (isClaudeConversationArray(json)) {
    indicators.push('Array of Claude conversation objects');
    return {
      format: 'claude',
      confidence: 0.9,
      indicators,
    };
  }

  if (isClaudeMessageArray(json)) {
    indicators.push('Direct array of Claude messages');
    return {
      format: 'claude',
      confidence: 0.8,
      indicators,
    };
  }

  // Check for generic format
  if (isGenericFormat(json)) {
    indicators.push('Has recognizable conversation structure');
    return {
      format: 'generic',
      confidence: 0.6,
      indicators,
    };
  }

  // Unknown format
  return {
    format: 'unknown',
    confidence: 0,
    indicators: ['No recognized format patterns found'],
  };
}

// =============================================================================
// Main Parsing Functions
// =============================================================================

/**
 * Parse a single conversation from JSON
 * Automatically detects format and uses appropriate parser
 */
export function parseConversation(
  json: unknown,
  options: ParserOptions = {}
): ParseResult<Conversation> {
  const opts = { ...DEFAULT_PARSER_OPTIONS, ...options };
  const detection = detectFormat(json);

  switch (detection.format) {
    case 'chatgpt':
      return parseChatGPTExport(json, opts);

    case 'claude':
      return parseClaudeExport(json, opts);

    case 'generic':
      return parseGenericFormat(json, opts);

    default:
      return {
        success: false,
        error: {
          code: 'UNKNOWN_FORMAT',
          message: 'Could not detect conversation format',
          value: detection,
        },
      };
  }
}

/**
 * Parse multiple conversations from JSON
 * Handles both arrays and single objects
 */
export function parseConversations(json: unknown, options: ParserOptions = {}): MultiParseResult {
  const opts = { ...DEFAULT_PARSER_OPTIONS, ...options };

  // Handle array input
  if (Array.isArray(json)) {
    // Empty array
    if (json.length === 0) {
      return {
        conversations: [],
        errors: [
          {
            code: 'EMPTY_EXPORT',
            message: 'Empty array provided',
          },
        ],
        warnings: [],
        totalAttempted: 0,
        successCount: 0,
      };
    }

    // Detect format from first item
    const detection = detectFormat(json[0]);

    // If first item is ChatGPT format, assume array of ChatGPT exports
    if (detection.format === 'chatgpt') {
      return parseChatGPTExportArray(json, opts);
    }

    // If first item is Claude format, assume array of Claude exports
    if (detection.format === 'claude') {
      return parseClaudeExportArray(json, opts);
    }

    // Try detecting array itself as single ChatGPT export array
    if (isChatGPTExportArray(json)) {
      return parseChatGPTExportArray(json, opts);
    }

    // Try detecting array itself as Claude messages
    if (isClaudeMessageArray(json)) {
      return parseClaudeExportArray(json, opts);
    }

    // Fall back to generic
    return parseGenericFormatArray(json, opts);
  }

  // Handle single object input
  const result = parseConversation(json, opts);
  if (result.success) {
    return {
      conversations: [result.data],
      errors: [],
      warnings: result.warnings || [],
      totalAttempted: 1,
      successCount: 1,
    };
  } else {
    return {
      conversations: [],
      errors: [result.error],
      warnings: [],
      totalAttempted: 1,
      successCount: 0,
    };
  }
}

// =============================================================================
// Exports
// =============================================================================

// Re-export types
export type {
  ParseResult,
  ParseError,
  ParserOptions,
  MultiParseResult,
  FormatDetectionResult,
  ParseErrorCode,
} from './types';
export { DEFAULT_PARSER_OPTIONS } from './types';

// Re-export ChatGPT parser
export {
  isChatGPTExport,
  isChatGPTExportArray,
  parseChatGPTExport,
  parseChatGPTExportArray,
  findRootNode,
  extractMessagesFromMapping,
  extractMainBranchMessages,
  getTreeStats,
} from './chatgpt-parser';

// Re-export Claude parser
export {
  isClaudeExport,
  isClaudeMessageArray,
  isClaudeConversationArray,
  parseClaudeExport,
  parseClaudeExportArray,
  parseClaudeAPIFormat,
} from './claude-parser';

// Re-export Generic parser
export {
  isGenericFormat,
  parseGenericFormat,
  parseGenericFormatArray,
  analyzeGenericFormat,
} from './generic-parser';

// Re-export validation utilities
export {
  sanitizeContent,
  stripHtmlTags,
  validateMessage,
  validateConversation,
  deduplicateMessages,
  sortMessagesByTimestamp,
  sortConversationsByDate,
  normalizeRole,
  parseTimestamp,
  normalizeContent,
  filterEmptyMessages,
  filterSystemMessages,
  limitMessages,
} from './validation';
