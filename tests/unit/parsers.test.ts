/**
 * Parser Unit Tests
 *
 * Comprehensive tests for the conversation parsing subsystem.
 * Tests ChatGPT tree traversal, Claude parsing, generic format detection,
 * and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  // Format detection
  detectFormat,
  parseConversations,
  parseConversation,
  // ChatGPT
  isChatGPTExport,
  isChatGPTExportArray,
  parseChatGPTExport,
  parseChatGPTExportArray,
  findRootNode,
  extractMessagesFromMapping,
  getTreeStats,
  // Claude
  isClaudeExport,
  isClaudeMessageArray,
  parseClaudeExport,
  parseClaudeExportArray,
  // Generic
  isGenericFormat,
  parseGenericFormat,
  analyzeGenericFormat,
  // Validation
  sanitizeContent,
  deduplicateMessages,
  sortMessagesByTimestamp,
  normalizeRole,
  parseTimestamp,
  validateConversation,
} from '../../src/renderer/lib/parsers';

import {
  SAMPLE_CHATGPT_SIMPLE,
  SAMPLE_CHATGPT_BRANCHED,
  SAMPLE_CHATGPT_WITH_SYSTEM,
  SAMPLE_CHATGPT_ARRAY,
  SAMPLE_EMPTY_CHATGPT,
  SAMPLE_CLAUDE_SIMPLE,
  SAMPLE_CLAUDE_ALT_ROLES,
  SAMPLE_CLAUDE_MESSAGE_ARRAY,
  SAMPLE_CLAUDE_ARRAY,
  SAMPLE_GENERIC_QA,
  SAMPLE_GENERIC_HUMAN_BOT,
  SAMPLE_GENERIC_STRING_ARRAY,
  SAMPLE_WITH_HTML_ENTITIES,
  SAMPLE_WITH_DUPLICATES,
  generateLargeConversation,
} from '../fixtures/sample-data';

// =============================================================================
// Format Detection Tests
// =============================================================================

describe('Format Detection', () => {
  it('should detect ChatGPT format', () => {
    const result = detectFormat(SAMPLE_CHATGPT_SIMPLE);
    expect(result.format).toBe('chatgpt');
    expect(result.confidence).toBe(1.0);
  });

  it('should detect ChatGPT array format', () => {
    const result = detectFormat(SAMPLE_CHATGPT_ARRAY);
    expect(result.format).toBe('chatgpt');
  });

  it('should detect Claude format', () => {
    const result = detectFormat(SAMPLE_CLAUDE_SIMPLE);
    expect(result.format).toBe('claude');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('should detect Claude message array', () => {
    const result = detectFormat(SAMPLE_CLAUDE_MESSAGE_ARRAY);
    expect(result.format).toBe('claude');
  });

  it('should detect generic format', () => {
    const result = detectFormat(SAMPLE_GENERIC_QA);
    expect(result.format).toBe('generic');
  });

  it('should return unknown for invalid input', () => {
    const result = detectFormat({ foo: 'bar' });
    expect(result.format).toBe('unknown');
    expect(result.confidence).toBe(0);
  });

  it('should return unknown for null input', () => {
    const result = detectFormat(null);
    expect(result.format).toBe('unknown');
  });

  it('should return unknown for primitive input', () => {
    const result = detectFormat('string');
    expect(result.format).toBe('unknown');
  });
});

// =============================================================================
// ChatGPT Parser Tests
// =============================================================================

describe('ChatGPT Parser', () => {
  describe('Type Guards', () => {
    it('should identify valid ChatGPT export', () => {
      expect(isChatGPTExport(SAMPLE_CHATGPT_SIMPLE)).toBe(true);
    });

    it('should reject invalid ChatGPT export', () => {
      expect(isChatGPTExport({ messages: [] })).toBe(false);
      expect(isChatGPTExport(null)).toBe(false);
      expect(isChatGPTExport([])).toBe(false);
    });

    it('should identify ChatGPT export array', () => {
      expect(isChatGPTExportArray(SAMPLE_CHATGPT_ARRAY)).toBe(true);
      expect(isChatGPTExportArray(SAMPLE_CHATGPT_SIMPLE)).toBe(false);
    });
  });

  describe('Tree Traversal', () => {
    it('should find root node', () => {
      const rootId = findRootNode(SAMPLE_CHATGPT_SIMPLE.mapping);
      expect(rootId).toBe('root-node');
    });

    it('should extract messages from simple tree', () => {
      const rootId = findRootNode(SAMPLE_CHATGPT_SIMPLE.mapping)!;
      const messages = extractMessagesFromMapping(
        SAMPLE_CHATGPT_SIMPLE.mapping,
        rootId
      );

      expect(messages.length).toBe(4);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toContain('JSON file');
      expect(messages[1].role).toBe('assistant');
    });

    it('should handle branched conversations', () => {
      const rootId = findRootNode(SAMPLE_CHATGPT_BRANCHED.mapping)!;
      const messages = extractMessagesFromMapping(
        SAMPLE_CHATGPT_BRANCHED.mapping,
        rootId
      );

      // Should capture all branches
      expect(messages.length).toBeGreaterThanOrEqual(4);
    });

    it('should extract messages with timestamps', () => {
      const rootId = findRootNode(SAMPLE_CHATGPT_SIMPLE.mapping)!;
      const messages = extractMessagesFromMapping(
        SAMPLE_CHATGPT_SIMPLE.mapping,
        rootId
      );

      // First message should have timestamp
      expect(messages[0].timestamp).toBeInstanceOf(Date);
    });

    it('should prevent infinite loops on circular references', () => {
      const circularMapping = {
        ...SAMPLE_CHATGPT_SIMPLE.mapping,
      };
      // Create circular reference
      circularMapping['msg-4'] = {
        ...circularMapping['msg-4'],
        children: ['msg-1'], // Points back to earlier node
      };

      const rootId = findRootNode(circularMapping)!;
      const messages = extractMessagesFromMapping(circularMapping, rootId);

      // Should not hang or crash
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('Parsing', () => {
    it('should parse simple ChatGPT export', () => {
      const result = parseChatGPTExport(SAMPLE_CHATGPT_SIMPLE);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Python Help Session');
        expect(result.data.source).toBe('chatgpt');
        expect(result.data.messages.length).toBe(4);
        expect(result.data.createdAt).toBeInstanceOf(Date);
      }
    });

    it('should parse branched ChatGPT export', () => {
      const result = parseChatGPTExport(SAMPLE_CHATGPT_BRANCHED);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.messages.length).toBeGreaterThanOrEqual(4);
      }
    });

    it('should handle system messages', () => {
      const result = parseChatGPTExport(SAMPLE_CHATGPT_WITH_SYSTEM);

      expect(result.success).toBe(true);
      if (result.success) {
        const systemMessages = result.data.messages.filter(
          (m) => m.role === 'system'
        );
        expect(systemMessages.length).toBe(1);
      }
    });

    it('should skip system messages when configured', () => {
      const result = parseChatGPTExport(SAMPLE_CHATGPT_WITH_SYSTEM, {
        skipSystemMessages: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const systemMessages = result.data.messages.filter(
          (m) => m.role === 'system'
        );
        expect(systemMessages.length).toBe(0);
      }
    });

    it('should handle empty ChatGPT export', () => {
      const result = parseChatGPTExport(SAMPLE_EMPTY_CHATGPT);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.messages.length).toBe(0);
        expect(result.warnings).toContain('No messages extracted from conversation');
      }
    });

    it('should parse array of ChatGPT exports', () => {
      const result = parseChatGPTExportArray(SAMPLE_CHATGPT_ARRAY);

      expect(result.successCount).toBe(2);
      expect(result.conversations.length).toBe(2);
      expect(result.errors.length).toBe(0);
    });

    it('should reject invalid input', () => {
      const result = parseChatGPTExport({ invalid: true });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_FORMAT');
      }
    });
  });

  describe('Tree Statistics', () => {
    it('should calculate tree stats correctly', () => {
      const stats = getTreeStats(SAMPLE_CHATGPT_SIMPLE.mapping);

      expect(stats.totalNodes).toBe(5);
      expect(stats.nodesWithMessages).toBe(4);
      expect(stats.branchPoints).toBe(0);
      expect(stats.rootNodes).toBe(1);
      expect(stats.maxDepth).toBe(5);
    });

    it('should detect branch points', () => {
      const stats = getTreeStats(SAMPLE_CHATGPT_BRANCHED.mapping);

      expect(stats.branchPoints).toBe(1);
    });
  });
});

// =============================================================================
// Claude Parser Tests
// =============================================================================

describe('Claude Parser', () => {
  describe('Type Guards', () => {
    it('should identify valid Claude export', () => {
      expect(isClaudeExport(SAMPLE_CLAUDE_SIMPLE)).toBe(true);
    });

    it('should identify Claude message array', () => {
      expect(isClaudeMessageArray(SAMPLE_CLAUDE_MESSAGE_ARRAY)).toBe(true);
    });

    it('should reject invalid Claude export', () => {
      expect(isClaudeExport({ mapping: {} })).toBe(false);
    });
  });

  describe('Parsing', () => {
    it('should parse simple Claude export', () => {
      const result = parseClaudeExport(SAMPLE_CLAUDE_SIMPLE);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('claude');
        expect(result.data.messages.length).toBe(4);
        expect(result.data.messages[0].role).toBe('user');
      }
    });

    it('should handle human/assistant roles', () => {
      const result = parseClaudeExport(SAMPLE_CLAUDE_SIMPLE);

      expect(result.success).toBe(true);
      if (result.success) {
        // 'human' should be normalized to 'user'
        expect(result.data.messages[0].role).toBe('user');
        expect(result.data.messages[1].role).toBe('assistant');
      }
    });

    it('should handle user/assistant roles', () => {
      const result = parseClaudeExport(SAMPLE_CLAUDE_ALT_ROLES);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.messages[0].role).toBe('user');
        expect(result.data.messages[1].role).toBe('assistant');
      }
    });

    it('should parse direct message array', () => {
      const result = parseClaudeExport(SAMPLE_CLAUDE_MESSAGE_ARRAY);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.messages.length).toBe(2);
      }
    });

    it('should parse array of Claude exports', () => {
      const result = parseClaudeExportArray(SAMPLE_CLAUDE_ARRAY);

      expect(result.successCount).toBe(2);
      expect(result.conversations.length).toBe(2);
    });

    it('should extract timestamps when available', () => {
      const result = parseClaudeExport(SAMPLE_CLAUDE_SIMPLE);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.messages[0].timestamp).toBeInstanceOf(Date);
      }
    });
  });
});

// =============================================================================
// Generic Parser Tests
// =============================================================================

describe('Generic Parser', () => {
  describe('Type Guards', () => {
    it('should identify generic format', () => {
      expect(isGenericFormat(SAMPLE_GENERIC_QA)).toBe(true);
      expect(isGenericFormat(SAMPLE_GENERIC_HUMAN_BOT)).toBe(true);
    });

    it('should reject non-generic formats', () => {
      // ChatGPT uses tree structure (mapping), not messages array
      expect(isGenericFormat(SAMPLE_CHATGPT_SIMPLE)).toBe(false);
      expect(isGenericFormat({ random: 'data' })).toBe(false);
    });
  });

  describe('Parsing', () => {
    it('should parse Q&A format', () => {
      const result = parseGenericFormat(SAMPLE_GENERIC_QA);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('generic');
        expect(result.data.messages.length).toBeGreaterThan(0);
      }
    });

    it('should parse human/bot format', () => {
      const result = parseGenericFormat(SAMPLE_GENERIC_HUMAN_BOT);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.messages.length).toBe(4);
      }
    });

    it('should parse string array as alternating messages', () => {
      const result = parseGenericFormat(SAMPLE_GENERIC_STRING_ARRAY);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.messages.length).toBe(4);
        expect(result.data.messages[0].role).toBe('user');
        expect(result.data.messages[1].role).toBe('assistant');
      }
    });

    it('should analyze generic format structure', () => {
      const analysis = analyzeGenericFormat(SAMPLE_GENERIC_QA);

      expect(analysis.hasMessages).toBe(true);
      expect(analysis.structure).toBe('object');
    });
  });
});

// =============================================================================
// Main Parser API Tests
// =============================================================================

describe('Main Parser API', () => {
  describe('parseConversation', () => {
    it('should auto-detect and parse ChatGPT', () => {
      const result = parseConversation(SAMPLE_CHATGPT_SIMPLE);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('chatgpt');
      }
    });

    it('should auto-detect and parse Claude', () => {
      const result = parseConversation(SAMPLE_CLAUDE_SIMPLE);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('claude');
      }
    });
  });

  describe('parseConversations', () => {
    it('should parse ChatGPT array', () => {
      const result = parseConversations(SAMPLE_CHATGPT_ARRAY);

      expect(result.successCount).toBe(2);
      expect(result.conversations.length).toBe(2);
    });

    it('should parse Claude array', () => {
      const result = parseConversations(SAMPLE_CLAUDE_ARRAY);

      expect(result.successCount).toBe(2);
    });

    it('should handle single object', () => {
      const result = parseConversations(SAMPLE_CHATGPT_SIMPLE);

      expect(result.successCount).toBe(1);
      expect(result.conversations.length).toBe(1);
    });

    it('should handle empty array', () => {
      const result = parseConversations([]);

      expect(result.successCount).toBe(0);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].code).toBe('EMPTY_EXPORT');
    });
  });

});

// =============================================================================
// Validation Tests
// =============================================================================

describe('Validation Utilities', () => {
  describe('sanitizeContent', () => {
    it('should decode HTML entities', () => {
      expect(sanitizeContent('&lt;script&gt;')).toBe('<script>');
      expect(sanitizeContent('&amp;&amp;')).toBe('&&');
      expect(sanitizeContent('&quot;test&quot;')).toBe('"test"');
    });

    it('should remove control characters', () => {
      expect(sanitizeContent('hello\x00world')).toBe('helloworld');
    });

    it('should normalize whitespace', () => {
      expect(sanitizeContent('hello    world')).toBe('hello world');
      expect(sanitizeContent('a\n\n\n\nb')).toBe('a\n\nb');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeContent(null as unknown as string)).toBe('');
      expect(sanitizeContent(undefined as unknown as string)).toBe('');
    });
  });

  describe('deduplicateMessages', () => {
    it('should remove duplicate messages', () => {
      const messages = [
        { id: '1', role: 'user' as const, content: 'Hello', timestamp: null },
        { id: '2', role: 'assistant' as const, content: 'Hi', timestamp: null },
        { id: '3', role: 'user' as const, content: 'Hello', timestamp: null },
      ];

      const result = deduplicateMessages(messages);
      expect(result.length).toBe(2);
    });

    it('should preserve first occurrence', () => {
      const messages = [
        { id: '1', role: 'user' as const, content: 'Hello', timestamp: null },
        { id: '2', role: 'user' as const, content: 'Hello', timestamp: null },
      ];

      const result = deduplicateMessages(messages);
      expect(result[0].id).toBe('1');
    });
  });

  describe('sortMessagesByTimestamp', () => {
    it('should sort by timestamp', () => {
      const messages = [
        { id: '1', role: 'user' as const, content: 'A', timestamp: new Date('2024-01-02') },
        { id: '2', role: 'user' as const, content: 'B', timestamp: new Date('2024-01-01') },
        { id: '3', role: 'user' as const, content: 'C', timestamp: new Date('2024-01-03') },
      ];

      const result = sortMessagesByTimestamp(messages);
      expect(result[0].content).toBe('B');
      expect(result[1].content).toBe('A');
      expect(result[2].content).toBe('C');
    });

    it('should place null timestamps at end', () => {
      const messages = [
        { id: '1', role: 'user' as const, content: 'A', timestamp: null },
        { id: '2', role: 'user' as const, content: 'B', timestamp: new Date('2024-01-01') },
      ];

      const result = sortMessagesByTimestamp(messages);
      expect(result[0].content).toBe('B');
      expect(result[1].content).toBe('A');
    });
  });

  describe('normalizeRole', () => {
    it('should normalize user roles', () => {
      expect(normalizeRole('user')).toBe('user');
      expect(normalizeRole('human')).toBe('user');
      expect(normalizeRole('Human')).toBe('user');
      expect(normalizeRole('HUMAN')).toBe('user');
    });

    it('should normalize assistant roles', () => {
      expect(normalizeRole('assistant')).toBe('assistant');
      expect(normalizeRole('ai')).toBe('assistant');
      expect(normalizeRole('bot')).toBe('assistant');
      expect(normalizeRole('chatgpt')).toBe('assistant');
      expect(normalizeRole('claude')).toBe('assistant');
    });

    it('should normalize system roles', () => {
      expect(normalizeRole('system')).toBe('system');
    });

    it('should default unknown roles to assistant', () => {
      expect(normalizeRole('unknown')).toBe('assistant');
    });
  });

  describe('parseTimestamp', () => {
    it('should parse Unix timestamps in seconds', () => {
      const date = parseTimestamp(1700000000);
      expect(date).toBeInstanceOf(Date);
      expect(date!.getFullYear()).toBe(2023);
    });

    it('should parse Unix timestamps in milliseconds', () => {
      const date = parseTimestamp(1700000000000);
      expect(date).toBeInstanceOf(Date);
    });

    it('should parse ISO strings', () => {
      const date = parseTimestamp('2024-01-15T10:30:00Z');
      expect(date).toBeInstanceOf(Date);
    });

    it('should return null for invalid input', () => {
      expect(parseTimestamp(null)).toBeNull();
      expect(parseTimestamp('invalid')).toBeNull();
    });

    it('should pass through valid Dates', () => {
      const original = new Date();
      const result = parseTimestamp(original);
      expect(result).toBe(original);
    });
  });

  describe('validateConversation', () => {
    it('should validate correct conversation', () => {
      const conversation = {
        id: 'test-id',
        title: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'chatgpt' as const,
        messages: [],
      };

      const result = validateConversation(conversation);
      expect(result.success).toBe(true);
    });

    it('should reject missing id', () => {
      const conversation = {
        id: '',
        title: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'chatgpt' as const,
        messages: [],
      };

      const result = validateConversation(conversation);
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// Edge Case Tests
// =============================================================================

describe('Edge Cases', () => {
  it('should handle HTML entities in content', () => {
    const result = parseConversations(SAMPLE_WITH_HTML_ENTITIES);

    expect(result.successCount).toBe(1);
    if (result.conversations.length > 0) {
      // HTML should be decoded
      expect(result.conversations[0].messages[0].content).toContain('<script>');
    }
  });

  it('should deduplicate messages when enabled', () => {
    const result = parseConversations(SAMPLE_WITH_DUPLICATES, {
      deduplicateMessages: true,
    });

    expect(result.successCount).toBe(1);
    if (result.conversations.length > 0) {
      // Should have 4 unique messages, not 6
      expect(result.conversations[0].messages.length).toBe(4);
    }
  });

  it('should respect maxMessages option', () => {
    const result = parseChatGPTExport(SAMPLE_CHATGPT_SIMPLE, {
      maxMessages: 2,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages.length).toBe(2);
    }
  });
});

// =============================================================================
// Performance Tests
// =============================================================================

describe('Performance', () => {
  it('should handle large conversations efficiently', () => {
    const largeExport = generateLargeConversation(1000);

    const startTime = Date.now();
    const result = parseChatGPTExport(largeExport);
    const elapsed = Date.now() - startTime;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages.length).toBe(1000);
    }

    // Should complete in reasonable time (< 1 second)
    expect(elapsed).toBeLessThan(1000);
  });

  it('should handle very large conversations (10000+ messages)', () => {
    const largeExport = generateLargeConversation(10000);

    const startTime = Date.now();
    const result = parseChatGPTExport(largeExport);
    const elapsed = Date.now() - startTime;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages.length).toBe(10000);
    }

    // Should complete in reasonable time (< 5 seconds)
    expect(elapsed).toBeLessThan(5000);
  });
});
