/**
 * Core Type Definitions for Resume Builder
 *
 * Comprehensive type system for data models used across
 * main and renderer processes.
 */

// =============================================================================
// Source Types
// =============================================================================

/**
 * Supported conversation export sources
 */
export type ConversationSource = 'chatgpt' | 'claude' | 'generic';

// =============================================================================
// Message & Conversation Types
// =============================================================================

/**
 * Individual message within a conversation
 */
export interface Message {
  /** Unique identifier for the message */
  id: string;
  /** Role of the message author */
  role: 'user' | 'assistant' | 'system';
  /** Text content of the message */
  content: string;
  /** When the message was created (null if unknown) */
  timestamp: Date | null;
}

/**
 * A conversation containing multiple messages
 */
export interface Conversation {
  /** Unique identifier for the conversation */
  id: string;
  /** Title or subject of the conversation */
  title: string;
  /** When the conversation was created */
  createdAt: Date;
  /** When the conversation was last updated */
  updatedAt: Date;
  /** Source platform of the export */
  source: ConversationSource;
  /** Ordered list of messages */
  messages: Message[];
}

// =============================================================================
// ChatGPT Export Types (Tree Structure)
// =============================================================================

/**
 * Node in ChatGPT's mapping tree structure
 * ChatGPT exports use a tree with parent/children relationships,
 * NOT flat arrays. This structure must be traversed recursively.
 */
export interface ChatGPTMappingNode {
  /** Node identifier */
  id: string;
  /** Parent node ID (null for root) */
  parent: string | null;
  /** Child node IDs */
  children: string[];
  /** Message content (null for structural nodes) */
  message: {
    /** Message identifier */
    id: string;
    /** Author information */
    author: { role: string };
    /** Content container */
    content: { content_type: string; parts: string[] };
    /** Unix timestamp of creation (null if unavailable) */
    create_time: number | null;
  } | null;
}

/**
 * ChatGPT conversation export format
 */
export interface ChatGPTExport {
  /** Conversation title */
  title: string;
  /** Unix timestamp of creation */
  create_time: number;
  /** Unix timestamp of last update */
  update_time: number;
  /** Tree mapping of conversation nodes */
  mapping: Record<string, ChatGPTMappingNode>;
}

// =============================================================================
// Skill Types
// =============================================================================

/**
 * Categories for skill classification
 */
export type SkillCategory =
  | 'programming'
  | 'data-science'
  | 'web-mobile'
  | 'devops-cloud'
  | 'soft-skills'
  | 'other';

/**
 * Skill extracted from conversation analysis
 */
export interface ExtractedSkill {
  /** Unique identifier */
  id: string;
  /** Skill name (e.g., "Python", "Machine Learning") */
  name: string;
  /** Classification category */
  category: SkillCategory;
  /** Number of times mentioned */
  frequency: number;
  /** Confidence score from NLP analysis (0-1) */
  confidence: number;
  /** Message IDs where this skill was found */
  sources: string[];
}

// =============================================================================
// Achievement Types
// =============================================================================

/**
 * Achievement or accomplishment extracted from conversations
 */
export interface ExtractedAchievement {
  /** Unique identifier */
  id: string;
  /** Description of the achievement */
  description: string;
  /** Surrounding context from the conversation */
  context: string;
  /** Sentiment analysis score (-1 to 1) */
  sentimentScore: number;
  /** When the achievement occurred (null if unknown) */
  date: Date | null;
  /** Related skill names */
  skills: string[];
}

// =============================================================================
// Timeline Types
// =============================================================================

/**
 * Event in the user's professional timeline
 */
export interface TimelineEvent {
  /** Unique identifier */
  id: string;
  /** When the event occurred */
  date: Date;
  /** Description of the event */
  event: string;
  /** Type classification */
  type: 'development' | 'deployment' | 'achievement' | 'learning';
}

// =============================================================================
// Job Matching Types
// =============================================================================

/**
 * Job position match based on skill analysis
 */
export interface JobMatch {
  /** Unique identifier */
  id: string;
  /** Job title */
  title: string;
  /** Job description */
  description: string;
  /** Match percentage (0-100) */
  matchScore: number;
  /** Skills that match the job requirements */
  matchedSkills: string[];
  /** Skills required but not found in user's profile */
  missingSkills: string[];
}

// =============================================================================
// Resume Types
// =============================================================================

/**
 * Types of sections that can appear in a resume
 */
export type ResumeSectionType =
  | 'summary'
  | 'skills'
  | 'experience'
  | 'achievements'
  | 'education'
  | 'projects';

/**
 * Individual section of a resume
 */
export interface ResumeSection {
  /** Unique identifier */
  id: string;
  /** Section type */
  type: ResumeSectionType;
  /** Display title */
  title: string;
  /** Section content (structure varies by type) */
  content: unknown;
  /** Display order (lower = higher) */
  order: number;
  /** Whether section is visible in output */
  visible: boolean;
}

/**
 * Complete resume document
 */
export interface Resume {
  /** Unique identifier */
  id: string;
  /** User-defined name for this resume */
  name: string;
  /** When the resume was created */
  createdAt: Date;
  /** When the resume was last modified */
  updatedAt: Date;
  /** Target job title for tailoring (null if generic) */
  targetJob: string | null;
  /** Ordered sections of the resume */
  sections: ResumeSection[];
  /** Template identifier for PDF generation */
  template: string;
}

// =============================================================================
// Project Types
// =============================================================================

/**
 * A project container holding all user data
 */
export interface Project {
  /** Unique identifier */
  id: string;
  /** Project name */
  name: string;
  /** When the project was created */
  createdAt: Date;
  /** When the project was last modified */
  updatedAt: Date;
  /** Imported conversations */
  conversations: Conversation[];
  /** Extracted skills */
  skills: ExtractedSkill[];
  /** Extracted achievements */
  achievements: ExtractedAchievement[];
  /** Generated resumes */
  resumes: Resume[];
}

// =============================================================================
// Analysis Types
// =============================================================================

/**
 * Complete result from NLP analysis pipeline
 */
export interface AnalysisResult {
  /** Extracted skills with frequencies */
  skills: ExtractedSkill[];
  /** Extracted achievements */
  achievements: ExtractedAchievement[];
  /** Timeline of events */
  timeline: TimelineEvent[];
  /** Topic clusters from BERTopic */
  topics: TopicCluster[];
  /** Sentiment data over time */
  sentiments: SentimentData[];
}

/**
 * Topic cluster from topic modeling
 */
export interface TopicCluster {
  /** Topic identifier */
  id: number;
  /** Generated topic name */
  name: string;
  /** Top keywords for this topic */
  keywords: string[];
  /** Number of messages in this cluster */
  count: number;
}

/**
 * Sentiment analysis data point
 */
export interface SentimentData {
  /** When this message was sent */
  timestamp: Date;
  /** Type of message */
  messageType: 'user' | 'assistant';
  /** Sentiment classification */
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  /** Confidence score (0-1) */
  score: number;
}

// =============================================================================
// Progress Types
// =============================================================================

/**
 * Progress tracking for long-running operations
 */
export interface Progress {
  /** Current stage name */
  stage: string;
  /** Current item number */
  current: number;
  /** Total items to process */
  total: number;
  /** Human-readable status message */
  message: string;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Result wrapper for operations that may fail
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * File selection result from dialog
 */
export interface FileSelection {
  /** Whether a file was selected */
  canceled: boolean;
  /** Selected file paths */
  filePaths: string[];
}
