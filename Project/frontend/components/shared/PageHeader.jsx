/**
 * PageHeader — Title + subtitle + actions bar
 *
 * @param {string} title
 * @param {string} subtitle
 * @param {React.ReactNode} actions - Buttons/filters on the right side
 * @param {string} className
 */
export default function PageHeader({ title, subtitle, actions, className = '' }) {
  return (
    <div className={`mb-8 flex items-end justify-between ${className}`}>
      <div>
        <h2 className="font-headline-lg text-on-surface uppercase mb-2">{title}</h2>
        {subtitle && (
          <p className="font-body-md text-on-surface-variant">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex gap-4">{actions}</div>}
    </div>
  );
}
