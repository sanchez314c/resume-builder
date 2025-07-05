/**
 * StatusBar Component — Neo-Noir Glass Monitor
 *
 * Bottom status bar:
 * - Left: NLP status dot + text + file count + current project
 * - Center: current page indicator
 * - Right: version in teal
 */

import React from 'react';
import { useAppStore } from '../../stores/app-store';

const pageLabels: Record<string, string> = {
  projects: 'PROJECTS',
  import: 'IMPORT',
  analysis: 'ANALYSIS',
  jobs: 'JOBS',
  resume: 'RESUME',
  export: 'EXPORT',
};

export const StatusBar: React.FC = () => {
  const { isNlpConnected, projects, currentProject, currentPage } = useAppStore();

  // File count from current project, fallback to total across all projects
  const fileCount = currentProject
    ? currentProject.files.length
    : projects.reduce((acc, p) => acc + p.files.length, 0);

  const pageLabel = pageLabels[currentPage] ?? currentPage.toUpperCase();

  return (
    <footer
      style={{
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: 'linear-gradient(180deg, rgba(8, 11, 15, 0.92) 0%, rgba(8, 11, 15, 0.96) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(0, 210, 190, 0.12)',
        flexShrink: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* LEFT: NLP status + file count + project */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Status dot */}
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: isNlpConnected ? '#3fb950' : '#f85149',
            boxShadow: isNlpConnected
              ? '0 0 6px rgba(63, 185, 80, 0.8), 0 0 12px rgba(63, 185, 80, 0.3)'
              : '0 0 6px rgba(248, 81, 73, 0.8), 0 0 12px rgba(248, 81, 73, 0.3)',
            flexShrink: 0,
            display: 'inline-block',
            animation: isNlpConnected ? 'none' : 'pulse 2s ease-in-out infinite',
          }}
        />
        <span
          style={{
            color: isNlpConnected ? '#3fb950' : '#f85149',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {isNlpConnected ? 'NLP Online' : 'NLP Offline'}
        </span>

        <span style={{ color: '#2a2f37', userSelect: 'none' }}>│</span>

        <span style={{ color: '#8b949e', letterSpacing: '0.02em' }}>
          <span style={{ color: '#00d2be', fontWeight: 600 }}>{fileCount}</span> file
          {fileCount === 1 ? '' : 's'}
        </span>

        {currentProject && (
          <>
            <span style={{ color: '#2a2f37', userSelect: 'none' }}>│</span>
            <span
              style={{
                color: '#8b949e',
                letterSpacing: '0.02em',
                maxWidth: '220px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={currentProject.name}
            >
              <span style={{ color: '#484f58' }}>project:</span>{' '}
              <span style={{ color: '#00d2be' }}>{currentProject.name}</span>
            </span>
          </>
        )}
      </div>

      {/* CENTER: current page */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#00d2be',
          fontWeight: 600,
          letterSpacing: '0.08em',
        }}
      >
        <span style={{ color: '#484f58' }}>▸</span>
        <span>{pageLabel}</span>
      </div>

      {/* RIGHT: version */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#484f58', letterSpacing: '0.04em' }}>READY</span>
        <span style={{ color: '#2a2f37', userSelect: 'none' }}>│</span>
        <span
          style={{
            color: '#00d2be',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          v1.0.0
        </span>
      </div>
    </footer>
  );
};

export default StatusBar;
