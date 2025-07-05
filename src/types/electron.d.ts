/**
 * Electron API Type Declarations
 *
 * Provides TypeScript types for the APIs exposed via contextBridge
 * in the preload script. These types make the renderer process
 * aware of the available window.api methods.
 */

import type { Result, FileSelection, AnalysisResult, Progress } from '../common/types';

// =============================================================================
// File Operations Types
// =============================================================================

interface FileFilter {
  name: string;
  extensions: string[];
}

interface SaveFileOptions {
  filePath?: string;
  content: string;
  filters?: FileFilter[];
}

interface FileAPI {
  /**
   * Opens a native file selection dialog
   * @param options - Dialog options
   * @returns Selected file paths
   */
  select(options?: { filters?: FileFilter[]; multiSelect?: boolean }): Promise<FileSelection>;

  /**
   * Reads a file from the filesystem
   * @param filePath - Absolute path to the file
   * @returns File contents as string
   */
  read(filePath: string): Promise<Result<string>>;

  /**
   * Saves content to a file
   * @param options - Save options including path and content
   * @returns Path where file was saved
   */
  save(options: SaveFileOptions): Promise<Result<string>>;

  /**
   * Copies a file to a destination
   */
  copy(sourcePath: string, destPath: string): Promise<Result<string>>;

  /**
   * Ensures a directory exists
   */
  ensureDir(dirPath: string): Promise<Result<string>>;

  /**
   * Gets the project data directory path
   */
  getDataPath(projectName: string): Promise<string>;
}

// =============================================================================
// NLP Operations Types
// =============================================================================

interface NlpAPI {
  /**
   * Analyzes conversation data through the NLP pipeline
   * @param data - Messages to analyze
   * @returns Analysis results
   */
  analyze(data: {
    messages: Array<{ role: string; content: string }>;
  }): Promise<Result<AnalysisResult>>;

  /**
   * Extracts skills from text
   * @param text - Text to analyze
   * @returns Extracted skills with confidence scores
   */
  extractSkills(text: string): Promise<Result<Array<{ name: string; confidence: number }>>>;

  /**
   * Subscribes to NLP progress updates
   * @param callback - Function to call with progress updates
   * @returns Unsubscribe function
   */
  onProgress(callback: (progress: Progress) => void): () => void;
}

// =============================================================================
// Resume Operations Types
// =============================================================================

interface ResumeAPI {
  /**
   * Generates a PDF resume
   * @param resume - Resume data with sections and template
   * @returns PDF as Buffer
   */
  generatePdf(resume: { sections: unknown[]; template: string }): Promise<Result<Buffer>>;

  /**
   * Generates a DOCX resume
   * @param resume - Resume data with sections and template
   * @returns DOCX as Buffer
   */
  generateDocx(resume: { sections: unknown[]; template: string }): Promise<Result<Buffer>>;

  /**
   * Enhances resume content with AI
   * @param content - Content to enhance
   * @returns Enhanced content
   */
  enhance(content: string): Promise<Result<string>>;
}

// =============================================================================
// Assessment Operations Types
// =============================================================================

interface AssessmentData {
  projectName: string;
  skills: Array<{
    name: string;
    category: string;
    confidence: number;
    mentions: number;
  }>;
  achievements: Array<{
    id: string;
    text: string;
    category: string;
    keywords: string[];
  }>;
  topics: Array<{
    name: string;
    weight: number;
  }>;
  experience: Array<{
    id: string;
    title: string;
    description: string;
    duration?: string;
    skills: string[];
  }>;
}

interface AssessmentAPI {
  /**
   * Generates a PDF assessment report
   * @param data - Assessment data including skills, achievements, topics, experience
   * @returns PDF as Buffer
   */
  generatePdf(data: AssessmentData): Promise<Result<Buffer>>;
}

// =============================================================================
// App Operations Types
// =============================================================================

interface AppAPI {
  /**
   * Opens a URL in the system's default browser
   * @param url - URL to open
   */
  openExternal(url: string): Promise<Result<void>>;

  /**
   * Opens a file or folder in the system's default application
   * @param filePath - Path to open
   */
  openPath(filePath: string): Promise<Result<void>>;

  /**
   * Shows a file in the system's file manager with the file selected
   * @param filePath - Path to the file
   */
  showItemInFolder(filePath: string): Promise<Result<void>>;

  /**
   * Gets the exports directory path
   */
  getExportsPath(): Promise<string>;
}

// =============================================================================
// Menu Event Types
// =============================================================================

interface MenuAPI {
  /**
   * Subscribes to menu events from the main process
   * @param channel - Menu event channel (must start with 'menu:')
   * @param callback - Event handler
   * @returns Unsubscribe function
   */
  on(channel: string, callback: (...args: unknown[]) => void): () => void;
}

// =============================================================================
// Events API Types
// =============================================================================

interface EventsAPI {
  /**
   * Subscribes to deep link events
   * @param callback - Handler for deep link URLs
   * @returns Unsubscribe function
   */
  onDeepLink(callback: (url: string) => void): () => void;

  /**
   * Subscribes to file open events (macOS)
   * @param callback - Handler for file paths
   * @returns Unsubscribe function
   */
  onOpenFile(callback: (filePath: string) => void): () => void;
}

// =============================================================================
// Window Control Types (Neo-Noir frameless window)
// =============================================================================

interface WindowControlAPI {
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  close(): Promise<void>;
  openExternal(url: string): Promise<void>;
}

// =============================================================================
// Complete Electron API Interface
// =============================================================================

/**
 * The complete API interface exposed to the renderer process
 * via window.api
 */
export interface ElectronAPI {
  file: FileAPI;
  nlp: NlpAPI;
  resume: ResumeAPI;
  assessment: AssessmentAPI;
  app: AppAPI;
  menu: MenuAPI;
  events: EventsAPI;
  window: WindowControlAPI;
}

// =============================================================================
// Global Window Extension
// =============================================================================

declare global {
  interface Window {
    /**
     * Electron API exposed via contextBridge
     * Available in renderer process when running in Electron
     */
    api: ElectronAPI;
  }
}

// =============================================================================
// Type Guard
// =============================================================================

/**
 * Checks if the app is running in Electron environment
 * @returns true if window.api is available
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && typeof window.api !== 'undefined';
}

/**
 * Safely gets the Electron API
 * @returns ElectronAPI or null if not available
 */
export function getElectronAPISafe(): ElectronAPI | null {
  return isElectron() ? window.api : null;
}
