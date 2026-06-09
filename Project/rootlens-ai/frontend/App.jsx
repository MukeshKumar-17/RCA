import { useState } from 'react';
import { ToastProvider } from './components/shared/ToastContext';
import { BrowserRouter, Routes, Route, NavLink, useLocation, Link } from 'react-router-dom';
import DashboardPage from './features/dashboard/DashboardPage';
import InvestigationPage from './features/investigation/InvestigationPage';
import ReportPage from './features/report/ReportPage';
import HistoricalPage from './features/historical/HistoricalPage';
import CopilotPage from './features/chat/CopilotPage';
import NewScanModal from './components/shared/NewScanModal';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard', color: 'bg-mint-50' },
  { path: '/investigate', label: 'Investigations', icon: 'troubleshoot', color: 'bg-lavender-50' },
  { path: '/copilot', label: 'AI Copilot', icon: 'smart_toy', color: 'bg-sky-100' },
  { path: '/history', label: 'Historical', icon: 'history', color: 'bg-violet-200/20' },
  { path: '/knowledge', label: 'Knowledge Base', icon: 'menu_book', color: 'bg-mint-100/30' },
  { path: '/settings', label: 'Settings', icon: 'settings', color: 'bg-surface-dim' },
];

function AppLayout() {
  const location = useLocation();
  const [isNewScanOpen, setIsNewScanOpen] = useState(false);

  return (
    <>
      {/* ── Sidebar ── */}
      <nav className="w-[260px] h-screen fixed left-0 top-0 bg-white border-r border-outline-variant/50 z-50 flex flex-col hidden md:flex">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-200 to-violet-400 flex items-center justify-center shadow-neo group-hover:shadow-neo-hover transition-shadow">
              <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lens_blur</span>
            </div>
            <div>
              <h1 className="font-headline-sm text-[18px] text-on-surface tracking-tight leading-none font-bold">RootLens</h1>
              <span className="font-label-mono text-[10px] text-outline uppercase tracking-[0.15em] mt-0.5 block">AI Platform</span>
            </div>
          </Link>
        </div>

        <div className="h-px bg-outline-variant/30 mx-5 mb-3"></div>

        {/* Navigation */}
        <div className="flex flex-col flex-1 px-3 gap-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const isSettings = item.path === '/settings';
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium tracking-wide transition-all group ${isSettings ? 'mt-auto mb-2' : ''} ${
                  isActive
                    ? `${item.color} text-on-surface shadow-card`
                    : 'text-outline hover:text-on-surface hover:bg-surface-dim/50'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] transition-colors ${isActive ? 'text-on-surface' : 'text-outline group-hover:text-on-surface'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.path === '/copilot' && (
                  <span className="ml-auto text-[9px] font-bold bg-gradient-to-r from-sky-200 to-violet-200 text-violet-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">AI</span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* New Scan CTA */}
        <div className="px-4 pb-5">
          <button
            onClick={() => setIsNewScanOpen(true)}
            className="w-full bg-gradient-to-r from-sky-200 to-violet-200 text-on-surface font-label-bold text-label-bold py-3 rounded-lg hover:shadow-elevated active:translate-y-0.5 transition-all flex items-center justify-center gap-2 border border-sky-200/50"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Scan
          </button>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="ml-0 md:ml-[260px] flex-1 flex flex-col min-h-screen bg-transparent relative z-0">
        {/* TopBar */}
        <header className="h-16 bg-white/80 glass border-b border-outline-variant/30 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex-1 max-w-xl flex items-center">
            <div className="relative w-full hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input
                className="w-full bg-surface-container border border-outline-variant/40 rounded-lg py-2 pl-10 pr-4 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-sky-200/50 focus:border-sky-200 transition-all"
                placeholder="Search investigations, agents, or assets..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 text-outline">
            <button className="w-9 h-9 rounded-lg hover:bg-surface-dim flex items-center justify-center transition-colors focus-ring">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button className="w-9 h-9 rounded-lg hover:bg-surface-dim flex items-center justify-center transition-colors focus-ring">
              <span className="material-symbols-outlined text-[20px]">help</span>
            </button>
            <div className="w-px h-6 bg-outline-variant/30 mx-1"></div>
            <button className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-200 to-violet-200 flex items-center justify-center text-on-surface transition-transform hover:scale-105 focus-ring">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 relative z-10 flex flex-col animate-fade-in">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/investigate/:incidentId" element={<InvestigationPage />} />
            <Route path="/investigate" element={<InvestigationPage />} />
            <Route path="/report/:incidentId" element={<ReportPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/history/:incidentId" element={<HistoricalPage />} />
            <Route path="/history" element={<HistoricalPage />} />
            <Route path="/copilot/:incidentId" element={<CopilotPage />} />
            <Route path="/copilot" element={<CopilotPage />} />
            <Route path="/knowledge" element={<div className="p-12 text-center font-headline-md text-outline">Knowledge Base — Coming Soon</div>} />
            <Route path="/settings" element={<div className="p-12 text-center font-headline-md text-outline">Settings — Coming Soon</div>} />
          </Routes>
        </div>
      </main>

      <NewScanModal isOpen={isNewScanOpen} onClose={() => setIsNewScanOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppLayout />
      </ToastProvider>
    </BrowserRouter>
  );
}
