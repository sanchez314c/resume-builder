/**
 * Toast Notification Component
 * Resume Builder Application
 *
 * Toast notifications with success, error, warning, and info variants.
 * Includes auto-dismiss functionality and stack management.
 */

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';

// ============================================
// Types
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

export interface Toast {
  /** Unique identifier */
  id: string;
  /** Toast type/variant */
  type: ToastType;
  /** Toast title */
  title: string;
  /** Optional description */
  description?: string;
  /** Duration in milliseconds (0 = persistent) */
  duration?: number;
  /** Whether the toast can be dismissed */
  dismissible?: boolean;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastOptions {
  /** Toast title */
  title: string;
  /** Optional description */
  description?: string;
  /** Duration in milliseconds */
  duration?: number;
  /** Whether the toast can be dismissed */
  dismissible?: boolean;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  /** Currently active toasts */
  toasts: Toast[];
  /** Add a new toast */
  addToast: (type: ToastType, options: ToastOptions) => string;
  /** Remove a toast by ID */
  removeToast: (id: string) => void;
  /** Remove all toasts */
  clearToasts: () => void;
  /** Convenience methods */
  success: (options: ToastOptions) => string;
  error: (options: ToastOptions) => string;
  warning: (options: ToastOptions) => string;
  info: (options: ToastOptions) => string;
}

interface ToastProviderProps {
  children: React.ReactNode;
  /** Default duration for toasts */
  defaultDuration?: number;
  /** Maximum number of visible toasts */
  maxToasts?: number;
  /** Toast position */
  position?: ToastPosition;
}

// ============================================
// Icons
// ============================================

interface IconProps {
  className?: string;
  size?: number;
}

const CheckCircleIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
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
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XCircleIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="15" x2="9" y1="9" y2="15" />
    <line x1="9" x2="15" y1="9" y2="15" />
  </svg>
);

const AlertTriangleIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
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
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
);

const InfoIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="16" y2="12" />
    <line x1="12" x2="12.01" y1="8" y2="8" />
  </svg>
);

const XIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
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
    <line x1="18" x2="6" y1="6" y2="18" />
    <line x1="6" x2="18" y1="6" y2="18" />
  </svg>
);

// ============================================
// Toast Styling
// ============================================

const TOAST_ICONS: Record<ToastType, React.FC<IconProps>> = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
};

const TOAST_STYLES: Record<ToastType, { container: string; icon: string }> = {
  success: {
    container: 'bg-status-success/10 border-status-success/30',
    icon: 'text-status-success',
  },
  error: {
    container: 'bg-status-error/10 border-status-error/30',
    icon: 'text-status-error',
  },
  warning: {
    container: 'bg-status-warning/10 border-status-warning/30',
    icon: 'text-status-warning',
  },
  info: {
    container: 'bg-status-info/10 border-status-info/30',
    icon: 'text-status-info',
  },
};

// ============================================
// Context
// ============================================

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ============================================
// Generate ID
// ============================================

let toastId = 0;
const generateId = () => `toast-${++toastId}`;

// ============================================
// Toast Item Component
// ============================================

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
  position: ToastPosition;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove, position }) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, toast.duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast.duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Match animation duration
  }, [onRemove, toast.id]);

  const Icon = TOAST_ICONS[toast.type];
  const styles = TOAST_STYLES[toast.type];

  const isTop = position.includes('top');
  const animationClass = isLeaving
    ? isTop
      ? 'toast-leave'
      : 'toast-leave-bottom'
    : isTop
      ? 'toast-enter'
      : 'toast-enter-bottom';

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex w-full max-w-sm
        items-start gap-3
        rounded-lg
        border
        bg-surface
        p-4
        shadow-lg
        ${styles.container}
        ${animationClass}
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${styles.icon}`}>
        <Icon size={20} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-sm text-text-secondary">{toast.description}</p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              handleDismiss();
            }}
            className="mt-2 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Dismiss button */}
      {toast.dismissible !== false && (
        <button
          type="button"
          onClick={handleDismiss}
          className="
            flex-shrink-0
            rounded
            p-1
            text-text-muted
            transition-colors
            hover:bg-surface-hover
            hover:text-text-primary
          "
          aria-label="Dismiss"
        >
          <XIcon size={16} />
        </button>
      )}
    </div>
  );
};

// ============================================
// Toast Container Component
// ============================================

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
  position: ToastPosition;
  maxToasts: number;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
  position,
  maxToasts,
}) => {
  const positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const visibleToasts = toasts.slice(-maxToasts);
  const isTop = position.includes('top');

  return (
    <div
      className={`
        pointer-events-none fixed
        z-100 flex flex-col
        gap-2
        ${positionClasses[position]}
        ${isTop ? '' : 'flex-col-reverse'}
      `}
    >
      {visibleToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} position={position} />
        </div>
      ))}
    </div>
  );
};

// ============================================
// Toast Provider
// ============================================

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  defaultDuration = 5000,
  maxToasts = 5,
  position = 'top-right',
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: ToastType, options: ToastOptions): string => {
      const id = generateId();
      const toast: Toast = {
        id,
        type,
        duration: defaultDuration,
        dismissible: true,
        ...options,
      };

      setToasts((prev) => [...prev, toast]);
      return id;
    },
    [defaultDuration]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback((options: ToastOptions) => addToast('success', options), [addToast]);

  const error = useCallback((options: ToastOptions) => addToast('error', options), [addToast]);

  const warning = useCallback((options: ToastOptions) => addToast('warning', options), [addToast]);

  const info = useCallback((options: ToastOptions) => addToast('info', options), [addToast]);

  const contextValue: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
        position={position}
        maxToasts={maxToasts}
      />
    </ToastContext.Provider>
  );
};

// ============================================
// Hook
// ============================================

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

// ============================================
// Standalone Toast Component (for direct rendering)
// ============================================

interface StandaloneToastProps {
  type: ToastType;
  title: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

export const StandaloneToast: React.FC<StandaloneToastProps> = ({
  type,
  title,
  description,
  onClose,
  className = '',
}) => {
  const Icon = TOAST_ICONS[type];
  const styles = TOAST_STYLES[type];

  return (
    <div
      role="alert"
      className={`
        flex items-start gap-3
        rounded-lg
        border
        p-4
        ${styles.container}
        ${className}
      `}
    >
      <div className={`flex-shrink-0 ${styles.icon}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="
            flex-shrink-0
            rounded
            p-1
            text-text-muted
            transition-colors
            hover:bg-surface-hover
            hover:text-text-primary
          "
          aria-label="Dismiss"
        >
          <XIcon size={16} />
        </button>
      )}
    </div>
  );
};

export default ToastProvider;
