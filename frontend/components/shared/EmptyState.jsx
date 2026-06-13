/**
 * EmptyState — "No data" placeholder
 *
 * @param {string} icon - Material Symbols icon name
 * @param {string} title
 * @param {string} description
 * @param {React.ReactNode} action - Optional action button/link
 */
export default function EmptyState({ icon = 'inbox', title = 'No data', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 border-[3px] border-black bg-surface-container-high flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[40px] text-on-surface-variant">{icon}</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm uppercase mb-2">{title}</h3>
      {description && (
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}
