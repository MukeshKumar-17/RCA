/**
 * Button — Neo-Brutalist button component
 * 
 * @param {'primary'|'secondary'|'ghost'|'danger'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {string} icon - Material Symbols icon name
 * @param {React.ReactNode} children
 * @param {string} className - Additional classes
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}) {
  const base = 'font-label-bold text-label-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 border-[3px] border-black';

  const variants = {
    primary: 'bg-primary-container text-on-surface hover:bg-[#FFE000] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-1',
    secondary: 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high',
    ghost: 'bg-transparent text-on-surface hover:bg-surface-variant border-transparent hover:border-black',
    danger: 'bg-error text-on-error hover:bg-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-1',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[12px]',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-4 text-[16px]',
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {icon && (
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
