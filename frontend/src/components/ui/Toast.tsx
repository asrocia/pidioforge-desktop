/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

let toastId = 0;
const listeners = new Set<(toast: Toast) => void>();
let toastsEnabled = true;

export function showToast(type: ToastType, message: string, duration = 5000) {
  if (!toastsEnabled) return;

  const toast: Toast = {
    id: `toast-${++toastId}`,
    type,
    message,
    duration,
  };
  listeners.forEach(listener => listener(toast));
}

export function toggleToasts() {
  toastsEnabled = !toastsEnabled;
  return toastsEnabled;
}

export function areToastsEnabled() {
  return toastsEnabled;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [enabled, setEnabled] = useState(toastsEnabled);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
      if (toast.duration) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, toast.duration);
      }
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleToggle = () => {
    const newState = toggleToasts();
    setEnabled(newState);
    if (!newState) {
      setToasts([]);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className={cn(
          'fixed top-4 right-4 z-50 w-10 h-10 rounded-lg border-2 backdrop-blur-sm transition-all duration-300',
          'flex items-center justify-center text-lg font-bold shadow-lg',
          enabled
            ? 'bg-green-900/90 border-green-500 text-green-100 hover:bg-green-800/90'
            : 'bg-gray-900/90 border-gray-500 text-gray-400 hover:bg-gray-800/90',
        )}
        title={enabled ? 'Disable notifications' : 'Enable notifications'}
      >
        {enabled ? '🔔' : '🔕'}
      </button>

      {/* Toast Messages */}
      {enabled && (
        <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto min-w-[300px] max-w-[500px] p-4 rounded-lg shadow-lg border-2 backdrop-blur-sm',
                'animate-[slideIn_0.3s_ease-out] transition-all duration-300',
                toast.type === 'error' && 'bg-red-900/90 border-red-500 text-red-100',
                toast.type === 'success' && 'bg-green-900/90 border-green-500 text-green-100',
                toast.type === 'warning' && 'bg-yellow-900/90 border-yellow-500 text-yellow-100',
                toast.type === 'info' && 'bg-blue-900/90 border-blue-500 text-blue-100',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-xl">
                  {toast.type === 'error' && '❌'}
                  {toast.type === 'success' && '✅'}
                  {toast.type === 'warning' && '⚠️'}
                  {toast.type === 'info' && 'ℹ️'}
                </div>
                <div className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 text-lg opacity-70 hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Global error handler
export function setupGlobalErrorHandler() {
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('error', `Error: ${event.reason?.message || event.reason || 'Unknown error'}`);
  });

  window.addEventListener('error', event => {
    console.error('Global error:', event.error);
    showToast('error', `Error: ${event.error?.message || event.message || 'Unknown error'}`);
  });
}
