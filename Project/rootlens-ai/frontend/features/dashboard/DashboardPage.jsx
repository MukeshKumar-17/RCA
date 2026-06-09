import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncidents } from '../../data/api';
import { useToast } from '../../components/shared/ToastContext';

/**
 * ConfidenceRing — SVG circular progress indicator
 */
function ConfidenceRing({ value, size = 80, stroke = 6, color = '#69D2E7' }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#edf2f7" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        className="confidence-ring" />
    </svg>
  );
}

/**
 * SkeletonCard — Loading placeholder
 */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-outline-variant/30 p-5 bg-white animate-pulse">
      <div className="h-3 w-24 bg-surface-dim rounded mb-3"></div>
      <div className="h-8 w-16 bg-surface-dim rounded mb-2"></div>
      <div className="h-3 w-32 bg-surface-dim rounded"></div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-lg border border-outline-variant/30 p-4 bg-white animate-pulse flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-surface-dim shrink-0"></div>
      <div className="flex-1">
        <div className="h-4 w-48 bg-surface-dim rounded mb-2"></div>
        <div className="h-3 w-32 bg-surface-dim rounded"></div>
      </div>
      <div className="w-24 h-2 bg-surface-dim rounded"></div>
    </div>
  );
}

/**
 * DashboardPage — Loads real incidents from the backend.
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getIncidents();
        if (!cancelled) {
          setIncidents(data.incidents || []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          toast.error(`Backend unavailable: ${err.message}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    // Poll every 10s for live updates
    const interval = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Compute stats from real data
  const totalIncidents = incidents.length;
  const runningIncidents = incidents.filter(i => i.status === 'RUNNING' || i.status === 'pending' || i.status === 'running').length;
  const completedIncidents = incidents.filter(i => i.status === 'COMPLETE').length;
  const needsClarification = incidents.filter(i => i.status === 'NEEDS_CLARIFICATION').length;

  const avgConfidence = completedIncidents > 0
    ? Math.round(
        incidents
          .filter(i => i.status === 'COMPLETE' && i.rca?.rca_metadata?.overall_confidence)
          .reduce((sum, i) => sum + (i.rca?.rca_metadata?.overall_confidence || 0), 0) /
        Math.max(incidents.filter(i => i.status === 'COMPLETE' && i.rca?.rca_metadata?.overall_confidence).length, 1)
      )
    : 0;

  const activeIncidents = incidents.filter(i => i.status !== 'COMPLETE');
  const recentComplete = incidents.filter(i => i.status === 'COMPLETE').slice(0, 2);

  if (loading && incidents.length === 0) {
    return (
      <div className="p-6 lg:p-8 flex-1 flex flex-col gap-6 xl:flex-row animate-fade-in">
        <div className="flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
          <div className="bg-white rounded-xl border border-outline-variant/30 p-6 flex-1">
            <div className="h-5 w-40 bg-surface-dim rounded mb-4"></div>
            <SkeletonRow /><div className="mt-3"><SkeletonRow /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 flex-1 flex flex-col gap-6 xl:flex-row animate-fade-in">
      {/* Left Column */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-in">
          {/* Total Investigations */}
          <div className="rounded-xl border border-outline-variant/30 p-6 bg-white shadow-card card-hover relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 opacity-[0.06] transform group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-[120px] text-sky-200" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2.5 h-2.5 rounded-full ${totalIncidents > 0 ? 'bg-emerald-400 animate-pulse-soft' : 'bg-outline-variant'}`}></div>
              <h2 className="font-label-bold text-[12px] uppercase tracking-widest text-outline">Investigations</h2>
            </div>
            <div className="font-headline-lg text-[36px] flex items-end gap-2 text-on-surface leading-none mb-1">
              {totalIncidents}
            </div>
            <p className="font-body-sm text-[13px] text-outline mt-2">{completedIncidents} completed · {runningIncidents} running</p>
          </div>

          {/* Active Incidents */}
          <div className="rounded-xl border border-outline-variant/30 p-6 bg-white shadow-card card-hover relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 opacity-[0.06] transform group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-[120px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2.5 h-2.5 rounded-full ${activeIncidents.length > 0 ? 'bg-error animate-pulse' : 'bg-outline-variant'}`}></div>
              <h2 className="font-label-bold text-[12px] uppercase tracking-widest text-outline">Active</h2>
            </div>
            <div className="font-headline-lg text-[36px] flex items-end gap-2 text-error leading-none mb-1">
              {activeIncidents.length}
            </div>
            <p className="font-body-sm text-[13px] text-outline mt-2">
              {needsClarification > 0 ? `${needsClarification} need clarification` : runningIncidents > 0 ? 'Pipeline running' : 'No active incidents'}
            </p>
          </div>

          {/* AI Confidence */}
          <div className="rounded-xl border border-outline-variant/30 p-6 bg-white shadow-card card-hover relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-400"></div>
                  <h2 className="font-label-bold text-[12px] uppercase tracking-widest text-outline">AI Confidence</h2>
                </div>
                <div className="font-headline-lg text-[36px] text-on-surface leading-none mb-1">
                  {avgConfidence > 0 ? `${avgConfidence}%` : '—'}
                </div>
                <p className="font-body-sm text-[13px] text-outline mt-2 max-w-[140px]">
                  {completedIncidents > 0 ? `Avg. across ${completedIncidents} resolved` : 'No data yet'}
                </p>
              </div>
              {avgConfidence > 0 && (
                <div className="relative mt-2">
                  <ConfidenceRing value={avgConfidence} size={72} stroke={6} color="#9723C9" />
                  <span className="absolute inset-0 flex items-center justify-center font-label-bold text-[14px] text-violet-400">{avgConfidence}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Investigations List */}
        <div className="bg-white rounded-xl border border-outline-variant/30 p-6 flex-1 flex flex-col shadow-card">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Investigations</h2>
              <p className="font-body-sm text-body-sm text-outline mt-0.5">
                {totalIncidents > 0 ? 'AI agents analyzing root causes' : 'Start a new investigation to see results here'}
              </p>
            </div>
          </div>

          {incidents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-lavender-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-violet-200 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>search_off</span>
              </div>
              <h3 className="font-headline-sm text-[16px] text-on-surface">No Investigations Yet</h3>
              <p className="font-body-sm text-body-sm text-outline text-center max-w-sm">
                Click "New Scan" in the sidebar to upload incident data and start your first AI-powered root cause analysis.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 stagger-in">
              {incidents.map((inc) => (
                <IncidentCard key={inc.id} incident={inc} navigate={navigate} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Recent Activity */}
      <aside className="w-full xl:w-[360px] flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-outline-variant/30 p-5 flex-1 flex flex-col shadow-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 tracking-tight">
              <span className={`w-2.5 h-2.5 rounded-full ${runningIncidents > 0 ? 'bg-violet-400 animate-pulse-soft' : 'bg-outline-variant'}`}></span>
              Recent Activity
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {incidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="material-symbols-outlined text-outline-variant text-[32px] mb-2">inbox</span>
                <p className="font-body-sm text-[12px] text-outline">No activity yet</p>
              </div>
            ) : (
              incidents.slice(0, 5).map((inc) => (
                <ActivityItem key={inc.id} incident={inc} navigate={navigate} />
              ))
            )}
          </div>

          {/* Command Input */}
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-outline text-[16px]">terminal</span>
            <input
              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 py-1 font-label-mono text-[12px] text-on-surface placeholder:text-outline"
              placeholder="Inject context to active agents..."
              type="text"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

function IncidentCard({ incident, navigate }) {
  const isComplete = incident.status === 'COMPLETE';
  const isRunning = incident.status === 'RUNNING' || incident.status === 'running';
  const confidence = incident.rca?.rca_metadata?.overall_confidence || incident.confidence_ceiling || 0;
  const evidenceCompleteness = incident.evidence_completeness || 0;
  const title = incident.user_context || incident.rca?.rca_metadata?.affected_services?.[0] || 'Untitled';
  const rootCause = incident.rca?.root_cause?.title;

  const targetPath = isComplete ? `/report/${incident.id}` : `/investigate/${incident.id}`;

  return (
    <div className={`rounded-lg border border-outline-variant/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white transition-all card-hover group ${isComplete ? 'opacity-80' : 'hover:bg-surface-container/50'}`}>
      <div className="flex items-start gap-4 flex-1">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isComplete ? 'bg-mint-50' : 'bg-error-container'}`}>
          <span className={`material-symbols-outlined text-[20px] ${isComplete ? 'text-sky-200' : 'text-error'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {isComplete ? 'check_circle' : 'dns'}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-label-bold text-[15px] text-on-surface truncate">{title}</h3>
            <span className={`px-2 py-0.5 font-label-mono text-[10px] uppercase rounded-full border shrink-0 ${
              isComplete ? 'bg-mint-50 text-sky-200 border-sky-200/20' : 'bg-error/10 text-error border-error/20'
            }`}>
              {isComplete ? 'Complete' : incident.status === 'NEEDS_CLARIFICATION' ? 'Needs Input' : 'Running'}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-outline truncate">
            {rootCause || (isComplete ? `Confidence: ${confidence}%` : `Evidence: ${evidenceCompleteness}%`)}
          </p>
        </div>
      </div>

      {!isComplete && (
        <div className="flex-1 w-full md:w-auto md:max-w-[200px]">
          <div className="flex justify-between font-label-mono text-label-mono text-outline mb-1.5">
            <span>Evidence</span>
            <span className="text-on-surface">{evidenceCompleteness}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-dim overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-200 to-sky-100 rounded-full progress-stripe" style={{ width: `${evidenceCompleteness}%` }}></div>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate(targetPath)}
        className="w-8 h-8 rounded-lg bg-surface-container-lowest hover:bg-mint-50 flex items-center justify-center transition-colors border border-outline-variant/30 shrink-0"
      >
        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    </div>
  );
}

function ActivityItem({ incident, navigate }) {
  const isComplete = incident.status === 'COMPLETE';
  const title = incident.user_context || 'Untitled';
  const created = incident.created_at ? new Date(incident.created_at) : null;
  const timeAgo = created ? getTimeAgo(created) : '';

  return (
    <div className="relative pl-8 cursor-pointer" onClick={() => navigate(isComplete ? `/report/${incident.id}` : `/investigate/${incident.id}`)}>
      <div className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-card z-10 ${
        isComplete ? 'bg-mint-50' : 'bg-lavender-50'
      }`}>
        <span className={`material-symbols-outlined text-[12px] ${isComplete ? 'text-sky-200' : 'text-violet-200'}`}>
          {isComplete ? 'done_all' : 'psychology'}
        </span>
      </div>
      <div className="absolute left-[11px] top-6 w-px h-[calc(100%+8px)] bg-outline-variant/30"></div>
      <div className="bg-surface-container/50 rounded-lg p-3 border border-outline-variant/20 hover:bg-surface-container/70 transition-colors">
        <div className="flex justify-between items-center mb-1.5">
          <span className={`font-label-bold text-[11px] ${isComplete ? 'text-sky-200' : 'text-violet-400'}`}>
            {isComplete ? 'Completed' : 'In Progress'}
          </span>
          <span className="font-label-mono text-[10px] text-outline">{timeAgo}</span>
        </div>
        <p className="font-body-sm text-[13px] text-on-surface leading-relaxed truncate">{title}</p>
      </div>
    </div>
  );
}

function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
