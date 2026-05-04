/**
 * Application Constants
 *
 * Shared constants across main and renderer processes.
 * Includes IPC channels, patterns, and configuration.
 */

// =============================================================================
// IPC Channel Names
// =============================================================================

/**
 * IPC channel constants for Electron inter-process communication.
 * All channels are namespaced by feature area.
 */
export const IPC = {
  // File operations
  FILE_SELECT: 'file:select',
  FILE_READ: 'file:read',
  FILE_SAVE: 'file:save',
  FILE_COPY: 'file:copy',
  FILE_ENSURE_DIR: 'file:ensure-dir',
  FILE_GET_DATA_PATH: 'file:get-data-path',

  // NLP operations
  NLP_ANALYZE: 'nlp:analyze',
  NLP_EXTRACT_SKILLS: 'nlp:extract-skills',
  NLP_PROGRESS: 'nlp:progress',

  // Resume operations
  RESUME_GENERATE_PDF: 'resume:generate-pdf',
  RESUME_GENERATE_DOCX: 'resume:generate-docx',
  RESUME_ENHANCE: 'resume:enhance',

  // Assessment operations
  ASSESSMENT_GENERATE_PDF: 'assessment:generate-pdf',

  // App operations
  APP_OPEN_EXTERNAL: 'app:open-external',
  APP_OPEN_PATH: 'app:open-path',
  APP_SHOW_ITEM_IN_FOLDER: 'app:show-item-in-folder',
  APP_GET_EXPORTS_PATH: 'app:get-exports-path',
} as const;

// =============================================================================
// Application Metadata
// =============================================================================

/**
 * Application information constants
 */
export const APP_INFO = {
  name: 'Resume Builder',
  version: '1.0.0',
  description: 'AI-powered resume generation from conversation history',
  author: 'J. Michaels',
  repository: 'https://github.com/sanchez314c/resume-builder',
} as const;

// =============================================================================
// Window Configuration
// =============================================================================

/**
 * Default window dimensions and constraints
 */
export const WINDOW_CONFIG = {
  MIN_WIDTH: 800,
  MIN_HEIGHT: 600,
  DEFAULT_WIDTH: 1200,
  DEFAULT_HEIGHT: 926,
  TITLE: APP_INFO.name,
} as const;

// =============================================================================
// API Configuration
// =============================================================================

/**
 * Python sidecar API configuration
 */
export const API_CONFIG = {
  /** Default port for Python sidecar — must match BACKEND_PORT in run-source-linux.sh */
  DEFAULT_PORT: 57964,
  /** Default port for Vite dev server */
  FRONTEND_PORT: 63263,
  /** Request timeout in milliseconds (10 minutes for large datasets) */
  TIMEOUT: 600000,
  /** Analysis-specific timeout (15 minutes for heavy NLP) */
  ANALYSIS_TIMEOUT: 900000,
  /** Maximum retries for failed requests */
  MAX_RETRIES: 3,
  /** Health check endpoint */
  HEALTH_ENDPOINT: '/health',
  /** Analysis endpoint */
  ANALYZE_ENDPOINT: '/analyze',
  /** Enhancement endpoint */
  ENHANCE_ENDPOINT: '/enhance',
} as const;
