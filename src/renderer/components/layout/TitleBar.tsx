/**
 * TitleBar Component — Neo-Noir Glass Monitor
 *
 * Frameless window title bar with:
 * - App name + tagline (left)
 * - Flat action icons: About (i) + Settings (gear) (right, gap 2px, margin-right 10px)
 * - Circular window controls: minimize, maximize, close (right)
 * - Full drag region, controls are no-drag
 */

import React, { useState } from 'react';

// ============================================================
// About Modal
// ============================================================

interface AboutModalProps {
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  const handleLinkClick = (url: string) => {
    window.api?.window?.openExternal?.(url) ?? window.api?.app?.openExternal?.(url);
  };

  const techStack = [
    'Electron',
    'React 18',
    'TypeScript',
    'Tailwind CSS',
    'Zustand',
    'Vite',
    'Python NLP',
    'pdf-lib',
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(8, 11, 15, 0.88)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 200ms ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          background:
            'linear-gradient(135deg, rgba(22, 27, 34, 0.95) 0%, rgba(13, 17, 23, 0.92) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 210, 190, 0.25)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '460px',
          width: '90%',
          boxShadow:
            '0 24px 64px rgba(0, 0, 0, 0.85), 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 60px rgba(0, 210, 190, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          animation: 'scaleIn 250ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top highlight */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0, 210, 190, 0.5), transparent)',
            borderRadius: '16px 16px 0 0',
          }}
        />

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {/* Logo badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              marginBottom: '14px',
              borderRadius: '14px',
              background:
                'linear-gradient(135deg, rgba(0, 210, 190, 0.2) 0%, rgba(0, 210, 190, 0.08) 100%)',
              border: '1px solid rgba(0, 210, 190, 0.35)',
              boxShadow: '0 0 24px rgba(0, 210, 190, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <span
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#00d2be',
                letterSpacing: '-0.05em',
              }}
            >
              RB
            </span>
          </div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#e6edf3',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Resume<span style={{ color: '#00d2be' }}>Builder</span>
          </h2>
          <p
            style={{
              color: '#00d2be',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              margin: '0 0 8px 0',
              letterSpacing: '0.05em',
            }}
          >
            v1.0.0
          </p>
          <p
            style={{
              color: '#8b949e',
              fontSize: '13px',
              margin: 0,
              lineHeight: 1.5,
              maxWidth: '360px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            AI-powered desktop application that transforms personal data from AI conversations into
            professional resumes and career analytics.
          </p>
        </div>

        {/* Tech Stack */}
        <div
          style={{
            borderTop: '1px solid rgba(0, 210, 190, 0.15)',
            paddingTop: '18px',
            marginBottom: '18px',
          }}
        >
          <p
            style={{
              color: '#484f58',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '10px',
              marginTop: 0,
            }}
          >
            Tech Stack
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {techStack.map((tech) => (
              <span
                key={tech}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                  color: '#00d2be',
                  background: 'rgba(0, 210, 190, 0.08)',
                  border: '1px solid rgba(0, 210, 190, 0.2)',
                  borderRadius: '9999px',
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Author + Links */}
        <div
          style={{
            borderTop: '1px solid rgba(0, 210, 190, 0.15)',
            paddingTop: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#484f58',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span>MIT License</span>
            <span>Jason Paul Michaels</span>
          </div>
          <button
            onClick={() => handleLinkClick('https://github.com/sanchez314c/resume-builder')}
            style={{
              background: 'none',
              border: 'none',
              color: '#00d2be',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            github.com/sanchez314c/resume-builder
          </button>
          <button
            onClick={() => handleLinkClick('mailto:software@jasonpaulmichaels.co')}
            style={{
              background: 'none',
              border: 'none',
              color: '#8b949e',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            software@jasonpaulmichaels.co
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '24px',
            width: '100%',
            padding: '10px',
            background:
              'linear-gradient(135deg, rgba(0, 210, 190, 0.15) 0%, rgba(0, 210, 190, 0.08) 100%)',
            border: '1px solid rgba(0, 210, 190, 0.3)',
            borderRadius: '8px',
            color: '#00d2be',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background =
              'linear-gradient(135deg, rgba(0, 210, 190, 0.25) 0%, rgba(0, 210, 190, 0.15) 100%)';
            el.style.boxShadow = '0 0 20px rgba(0, 210, 190, 0.25)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background =
              'linear-gradient(135deg, rgba(0, 210, 190, 0.15) 0%, rgba(0, 210, 190, 0.08) 100%)';
            el.style.boxShadow = 'none';
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// ============================================================
// TitleBar
// ============================================================

export const TitleBar: React.FC = () => {
  const [showAbout, setShowAbout] = useState(false);

  const handleMinimize = () => window.api?.window?.minimize?.();
  const handleMaximize = () => window.api?.window?.maximize?.();
  const handleClose = () => window.api?.window?.close?.();

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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#e6edf3',
              letterSpacing: '-0.01em',
            }}
          >
            Resume<span style={{ color: '#00d2be' }}>Builder</span>
          </span>
          <span
            style={{
              fontSize: '11px',
              color: '#484f58',
              fontWeight: 400,
            }}
          >
            AI-powered resume generation
          </span>
        </div>

        {/* === RIGHT: Action icons + window controls === */}
        <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          {/* Flat action icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginRight: '10px' }}>
            {/* About */}
            <button
              onClick={() => setShowAbout(true)}
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

            {/* Settings */}
            <button
              title="Settings"
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
                el.style.color = '#8b949e';
                el.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = '#484f58';
                el.style.background = 'transparent';
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

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );
};

export default TitleBar;
