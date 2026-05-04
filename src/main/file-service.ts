/**
 * File Service
 *
 * Handles all file system operations with proper error handling
 * and type safety. Used by IPC handlers for file dialogs and I/O.
 */

import { dialog, BrowserWindow, OpenDialogOptions, SaveDialogOptions } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Result, FileSelection } from '../common/types';

// =============================================================================
// Security: blocked system path prefixes
// =============================================================================

const BLOCKED_PATH_PREFIXES = [
  '/etc/',
  '/proc/',
  '/sys/',
  '/dev/',
  '/run/',
  '/boot/',
  '/root/',
  '/var/',
  '/usr/',
  '/bin/',
  '/sbin/',
  '/lib/',
  '/lib64/',
  '/snap/',
] as const;

/**
 * Returns an error string if the resolved path is inside a blocked system directory,
 * or null if the path is acceptable.
 */
function checkBlockedPath(resolvedPath: string): string | null {
  for (const prefix of BLOCKED_PATH_PREFIXES) {
    if (resolvedPath.startsWith(prefix)) {
      return 'Access denied: restricted system path';
    }
  }
  return null;
}

// =============================================================================
// Types
// =============================================================================

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface SaveFileOptions {
  defaultPath?: string;
  filters?: FileFilter[];
  title?: string;
}

// =============================================================================
// File Dialog Operations
// =============================================================================

/**
 * Opens a native file selection dialog
 * @param options Dialog configuration
 * @returns Selected file paths or canceled status
 */
export async function selectFiles(
  options: {
    filters?: FileFilter[];
    multiSelect?: boolean;
    title?: string;
  } = {}
): Promise<FileSelection> {
  const window = BrowserWindow.getFocusedWindow();

  const dialogOptions: OpenDialogOptions = {
    title: options.title || 'Select File',
    properties: options.multiSelect ? ['openFile', 'multiSelections'] : ['openFile'],
    filters: options.filters || [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  };

  const result = window
    ? await dialog.showOpenDialog(window, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  return {
    canceled: result.canceled,
    filePaths: result.filePaths,
  };
}

/**
 * Opens a native save file dialog
 * @param options Dialog configuration
 * @returns Selected save path or null if canceled
 */
export async function selectSaveLocation(options: SaveFileOptions = {}): Promise<string | null> {
  const window = BrowserWindow.getFocusedWindow();

  const dialogOptions: SaveDialogOptions = {
    title: options.title || 'Save File',
    defaultPath: options.defaultPath,
    filters: options.filters || [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  };

  const result = window
    ? await dialog.showSaveDialog(window, dialogOptions)
    : await dialog.showSaveDialog(dialogOptions);

  return result.canceled ? null : result.filePath || null;
}

// =============================================================================
// File I/O Operations
// =============================================================================

/**
 * Reads a file with automatic encoding detection
 * @param filePath Absolute path to file
 * @returns File contents as string
 */
export async function readFile(filePath: string): Promise<Result<string>> {
  try {
    // Validate path is absolute
    if (!path.isAbsolute(filePath)) {
      return {
        success: false,
        error: new Error(`Path must be absolute: ${filePath}`),
      };
    }

    // Block reads from sensitive system directories
    const resolvedRead = path.resolve(filePath);
    const blockedReadErr = checkBlockedPath(resolvedRead);
    if (blockedReadErr) {
      return { success: false, error: new Error(blockedReadErr) };
    }

    // Check if file exists
    try {
      await fs.access(filePath, fs.constants.R_OK);
    } catch {
      return {
        success: false,
        error: new Error(`File not found or not readable: ${filePath}`),
      };
    }

    // Read file with UTF-8 encoding (most common for JSON/text)
    const content = await fs.readFile(filePath, 'utf-8');

    return { success: true, data: content };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Reads and parses a JSON file with type safety
 * @param filePath Absolute path to JSON file
 * @returns Parsed JSON data
 */
export async function readJsonFile<T>(filePath: string): Promise<Result<T>> {
  const readResult = await readFile(filePath);

  if (!readResult.success) {
    return readResult;
  }

  try {
    const data = JSON.parse(readResult.data) as T;
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: new Error(`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`),
    };
  }
}

/**
 * Writes content to a file atomically
 * Writes to a temp file first, then renames for crash safety
 * @param filePath Absolute path for output file
 * @param content Content to write
 */
export async function saveFile(filePath: string, content: string): Promise<Result<void>> {
  try {
    // Validate path is absolute
    if (!path.isAbsolute(filePath)) {
      return {
        success: false,
        error: new Error(`Path must be absolute: ${filePath}`),
      };
    }

    // Block writes to system directories
    const blockedWriteErr = checkBlockedPath(path.resolve(filePath));
    if (blockedWriteErr) return { success: false, error: new Error(blockedWriteErr) };

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Write to temp file first for atomicity
    const tempPath = `${filePath}.tmp.${Date.now()}`;

    try {
      await fs.writeFile(tempPath, content, 'utf-8');
      await fs.rename(tempPath, filePath);
    } catch (writeErr) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw writeErr;
    }

    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Saves JSON data to a file with pretty formatting
 * @param filePath Absolute path for output file
 * @param data Data to serialize and save
 */
export async function saveJsonFile<T>(filePath: string, data: T): Promise<Result<void>> {
  try {
    const content = JSON.stringify(data, null, 2);
    return await saveFile(filePath, content);
  } catch (err) {
    return {
      success: false,
      error: new Error(
        `Failed to serialize JSON: ${err instanceof Error ? err.message : String(err)}`
      ),
    };
  }
}

/**
 * Deletes a file
 * @param filePath Absolute path to file
 */
export async function deleteFile(filePath: string): Promise<Result<void>> {
  try {
    if (!path.isAbsolute(filePath)) {
      return {
        success: false,
        error: new Error(`Path must be absolute: ${filePath}`),
      };
    }

    await fs.unlink(filePath);
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Copies a file to a destination
 * @param sourcePath Source file path
 * @param destPath Destination file path
 * @returns Destination path on success
 */
export async function copyFile(sourcePath: string, destPath: string): Promise<Result<string>> {
  try {
    if (!path.isAbsolute(sourcePath)) {
      return {
        success: false,
        error: new Error(`Source path must be absolute: ${sourcePath}`),
      };
    }

    if (!path.isAbsolute(destPath)) {
      return {
        success: false,
        error: new Error(`Destination path must be absolute: ${destPath}`),
      };
    }

    // Block copies involving system directories
    const srcBlocked = checkBlockedPath(path.resolve(sourcePath));
    if (srcBlocked) return { success: false, error: new Error(srcBlocked) };
    const dstBlocked = checkBlockedPath(path.resolve(destPath));
    if (dstBlocked) return { success: false, error: new Error(dstBlocked) };

    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    await fs.mkdir(destDir, { recursive: true });

    // Copy file
    await fs.copyFile(sourcePath, destPath);

    return { success: true, data: destPath };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath Directory path to ensure
 * @returns The directory path on success
 */
export async function ensureDir(dirPath: string): Promise<Result<string>> {
  try {
    if (!path.isAbsolute(dirPath)) {
      return {
        success: false,
        error: new Error(`Path must be absolute: ${dirPath}`),
      };
    }

    const blockedDirErr = checkBlockedPath(path.resolve(dirPath));
    if (blockedDirErr) return { success: false, error: new Error(blockedDirErr) };

    await fs.mkdir(dirPath, { recursive: true });

    return { success: true, data: dirPath };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Gets the application data directory path for projects
 * @param appPath Application root path
 * @param projectName Project name (sanitized for filesystem)
 * @returns Absolute path to project data directory
 */
export function getProjectDataPath(appPath: string, projectName: string): string {
  // Sanitize project name for filesystem
  const sanitized = projectName
    .replace(/[^a-zA-Z0-9-_\s]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 50);

  return path.join(appPath, 'data', sanitized);
}
