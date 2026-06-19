/**
 * Badge — Severity / status badge
 *
 * @param {'sev1'|'sev2'|'sev3'|'info'|'success'} severity
 * @param {string} label
 * @param {string} className
 */
export default function Badge({ severity = 'info', label, className = '' }) {
  const colors = {
    sev1: 'bg-error text-on-error',
    sev2: 'bg-secondary-container text-on-secondary-container',
    sev3: 'bg-surface-dim text-on-surface',
    info: 'bg-tertiary-container text-on-tertiary-container',
    success: 'bg-primary-container text-on-primary-container',
    coral: 'bg-brand-coral text-on-surface',
    yellow: 'bg-brand-yellow text-on-surface',
  };

  return (
    <span
      className={`px-2 py-0.5 font-label-mono text-[10px] uppercase border-[2px] border-black inline-block ${
        colors[severity] || colors.info
      } ${className}`}
    >
      {label}
    </span>
  );
}
