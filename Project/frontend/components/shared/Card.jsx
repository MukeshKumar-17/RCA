/**
 * Card — Neo-Brutalist card container
 *
 * @param {React.ReactNode} children
 * @param {boolean} hover - Enable hover background effect
 * @param {string} className - Additional classes
 */
export default function Card({ children, hover = false, className = '', ...props }) {
  return (
    <div
      className={`bg-surface-container-lowest border-[3px] border-black p-6 ${
        hover ? 'hover:bg-surface-container-high transition-colors' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
