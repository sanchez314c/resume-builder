/**
 * Button Component
 * Resume Builder - CashCommand Style
 *
 * A versatile button component with multiple variants and sizes.
 * Follows shadcn/ui patterns with class-variance-authority.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const buttonVariants = {
  base: 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-background] disabled:pointer-events-none disabled:opacity-50',
  variants: {
    // Glass button with teal accent — Neo-Noir Glass Monitor
    default:
      'text-[#00d2be] border border-[rgba(0,210,190,0.25)] bg-gradient-to-br from-[rgba(0,210,190,0.12)] to-[rgba(0,210,190,0.06)] hover:from-[rgba(0,210,190,0.2)] hover:to-[rgba(0,210,190,0.12)] hover:border-[rgba(0,210,190,0.4)] hover:shadow-[0_0_20px_rgba(0,210,190,0.25),0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-px',
    // Primary filled — teal gradient
    primary:
      'text-white bg-gradient-to-br from-[#00d2be] to-[#00a896] border border-[rgba(0,210,190,0.5)] hover:from-[#00e5cc] hover:to-[#00b8a0] hover:border-[rgba(0,210,190,0.7)] hover:shadow-[0_0_30px_rgba(0,210,190,0.35),0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-px',
    destructive:
      'bg-[--color-error] text-white hover:bg-[--color-error]/90 hover:shadow-[0_0_20px_rgba(248,81,73,0.3)]',
    outline:
      'border border-[rgba(0,210,190,0.18)] bg-transparent text-[--color-text-primary] hover:bg-white/4 hover:border-[rgba(0,210,190,0.32)]',
    secondary:
      'bg-[rgba(22,27,34,0.8)] text-[--color-text-primary] border border-[rgba(0,210,190,0.15)] hover:bg-[rgba(28,33,40,0.9)] hover:border-[rgba(0,210,190,0.25)]',
    ghost: 'text-[--color-text-secondary] hover:bg-white/4 hover:text-[--color-text-primary]',
    link: 'text-[--color-accent] underline-offset-4 hover:underline',
  },
  sizes: {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-11 rounded-lg px-6',
    icon: 'h-9 w-9',
  },
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'default', size = 'default', isLoading, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        className={cn(
          buttonVariants.base,
          buttonVariants.variants[variant],
          buttonVariants.sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
