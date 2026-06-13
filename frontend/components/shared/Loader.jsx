/**
 * Loader — Loading spinner/skeleton
 *
 * @param {'sm'|'md'|'lg'} size
 * @param {string} label
 */
export default function Loader({ size = 'md', label = 'Loading...' }) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-[3px]',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className={`${sizes[size]} border-black border-t-primary-container animate-spin`} />
      {label && (
        <span className="font-label-mono text-label-mono uppercase text-on-surface-variant tracking-widest">
          {label}
        </span>
      )}
    </div>
  );
}
