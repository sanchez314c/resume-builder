/**
 * Log Store
 * Resume Builder - CashCommand Style
 *
 * Global store for terminal log entries.
 * Captures NLP operations, system events, and debug information.
 */

import { create } from 'zustand';
import type { LogEntry, LogLevel } from '../components/ui/terminal-log';

// =============================================================================
// Types
// =============================================================================

export interface LogState {
  logs: LogEntry[];
  maxLogs: number;
}

export interface LogActions {
  addLog: (
    level: LogLevel,
    message: string,
    options?: { stage?: string; details?: string }
  ) => void;
  info: (message: string, options?: { stage?: string; details?: string }) => void;
  success: (message: string, options?: { stage?: string; details?: string }) => void;
  warning: (message: string, options?: { stage?: string; details?: string }) => void;
  error: (message: string, options?: { stage?: string; details?: string }) => void;
  debug: (message: string, options?: { stage?: string; details?: string }) => void;
  system: (message: string, options?: { stage?: string; details?: string }) => void;
  clearLogs: () => void;
  setMaxLogs: (max: number) => void;
}

export type LogStore = LogState & LogActions;

// =============================================================================
// Helper
// =============================================================================

let logIdCounter = 0;

function generateLogId(): string {
  logIdCounter += 1;
  return `log-${Date.now()}-${logIdCounter}`;
}

// =============================================================================
// Store
// =============================================================================

export const useLogStore = create<LogStore>((set, get) => ({
  // State
  logs: [],
  maxLogs: 500,

  // Actions
  addLog: (level, message, options = {}) => {
    const newLog: LogEntry = {
      id: generateLogId(),
      timestamp: new Date(),
      level,
      message,
      stage: options.stage,
      details: options.details,
    };

    set((state) => {
      const newLogs = [...state.logs, newLog];
      // Trim if exceeds max
      if (newLogs.length > state.maxLogs) {
        return { logs: newLogs.slice(-state.maxLogs) };
      }
      return { logs: newLogs };
    });
  },

  info: (message, options) => get().addLog('info', message, options),
  success: (message, options) => get().addLog('success', message, options),
  warning: (message, options) => get().addLog('warning', message, options),
  error: (message, options) => get().addLog('error', message, options),
  debug: (message, options) => get().addLog('debug', message, options),
  system: (message, options) => get().addLog('system', message, options),

  clearLogs: () => set({ logs: [] }),

  setMaxLogs: (max) => set({ maxLogs: max }),
}));

// =============================================================================
// Global Logger Helper (for use outside React components)
// =============================================================================

export const logger = {
  info: (message: string, options?: { stage?: string; details?: string }) => {
    useLogStore.getState().info(message, options);
  },
  success: (message: string, options?: { stage?: string; details?: string }) => {
    useLogStore.getState().success(message, options);
  },
  warning: (message: string, options?: { stage?: string; details?: string }) => {
    useLogStore.getState().warning(message, options);
  },
  error: (message: string, options?: { stage?: string; details?: string }) => {
    useLogStore.getState().error(message, options);
  },
  debug: (message: string, options?: { stage?: string; details?: string }) => {
    useLogStore.getState().debug(message, options);
  },
  system: (message: string, options?: { stage?: string; details?: string }) => {
    useLogStore.getState().system(message, options);
  },
  clear: () => {
    useLogStore.getState().clearLogs();
  },
};

export default useLogStore;
