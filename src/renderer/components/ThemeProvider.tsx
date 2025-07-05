/**
 * Theme Provider Component
 * Resume Builder Application
 *
 * React context for managing theme state across the application.
 * Supports light, dark, and system preference modes.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

// ============================================
// Types
// ============================================

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  /** Current theme setting (light, dark, or system) */
  theme: Theme;
  /** Resolved theme based on setting and system preference */
  resolvedTheme: ResolvedTheme;
  /** Update the theme setting */
  setTheme: (theme: Theme) => void;
  /** Toggle between light and dark themes */
  toggleTheme: () => void;
  /** Whether the current resolved theme is dark */
  isDark: boolean;
  /** Whether the current resolved theme is light */
  isLight: boolean;
}

interface ThemeProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Initial theme (defaults to 'system') */
  defaultTheme?: Theme;
  /** localStorage key for persisting theme preference */
  storageKey?: string;
  /** Whether to disable transitions on initial load */
  disableTransitionOnChange?: boolean;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = 'resume-builder-theme';
const THEME_ATTRIBUTE = 'data-theme';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

// ============================================
// Context
// ============================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ============================================
// Helper Functions
// ============================================

/**
 * Get the system color scheme preference
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
}

/**
 * Resolve the theme setting to an actual theme
 */
function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Get the stored theme preference
 */
function getStoredTheme(key: string): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(key);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage might be unavailable
  }
  return null;
}

/**
 * Store the theme preference
 */
function storeTheme(key: string, theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, theme);
  } catch {
    // localStorage might be unavailable
  }
}

/**
 * Apply the theme to the document
 */
function applyTheme(resolvedTheme: ResolvedTheme, disableTransition: boolean = false): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // Optionally disable transitions during theme change
  if (disableTransition) {
    root.classList.add('no-transitions');
  } else {
    root.classList.add('theme-transitioning');
  }

  // Remove existing theme classes
  root.classList.remove('light', 'dark');

  // Add the new theme class
  root.classList.add(resolvedTheme);

  // Set the data attribute
  root.setAttribute(THEME_ATTRIBUTE, resolvedTheme);

  // Update the color-scheme CSS property
  root.style.colorScheme = resolvedTheme;

  // Re-enable transitions after a frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove('no-transitions', 'theme-transitioning');
    });
  });
}

// ============================================
// Provider Component
// ============================================

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = STORAGE_KEY,
  disableTransitionOnChange = false,
}: ThemeProviderProps): JSX.Element {
  // Initialize theme from storage or default
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme(storageKey);
    return stored ?? defaultTheme;
  });

  // Track the resolved theme
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    return resolveTheme(theme);
  });

  // Update resolved theme when theme changes
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved, disableTransitionOnChange);
  }, [theme, disableTransitionOnChange]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(MEDIA_QUERY);

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newResolved = e.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        applyTheme(newResolved, disableTransitionOnChange);
      }
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, disableTransitionOnChange]);

  // Apply initial theme on mount
  useEffect(() => {
    // Apply initial theme without transition
    applyTheme(resolvedTheme, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Theme setter
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      storeTheme(storageKey, newTheme);
    },
    [storageKey]
  );

  // Theme toggle
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Memoized context value
  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      isDark: resolvedTheme === 'dark',
      isLight: resolvedTheme === 'light',
    }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

// ============================================
// Hook
// ============================================

/**
 * Hook to access the theme context
 * @throws Error if used outside of ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// ============================================
// Script for preventing FOUC
// ============================================

/**
 * Inline script to prevent flash of unstyled content (FOUC)
 * Include this in the HTML head before any styles load
 */
export const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('${STORAGE_KEY}') || 'system';
    var resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.add(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {}
})();
`;

export default ThemeProvider;
