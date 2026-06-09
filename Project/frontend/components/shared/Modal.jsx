/**
 * Modal — Premium modal overlay with smooth animations
 */
export default function Modal({ isOpen, onClose, title, children, className = '' }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 glass animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white rounded-2xl border border-outline-variant/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-elevated animate-scale-in ${className}`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
            <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-dim text-outline hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
