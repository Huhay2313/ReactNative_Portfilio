/**
 * ToastContext: non-blocking feedback & Postel's-law Undo.
 *
 * Replaces intrusive blocking alerts for reversible actions (deleting evidence,
 * switching theme, saving profile) with a crisp floating banner above the tab
 * bar that auto-dismisses and supports swipe-to-dismiss or one-tap Undo.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastTone = 'default' | 'complete' | 'accent' | 'alert';

export interface ToastPayload {
  id: number;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ShowToastOptions {
  message: string;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastContextValue {
  toast: ToastPayload | null;
  showToast: (options: ShowToastOptions) => void;
  dismissToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counterRef = useRef(0);

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    ({ message, tone = 'default', actionLabel, onAction, durationMs = 3400 }: ShowToastOptions) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      counterRef.current += 1;
      const id = counterRef.current;

      setToast({
        id,
        message,
        tone,
        actionLabel,
        onAction,
      });

      timerRef.current = setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
        timerRef.current = null;
      }, durationMs);
    },
    [],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toast, showToast, dismissToast }),
    [toast, showToast, dismissToast],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside a ToastProvider');
  }
  return ctx;
}
