/**
 * Terminal Log Component
 * Resume Builder - CashCommand Style
 *
 * Real-time terminal-style log output showing NLP operations.
 */

import React, { useEffect, useRef } from 'react';
import { Terminal, ChevronDown, X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// =============================================================================
// Types
// =============================================================================

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug' | 'system';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: string;
  stage?: string;
}

export interface TerminalLogProps {
  logs: LogEntry[];
  title?: string;
  maxHeight?: string;
  /** Fill available vertical space (uses flex-1) */
  fillHeight?: boolean;
  autoScroll?: boolean;
  showTimestamp?: boolean;
  showLevel?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onClear?: () => void;
  className?: string;
}

// =============================================================================
// Level Styling
// =============================================================================

const levelStyles: Record<LogLevel, { color: string; prefix: string; icon?: string }> = {
  info: { color: 'text-[#94a3b8]', prefix: 'INFO', icon: '○' },
  success: { color: 'text-[#00d2be]', prefix: 'DONE', icon: '✓' },
  warning: { color: 'text-[#f59e0b]', prefix: 'WARN', icon: '⚠' },
  error: { color: 'text-[#ef4444]', prefix: 'FAIL', icon: '✗' },
  debug: { color: 'text-[#8b5cf6]', prefix: 'DBUG', icon: '◆' },
  system: { color: 'text-[#22d3ee]', prefix: 'SYS', icon: '►' },
};

// =============================================================================
// Component
// =============================================================================

export const TerminalLog: React.FC<TerminalLogProps> = ({
  logs,
  title = 'System Log',
  maxHeight = '300px',
  fillHeight = false,
  autoScroll = true,
  showTimestamp = true,
  showLevel = true,
  collapsible = true,
  defaultCollapsed = false,
  onClear,
  className,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [isMinimized, setIsMinimized] = React.useState(false);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current && !isCollapsed && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll, isCollapsed, isMinimized]);

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (isMinimized) {
    return (
      <div
        className={cn(
          'flex items-center justify-between rounded-xl border border-[rgba(0,210,190,0.15)] bg-[rgba(10,10,15,0.9)] px-4 py-2 backdrop-blur-xl',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[#00d2be]" />
          <span className="font-mono text-sm text-[#00d2be]">{title}</span>
          <span className="rounded bg-[rgba(0,210,190,0.15)] px-2 py-0.5 font-mono text-xs text-[#00d2be]">
            {logs.length} entries
          </span>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="rounded p-1 text-[#94a3b8] transition-colors hover:bg-white/5 hover:text-white"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-[rgba(0,210,190,0.15)] bg-[rgba(10,10,15,0.9)] backdrop-blur-xl',
        fillHeight && 'flex flex-1 flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(0,210,190,0.15)] bg-[rgba(26,29,36,0.5)] px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[#00d2be]" />
          <span className="font-mono text-sm font-semibold text-[#00d2be]">{title}</span>
          {logs.length > 0 && (
            <span className="rounded bg-[rgba(0,210,190,0.15)] px-2 py-0.5 font-mono text-xs text-[#00d2be]">
              {logs.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onClear && logs.length > 0 && (
            <button
              onClick={onClear}
              className="rounded p-1 text-[#94a3b8] transition-colors hover:bg-white/5 hover:text-white"
              title="Clear log"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsMinimized(true)}
            className="rounded p-1 text-[#94a3b8] transition-colors hover:bg-white/5 hover:text-white"
            title="Minimize"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="rounded p-1 text-[#94a3b8] transition-colors hover:bg-white/5 hover:text-white"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', isCollapsed && '-rotate-90')}
              />
            </button>
          )}
        </div>
      </div>

      {/* Log Content */}
      {!isCollapsed && (
        <div
          ref={scrollRef}
          className={cn('scrollbar-thin overflow-y-auto font-mono text-sm', fillHeight && 'flex-1')}
          style={fillHeight ? undefined : { maxHeight }}
        >
          {logs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-[#64748b]">
              <span>Waiting for activity...</span>
            </div>
          ) : (
            <div className="p-2">
              {logs.map((log) => {
                const style = levelStyles[log.level];
                return (
                  <div
                    key={log.id}
                    className="group flex items-start gap-2 rounded px-2 py-1 transition-colors hover:bg-white/5"
                  >
                    {/* Timestamp */}
                    {showTimestamp && (
                      <span className="flex-shrink-0 text-[#64748b]">
                        [{formatTime(log.timestamp)}]
                      </span>
                    )}

                    {/* Level Badge */}
                    {showLevel && (
                      <span className={cn('flex-shrink-0 font-bold', style.color)}>
                        {style.icon} {style.prefix}
                      </span>
                    )}

                    {/* Stage (if present) */}
                    {log.stage && (
                      <span className="flex-shrink-0 rounded bg-[rgba(0,210,190,0.1)] px-1.5 py-0.5 text-xs text-[#00d2be]">
                        {log.stage}
                      </span>
                    )}

                    {/* Message */}
                    <span className="flex-1 text-[#f1f5f9]">{log.message}</span>

                    {/* Details (expandable on hover) */}
                    {log.details && (
                      <span className="hidden text-[#64748b] group-hover:inline">
                        {log.details}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer Status Bar */}
      {!isCollapsed && logs.length > 0 && (
        <div className="flex items-center justify-between border-t border-[rgba(0,210,190,0.1)] bg-[rgba(26,29,36,0.3)] px-4 py-1.5">
          <div className="flex items-center gap-4 text-xs text-[#64748b]">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00d2be]" />
              Live
            </span>
            <span>{logs.filter((l) => l.level === 'error').length} errors</span>
            <span>{logs.filter((l) => l.level === 'warning').length} warnings</span>
          </div>
          <span className="text-xs text-[#64748b]">
            Last: {formatTime(logs[logs.length - 1].timestamp)}
          </span>
        </div>
      )}
    </div>
  );
};

export default TerminalLog;
