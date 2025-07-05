/**
 * Electron Preload Script
 *
 * Bridge between main and renderer processes.
 * Exposes safe APIs to the renderer via contextBridge.
 *
 * SECURITY: Only expose minimal, safe APIs. Never expose
 * direct access to Node.js, Electron internals, or the file system.
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IPC } from '../common/constants';
import type { Result, FileSelection, AnalysisResult, Progress } from '../common/types';

// =============================================================================
// Type Definitions
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

// =============================================================================
// API Definition
// =============================================================================

/**
 * The API object exposed to the renderer process via window.api
 */
const api = {
  // ===========================================================================
  // File Operations
  // ===========================================================================

  file: {
    /**
     * Opens a native file selection dialog
     * @param options - Dialog options
     * @returns Selected file paths
     */
    select: (options?: {
      filters?: FileFilter[];
      multiSelect?: boolean;
    }): Promise<FileSelection> => {
      return ipcRenderer.invoke(IPC.FILE_SELECT, options);
    },

    /**
     * Reads a file from the filesystem
     * @param filePath - Absolute path to the file
     * @returns File contents as string
     */
    read: (filePath: string): Promise<Result<string>> => {
      return ipcRenderer.invoke(IPC.FILE_READ, filePath);
    },

    /**
     * Saves content to a file
     * @param options - Save options including path and content
     * @returns Path where file was saved
     */
    save: (options: SaveFileOptions): Promise<Result<string>> => {
      return ipcRenderer.invoke(IPC.FILE_SAVE, options);
    },

    /**
     * Copies a file to a destination
     * @param sourcePath - Source file path
     * @param destPath - Destination file path
     * @returns Destination path on success
     */
    copy: (sourcePath: string, destPath: string): Promise<Result<string>> => {
      return ipcRenderer.invoke(IPC.FILE_COPY, { sourcePath, destPath });
    },

    /**
     * Ensures a directory exists
     * @param dirPath - Directory path
     * @returns Directory path on success
     */
    ensureDir: (dirPath: string): Promise<Result<string>> => {
      return ipcRenderer.invoke(IPC.FILE_ENSURE_DIR, dirPath);
    },

    /**
     * Gets the project data directory path
     * @param projectName - Project name
     * @returns Absolute path to project data directory
     */
    getDataPath: (projectName: string): Promise<string> => {
      return ipcRenderer.invoke(IPC.FILE_GET_DATA_PATH, projectName);
    },
  },

  // ===========================================================================
  // NLP Operations
  // ===========================================================================

  nlp: {
    /**
     * Analyzes conversation data through the NLP pipeline
     * @param data - Messages to analyze
     * @returns Analysis results
     */
    analyze: (data: {
      messages: Array<{ role: string; content: string }>;
    }): Promise<Result<AnalysisResult>> => {
      return ipcRenderer.invoke(IPC.NLP_ANALYZE, data);
    },

    /**
     * Extracts skills from text
     * @param text - Text to analyze
     * @returns Extracted skills with confidence scores
     */
    extractSkills: (text: string): Promise<Result<Array<{ name: string; confidence: number }>>> => {
      return ipcRenderer.invoke(IPC.NLP_EXTRACT_SKILLS, text);
    },

    /**
     * Subscribes to NLP progress updates
     * @param callback - Function to call with progress updates
     * @returns Unsubscribe function
     */
    onProgress: (callback: (progress: Progress) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, progress: Progress) => {
        callback(progress);
      };
      ipcRenderer.on(IPC.NLP_PROGRESS, handler);
      return () => {
        ipcRenderer.removeListener(IPC.NLP_PROGRESS, handler);
      };
    },
  },

  // ===========================================================================
  // Resume Operations
  // ===========================================================================

  resume: {
    /**
     * Generates a PDF resume
     * @param resume - Resume data with sections and template
     * @returns PDF as Buffer
     */
    generatePdf: (resume: { sections: unknown[]; template: string }): Promise<Result<Buffer>> => {
      return ipcRenderer.invoke(IPC.RESUME_GENERATE_PDF, resume);
    },

    /**
     * Generates a DOCX resume
     * @param resume - Resume data with sections and template
     * @returns DOCX as Buffer
     */
    generateDocx: (resume: { sections: unknown[]; template: string }): Promise<Result<Buffer>> => {
      return ipcRenderer.invoke(IPC.RESUME_GENERATE_DOCX, resume);
    },

    /**
     * Enhances resume content with AI
     * @param content - Content to enhance
     * @returns Enhanced content
     */
    enhance: (content: string): Promise<Result<string>> => {
      return ipcRenderer.invoke(IPC.RESUME_ENHANCE, content);
    },
  },

  // ===========================================================================
  // Assessment Operations
  // ===========================================================================

  assessment: {
    /**
     * Generates a PDF assessment report
     * @param data - Assessment data including skills, achievements, topics, experience
     * @returns PDF as Buffer
     */
    generatePdf: (data: {
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
    }): Promise<Result<Buffer>> => {
      return ipcRenderer.invoke(IPC.ASSESSMENT_GENERATE_PDF, data);
    },
  },

  // ===========================================================================
  // App Operations
  // ===========================================================================

  app: {
    /**
     * Opens a URL in the system's default browser
     * @param url - URL to open
     */
    openExternal: (url: string): Promise<Result<void>> => {
      return ipcRenderer.invoke(IPC.APP_OPEN_EXTERNAL, url);
    },

    /**
     * Opens a file or folder in the system's default application
     * @param filePath - Path to open
     */
    openPath: (filePath: string): Promise<Result<void>> => {
      return ipcRenderer.invoke(IPC.APP_OPEN_PATH, filePath);
    },

    /**
     * Shows a file in the system's file manager with the file selected
     * @param filePath - Path to the file
     */
    showItemInFolder: (filePath: string): Promise<Result<void>> => {
      return ipcRenderer.invoke(IPC.APP_SHOW_ITEM_IN_FOLDER, filePath);
    },

    /**
     * Gets the exports directory path
     * @returns Path to the exports directory
     */
    getExportsPath: (): Promise<string> => {
      return ipcRenderer.invoke(IPC.APP_GET_EXPORTS_PATH);
    },
  },

  // ===========================================================================
  // Menu Event Handlers
  // ===========================================================================

  menu: {
    /**
     * Subscribes to menu events from the main process
     * @param channel - Menu event channel
     * @param callback - Event handler
     * @returns Unsubscribe function
     */
    on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
      // Only allow menu: prefixed channels
      if (!channel.startsWith('menu:')) {
        console.warn(`Invalid menu channel: ${channel}`);
        return () => {};
      }

      const handler = (_event: IpcRendererEvent, ...args: unknown[]) => {
        callback(...args);
      };
      ipcRenderer.on(channel, handler);
      return () => {
        ipcRenderer.removeListener(channel, handler);
      };
    },
  },

  // ===========================================================================
  // Window Controls (Neo-Noir Glass Monitor)
  // ===========================================================================

  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window-minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('window-maximize'),
    close: (): Promise<void> => ipcRenderer.invoke('window-close'),
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('open-external', url),
  },

  // ===========================================================================
  // Deep Link & File Open Handlers
  // ===========================================================================

  events: {
    /**
     * Subscribes to deep link events
     * @param callback - Handler for deep link URLs
     * @returns Unsubscribe function
     */
    onDeepLink: (callback: (url: string) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, url: string) => {
        callback(url);
      };
      ipcRenderer.on('deep-link', handler);
      return () => {
        ipcRenderer.removeListener('deep-link', handler);
      };
    },

    /**
     * Subscribes to file open events (macOS)
     * @param callback - Handler for file paths
     * @returns Unsubscribe function
     */
    onOpenFile: (callback: (filePath: string) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, filePath: string) => {
        callback(filePath);
      };
      ipcRenderer.on('open-file', handler);
      return () => {
        ipcRenderer.removeListener('open-file', handler);
      };
    },
  },
};

// =============================================================================
// Context Bridge Exposure
// =============================================================================

// Expose the API in the main world
contextBridge.exposeInMainWorld('api', api);

// =============================================================================
// Type Export for Renderer
// =============================================================================

// Export the API type for TypeScript usage in renderer
export type ElectronAPI = typeof api;
