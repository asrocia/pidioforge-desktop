import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface Toast {
  id: string;
  title: string;
  message?: string;
  variant: 'success' | 'error' | 'warn' | 'info';
  duration?: number;
}

/* interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
} */

let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toastState: Toast[] = [];

function notify(toasts: Toast[]) {
  toastState = toasts;
  toastListeners.forEach(fn => fn(toasts));
}

export function toast(options: Omit<Toast, 'id'>) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newToast: Toast = { ...options, id, duration: options.duration ?? 4000 };
  notify([...toastState, newToast]);

  if ((newToast.duration ?? 0) > 0) {
    setTimeout(() => {
      notify(toastState.filter(t => t.id !== id));
    }, newToast.duration);
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter(fn => fn !== setToasts);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-3 right-3 z-[9999] flex flex-col gap-2 max-w-[320px]">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'toast-enter rounded-[var(--radius-lg)] px-4 py-3 shadow-lg border backdrop-blur-sm',
            'flex items-start gap-3 min-w-[240px]',
            t.variant === 'success' && 'bg-[#0d1c16]/95 border-[#2dbb7f]/30 text-[#2dbb7f]',
            t.variant === 'error' && 'bg-[#1a0f11]/95 border-[#e76d78]/30 text-[#e76d78]',
            t.variant === 'warn' && 'bg-[#1a1509]/95 border-[#d9a65f]/30 text-[#d9a65f]',
            t.variant === 'info' && 'bg-[#121821]/95 border-[#4f8ef7]/30 text-[#4f8ef7]',
          )}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold leading-tight">{t.title}</p>
            {t.message && <p className="text-[11px] opacity-80 mt-0.5 leading-snug">{t.message}</p>}
          </div>
          <button
            onClick={() => notify(toastState.filter(x => x.id !== t.id))}
            className="text-current opacity-50 hover:opacity-100 text-[14px] leading-none shrink-0 mt-0.5"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/** Skeleton loading placeholder */
export function Skeleton({ className, lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton rounded-[var(--radius-sm)] h-4"
          style={{ width: i === lines - 1 && lines > 1 ? '66%' : '100%' }}
        />
      ))}
    </div>
  );
}

/** Loading spinner inline */
export function Spinner({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('spinner inline-block', className)}
      style={{ width: size, height: size }}
    />
  );
}
