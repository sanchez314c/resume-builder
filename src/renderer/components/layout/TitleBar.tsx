/**
 * TitleBar Component — Neo-Noir Glass Monitor
 *
 * Frameless window title bar with:
 * - App name + tagline (left)
 * - Flat action icons: About (i) + Settings (gear) (right, gap 2px, margin-right 10px)
 * - Circular window controls: minimize, maximize, close (right)
 * - Full drag region, controls are no-drag
 */

import React from 'react';
import iconUrl from '../../assets/icon.png';

// ============================================================
// TitleBar
// ============================================================

interface TitleBarProps {
  onAboutClick?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onAboutClick }) => {

  const handleMinimize = () => window.api?.window?.minimize?.();
  const handleMaximize = () => window.api?.window?.maximize?.();
  const handleClose = () => window.api?.window?.close?.();
  const handleAbout = () => onAboutClick?.();

  return (
    <>
      <div
        className="drag-region no-select"
        style={{
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px 0 16px',
          background:
            'linear-gradient(180deg, rgba(8, 11, 15, 0.98) 0%, rgba(13, 17, 23, 0.95) 100%)',
          borderBottom: '1px solid rgba(0, 210, 190, 0.12)',
          flexShrink: 0,
          zIndex: 50,
          position: 'relative',
        }}
      >
        {/* === LEFT: App identity === */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={iconUrl}
            alt="Resume Builder"
            width={18}
            height={18}
            style={{ display: 'block', flexShrink: 0 }}
          />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#e6edf3',
                letterSpacing: '-0.01em',
              }}
            >
              Resume <span style={{ color: '#00d2be' }}>Builder</span>
            </span>
            <span
              style={{
                fontSize: '11px',
                color: '#484f58',
                fontWeight: 400,
              }}
            >
              AI-Powered Resume Generation
            </span>
          </div>
        </div>

        {/* === RIGHT: Action icons + window controls === */}
        <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          {/* Flat action icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginRight: '10px' }}>
            {/* About */}
            <button
              onClick={handleAbout}
              title="About"
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#484f58',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'color 150ms ease, background 150ms ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = '#00d2be';
                el.style.background = 'rgba(0, 210, 190, 0.08)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = '#484f58';
                el.style.background = 'transparent';
              }}
            >
              ⓘ
            </button>

            {/* Settings — not yet implemented */}
            <button
              title="Settings (coming soon)"
              disabled
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#484f58',
                cursor: 'not-allowed',
                fontSize: '14px',
                opacity: 0.4,
              }}
            >
              ⚙
            </button>
          </div>

          {/* Circular window controls — macOS traffic lights: close=red, minimize=yellow, maximize=green */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Minimize (yellow) */}
            <button
              onClick={handleMinimize}
              title="Minimize"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(210, 153, 34, 0.15)',
                color: 'rgba(210, 153, 34, 0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                lineHeight: 1,
                transition: 'all 150ms ease',
                fontWeight: 300,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(210, 153, 34, 0.85)';
                el.style.color = '#ffffff';
                el.style.boxShadow = '0 0 12px rgba(210, 153, 34, 0.5)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(210, 153, 34, 0.15)';
                el.style.color = 'rgba(210, 153, 34, 0.7)';
                el.style.boxShadow = 'none';
              }}
            >
              −
            </button>

            {/* Maximize (green) */}
            <button
              onClick={handleMaximize}
              title="Maximize"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(63, 185, 80, 0.15)',
                color: 'rgba(63, 185, 80, 0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                lineHeight: 1,
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(63, 185, 80, 0.85)';
                el.style.color = '#ffffff';
                el.style.boxShadow = '0 0 12px rgba(63, 185, 80, 0.5)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(63, 185, 80, 0.15)';
                el.style.color = 'rgba(63, 185, 80, 0.7)';
                el.style.boxShadow = 'none';
              }}
            >
              □
            </button>

            {/* Close (red) */}
            <button
              onClick={handleClose}
              title="Close"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(248, 81, 73, 0.15)',
                color: 'rgba(248, 81, 73, 0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                lineHeight: 1,
                transition: 'all 150ms ease',
                fontWeight: 300,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(248, 81, 73, 0.85)';
                el.style.color = '#ffffff';
                el.style.boxShadow = '0 0 12px rgba(248, 81, 73, 0.5)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(248, 81, 73, 0.15)';
                el.style.color = 'rgba(248, 81, 73, 0.7)';
                el.style.boxShadow = 'none';
              }}
            >
              ×
            </button>
          </div>
        </div>
      </div>

    </>
  );
};

export default TitleBar;
