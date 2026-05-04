import React from 'react';
import { FileText, X, Github, Mail } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APP_VERSION = 'v1.0.0';

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const openExternal = (url: string) => {
    window.api?.window?.openExternal?.(url) ?? window.api?.app?.openExternal?.(url);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.6)',
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
            '0 24px 64px rgba(0,0,0,0.85), 0 8px 24px rgba(0,0,0,0.6), 0 0 60px rgba(0,210,190,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
          animation: 'scaleIn 250ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top highlight line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0,210,190,0.5), transparent)',
            borderRadius: '16px 16px 0 0',
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          title="Close"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: '#484f58',
            cursor: 'pointer',
            transition: 'color 150ms ease, background 150ms ease, border-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = '#e6edf3';
            el.style.background = 'rgba(255,255,255,0.08)';
            el.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = '#484f58';
            el.style.background = 'transparent';
            el.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {/* App icon */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              marginBottom: '14px',
              borderRadius: '16px',
              background:
                'linear-gradient(135deg, rgba(0,210,190,0.2) 0%, rgba(0,210,190,0.08) 100%)',
              border: '1px solid rgba(0,210,190,0.35)',
              boxShadow:
                '0 0 24px rgba(0,210,190,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <FileText size={28} color="#00d2be" strokeWidth={1.5} />
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
            Resume <span style={{ color: '#00d2be' }}>Builder</span>
          </h2>

          <p
            style={{
              color: '#00d2be',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              margin: '0 0 10px 0',
              letterSpacing: '0.05em',
            }}
          >
            {APP_VERSION}
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
            AI-powered desktop application for generating professional resumes
          </p>
        </div>

        {/* Tech stack */}
        <div
          style={{
            borderTop: '1px solid rgba(0,210,190,0.15)',
            paddingTop: '18px',
            paddingBottom: '4px',
            marginBottom: '14px',
          }}
        >
          <p
            style={{
              color: '#484f58',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
              margin: '0 0 10px 0',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Tech Stack
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
            {[
              'Electron',
              'React 18',
              'TypeScript',
              'Tailwind CSS',
              'Zustand',
              'Vite',
              'Python',
              'FastAPI',
              'spaCy',
              'pdf-lib',
            ].map((tech) => (
              <span
                key={tech}
                style={{
                  padding: '3px 9px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                  color: '#8b949e',
                  background: 'rgba(139,148,158,0.06)',
                  border: '1px solid rgba(139,148,158,0.15)',
                  borderRadius: '4px',
                  letterSpacing: '0.02em',
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Footer: license + links */}
        <div
          style={{
            borderTop: '1px solid rgba(0,210,190,0.15)',
            paddingTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <p
            style={{
              color: '#484f58',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
              margin: 0,
              letterSpacing: '0.04em',
            }}
          >
            MIT License | J. Michaels
          </p>

          {/* Pill badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* GitHub pill */}
            <button
              onClick={() => openExternal('https://github.com/sanchez314c/resume-builder')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
                color: '#00d2be',
                background: 'rgba(0,210,190,0.08)',
                border: '1px solid rgba(0,210,190,0.25)',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(0,210,190,0.16)';
                el.style.borderColor = 'rgba(0,210,190,0.45)';
                el.style.boxShadow = '0 0 12px rgba(0,210,190,0.2)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(0,210,190,0.08)';
                el.style.borderColor = 'rgba(0,210,190,0.25)';
                el.style.boxShadow = 'none';
              }}
            >
              <Github size={12} />
              sanchez314c/resume-builder
            </button>

            {/* Email pill */}
            <button
              onClick={() => openExternal('mailto:jason@speedheathens.com')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
                color: '#8b949e',
                background: 'rgba(139,148,158,0.08)',
                border: '1px solid rgba(139,148,158,0.2)',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(139,148,158,0.16)';
                el.style.borderColor = 'rgba(139,148,158,0.35)';
                el.style.color = '#c9d1d9';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(139,148,158,0.08)';
                el.style.borderColor = 'rgba(139,148,158,0.2)';
                el.style.color = '#8b949e';
              }}
            >
              <Mail size={12} />
              jason@speedheathens.com
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
