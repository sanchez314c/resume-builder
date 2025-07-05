/**
 * File Import Hook
 *
 * Handles the complete file import workflow:
 * 1. File selection via native dialog
 * 2. File content reading
 * 3. Format detection (ChatGPT/Claude)
 * 4. Parsing using appropriate parser
 * 5. Storing results in Zustand store
 */

import { useState, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useAppStore } from '../stores/app-store';
import { logger } from '../stores/log-store';
import { parseConversations, detectFormat } from '../lib/parsers';
import type { Conversation } from '@common/types';
import type { MultiParseResult, FormatDetectionResult } from '../lib/parsers/types';
import { API_CONFIG } from '@common/constants';

// =============================================================================
// Types
// =============================================================================

export interface ImportedConversation extends Conversation {
  sourceFile: string;
  importedAt: Date;
}

export interface ImportProgress {
  stage: 'idle' | 'selecting' | 'reading' | 'parsing' | 'storing' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
  fileName?: string;
}

export interface ImportResult {
  success: boolean;
  conversations: ImportedConversation[];
  errors: string[];
  warnings: string[];
  stats: {
    filesProcessed: number;
    conversationsImported: number;
    messagesTotal: number;
  };
}

export interface UseFileImportOptions {
  /** Auto-process files after selection */
  autoProcess?: boolean;
  /** Filters for file selection dialog */
  filters?: Array<{ name: string; extensions: string[] }>;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Callback on progress update */
  onProgress?: (progress: ImportProgress) => void;
  /** Callback on completion */
  onComplete?: (result: ImportResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_FILTERS = [
  { name: 'JSON Conversations', extensions: ['json'] },
  { name: 'Documents (PDF, TXT, MD)', extensions: ['pdf', 'txt', 'md', 'markdown', 'csv'] },
  { name: 'All Files', extensions: ['*'] },
];

// Document file extensions that go to /analyze-file endpoint
const DOCUMENT_EXTENSIONS = ['pdf', 'txt', 'md', 'markdown', 'csv'];

/**
 * Check if file is a document (not a conversation JSON)
 */
function isDocumentFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return DOCUMENT_EXTENSIONS.includes(ext);
}

const initialProgress: ImportProgress = {
  stage: 'idle',
  current: 0,
  total: 0,
  message: '',
};

// =============================================================================
// Hook Implementation
// =============================================================================

export function useFileImport(options: UseFileImportOptions = {}) {
  const { filters = DEFAULT_FILTERS, multiple = true, onProgress, onComplete, onError } = options;

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<ImportProgress>(initialProgress);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  // Store access
  const {
    currentProject,
    createProject,
    addFileToProject,
    updateFileStatus,
    addError: addStoreError,
  } = useAppStore();

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Updates progress state and calls callback.
   * Uses functional setState to avoid stale closure over `progress`.
   */
  const updateProgress = useCallback(
    (update: Partial<ImportProgress>) => {
      setProgress((prev) => {
        const newProgress = { ...prev, ...update };
        onProgress?.(newProgress);
        return newProgress;
      });
    },
    [onProgress]
  );

  /**
   * Analyzes a document file (PDF, TXT, MD, CSV) via Python backend
   */
  const analyzeDocumentFile = useCallback(
    async (
      filePath: string,
      _fileName: string
    ): Promise<{
      success: boolean;
      skills: Array<{ name: string; category: string; confidence: number; frequency: number }>;
      textLength: number;
      error?: string;
    }> => {
      try {
        // Use the path-based endpoint (Python reads the file directly)
        const response = await fetch(
          `http://127.0.0.1:${API_CONFIG.DEFAULT_PORT}/analyze-file-path`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file_path: filePath,
              min_confidence: 0.3,
              min_frequency: 1,
              max_skills: 100,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return {
          success: true,
          skills: data.skills || [],
          textLength: data.text_length || 0,
        };
      } catch (err) {
        return {
          success: false,
          skills: [],
          textLength: 0,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
    []
  );

  /**
   * Detects format from file content
   */
  const detectFileFormat = useCallback(
    (content: string, _fileName: string): FormatDetectionResult & { json: unknown } => {
      try {
        const json = JSON.parse(content);
        const detection = detectFormat(json);
        return { ...detection, json };
      } catch (err) {
        return {
          format: 'unknown',
          confidence: 0,
          indicators: [`Failed to parse JSON: ${err}`],
          json: null,
        };
      }
    },
    []
  );

  /**
   * Processes a single file and returns parsed conversations
   */
  const processFile = useCallback(
    async (
      filePath: string,
      fileName: string
    ): Promise<{ conversations: ImportedConversation[]; parseResult: MultiParseResult }> => {
      // Read file content
      const readResult = await api.readFile(filePath);

      if (!readResult.success) {
        throw new Error(`Failed to read file: ${readResult.error.message}`);
      }

      // Detect format and parse
      const detection = detectFileFormat(readResult.data, fileName);

      if (detection.format === 'unknown' || !detection.json) {
        throw new Error('Unknown file format. Expected ChatGPT or Claude export.');
      }

      // Parse conversations
      const parseResult = parseConversations(detection.json);

      // Add metadata to conversations
      const importedConversations: ImportedConversation[] = parseResult.conversations.map(
        (conv) => ({
          ...conv,
          sourceFile: fileName,
          importedAt: new Date(),
        })
      );

      return { conversations: importedConversations, parseResult };
    },
    [detectFileFormat]
  );

  /**
   * Main import function - opens dialog and processes files
   */
  const importFile = useCallback(async (): Promise<ImportResult | null> => {
    // Reset state
    setIsLoading(true);
    setError(null);
    setProgress(initialProgress);
    abortControllerRef.current = new AbortController();

    const result: ImportResult = {
      success: false,
      conversations: [],
      errors: [],
      warnings: [],
      stats: {
        filesProcessed: 0,
        conversationsImported: 0,
        messagesTotal: 0,
      },
    };

    try {
      // Ensure project exists
      if (!currentProject) {
        // Auto-create project
        createProject('Imported Conversations');
      }

      // Stage 1: File Selection
      updateProgress({
        stage: 'selecting',
        message: 'Opening file dialog...',
      });

      const selection = await api.selectFile({ multiple, filters });

      if (selection.canceled || selection.filePaths.length === 0) {
        updateProgress({ stage: 'idle', message: 'Selection cancelled' });
        setIsLoading(false);
        return null;
      }

      const filePaths = selection.filePaths;
      logger.info('═══════════════════════════════════════════════════════════', {
        stage: 'IMPORT',
      });
      logger.info('   FILE IMPORT PROTOCOL INITIATED', { stage: 'IMPORT' });
      logger.info('═══════════════════════════════════════════════════════════', {
        stage: 'IMPORT',
      });
      logger.info(`Selected ${filePaths.length} file(s) for import`, { stage: 'IMPORT' });

      // Get or create project data directory
      const projectName = currentProject?.name || 'Imported Conversations';
      logger.info(`Project name: "${projectName}"`, { stage: 'IMPORT' });

      const dataPath = await api.getDataPath(projectName);
      logger.info(`Data path resolved: ${dataPath}`, { stage: 'IMPORT' });

      // Ensure data directory exists
      logger.info(`Creating data directory...`, { stage: 'IMPORT' });
      const dirResult = await api.ensureDir(dataPath);
      if (!dirResult.success) {
        logger.error(`Failed to create directory: ${dirResult.error.message}`, { stage: 'IMPORT' });
        throw new Error(`Failed to create data directory: ${dirResult.error.message}`);
      }
      logger.success(`Data directory ready: ${dirResult.data}`, { stage: 'IMPORT' });

      updateProgress({
        stage: 'reading',
        total: filePaths.length,
        current: 0,
        message: `Processing ${filePaths.length} file(s)...`,
      });

      // Stage 2-4: Process each file
      for (let i = 0; i < filePaths.length; i++) {
        // Check for cancellation
        if (abortControllerRef.current?.signal.aborted) {
          result.errors.push('Import cancelled by user');
          break;
        }

        const originalFilePath = filePaths[i];
        const fileName =
          originalFilePath.split('/').pop() || originalFilePath.split('\\').pop() || 'unknown';

        try {
          // Check if this is a document file (PDF, TXT, MD, CSV)
          if (isDocumentFile(fileName)) {
            logger.info(`Document file detected: ${fileName}`, { stage: 'IMPORT' });
            logger.info(`File path: ${originalFilePath}`, { stage: 'IMPORT' });

            updateProgress({
              stage: 'parsing',
              current: i,
              fileName,
              message: `Analyzing document: ${fileName}...`,
            });

            // Send directly to Python backend for skill extraction
            logger.info(`Calling Python backend for skill extraction...`, { stage: 'IMPORT' });
            const docResult = await analyzeDocumentFile(originalFilePath, fileName);
            logger.info(
              `Backend response: success=${docResult.success}, skills=${docResult.skills?.length || 0}, error=${docResult.error || 'none'}`,
              { stage: 'IMPORT' }
            );

            if (!docResult.success) {
              logger.error(`Document analysis failed: ${docResult.error}`, { stage: 'IMPORT' });
              throw new Error(docResult.error || 'Document analysis failed');
            }

            logger.success(`Extracted ${docResult.skills.length} skills from ${fileName}`, {
              stage: 'IMPORT',
            });

            // Log the skills found
            docResult.skills.forEach((skill) => {
              logger.info(
                `  • ${skill.name} (${skill.category}, ${Math.round(skill.confidence * 100)}%)`,
                { stage: 'SKILLS' }
              );
            });

            // Store skills result in app store for display
            const { setAnalysisResult } = useAppStore.getState();
            setAnalysisResult({
              skills: docResult.skills.map((s) => ({
                name: s.name,
                category: s.category,
                confidence: s.confidence,
                mentions: s.frequency,
              })),
              achievements: [],
              experience: [],
              topics: [],
            });

            // Add file to project
            addFileToProject({
              name: fileName,
              path: originalFilePath,
              size: docResult.textLength,
              format: 'unknown',
              status: 'completed',
            });

            result.stats.filesProcessed++;

            // Create a pseudo-conversation for compatibility
            const now = new Date();
            result.conversations.push({
              id: `doc-${Date.now()}`,
              title: `Document: ${fileName}`,
              messages: [
                {
                  id: 'doc-content',
                  role: 'user',
                  content: `[Document with ${docResult.textLength} characters, ${docResult.skills.length} skills extracted]`,
                  timestamp: now,
                },
              ],
              source: 'generic',
              createdAt: now,
              updatedAt: now,
              sourceFile: fileName,
              importedAt: now,
            } as ImportedConversation);

            result.stats.conversationsImported++;
            result.stats.messagesTotal++;

            continue; // Skip normal JSON processing
          }

          updateProgress({
            stage: 'reading',
            current: i,
            fileName,
            message: `Copying ${fileName} to project...`,
          });

          // Copy file to project data directory
          const destPath = `${dataPath}/${fileName}`;
          logger.info(`Copying: ${originalFilePath}`, { stage: 'IMPORT' });
          logger.info(`     To: ${destPath}`, { stage: 'IMPORT' });
          const copyResult = await api.copyFile(originalFilePath, destPath);

          if (!copyResult.success) {
            logger.error(`Copy failed: ${copyResult.error.message}`, { stage: 'IMPORT' });
            throw new Error(`Failed to copy file: ${copyResult.error.message}`);
          }

          logger.success(`File copied successfully`, { stage: 'IMPORT' });
          const filePath = copyResult.data; // Use the copied file path

          updateProgress({
            stage: 'reading',
            current: i,
            fileName,
            message: `Reading ${fileName}...`,
          });

          // Add file to store with pending status (pointing to copied location)
          const format = fileName.toLowerCase().includes('chatgpt')
            ? 'chatgpt'
            : fileName.toLowerCase().includes('claude')
              ? 'claude'
              : 'unknown';

          addFileToProject({
            name: fileName,
            path: filePath, // Now points to copied file in data directory
            size: 0, // Will be updated after reading
            format,
            status: 'processing',
          });

          // Capture the UUID assigned by the store for status updates below
          const addedFile = useAppStore
            .getState()
            .currentProject?.files.find((f) => f.path === filePath);
          const addedFileId = addedFile?.id;

          updateProgress({
            stage: 'parsing',
            current: i,
            message: `Parsing ${fileName}...`,
          });

          // Process the copied file
          const { conversations, parseResult } = await processFile(filePath, fileName);

          // Add conversations to result
          result.conversations.push(...conversations);
          result.warnings.push(...parseResult.warnings);
          result.stats.filesProcessed++;
          result.stats.conversationsImported += conversations.length;
          result.stats.messagesTotal += conversations.reduce(
            (sum, conv) => sum + conv.messages.length,
            0
          );

          // Update file status in store — use the UUID captured above
          if (addedFileId) {
            updateFileStatus(addedFileId, 'completed');
          }

          // Add parse errors as warnings
          parseResult.errors.forEach((err) => {
            result.warnings.push(`${fileName}: ${err.message}`);
          });
        } catch (fileError) {
          const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);

          result.errors.push(`${fileName}: ${errorMessage}`);
          addStoreError(`Failed to import ${fileName}: ${errorMessage}`);
        }
      }

      // Stage 5: Save parsed conversations for later analysis
      logger.info(
        `Parsed ${result.conversations.length} conversations, ${result.stats.messagesTotal} messages`,
        { stage: 'IMPORT' }
      );

      if (result.conversations.length > 0) {
        updateProgress({
          stage: 'storing',
          current: filePaths.length,
          total: filePaths.length,
          message: 'Saving parsed conversations...',
        });

        // Extract all messages from conversations for analysis
        const allMessages = result.conversations.flatMap((conv) =>
          conv.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            conversationId: conv.id,
            conversationTitle: conv.title,
          }))
        );

        // Save to project data folder
        const conversationsPath = `${dataPath}/parsed-conversations.json`;
        logger.info(`Saving parsed data to: ${conversationsPath}`, { stage: 'IMPORT' });

        const saveResult = await api.saveFile({
          filePath: conversationsPath,
          content: JSON.stringify(
            {
              conversations: result.conversations,
              messages: allMessages,
              stats: result.stats,
              exportedAt: new Date().toISOString(),
            },
            null,
            2
          ),
        });

        if (!saveResult.success) {
          logger.error(`Failed to save: ${saveResult.error.message}`, { stage: 'IMPORT' });
          result.warnings.push(`Failed to save parsed data: ${saveResult.error.message}`);
        } else {
          logger.success(`Parsed conversations saved successfully!`, { stage: 'IMPORT' });
          logger.info(`  - ${result.conversations.length} conversations`, { stage: 'IMPORT' });
          logger.info(`  - ${allMessages.length} messages`, { stage: 'IMPORT' });
        }
      } else {
        logger.warning(`No conversations parsed - skipping save`, { stage: 'IMPORT' });
      }

      // Stage 6: Complete
      updateProgress({
        stage: 'complete',
        current: filePaths.length,
        total: filePaths.length,
        message: `Imported ${result.stats.conversationsImported} conversation(s)`,
      });

      result.success = result.errors.length === 0;
      setLastResult(result);
      onComplete?.(result);

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      updateProgress({
        stage: 'error',
        message: error.message,
      });

      result.errors.push(error.message);
      onError?.(error);

      return result;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    currentProject,
    createProject,
    addFileToProject,
    updateFileStatus,
    addStoreError,
    multiple,
    filters,
    updateProgress,
    processFile,
    analyzeDocumentFile,
    onComplete,
    onError,
  ]);

  /**
   * Import from drag-and-drop or file input
   */
  const importFromFiles = useCallback(
    async (files: FileList): Promise<ImportResult | null> => {
      // For browser drag-and-drop, we need to handle differently
      // since we don't have file paths, only File objects

      setIsLoading(true);
      setError(null);

      const result: ImportResult = {
        success: false,
        conversations: [],
        errors: [],
        warnings: [],
        stats: {
          filesProcessed: 0,
          conversationsImported: 0,
          messagesTotal: 0,
        },
      };

      try {
        // Ensure project exists
        if (!currentProject) {
          createProject('Imported Conversations');
        }

        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          if (!file.name.endsWith('.json')) {
            result.warnings.push(`${file.name}: Skipped (not a JSON file)`);
            continue;
          }

          try {
            updateProgress({
              stage: 'reading',
              current: i,
              total: files.length,
              fileName: file.name,
              message: `Reading ${file.name}...`,
            });

            // Read file content using FileReader
            const content = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(reader.error);
              reader.readAsText(file);
            });

            updateProgress({
              stage: 'parsing',
              current: i,
              message: `Parsing ${file.name}...`,
            });

            // Detect and parse
            const detection = detectFileFormat(content, file.name);

            if (detection.format === 'unknown' || !detection.json) {
              throw new Error('Unknown file format');
            }

            const parseResult = parseConversations(detection.json);

            const importedConversations: ImportedConversation[] = parseResult.conversations.map(
              (conv) => ({
                ...conv,
                sourceFile: file.name,
                importedAt: new Date(),
              })
            );

            result.conversations.push(...importedConversations);
            result.warnings.push(...parseResult.warnings);
            result.stats.filesProcessed++;
            result.stats.conversationsImported += importedConversations.length;
            result.stats.messagesTotal += importedConversations.reduce(
              (sum, conv) => sum + conv.messages.length,
              0
            );

            // Add to store
            // Map format to store format type
            const storeFormat: 'chatgpt' | 'claude' | 'unknown' =
              detection.format === 'chatgpt'
                ? 'chatgpt'
                : detection.format === 'claude'
                  ? 'claude'
                  : 'unknown';

            addFileToProject({
              name: file.name,
              path: file.name, // No real path in browser
              size: file.size,
              format: storeFormat,
              status: 'completed',
            });
          } catch (fileError) {
            const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
            result.errors.push(`${file.name}: ${errorMessage}`);
          }
        }

        // Save parsed conversations to data folder
        logger.info('═══════════════════════════════════════════════════════════', {
          stage: 'IMPORT',
        });
        logger.info('   FILE IMPORT PROTOCOL INITIATED', { stage: 'IMPORT' });
        logger.info('═══════════════════════════════════════════════════════════', {
          stage: 'IMPORT',
        });
        logger.info(
          `Parsed ${result.conversations.length} conversations, ${result.stats.messagesTotal} messages`,
          { stage: 'IMPORT' }
        );

        if (result.conversations.length > 0) {
          // Get project data path
          const projectName = currentProject?.name || 'Imported Conversations';
          logger.info(`Project name: "${projectName}"`, { stage: 'IMPORT' });

          const dataPath = await api.getDataPath(projectName);
          logger.info(`Data path resolved: ${dataPath}`, { stage: 'IMPORT' });

          // Ensure data directory exists
          logger.info(`Creating data directory...`, { stage: 'IMPORT' });
          const dirResult = await api.ensureDir(dataPath);
          if (!dirResult.success) {
            logger.error(`Failed to create directory: ${dirResult.error.message}`, {
              stage: 'IMPORT',
            });
            throw new Error(`Failed to create data directory: ${dirResult.error.message}`);
          }
          logger.success(`Data directory ready: ${dirResult.data}`, { stage: 'IMPORT' });

          // Extract all messages from conversations for analysis
          const allMessages = result.conversations.flatMap((conv) =>
            conv.messages.map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
              conversationId: conv.id,
              conversationTitle: conv.title,
            }))
          );

          // Save to project data folder
          const conversationsPath = `${dataPath}/parsed-conversations.json`;
          logger.info(`Saving parsed data to: ${conversationsPath}`, { stage: 'IMPORT' });

          const saveResult = await api.saveFile({
            filePath: conversationsPath,
            content: JSON.stringify(
              {
                conversations: result.conversations,
                messages: allMessages,
                stats: result.stats,
                exportedAt: new Date().toISOString(),
              },
              null,
              2
            ),
          });

          if (!saveResult.success) {
            logger.error(`Failed to save: ${saveResult.error.message}`, { stage: 'IMPORT' });
            result.warnings.push(`Failed to save parsed data: ${saveResult.error.message}`);
          } else {
            logger.success(`Parsed conversations saved successfully!`, { stage: 'IMPORT' });
            logger.info(`  - ${result.conversations.length} conversations`, { stage: 'IMPORT' });
            logger.info(`  - ${allMessages.length} messages`, { stage: 'IMPORT' });
          }
        } else {
          logger.warning(`No conversations parsed - skipping save`, { stage: 'IMPORT' });
        }

        updateProgress({
          stage: 'complete',
          current: files.length,
          total: files.length,
          message: `Imported ${result.stats.conversationsImported} conversation(s)`,
        });

        result.success = result.errors.length === 0;
        setLastResult(result);
        onComplete?.(result);

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        logger.error(`Import failed: ${error.message}`, { stage: 'IMPORT' });
        onError?.(error);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [
      currentProject,
      createProject,
      addFileToProject,
      updateProgress,
      detectFileFormat,
      onComplete,
      onError,
    ]
  );

  /**
   * Cancels the current import operation
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  /**
   * Resets the hook state
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setProgress(initialProgress);
    setLastResult(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    progress,
    lastResult,

    // Actions
    importFile,
    importFromFiles,
    cancel,
    reset,
  };
}

export default useFileImport;
