import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const toast: Toast = { id, message, type, duration };
    setToasts((s) => [...s, toast]);

    // Auto-remove
    setTimeout(() => {
      setToasts((s) => s.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const success = useCallback((message: string, duration?: number) => add(message, 'success', duration), [add]);
  const error = useCallback((message: string, duration?: number) => add(message, 'error', duration), [add]);
  const info = useCallback((message: string, duration?: number) => add(message, 'info', duration), [add]);

  const remove = useCallback((id: string) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`max-w-sm w-full px-4 py-3 rounded shadow-lg text-sm text-white ${
              t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="mr-2">{t.message}</div>
              <button
                onClick={() => remove(t.id)}
                className="opacity-80 hover:opacity-100 ml-2 text-white"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
