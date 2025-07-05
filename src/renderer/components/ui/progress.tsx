/**
 * Progress Component
 *
 * A progress bar component with percentage display.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, showLabel = false, variant = 'default', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className={cn('w-full', className)} {...props}>
        <div
          ref={ref}
          className="relative h-2 w-full overflow-hidden rounded-full bg-[rgba(0,210,190,0.12)]"
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-in-out',
              variant === 'default' && 'bg-gradient-to-r from-[#00d2be] to-[#00a896]',
              variant === 'success' && 'bg-gradient-to-r from-[#00d2be] to-[#00a896]',
              variant === 'warning' && 'bg-[--color-warning]',
              variant === 'destructive' && 'bg-[--color-error]'
            )}
            style={{
              width: `${percentage}%`,
              boxShadow:
                percentage > 0
                  ? '0 0 8px rgba(0, 210, 190, 0.5), 0 0 16px rgba(0, 210, 190, 0.2)'
                  : 'none',
            }}
          />
        </div>
        {showLabel && (
          <div className="mt-1 text-right text-sm text-[--color-text-secondary]">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export interface ProgressStepsProps {
  steps: Array<{
    label: string;
    description?: string;
    status: 'pending' | 'current' | 'completed';
  }>;
  className?: string;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps, className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium',
                step.status === 'completed' && 'text-success-foreground border-success bg-success',
                step.status === 'current' && 'border-primary bg-primary text-primary-foreground',
                step.status === 'pending' && 'border-muted-foreground/30 text-muted-foreground'
              )}
            >
              {step.status === 'completed' ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mt-2 h-8 w-0.5',
                  step.status === 'completed' ? 'bg-success' : 'bg-muted-foreground/30'
                )}
              />
            )}
          </div>
          <div className="flex-1 pt-1">
            <p
              className={cn(
                'text-sm font-medium',
                step.status === 'current' && 'text-primary',
                step.status === 'pending' && 'text-muted-foreground'
              )}
            >
              {step.label}
            </p>
            {step.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export { Progress, ProgressSteps };
