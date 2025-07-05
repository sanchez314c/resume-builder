/**
 * Sample Data for Parser Testing
 *
 * Contains example conversation exports in various formats
 * for development, testing, and debugging purposes.
 */

import type { ChatGPTExport, ChatGPTMappingNode } from '@common/types';

// =============================================================================
// ChatGPT Sample Data
// =============================================================================

/**
 * Simple ChatGPT export with linear conversation (no branches)
 */
export const SAMPLE_CHATGPT_SIMPLE: ChatGPTExport = {
  title: 'Python Help Session',
  create_time: 1700000000,
  update_time: 1700001000,
  mapping: {
    'root-node': {
      id: 'root-node',
      parent: null,
      children: ['msg-1'],
      message: null,
    },
    'msg-1': {
      id: 'msg-1',
      parent: 'root-node',
      children: ['msg-2'],
      message: {
        id: 'msg-1-content',
        author: { role: 'user' },
        content: {
          content_type: 'text',
          parts: ['How do I read a JSON file in Python?'],
        },
        create_time: 1700000100,
      },
    },
    'msg-2': {
      id: 'msg-2',
      parent: 'msg-1',
      children: ['msg-3'],
      message: {
        id: 'msg-2-content',
        author: { role: 'assistant' },
        content: {
          content_type: 'text',
          parts: [
            'You can read a JSON file in Python using the built-in `json` module:\n\n```python\nimport json\n\nwith open("data.json", "r") as f:\n    data = json.load(f)\n```',
          ],
        },
        create_time: 1700000200,
      },
    },
    'msg-3': {
      id: 'msg-3',
      parent: 'msg-2',
      children: ['msg-4'],
      message: {
        id: 'msg-3-content',
        author: { role: 'user' },
        content: {
          content_type: 'text',
          parts: ['What if the file is very large?'],
        },
        create_time: 1700000300,
      },
    },
    'msg-4': {
      id: 'msg-4',
      parent: 'msg-3',
      children: [],
      message: {
        id: 'msg-4-content',
        author: { role: 'assistant' },
        content: {
          content_type: 'text',
          parts: [
            'For large JSON files, consider using `ijson` for incremental parsing or loading line-delimited JSON (JSONL) format.',
          ],
        },
        create_time: 1700000400,
      },
    },
  },
};

/**
 * ChatGPT export with branching (user edited a message)
 */
export const SAMPLE_CHATGPT_BRANCHED: ChatGPTExport = {
  title: 'Branched Conversation',
  create_time: 1700000000,
  update_time: 1700002000,
  mapping: {
    root: {
      id: 'root',
      parent: null,
      children: ['user-1'],
      message: null,
    },
    'user-1': {
      id: 'user-1',
      parent: 'root',
      children: ['assistant-1', 'assistant-1-edit'], // Branch point!
      message: {
        id: 'user-1-content',
        author: { role: 'user' },
        content: {
          content_type: 'text',
          parts: ['What is machine learning?'],
        },
        create_time: 1700000100,
      },
    },
    'assistant-1': {
      id: 'assistant-1',
      parent: 'user-1',
      children: [],
      message: {
        id: 'assistant-1-content',
        author: { role: 'assistant' },
        content: {
          content_type: 'text',
          parts: ['Machine learning is a subset of artificial intelligence...'],
        },
        create_time: 1700000200,
      },
    },
    'assistant-1-edit': {
      id: 'assistant-1-edit',
      parent: 'user-1',
      children: ['user-2'],
      message: {
        id: 'assistant-1-edit-content',
        author: { role: 'assistant' },
        content: {
          content_type: 'text',
          parts: [
            'Machine learning (ML) is a branch of AI that enables systems to learn from data.',
          ],
        },
        create_time: 1700000250,
      },
    },
    'user-2': {
      id: 'user-2',
      parent: 'assistant-1-edit',
      children: ['assistant-2'],
      message: {
        id: 'user-2-content',
        author: { role: 'user' },
        content: {
          content_type: 'text',
          parts: ['Can you give me an example?'],
        },
        create_time: 1700000300,
      },
    },
    'assistant-2': {
      id: 'assistant-2',
      parent: 'user-2',
      children: [],
      message: {
        id: 'assistant-2-content',
        author: { role: 'assistant' },
        content: {
          content_type: 'text',
          parts: ['Sure! A common example is spam email detection...'],
        },
        create_time: 1700000400,
      },
    },
  },
};

/**
 * ChatGPT export with system message
 */
export const SAMPLE_CHATGPT_WITH_SYSTEM: ChatGPTExport = {
  title: 'System Message Example',
  create_time: 1700000000,
  update_time: 1700001000,
  mapping: {
    root: {
      id: 'root',
      parent: null,
      children: ['system-1'],
      message: null,
    },
    'system-1': {
      id: 'system-1',
      parent: 'root',
      children: ['user-1'],
      message: {
        id: 'system-1-content',
        author: { role: 'system' },
        content: {
          content_type: 'text',
          parts: ['You are a helpful coding assistant.'],
        },
        create_time: 1700000050,
      },
    },
    'user-1': {
      id: 'user-1',
      parent: 'system-1',
      children: ['assistant-1'],
      message: {
        id: 'user-1-content',
        author: { role: 'user' },
        content: {
          content_type: 'text',
          parts: ['Hello!'],
        },
        create_time: 1700000100,
      },
    },
    'assistant-1': {
      id: 'assistant-1',
      parent: 'user-1',
      children: [],
      message: {
        id: 'assistant-1-content',
        author: { role: 'assistant' },
        content: {
          content_type: 'text',
          parts: ['Hello! How can I help you with coding today?'],
        },
        create_time: 1700000200,
      },
    },
  },
};

/**
 * Array of ChatGPT exports (typical export format)
 */
export const SAMPLE_CHATGPT_ARRAY: ChatGPTExport[] = [
  SAMPLE_CHATGPT_SIMPLE,
  SAMPLE_CHATGPT_BRANCHED,
];

// =============================================================================
// Claude Sample Data
// =============================================================================

/**
 * Simple Claude export format
 */
export const SAMPLE_CLAUDE_SIMPLE = {
  title: 'Claude Chat',
  name: 'Help with TypeScript',
  uuid: 'claude-conv-123',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:45:00Z',
  messages: [
    {
      role: 'human',
      content: 'How do I define a generic type in TypeScript?',
      timestamp: '2024-01-15T10:30:00Z',
    },
    {
      role: 'assistant',
      content:
        'In TypeScript, you define a generic type using angle brackets:\n\n```typescript\nfunction identity<T>(value: T): T {\n  return value;\n}\n```',
      timestamp: '2024-01-15T10:31:00Z',
    },
    {
      role: 'human',
      content: 'Can I constrain the generic type?',
      timestamp: '2024-01-15T10:32:00Z',
    },
    {
      role: 'assistant',
      content:
        'Yes! Use the `extends` keyword:\n\n```typescript\nfunction getLength<T extends { length: number }>(item: T): number {\n  return item.length;\n}\n```',
      timestamp: '2024-01-15T10:33:00Z',
    },
  ],
};

/**
 * Claude export with user/assistant roles
 */
export const SAMPLE_CLAUDE_ALT_ROLES = {
  name: 'React Discussion',
  messages: [
    {
      role: 'user',
      content: 'What are React hooks?',
    },
    {
      role: 'assistant',
      content:
        'React Hooks are functions that let you use state and other React features without writing a class.',
    },
  ],
};

/**
 * Direct array of Claude messages
 */
export const SAMPLE_CLAUDE_MESSAGE_ARRAY = [
  {
    role: 'human',
    content: 'What is Docker?',
    timestamp: '2024-01-20T09:00:00Z',
  },
  {
    role: 'assistant',
    content: 'Docker is a platform for containerizing applications...',
    timestamp: '2024-01-20T09:01:00Z',
  },
];

/**
 * Array of Claude conversations
 */
export const SAMPLE_CLAUDE_ARRAY = [SAMPLE_CLAUDE_SIMPLE, SAMPLE_CLAUDE_ALT_ROLES];

// =============================================================================
// Generic Sample Data
// =============================================================================

/**
 * Generic format with question/answer fields
 */
export const SAMPLE_GENERIC_QA = {
  title: 'Q&A Session',
  messages: [
    {
      question: 'What is the capital of France?',
      answer: 'The capital of France is Paris.',
    },
    {
      question: 'What is 2 + 2?',
      answer: '2 + 2 equals 4.',
    },
  ],
};

/**
 * Generic format with human/bot fields
 */
export const SAMPLE_GENERIC_HUMAN_BOT = {
  conversation: [
    {
      human: 'Tell me a joke.',
      bot: 'Why did the programmer quit? Because they did not get arrays!',
    },
    {
      human: 'Another one please.',
      bot: 'Why do programmers prefer dark mode? Because light attracts bugs!',
    },
  ],
};

/**
 * Generic format with input/output fields
 */
export const SAMPLE_GENERIC_INPUT_OUTPUT = {
  name: 'Training Data',
  data: [
    {
      input: 'Translate to French: Hello',
      output: 'Bonjour',
    },
    {
      input: 'Translate to French: Goodbye',
      output: 'Au revoir',
    },
  ],
};

/**
 * Simple string array (alternating messages)
 */
export const SAMPLE_GENERIC_STRING_ARRAY = [
  'Hello, how are you?',
  'I am doing well, thank you for asking!',
  'Can you help me with something?',
  'Of course! What do you need help with?',
];

// =============================================================================
// Edge Cases
// =============================================================================

/**
 * Empty ChatGPT export
 */
export const SAMPLE_EMPTY_CHATGPT: ChatGPTExport = {
  title: 'Empty Conversation',
  create_time: 1700000000,
  update_time: 1700000000,
  mapping: {
    root: {
      id: 'root',
      parent: null,
      children: [],
      message: null,
    },
  },
};

/**
 * ChatGPT export with missing content parts
 */
export const SAMPLE_MALFORMED_CHATGPT = {
  title: 'Malformed Export',
  create_time: 1700000000,
  update_time: 1700000000,
  mapping: {
    root: {
      id: 'root',
      parent: null,
      children: ['msg-1'],
      message: null,
    },
    'msg-1': {
      id: 'msg-1',
      parent: 'root',
      children: [],
      message: {
        id: 'msg-1-content',
        author: { role: 'user' },
        // Missing content.parts
        content: {
          content_type: 'text',
        },
        create_time: 1700000100,
      },
    },
  },
};

/**
 * Data with HTML entities that need sanitization
 */
export const SAMPLE_WITH_HTML_ENTITIES = {
  messages: [
    {
      role: 'user',
      content: 'Check this: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    },
    {
      role: 'assistant',
      content: 'That&#39;s HTML encoded. The &amp; symbol is an ampersand.',
    },
  ],
};

/**
 * Data with duplicate messages
 */
export const SAMPLE_WITH_DUPLICATES = {
  messages: [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there!' },
    { role: 'user', content: 'Hello' }, // Duplicate
    { role: 'assistant', content: 'Hi there!' }, // Duplicate
    { role: 'user', content: 'How are you?' },
    { role: 'assistant', content: 'I am doing well!' },
  ],
};

/**
 * Large conversation for performance testing
 */
export function generateLargeConversation(messageCount: number): ChatGPTExport {
  const mapping: Record<string, ChatGPTMappingNode> = {
    root: {
      id: 'root',
      parent: null,
      children: messageCount > 0 ? ['msg-0'] : [],
      message: null,
    },
  };

  for (let i = 0; i < messageCount; i++) {
    const isUser = i % 2 === 0;
    const nodeId = `msg-${i}`;
    const nextId = i < messageCount - 1 ? `msg-${i + 1}` : null;

    mapping[nodeId] = {
      id: nodeId,
      parent: i === 0 ? 'root' : `msg-${i - 1}`,
      children: nextId ? [nextId] : [],
      message: {
        id: `${nodeId}-content`,
        author: { role: isUser ? 'user' : 'assistant' },
        content: {
          content_type: 'text',
          parts: [
            isUser
              ? `This is user message number ${i / 2 + 1}`
              : `This is assistant response number ${Math.floor(i / 2) + 1}`,
          ],
        },
        create_time: 1700000000 + i * 100,
      },
    };
  }

  return {
    title: `Large Conversation (${messageCount} messages)`,
    create_time: 1700000000,
    update_time: 1700000000 + messageCount * 100,
    mapping,
  };
}

// =============================================================================
// Export All Samples
// =============================================================================

export const SAMPLES = {
  chatgpt: {
    simple: SAMPLE_CHATGPT_SIMPLE,
    branched: SAMPLE_CHATGPT_BRANCHED,
    withSystem: SAMPLE_CHATGPT_WITH_SYSTEM,
    array: SAMPLE_CHATGPT_ARRAY,
    empty: SAMPLE_EMPTY_CHATGPT,
    malformed: SAMPLE_MALFORMED_CHATGPT,
  },
  claude: {
    simple: SAMPLE_CLAUDE_SIMPLE,
    altRoles: SAMPLE_CLAUDE_ALT_ROLES,
    messageArray: SAMPLE_CLAUDE_MESSAGE_ARRAY,
    array: SAMPLE_CLAUDE_ARRAY,
  },
  generic: {
    qa: SAMPLE_GENERIC_QA,
    humanBot: SAMPLE_GENERIC_HUMAN_BOT,
    inputOutput: SAMPLE_GENERIC_INPUT_OUTPUT,
    stringArray: SAMPLE_GENERIC_STRING_ARRAY,
  },
  edge: {
    htmlEntities: SAMPLE_WITH_HTML_ENTITIES,
    duplicates: SAMPLE_WITH_DUPLICATES,
  },
} as const;
