/**
 * Main Layout Component — Neo-Noir Glass Monitor
 *
 * Root layout: TitleBar → [Sidebar | Content → StatusBar]
 * Floating glass panel with layered shadows + teal border glow.
 */

import React from 'react';
import { Sidebar } from './Sidebar';
import { TitleBar } from './TitleBar';
import { StatusBar } from './StatusBar';
import { useAppStore } from '../../stores/app-store';
import { Loader2 } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isLoading, loadingMessage } = useAppStore();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '20px',
        background: 'linear-gradient(160deg, #0a0b0e, #0f1012)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'relative',
      }}
    >
      {/* Ambient teal glow — top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '50%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0, 210, 190, 0.6), transparent)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Title Bar */}
      <TitleBar />

      {/* Body Row: Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Content Area */}
          <main
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '1.5rem',
              background: 'transparent',
              position: 'relative',
            }}
          >
            {children}
          </main>

          {/* Status Bar */}
          <StatusBar />
        </div>
      </div>

      {/* Global Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(8, 11, 15, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '20px',
            animation: 'fadeIn 200ms ease-out',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              background:
                'linear-gradient(135deg, rgba(22, 27, 34, 0.95) 0%, rgba(13, 17, 23, 0.9) 100%)',
              border: '1px solid rgba(0, 210, 190, 0.3)',
              borderRadius: '16px',
              padding: '32px 40px',
              boxShadow:
                '0 24px 64px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 210, 190, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            }}
          >
            <Loader2
              style={{
                width: '40px',
                height: '40px',
                color: '#00d2be',
                animation: 'spin 1s linear infinite',
                filter: 'drop-shadow(0 0 8px rgba(0, 210, 190, 0.5))',
              }}
            />
            {loadingMessage && (
              <p
                style={{
                  fontSize: '13px',
                  color: '#8b949e',
                  margin: 0,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.03em',
                }}
              >
                {loadingMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
