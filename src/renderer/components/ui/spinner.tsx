/**
 * Spinner Component
 * Resume Builder Application
 *
 * Loading spinner indicators with multiple variants and sizes.
 * Theme-aware colors that work in both light and dark modes.
 */

import React from 'react';

// ============================================
// Types
// ============================================

interface SpinnerProps {
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Color variant */
  color?: 'default' | 'primary' | 'white' | 'muted';
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

interface DotsSpinnerProps {
  /** Size of each dot */
  dotSize?: 'sm' | 'md' | 'lg' | number;
  /** Color variant */
  color?: 'default' | 'primary' | 'white' | 'muted';
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

interface BarSpinnerProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  color?: 'default' | 'primary' | 'white' | 'muted';
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

// ============================================
// Size Mappings
// ============================================

const SIZES = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

const DOT_SIZES = {
  sm: 6,
  md: 8,
  lg: 10,
};

const STROKE_WIDTHS = {
  xs: 2,
  sm: 2,
  md: 3,
  lg: 3,
  xl: 4,
};

// ============================================
// Color Classes
// ============================================

const getColorClasses = (color: SpinnerProps['color']) => {
  switch (color) {
    case 'primary':
      return {
        track: 'text-accent-muted',
        spinner: 'text-accent',
      };
    case 'white':
      return {
        track: 'text-white/20',
        spinner: 'text-white',
      };
    case 'muted':
      return {
        track: 'text-text-muted/20',
        spinner: 'text-text-muted',
      };
    default:
      return {
        track: 'text-surface-border',
        spinner: 'text-accent',
      };
  }
};

// ============================================
// Circle Spinner Component
// ============================================

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'default',
  className = '',
  label = 'Loading',
}) => {
  const dimension = typeof size === 'number' ? size : SIZES[size];
  const strokeWidth =
    typeof size === 'number' ? Math.max(2, Math.floor(size / 8)) : STROKE_WIDTHS[size];

  const colors = getColorClasses(color);
  const radius = (dimension - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  return (
    <div role="status" aria-label={label} className={`inline-flex ${className}`}>
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className="animate-spin-fast"
      >
        {/* Track circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={colors.track}
          stroke="currentColor"
        />
        {/* Spinner arc */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={colors.spinner}
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          transform={`rotate(-90 ${dimension / 2} ${dimension / 2})`}
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
};

// ============================================
// Dots Spinner Component
// ============================================

export const DotsSpinner: React.FC<DotsSpinnerProps> = ({
  dotSize = 'md',
  color = 'default',
  className = '',
  label = 'Loading',
}) => {
  const dimension = typeof dotSize === 'number' ? dotSize : DOT_SIZES[dotSize];
  const colors = getColorClasses(color);

  return (
    <div role="status" aria-label={label} className={`inline-flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`
            rounded-full
            ${colors.spinner}
            bg-current
          `}
          style={{
            width: dimension,
            height: dimension,
            animation: `dotPulse 1.4s ease-in-out ${index * 0.2}s infinite`,
          }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
};

// ============================================
// Bar Spinner Component
// ============================================

export const BarSpinner: React.FC<BarSpinnerProps> = ({
  size = 'md',
  color = 'default',
  className = '',
  label = 'Loading',
}) => {
  const barCounts = {
    sm: 8,
    md: 12,
    lg: 16,
  };

  const dimensions = {
    sm: { width: 16, barWidth: 1.5, barHeight: 4 },
    md: { width: 24, barWidth: 2, barHeight: 6 },
    lg: { width: 32, barWidth: 2.5, barHeight: 8 },
  };

  const { width, barWidth, barHeight } = dimensions[size];
  const barCount = barCounts[size];
  const colors = getColorClasses(color);

  return (
    <div role="status" aria-label={label} className={`inline-flex ${className}`}>
      <svg
        width={width}
        height={width}
        viewBox={`0 0 ${width} ${width}`}
        className={colors.spinner}
      >
        {Array.from({ length: barCount }).map((_, index) => {
          const angle = (index * 360) / barCount;
          const opacity = (index + 1) / barCount;
          const delay = (index * 1000) / barCount;

          return (
            <rect
              key={index}
              x={width / 2 - barWidth / 2}
              y={2}
              width={barWidth}
              height={barHeight}
              rx={barWidth / 2}
              fill="currentColor"
              opacity={opacity}
              transform={`rotate(${angle} ${width / 2} ${width / 2})`}
              style={{
                animation: `barFade 1s linear ${delay}ms infinite`,
              }}
            />
          );
        })}
      </svg>
      <span className="sr-only">{label}</span>

      <style>{`
        @keyframes barFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

// ============================================
// Ring Spinner Component
// ============================================

export const RingSpinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'default',
  className = '',
  label = 'Loading',
}) => {
  const dimension = typeof size === 'number' ? size : SIZES[size];
  const strokeWidth =
    typeof size === 'number' ? Math.max(2, Math.floor(size / 8)) : STROKE_WIDTHS[size];

  const colors = getColorClasses(color);

  return (
    <div role="status" aria-label={label} className={`inline-flex ${className}`}>
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className="animate-spin"
      >
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={(dimension - strokeWidth) / 2}
          fill="none"
          strokeWidth={strokeWidth}
          className={colors.track}
          stroke="currentColor"
        />
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={(dimension - strokeWidth) / 2}
          fill="none"
          strokeWidth={strokeWidth}
          className={colors.spinner}
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={`${dimension * 0.75} ${dimension * 2}`}
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
};

// ============================================
// Loading Overlay Component
// ============================================

export const LoadingOverlay: React.FC<{
  /** Whether the overlay is visible */
  isLoading: boolean;
  /** Spinner size */
  spinnerSize?: SpinnerProps['size'];
  /** Loading message */
  message?: string;
  /** Whether to use a full-screen overlay */
  fullScreen?: boolean;
  /** Additional CSS classes */
  className?: string;
}> = ({ isLoading, spinnerSize = 'lg', message, fullScreen = false, className = '' }) => {
  if (!isLoading) return null;

  return (
    <div
      className={`
        bg-background/80 flex flex-col items-center justify-center
        gap-4 backdrop-blur-sm
        ${fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0'}
        ${className}
      `}
    >
      <Spinner size={spinnerSize} color="primary" />
      {message && (
        <p className="animate-pulse text-sm font-medium text-text-secondary">{message}</p>
      )}
    </div>
  );
};

// ============================================
// Inline Loading Component
// ============================================

export const InlineLoading: React.FC<{
  /** Loading message */
  message?: string;
  /** Spinner size */
  spinnerSize?: SpinnerProps['size'];
  /** Color variant */
  color?: SpinnerProps['color'];
  /** Additional CSS classes */
  className?: string;
}> = ({ message = 'Loading...', spinnerSize = 'sm', color = 'default', className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Spinner size={spinnerSize} color={color} />
      <span className="text-sm text-text-secondary">{message}</span>
    </div>
  );
};

export default Spinner;
