/**
 * ChatGPT Export Parser
 *
 * CRITICAL: ChatGPT exports use a TREE STRUCTURE, NOT flat arrays.
 * The `mapping` object contains nodes with `parent/children` relationships
 * that must be traversed recursively.
 *
 * Tree Structure:
 * - Root node has `parent === null`
 * - Each node may have a `message` property with content
 * - `children` array contains IDs of child nodes
 * - Branching conversations occur when user edits a message
 *   (multiple children from the same parent)
 */

import type { ChatGPTExport, ChatGPTMappingNode, Conversation, Message } from '@common/types';
import type { ParseResult, ParseError, ParserOptions, MultiParseResult } from './types';
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
} from './validation';

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if a value is a ChatGPT mapping node
 */
function isChatGPTMappingNode(value: unknown): value is ChatGPTMappingNode {
  if (!value || typeof value !== 'object') return false;
  const node = value as Record<string, unknown>;

  // Required: id and children array
  if (typeof node.id !== 'string') return false;
  if (!Array.isArray(node.children)) return false;

  // parent can be string or null
  if (node.parent !== null && typeof node.parent !== 'string') return false;

  // message is optional but if present must have specific structure
  if (node.message !== null && node.message !== undefined) {
    const msg = node.message as Record<string, unknown>;
    if (typeof msg !== 'object') return false;
    // author.role is required if message exists
    if (!msg.author || typeof (msg.author as Record<string, unknown>).role !== 'string') {
      return false;
    }
  }

  return true;
}

/**
 * Check if a value is a ChatGPT export
 */
export function isChatGPTExport(value: unknown): value is ChatGPTExport {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  // Required: mapping object
  if (!obj.mapping || typeof obj.mapping !== 'object') return false;

  // Required: title (string)
  if (typeof obj.title !== 'string') return false;

  // Required: timestamps
  if (typeof obj.create_time !== 'number') return false;
  if (typeof obj.update_time !== 'number') return false;

  // Validate mapping structure
  const mapping = obj.mapping as Record<string, unknown>;
  const entries = Object.entries(mapping);

  // Must have at least one node
  if (entries.length === 0) return false;

  // Check first few nodes have valid structure
  const samplesToCheck = Math.min(3, entries.length);
  for (let i = 0; i < samplesToCheck; i++) {
    if (!isChatGPTMappingNode(entries[i][1])) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a value is an array of ChatGPT exports
 */
export function isChatGPTExportArray(value: unknown): value is ChatGPTExport[] {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return false;
  // Check first item
  return isChatGPTExport(value[0]);
}

// =============================================================================
// Tree Traversal
// =============================================================================

/**
 * Find the root node in a ChatGPT mapping (node with parent === null)
 */
export function findRootNode(mapping: Record<string, ChatGPTMappingNode>): string | null {
  for (const [nodeId, node] of Object.entries(mapping)) {
    if (node.parent === null) {
      return nodeId;
    }
  }
  return null;
}

/**
 * Find all root nodes (for safety - there should only be one)
 */
export function findAllRootNodes(mapping: Record<string, ChatGPTMappingNode>): string[] {
  const roots: string[] = [];
  for (const [nodeId, node] of Object.entries(mapping)) {
    if (node.parent === null) {
      roots.push(nodeId);
    }
  }
  return roots;
}

/**
 * Extract messages from ChatGPT's mapping tree structure.
 *
 * This is the CRITICAL algorithm that handles ChatGPT's tree format.
 * It recursively traverses the tree starting from the given node,
 * extracting messages and following the children chain.
 *
 * @param mapping - The mapping object from ChatGPT export
 * @param nodeId - Starting node ID for traversal
 * @param visited - Set of visited node IDs (prevents infinite loops)
 * @param options - Parser options
 * @returns Array of extracted messages
 */
export function extractMessagesFromMapping(
  mapping: Record<string, ChatGPTMappingNode>,
  nodeId: string,
  visited: Set<string> = new Set(),
  options: ParserOptions = {}
): Message[] {
  const messages: Message[] = [];

  // Prevent infinite loops from circular references
  if (visited.has(nodeId)) {
    return messages;
  }
  visited.add(nodeId);

  const node = mapping[nodeId];
  if (!node) {
    return messages;
  }

  // Extract message if present and valid
  if (node.message?.content?.parts && Array.isArray(node.message.content.parts)) {
    const role = node.message.author?.role;

    // Filter roles based on options
    const normalizedRole = normalizeRole(role || '');
    const shouldInclude =
      normalizedRole === 'user' ||
      normalizedRole === 'assistant' ||
      (normalizedRole === 'system' && !options.skipSystemMessages);

    if (shouldInclude) {
      // Join content parts
      let content = node.message.content.parts
        .filter((part): part is string => typeof part === 'string')
        .join('\n');

      // Sanitize if enabled
      if (options.sanitizeContent !== false) {
        content = sanitizeContent(content);
      }

      // Skip empty messages if configured
      if (content.trim().length > 0 || options.includeEmpty) {
        const timestamp = parseTimestamp(node.message.create_time);

        messages.push({
          id: node.message.id || options.idGenerator?.() || crypto.randomUUID(),
          role: normalizedRole,
          content,
          timestamp,
        });
      }
    }
  }

  // Recursively process children
  // Note: Multiple children indicate branching (edited messages)
  // By default, we follow all branches to capture all content
  if (Array.isArray(node.children)) {
    for (const childId of node.children) {
      const childMessages = extractMessagesFromMapping(mapping, childId, visited, options);
      messages.push(...childMessages);
    }
  }

  return messages;
}

/**
 * Extract messages following only the "main" conversation path
 * (following the first child at each branch point)
 */
export function extractMainBranchMessages(
  mapping: Record<string, ChatGPTMappingNode>,
  nodeId: string,
  visited: Set<string> = new Set(),
  options: ParserOptions = {}
): Message[] {
  const messages: Message[] = [];

  if (visited.has(nodeId)) {
    return messages;
  }
  visited.add(nodeId);

  const node = mapping[nodeId];
  if (!node) {
    return messages;
  }

  // Extract message if present
  if (node.message?.content?.parts && Array.isArray(node.message.content.parts)) {
    const role = node.message.author?.role;
    const normalizedRole = normalizeRole(role || '');

    const shouldInclude =
      normalizedRole === 'user' ||
      normalizedRole === 'assistant' ||
      (normalizedRole === 'system' && !options.skipSystemMessages);

    if (shouldInclude) {
      let content = node.message.content.parts
        .filter((part): part is string => typeof part === 'string')
        .join('\n');

      if (options.sanitizeContent !== false) {
        content = sanitizeContent(content);
      }

      if (content.trim().length > 0 || options.includeEmpty) {
        messages.push({
          id: node.message.id || options.idGenerator?.() || crypto.randomUUID(),
          role: normalizedRole,
          content,
          timestamp: parseTimestamp(node.message.create_time),
        });
      }
    }
  }

  // Follow only the first child (main branch)
  if (Array.isArray(node.children) && node.children.length > 0) {
    const childMessages = extractMainBranchMessages(mapping, node.children[0], visited, options);
    messages.push(...childMessages);
  }

  return messages;
}

// =============================================================================
// Parsing Functions
// =============================================================================

/**
 * Parse a single ChatGPT export object
 */
export function parseChatGPTExport(
  json: unknown,
  options: ParserOptions = {}
): ParseResult<Conversation> {
  const opts = { ...DEFAULT_PARSER_OPTIONS, ...options };
  const warnings: string[] = [];

  // Type check
  if (!isChatGPTExport(json)) {
    return {
      success: false,
      error: {
        code: 'INVALID_FORMAT',
        message: 'Input is not a valid ChatGPT export format',
        value: typeof json,
      },
    };
  }

  const export_ = json;

  // Find root node
  const rootId = findRootNode(export_.mapping);
  if (!rootId) {
    return {
      success: false,
      error: {
        code: 'TREE_TRAVERSAL_ERROR',
        message: 'Could not find root node in mapping tree',
        path: 'mapping',
      },
    };
  }

  // Check for multiple roots (unusual but possible in corrupted exports)
  const allRoots = findAllRootNodes(export_.mapping);
  if (allRoots.length > 1) {
    warnings.push(`Found ${allRoots.length} root nodes; using first one. Export may be corrupted.`);
  }

  // Extract messages from tree
  let messages: Message[];
  try {
    messages = extractMessagesFromMapping(export_.mapping, rootId, new Set(), opts);
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'TREE_TRAVERSAL_ERROR',
        message: `Failed to traverse mapping tree: ${err instanceof Error ? err.message : String(err)}`,
        stack: err instanceof Error ? err.stack : undefined,
      },
    };
  }

  // Apply post-processing
  if (opts.skipSystemMessages) {
    messages = filterSystemMessages(messages);
  }

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

  // Build conversation object
  const conversation: Conversation = {
    id: opts.idGenerator?.() || crypto.randomUUID(),
    title: export_.title || 'Untitled Conversation',
    createdAt: new Date(export_.create_time * 1000),
    updatedAt: new Date(export_.update_time * 1000),
    source: 'chatgpt',
    messages,
  };

  // Add warning if no messages extracted
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
 * Parse an array of ChatGPT exports
 */
export function parseChatGPTExportArray(
  json: unknown,
  options: ParserOptions = {}
): MultiParseResult {
  const opts = { ...DEFAULT_PARSER_OPTIONS, ...options };

  if (!Array.isArray(json)) {
    return {
      conversations: [],
      errors: [
        {
          code: 'INVALID_FORMAT',
          message: 'Expected an array of ChatGPT exports',
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
    const result = parseChatGPTExport(item, opts);

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
// Utility Functions
// =============================================================================

/**
 * Get statistics about a ChatGPT export tree
 */
export function getTreeStats(mapping: Record<string, ChatGPTMappingNode>): {
  totalNodes: number;
  nodesWithMessages: number;
  branchPoints: number;
  maxDepth: number;
  rootNodes: number;
} {
  let nodesWithMessages = 0;
  let branchPoints = 0;
  let rootNodes = 0;

  for (const node of Object.values(mapping)) {
    if (node.message?.content?.parts) {
      nodesWithMessages++;
    }
    if (node.children && node.children.length > 1) {
      branchPoints++;
    }
    if (node.parent === null) {
      rootNodes++;
    }
  }

  // Calculate max depth
  function getDepth(nodeId: string, visited: Set<string>): number {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);

    const node = mapping[nodeId];
    if (!node || !node.children || node.children.length === 0) {
      return 1;
    }

    let maxChildDepth = 0;
    for (const childId of node.children) {
      maxChildDepth = Math.max(maxChildDepth, getDepth(childId, visited));
    }
    return 1 + maxChildDepth;
  }

  const rootId = findRootNode(mapping);
  const maxDepth = rootId ? getDepth(rootId, new Set()) : 0;

  return {
    totalNodes: Object.keys(mapping).length,
    nodesWithMessages,
    branchPoints,
    maxDepth,
    rootNodes,
  };
}
