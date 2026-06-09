import { NavLink, Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../utils/constants';

/**
 * Sidebar — Main navigation sidebar
 * Extracted from the original App.jsx <nav> block.
 *
 * @param {Function} onNewScan - Callback to open the New Scan modal
 */
export default function Sidebar({ onNewScan }) {
  const location = useLocation();

  return (
    <nav className="w-[280px] h-screen fixed left-0 top-0 bg-surface-container-lowest border-r-[3px] border-black z-50 flex flex-col pt-gutter hidden md:flex">
      <div className="px-gutter mb-margin">
        <Link to="/" className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-brand-yellow border-[3px] border-black flex items-center justify-center">
            <div className="w-4 h-4 border-[3px] border-black"></div>
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight leading-none">RootLens</h1>
            <span className="font-label-mono text-[10px] text-outline uppercase block mt-1 tracking-widest font-bold">Enterprise Admin</span>
          </div>
        </Link>
        <div className="h-[3px] bg-black w-full mb-8"></div>
      </div>
      <div className="flex flex-col flex-1 px-4 gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const isSettings = item.path === '/settings';
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 font-label-bold text-label-bold uppercase tracking-wide transition-all group ${isSettings ? 'mt-auto mb-8' : ''} ${
                isActive
                  ? `${item.activeColor} text-on-surface border-[3px] border-black`
                  : 'text-on-surface hover:bg-surface-variant border-[3px] border-transparent'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${!isActive && 'group-hover:text-black transition-colors'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
      <div className="px-4 pb-8">
        <button
          onClick={onNewScan}
          className="w-full bg-brand-yellow text-on-surface font-label-bold text-label-bold uppercase py-4 border-[3px] border-black hover:bg-[#FFE000] active:translate-y-1 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]"
        >
          <span className="material-symbols-outlined font-bold">add</span>
          New Scan
        </button>
      </div>
    </nav>
  );
}
