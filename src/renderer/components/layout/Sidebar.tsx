/**
 * Sidebar Component — Neo-Noir Glass Monitor
 *
 * Navigation sidebar with gradient bg, teal active state.
 * NO logo section at top (title bar handles branding).
 */

import React from 'react';
import {
  FileUp,
  BarChart3,
  Briefcase,
  FileText,
  Download,
  HelpCircle,
  Settings,
  Cpu,
  FolderKanban,
} from 'lucide-react';
import { useAppStore, type PageId } from '../../stores/app-store';

// =============================================================================
// Types
// =============================================================================

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
}

// =============================================================================
// Navigation Items
// =============================================================================

const mainNavItems: NavItem[] = [
  { id: 'projects', label: 'Projects', icon: <FolderKanban size={18} /> },
  { id: 'import', label: 'Import', icon: <FileUp size={18} /> },
  { id: 'analysis', label: 'Analysis', icon: <BarChart3 size={18} /> },
  { id: 'jobs', label: 'Job Matching', icon: <Briefcase size={18} /> },
  { id: 'resume', label: 'Resume', icon: <FileText size={18} /> },
  { id: 'export', label: 'Export', icon: <Download size={18} /> },
];

// =============================================================================
// NavItem Button
// =============================================================================

const NavButton: React.FC<{
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => (
  <button
    onClick={onClick}
    title={item.label}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: isActive ? '1px solid rgba(0, 210, 190, 0.2)' : '1px solid transparent',
      background: isActive ? 'rgba(0, 210, 190, 0.1)' : 'transparent',
      color: isActive ? '#00d2be' : '#8b949e',
      fontSize: '14px',
      fontWeight: isActive ? 600 : 400,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 150ms ease',
      letterSpacing: '-0.01em',
    }}
    onMouseEnter={(e) => {
      if (!isActive) {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'rgba(255, 255, 255, 0.04)';
        el.style.color = '#e6edf3';
      }
    }}
    onMouseLeave={(e) => {
      if (!isActive) {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'transparent';
        el.style.color = '#8b949e';
      }
    }}
  >
    <span style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
    <span>{item.label}</span>
    {isActive && (
      <span
        style={{
          marginLeft: 'auto',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: '#00d2be',
          boxShadow: '0 0 6px rgba(0, 210, 190, 0.6)',
          flexShrink: 0,
        }}
      />
    )}
  </button>
);

// =============================================================================
// Sidebar Component
// =============================================================================

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, isNlpConnected } = useAppStore();

  return (
    <aside
      style={{
        width: '240px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background:
          'linear-gradient(180deg, rgba(13, 17, 23, 0.75) 0%, rgba(8, 11, 15, 0.85) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(0, 210, 190, 0.12)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Right edge teal glow */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '10%',
          bottom: '10%',
          width: '1px',
          background: 'linear-gradient(180deg, transparent, rgba(0, 210, 190, 0.25), transparent)',
          pointerEvents: 'none',
        }}
      />
      {/* Main Navigation */}
      <nav
        style={{
          flex: 1,
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
        }}
      >
        <p
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#3d444d',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '8px 12px 6px',
            margin: 0,
          }}
        >
          Navigation
        </p>
        {mainNavItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={currentPage === item.id}
            onClick={() => setCurrentPage(item.id)}
          />
        ))}
      </nav>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: 'rgba(0, 210, 190, 0.08)',
          margin: '0 8px',
        }}
      />

      {/* Bottom Navigation */}
      <nav
        style={{
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid transparent',
            background: 'transparent',
            color: '#484f58',
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'rgba(255, 255, 255, 0.04)';
            el.style.color = '#8b949e';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'transparent';
            el.style.color = '#484f58';
          }}
        >
          <HelpCircle size={16} />
          Help
        </button>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid transparent',
            background: 'transparent',
            color: '#484f58',
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'rgba(255, 255, 255, 0.04)';
            el.style.color = '#8b949e';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'transparent';
            el.style.color = '#484f58';
          }}
        >
          <Settings size={16} />
          Settings
        </button>
      </nav>

      {/* System Status Card */}
      <div style={{ padding: '8px', paddingBottom: '12px' }}>
        <div
          style={{
            position: 'relative',
            background:
              'linear-gradient(135deg, rgba(22, 27, 34, 0.8) 0%, rgba(13, 17, 23, 0.7) 100%)',
            border: '1px solid rgba(0, 210, 190, 0.15)',
            borderRadius: '10px',
            padding: '12px',
            overflow: 'hidden',
          }}
        >
          {/* Top highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background:
                'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent)',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isNlpConnected ? '#3fb950' : '#f85149',
                boxShadow: isNlpConnected
                  ? '0 0 6px rgba(63, 185, 80, 0.6)'
                  : '0 0 6px rgba(248, 81, 73, 0.6)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: isNlpConnected ? '#3fb950' : '#f85149',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {isNlpConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#484f58',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Cpu size={12} />
            <span>NLP Engine</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
