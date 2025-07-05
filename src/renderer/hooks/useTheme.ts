/**
 * Theme Hook
 *
 * Re-exports the useTheme hook from ThemeProvider for convenience.
 * Applications should wrap their root component with ThemeProvider.
 *
 * @example
 * ```tsx
 * // In your root component (e.g., App.tsx)
 * import { ThemeProvider } from '@/components/ThemeProvider';
 *
 * function App() {
 *   return (
 *     <ThemeProvider defaultTheme="system">
 *       <YourApp />
 *     </ThemeProvider>
 *   );
 * }
 *
 * // In any child component
 * import { useTheme } from '@/hooks/useTheme';
 *
 * function MyComponent() {
 *   const { theme, resolvedTheme, setTheme, toggleTheme, isDark } = useTheme();
 *   // ...
 * }
 * ```
 */

export { useTheme, ThemeProvider, themeScript } from '../components/ThemeProvider';

export type { Theme, ResolvedTheme } from '../components/ThemeProvider';
