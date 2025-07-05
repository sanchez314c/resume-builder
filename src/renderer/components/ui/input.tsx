/**
 * Input Component
 *
 * A styled input component with focus states and variants.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-[rgba(0,210,190,0.18)] bg-[rgba(13,17,23,0.8)] px-3 py-2 text-sm text-[--color-text-primary] transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[--color-text-muted] hover:border-[rgba(0,210,190,0.32)] focus-visible:border-[#00d2be] focus-visible:shadow-[0_0_0_3px_rgba(0,210,190,0.12),0_2px_8px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,210,190,0.2)] disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-10',
            error &&
              'focus-visible:ring-[--color-error]/30 border-[--color-error] focus-visible:shadow-none',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-[rgba(0,210,190,0.18)] bg-[rgba(13,17,23,0.8)] px-3 py-2 text-sm text-[--color-text-primary] transition-all duration-200 placeholder:text-[--color-text-muted] hover:border-[rgba(0,210,190,0.32)] focus-visible:border-[#00d2be] focus-visible:shadow-[0_0_0_3px_rgba(0,210,190,0.12),0_2px_8px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,210,190,0.2)] disabled:cursor-not-allowed disabled:opacity-50',
          error &&
            'focus-visible:ring-[--color-error]/30 border-[--color-error] focus-visible:shadow-none',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Input, Textarea };
