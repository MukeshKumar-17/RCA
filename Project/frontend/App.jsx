import { ToastProvider } from './components/shared/ToastContext';
import { BrowserRouter, Routes, Route, NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import DashboardPage from './features/dashboard/DashboardPage';
import InvestigationPage from './features/investigation/InvestigationPage';
import ReportPage from './features/report/ReportPage';
import HistoricalPage from './features/historical/HistoricalPage';
import CopilotPage from './features/chat/CopilotPage';
import NewScanPage from './features/scan/NewScanPage';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/investigate', label: 'Investigations', icon: 'search_check' },
  { path: '/copilot', label: 'AI Copilot', icon: 'smart_toy' },
  { path: '/history', label: 'Historical', icon: 'history' },
  { path: '/knowledge', label: 'Knowledge Base', icon: 'menu_book' },
  { path: '/settings', label: 'Settings', icon: 'settings', isFooter: true },
];

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* ── Sidebar ── */}
      <nav className="bg-surface border-r border-outline-variant flex flex-col h-screen py-6 px-4 space-y-8 w-64 hidden md:flex shrink-0 fixed left-0 top-0 z-50">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
             <span className="material-symbols-outlined text-on-primary-container text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lens_blur</span>
          </div>
          <div>
            <h1 className="text-headline-md font-headline-md text-on-surface leading-tight">RootLens</h1>
            <p className="text-label-sm font-label-sm text-outline tracking-widest uppercase">AI PLATFORM</p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/new-scan')}
          className="bg-primary hover:bg-[#00513e] text-on-primary w-full py-3 rounded-full flex items-center justify-center space-x-2 transition-colors duration-200"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          <span className="text-label-md font-label-md">New Scan</span>
        </button>

        {/* Navigation */}
        <ul className="flex-1 space-y-2 mt-6 flex flex-col">
          {navItems.filter(i => !i.isFooter).map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? 'text-on-primary-container bg-primary-container scale-95'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="text-label-md font-label-md">{item.label}</span>
                  {item.path === '/copilot' && (
                    <span className="ml-auto bg-primary-container text-on-primary-container text-[10px] font-bold px-2 py-0.5 rounded-full">AI</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Footer Navigation */}
        <ul className="pt-4 border-t border-outline-variant">
          {navItems.filter(i => i.isFooter).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? 'text-on-primary-container bg-primary-container'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="text-label-md font-label-md">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Main Content ── */}
      <main className="ml-0 md:ml-[260px] flex-1 flex flex-col h-screen overflow-hidden bg-transparent relative z-0">
        {/* Page Content fills full height */}
        <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/new-scan" element={<NewScanPage />} />
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
