/**
 * TopBar — Header bar with search and action icons
 * Extracted from the original App.jsx <header> block.
 */
export default function TopBar() {
  return (
    <header className="h-20 bg-surface-container-lowest border-b-[3px] border-black flex items-center justify-between px-gutter sticky top-0 z-40">
      <div className="flex-1 max-w-2xl flex items-center gap-4">
        <div className="relative w-full hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            className="w-full bg-surface-container-lowest border-[3px] border-black py-2 pl-10 pr-4 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-primary-fixed transition-colors"
            placeholder="Search investigations, agents, or assets..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-6 text-on-surface">
        <button className="hover:text-primary-fixed-dim transition-colors">
          <span className="material-symbols-outlined text-[24px]">notifications</span>
        </button>
        <button className="hover:text-primary-fixed-dim transition-colors">
          <span className="material-symbols-outlined text-[24px]">help</span>
        </button>
        <button className="hover:text-primary-fixed-dim transition-colors">
          <span className="material-symbols-outlined text-[24px]">account_circle</span>
        </button>
      </div>
    </header>
  );
}
