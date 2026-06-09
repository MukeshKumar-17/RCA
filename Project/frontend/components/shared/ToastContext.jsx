import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

let _toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => show(msg, 'success', dur),
    error: (msg, dur) => show(msg, 'error', dur ?? 6000),
    info: (msg, dur) => show(msg, 'info', dur),
    warning: (msg, dur) => show(msg, 'warning', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Stack */}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const show = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [toast.id, toast.duration, onDismiss]);

  const styles = {
    success: { bg: 'bg-mint-50 border-sky-200/40', icon: 'check_circle', iconColor: 'text-sky-200', textColor: 'text-on-surface' },
    error:   { bg: 'bg-error-container border-error/30', icon: 'error', iconColor: 'text-error', textColor: 'text-on-surface' },
    warning: { bg: 'bg-[#FFF9EC] border-amber-300/40', icon: 'warning', iconColor: 'text-amber-500', textColor: 'text-on-surface' },
    info:    { bg: 'bg-lavender-50 border-violet-200/40', icon: 'info', iconColor: 'text-violet-400', textColor: 'text-on-surface' },
  };

  const s = styles[toast.type] || styles.info;

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-elevated max-w-sm w-full
        ${s.bg} transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      role="alert"
    >
      <span className={`material-symbols-outlined text-[20px] shrink-0 ${s.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {s.icon}
      </span>
      <span className={`font-body-sm text-[13px] flex-1 leading-snug ${s.textColor}`}>{toast.message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 300); }}
        className="text-outline hover:text-on-surface transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}
