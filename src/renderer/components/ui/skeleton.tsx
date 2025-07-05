/**
 * Skeleton Component
 * Resume Builder Application
 *
 * Loading placeholder with animated shimmer effect.
 * Provides visual feedback while content is loading.
 */

import React from 'react';

// ============================================
// Types
// ============================================

interface SkeletonProps {
  /** Additional CSS classes */
  className?: string;
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Shape variant */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /** Animation style */
  animation?: 'pulse' | 'shimmer' | 'none';
  /** Number of skeleton items to render (for repeated patterns) */
  count?: number;
  /** Gap between skeleton items when count > 1 */
  gap?: string | number;
}

interface SkeletonTextProps {
  /** Number of lines */
  lines?: number;
  /** Width of the last line (as percentage) */
  lastLineWidth?: string;
  /** Line height spacing */
  lineHeight?: string;
  /** Additional CSS classes */
  className?: string;
  /** Animation style */
  animation?: 'pulse' | 'shimmer' | 'none';
}

interface SkeletonAvatarProps {
  /** Size of the avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Additional CSS classes */
  className?: string;
  /** Animation style */
  animation?: 'pulse' | 'shimmer' | 'none';
}

interface SkeletonCardProps {
  /** Show header section */
  hasHeader?: boolean;
  /** Show image placeholder */
  hasImage?: boolean;
  /** Image height */
  imageHeight?: string | number;
  /** Number of text lines */
  textLines?: number;
  /** Show footer section */
  hasFooter?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Animation style */
  animation?: 'pulse' | 'shimmer' | 'none';
}

// ============================================
// Base Skeleton Component
// ============================================

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  variant = 'text',
  animation = 'shimmer',
  count = 1,
  gap = '0.5rem',
}) => {
  // Determine border radius based on variant
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  // Determine animation class
  const animationClasses = {
    pulse: 'skeleton-pulse',
    shimmer: 'skeleton',
    none: '',
  };

  // Convert dimensions to CSS values
  const getSize = (value: string | number | undefined): string | undefined => {
    if (value === undefined) return undefined;
    if (typeof value === 'number') return `${value}px`;
    return value;
  };

  const style: React.CSSProperties = {
    width: getSize(width),
    height: getSize(height) || (variant === 'text' ? '1em' : undefined),
  };

  const baseClasses = `
    bg-surface-hover
    ${variantClasses[variant]}
    ${animationClasses[animation]}
    ${className}
  `;

  if (count === 1) {
    return <div className={baseClasses.trim()} style={style} />;
  }

  return (
    <div className="flex flex-col" style={{ gap: getSize(gap) }}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={baseClasses.trim()} style={style} />
      ))}
    </div>
  );
};

// ============================================
// Skeleton Text Component
// ============================================

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = '70%',
  lineHeight = '1.5rem',
  className = '',
  animation = 'shimmer',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => {
        const isLastLine = index === lines - 1;
        return (
          <Skeleton
            key={index}
            variant="text"
            height={lineHeight}
            width={isLastLine ? lastLineWidth : '100%'}
            animation={animation}
          />
        );
      })}
    </div>
  );
};

// ============================================
// Skeleton Avatar Component
// ============================================

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 'md',
  className = '',
  animation = 'shimmer',
}) => {
  // Predefined sizes
  const sizes = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  const dimension = typeof size === 'number' ? size : sizes[size];

  return (
    <Skeleton
      variant="circular"
      width={dimension}
      height={dimension}
      animation={animation}
      className={className}
    />
  );
};

// ============================================
// Skeleton Card Component
// ============================================

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasHeader = true,
  hasImage = false,
  imageHeight = 200,
  textLines = 3,
  hasFooter = false,
  className = '',
  animation = 'shimmer',
}) => {
  return (
    <div
      className={`
        overflow-hidden
        rounded-xl border
        border-surface-border
        bg-surface
        ${className}
      `}
    >
      {/* Image placeholder */}
      {hasImage && (
        <Skeleton variant="rectangular" width="100%" height={imageHeight} animation={animation} />
      )}

      <div className="p-4">
        {/* Header */}
        {hasHeader && (
          <div className="mb-4 flex items-center gap-3">
            <SkeletonAvatar size="md" animation={animation} />
            <div className="flex-1 space-y-2">
              <Skeleton width="60%" height="1rem" animation={animation} />
              <Skeleton width="40%" height="0.75rem" animation={animation} />
            </div>
          </div>
        )}

        {/* Text content */}
        <SkeletonText lines={textLines} animation={animation} />

        {/* Footer */}
        {hasFooter && (
          <div className="mt-4 flex items-center justify-between border-t border-surface-border pt-4">
            <Skeleton width="80px" height="2rem" variant="rounded" animation={animation} />
            <Skeleton width="80px" height="2rem" variant="rounded" animation={animation} />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// Skeleton List Item Component
// ============================================

export const SkeletonListItem: React.FC<{
  hasAvatar?: boolean;
  hasAction?: boolean;
  className?: string;
  animation?: 'pulse' | 'shimmer' | 'none';
}> = ({ hasAvatar = true, hasAction = false, className = '', animation = 'shimmer' }) => {
  return (
    <div className={`flex items-center gap-3 p-3 ${className}`}>
      {hasAvatar && <SkeletonAvatar size="sm" animation={animation} />}
      <div className="flex-1 space-y-2">
        <Skeleton width="70%" height="1rem" animation={animation} />
        <Skeleton width="50%" height="0.75rem" animation={animation} />
      </div>
      {hasAction && <Skeleton width="60px" height="2rem" variant="rounded" animation={animation} />}
    </div>
  );
};

// ============================================
// Skeleton Table Component
// ============================================

export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  className?: string;
  animation?: 'pulse' | 'shimmer' | 'none';
}> = ({ rows = 5, columns = 4, hasHeader = true, className = '', animation = 'shimmer' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header row */}
      {hasHeader && (
        <div className="flex gap-4 border-b border-surface-border pb-2">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="flex-1">
              <Skeleton height="1rem" animation={animation} />
            </div>
          ))}
        </div>
      )}

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <Skeleton height="1rem" width={`${70 + Math.random() * 30}%`} animation={animation} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// ============================================
// Skeleton Form Component
// ============================================

export const SkeletonForm: React.FC<{
  fields?: number;
  hasSubmit?: boolean;
  className?: string;
  animation?: 'pulse' | 'shimmer' | 'none';
}> = ({ fields = 3, hasSubmit = true, className = '', animation = 'shimmer' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          {/* Label */}
          <Skeleton width="30%" height="0.875rem" animation={animation} />
          {/* Input */}
          <Skeleton height="2.5rem" variant="rounded" animation={animation} />
        </div>
      ))}

      {hasSubmit && (
        <div className="pt-4">
          <Skeleton width="100px" height="2.5rem" variant="rounded" animation={animation} />
        </div>
      )}
    </div>
  );
};

export default Skeleton;
