/**
 * API Service Layer
 *
 * Centralized API service that wraps the Electron IPC calls.
 * Provides type-safe access to all backend operations with
 * proper error handling and fallbacks for non-Electron environments.
 */

import type { Result, FileSelection, AnalysisResult, Progress } from '@common/types';
import type { ElectronAPI } from '@/types/electron.d';
import { isElectron, getElectronAPISafe } from '@/types/electron.d';
import { API_CONFIG } from '@common/constants';

// =============================================================================
// Types
// =============================================================================

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface SaveFileOptions {
  filePath?: string;
  content: string;
  filters?: FileFilter[];
}

export interface ResumeSection {
  id: string;
  type: string;
  title: string;
  content: unknown;
  visible?: boolean;
}

export interface ResumeData {
  sections: ResumeSection[];
  template: string;
}

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Creates a consistent error result
 */
function createErrorResult<T>(message: string): Result<T> {
  return {
    success: false,
    error: new Error(message),
  };
}

/**
 * Gets the Electron API or returns null for browser fallback
 */
function getApi(): ElectronAPI | null {
  return getElectronAPISafe();
}

// =============================================================================
// File Operations Service
// =============================================================================

export const fileService = {
  /**
   * Opens a native file selection dialog
   */
  async selectFile(options?: {
    multiple?: boolean;
    filters?: FileFilter[];
  }): Promise<FileSelection> {
    const electronApi = getApi();

    if (!electronApi) {
      // Browser fallback - can implement HTML5 file input later
      return { canceled: true, filePaths: [] };
    }

    return electronApi.file.select({
      filters: options?.filters || [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      multiSelect: options?.multiple || false,
    });
  },

  /**
   * Reads a file from the filesystem
   */
  async readFile(filePath: string): Promise<Result<string>> {
    const electronApi = getApi();

    if (!electronApi) {
      return createErrorResult('File operations require Electron environment');
    }

    return electronApi.file.read(filePath);
  },

  /**
   * Saves content to a file
   */
  async saveFile(options: SaveFileOptions): Promise<Result<string>> {
    const electronApi = getApi();

    if (!electronApi) {
      return createErrorResult('File operations require Electron environment');
    }

    return electronApi.file.save(options);
  },

  /**
   * Copies a file to a destination
   */
  async copyFile(sourcePath: string, destPath: string): Promise<Result<string>> {
    const electronApi = getApi();

    if (!electronApi) {
      return createErrorResult('File operations require Electron environment');
    }

    return electronApi.file.copy(sourcePath, destPath);
  },

  /**
   * Ensures a directory exists
   */
  async ensureDir(dirPath: string): Promise<Result<string>> {
    const electronApi = getApi();

    if (!electronApi) {
      return createErrorResult('File operations require Electron environment');
    }

    return electronApi.file.ensureDir(dirPath);
  },

  /**
   * Gets the project data directory path
   */
  async getDataPath(projectName: string): Promise<string> {
    const electronApi = getApi();

    if (!electronApi) {
      // Browser fallback - use a default path
      return `data/${projectName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()}`;
    }

    return electronApi.file.getDataPath(projectName);
  },
};

// =============================================================================
// NLP Operations Service
// =============================================================================

export const nlpService = {
  /**
   * Analyzes conversation data through the NLP pipeline
   */
  async analyzeConversation(
    messages: Array<{ role: string; content: string }>
  ): Promise<Result<AnalysisResult>> {
    const electronApi = getApi();

    if (!electronApi) {
      return createErrorResult('NLP operations require Electron environment');
    }

    return electronApi.nlp.analyze({ messages });
  },

  /**
   * Extracts skills from text content
   */
  async extractSkills(text: string): Promise<Result<Array<{ name: string; confidence: number }>>> {
    const electronApi = getApi();

    if (!electronApi) {
      return createErrorResult('NLP operations require Electron environment');
    }

    return electronApi.nlp.extractSkills(text);
  },

  /**
   * Subscribes to NLP progress updates
   * @returns Unsubscribe function
   */
  onProgress(callback: (progress: Progress) => void): () => void {
    const electronApi = getApi();

    if (!electronApi) {
      return () => {}; // No-op for browser
    }

    return electronApi.nlp.onProgress(callback);
  },
};

// =============================================================================
// Resume Operations Service
// =============================================================================

export const resumeService = {
  /**
   * Generates a PDF resume
   */
  async generatePdf(data: ResumeData): Promise<Result<Uint8Array>> {
    const electronApi = getApi();

    if (!electronApi) {
      return createErrorResult('PDF generation requires Electron environment');
    }

    const result = await electronApi.resume.generatePdf({
      sections: data.sections,
      template: data.template,
    });

    if (result.success) {
      // Convert Buffer to Uint8Array for consistency
      return {
        success: true,
        data: new Uint8Array(result.data),
      };
    }

    return result as Result<Uint8Array>;
  },

  /**
   * Generates a DOCX resume
   */
  async generateDocx(data: ResumeData): Promise<Result<Uint8Array>> {
    const electronApi = getApi();

    if (!electronApi) {
      return createErrorResult('DOCX generation requires Electron environment');
    }

    const result = await electronApi.resume.generateDocx({
      sections: data.sections,
      template: data.template,
    });

    if (result.success) {
      return {
        success: true,
        data: new Uint8Array(result.data),
      };
    }

    return result as Result<Uint8Array>;
  },

  /**
   * Enhances text content using AI
   */
  async enhanceText(content: string): Promise<Result<string>> {
    const electronApi = getApi();

    if (!electronApi) {
      return createErrorResult('AI enhancement requires Electron environment');
    }

    return electronApi.resume.enhance(content);
  },
};

// =============================================================================
// Assessment Operations Service
// =============================================================================

export interface AssessmentData {
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

export const assessmentService = {
  /**
   * Generates a PDF assessment report
   */
  async generatePdf(data: AssessmentData): Promise<Result<Uint8Array>> {
    const electronApi = getApi();

    if (!electronApi) {
      return createErrorResult('PDF generation requires Electron environment');
    }

    // Call the assessment PDF generation IPC
    const result = await electronApi.assessment.generatePdf(data);

    if (result.success) {
      return {
        success: true,
        data: new Uint8Array(result.data),
      };
    }

    return result as Result<Uint8Array>;
  },
};

// =============================================================================
// App Operations Service
// =============================================================================

export const appService = {
  /**
   * Opens a URL in the system's default browser
   */
  async openExternal(url: string): Promise<Result<void>> {
    const electronApi = getApi();

    if (!electronApi) {
      // Browser fallback
      window.open(url, '_blank', 'noopener,noreferrer');
      return { success: true, data: undefined };
    }

    return electronApi.app.openExternal(url);
  },

  /**
   * Opens a file or folder in the system's default application
   */
  async openPath(filePath: string): Promise<Result<void>> {
    const electronApi = getApi();

    if (!electronApi) {
      return createErrorResult('File operations require Electron environment');
    }

    return electronApi.app.openPath(filePath);
  },

  /**
   * Shows a file in the system's file manager with the file selected
   */
  async showItemInFolder(filePath: string): Promise<Result<void>> {
    const electronApi = getApi();

    if (!electronApi) {
      return createErrorResult('File operations require Electron environment');
    }

    return electronApi.app.showItemInFolder(filePath);
  },

  /**
   * Gets the exports directory path
   */
  async getExportsPath(): Promise<string> {
    const electronApi = getApi();

    if (!electronApi) {
      return 'exports';
    }

    return electronApi.app.getExportsPath();
  },
};

// =============================================================================
// Event Subscriptions
// =============================================================================

export const eventService = {
  /**
   * Subscribes to menu events
   */
  onMenu(channel: string, callback: (...args: unknown[]) => void): () => void {
    const electronApi = getApi();

    if (!electronApi) {
      return () => {};
    }

    return electronApi.menu.on(channel, callback);
  },

  /**
   * Subscribes to deep link events
   */
  onDeepLink(callback: (url: string) => void): () => void {
    const electronApi = getApi();

    if (!electronApi) {
      return () => {};
    }

    return electronApi.events.onDeepLink(callback);
  },

  /**
   * Subscribes to file open events (macOS)
   */
  onOpenFile(callback: (filePath: string) => void): () => void {
    const electronApi = getApi();

    if (!electronApi) {
      return () => {};
    }

    return electronApi.events.onOpenFile(callback);
  },
};

// =============================================================================
// NLP Backend Health Check
// =============================================================================

const NLP_BACKEND_URL = `http://127.0.0.1:${API_CONFIG.DEFAULT_PORT}`;

export const healthService = {
  /**
   * Checks if the NLP backend is running and responsive
   */
  async checkNlpBackend(): Promise<boolean> {
    try {
      const response = await fetch(`${NLP_BACKEND_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Gets detailed NLP backend status
   */
  async getNlpStatus(): Promise<{ online: boolean; cuda: boolean; version?: string }> {
    try {
      const response = await fetch(`${NLP_BACKEND_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = await response.json();
        return {
          online: true,
          cuda: data.cuda_available ?? false,
          version: data.version,
        };
      }
      return { online: false, cuda: false };
    } catch {
      return { online: false, cuda: false };
    }
  },
};

// =============================================================================
// Unified API Export
// =============================================================================

/**
 * Unified API object for convenient access to all services
 */
export const api = {
  file: fileService,
  nlp: nlpService,
  resume: resumeService,
  assessment: assessmentService,
  app: appService,
  events: eventService,
  health: healthService,

  // Utility methods
  isElectron,

  // Direct access methods for common operations
  async selectFile(options?: { multiple?: boolean; filters?: FileFilter[] }) {
    return fileService.selectFile(options);
  },

  async readFile(filePath: string) {
    return fileService.readFile(filePath);
  },

  async saveFile(options: SaveFileOptions) {
    return fileService.saveFile(options);
  },

  async analyzeConversation(messages: Array<{ role: string; content: string }>) {
    return nlpService.analyzeConversation(messages);
  },

  async extractSkills(text: string) {
    return nlpService.extractSkills(text);
  },

  async generateResume(data: ResumeData) {
    return resumeService.generatePdf(data);
  },

  async enhanceText(content: string) {
    return resumeService.enhanceText(content);
  },

  async openExternal(url: string) {
    return appService.openExternal(url);
  },

  async openPath(filePath: string) {
    return appService.openPath(filePath);
  },

  async showItemInFolder(filePath: string) {
    return appService.showItemInFolder(filePath);
  },

  async getExportsPath() {
    return appService.getExportsPath();
  },

  // File operation shortcuts
  async copyFile(sourcePath: string, destPath: string) {
    return fileService.copyFile(sourcePath, destPath);
  },

  async ensureDir(dirPath: string) {
    return fileService.ensureDir(dirPath);
  },

  async getDataPath(projectName: string) {
    return fileService.getDataPath(projectName);
  },
};

export default api;
