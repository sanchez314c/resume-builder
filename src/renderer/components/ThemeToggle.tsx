/**
 * Theme Toggle Component
 * Resume Builder Application
 *
 * Button component for toggling between light, dark, and system themes.
 * Includes dropdown menu for selecting specific theme modes.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme, Theme } from './ThemeProvider';

// ============================================
// Icon Components (Lucide-style SVG icons)
// ============================================

interface IconProps {
  className?: string;
  size?: number;
}

const SunIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const MonitorIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);

const CheckIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ============================================
// Types
// ============================================

interface ThemeToggleProps {
  /** Additional CSS classes */
  className?: string;
  /** Show dropdown with all theme options */
  showDropdown?: boolean;
  /** Button size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show label next to icon */
  showLabel?: boolean;
}

interface ThemeOption {
  value: Theme;
  label: string;
  icon: React.FC<IconProps>;
}

// ============================================
// Constants
// ============================================

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: MonitorIcon },
];

// ============================================
// Theme Toggle Button (Simple)
// ============================================

export const ThemeToggleButton: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { resolvedTheme, toggleTheme, isDark } = useTheme();

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`
        inline-flex items-center justify-center
        rounded-lg
        bg-transparent
        text-text-primary
        transition-colors
        duration-200 hover:bg-surface-hover focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-accent
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Current: ${resolvedTheme} theme. Click to toggle.`}
    >
      <div className="relative">
        <SunIcon
          size={iconSizes[size]}
          className={`
            transition-all duration-300
            ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}
            absolute inset-0
          `}
        />
        <MoonIcon
          size={iconSizes[size]}
          className={`
            transition-all duration-300
            ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}
          `}
        />
      </div>
    </button>
  );
};

// ============================================
// Theme Toggle with Dropdown
// ============================================

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showDropdown = true,
  size = 'md',
  showLabel = false,
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    return undefined;
  }, [isOpen]);

  const handleSelect = useCallback(
    (selectedTheme: Theme) => {
      setTheme(selectedTheme);
      setIsOpen(false);
      buttonRef.current?.focus();
    },
    [setTheme]
  );

  const sizeClasses = {
    sm: 'p-1.5 text-sm',
    md: 'p-2 text-base',
    lg: 'p-2.5 text-lg',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  // Get current theme icon
  const CurrentIcon = theme === 'system' ? MonitorIcon : isDark ? MoonIcon : SunIcon;

  // Simple toggle mode
  if (!showDropdown) {
    return <ThemeToggleButton className={className} size={size} />;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center justify-center gap-2
          rounded-lg
          bg-transparent
          text-text-primary
          transition-colors
          duration-200 hover:bg-surface-hover focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-accent
          ${sizeClasses[size]}
        `}
        aria-label="Theme settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <CurrentIcon size={iconSizes[size]} />
        {showLabel && <span className="capitalize">{theme}</span>}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="
            absolute right-0 top-full z-50 mt-2
            min-w-[140px]
            origin-top-right
            animate-scale-in
            rounded-lg border
            border-surface-border
            bg-surface
            py-1
            shadow-lg
          "
          role="menu"
          aria-orientation="vertical"
        >
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`
                  flex w-full items-center gap-3 px-3 py-2
                  text-left text-sm
                  transition-colors duration-150
                  ${
                    isSelected
                      ? 'bg-accent-muted text-accent'
                      : 'text-text-primary hover:bg-surface-hover'
                  }
                `}
                role="menuitem"
                aria-checked={isSelected}
              >
                <Icon size={16} />
                <span className="flex-1">{option.label}</span>
                {isSelected && <CheckIcon size={16} className="text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================
// Theme Segment Control
// ============================================

export const ThemeSegmentControl: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={`
        inline-flex items-center
        rounded-lg
        border
        border-surface-border bg-surface
        p-1
        ${className}
      `}
      role="radiogroup"
      aria-label="Theme selection"
    >
      {THEME_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={`
              flex items-center justify-center
              rounded-md p-2
              transition-all duration-200
              ${
                isSelected
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }
            `}
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            title={option.label}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
