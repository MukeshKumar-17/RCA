/**
 * Navigation items and app-wide constants
 */
export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'dashboard', activeColor: 'bg-brand-coral' },
  { path: '/investigate', label: 'Investigations', icon: 'troubleshoot', activeColor: 'bg-neo-pink' },
  { path: '/history', label: 'Historical Incidents', icon: 'history', activeColor: 'bg-brand-magenta' },
  { path: '/knowledge', label: 'Knowledge Base', icon: 'menu_book', activeColor: 'bg-brand-teal' },
  { path: '/settings', label: 'Settings', icon: 'settings', activeColor: 'bg-surface-variant' },
];

export const SEVERITY_CONFIG = {
  sev1: { label: 'SEV-1', bg: 'bg-brand-coral', text: 'text-on-surface' },
  sev2: { label: 'SEV-2', bg: 'bg-brand-yellow', text: 'text-on-surface' },
  sev3: { label: 'SEV-3', bg: 'bg-surface-dim', text: 'text-on-surface' },
};
