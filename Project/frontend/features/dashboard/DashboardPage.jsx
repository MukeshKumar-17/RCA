import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncidents } from '../../data/api';
import { useToast } from '../../components/shared/ToastContext';

/**
 * ConfidenceRing — SVG circular progress indicator
 */
function ConfidenceRing({ value, size = 80, stroke = 6, color = '#006b54' }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e6f0ea" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        className="confidence-ring transition-all duration-1000 ease-out" />
    </svg>
  );
}

/**
 * SkeletonCard — Loading placeholder
 */
function SkeletonCard() {
  return (
    <div className="bento-tile p-6 animate-pulse">
      <div className="h-4 w-28 bg-surface-container-high rounded mb-4"></div>
      <div className="h-10 w-20 bg-surface-container-high rounded mb-3"></div>
      <div className="h-4 w-36 bg-surface-container-high rounded"></div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="bento-tile p-5 animate-pulse flex items-center gap-5">
      <div className="w-12 h-12 rounded-2xl bg-surface-container-high shrink-0"></div>
      <div className="flex-1">
        <div className="h-5 w-56 bg-surface-container-high rounded mb-2"></div>
        <div className="h-4 w-40 bg-surface-container-high rounded"></div>
      </div>
      <div className="w-32 h-2.5 bg-surface-container-high rounded"></div>
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
      <div className="p-6 lg:p-8 h-full flex flex-col gap-6 xl:flex-row animate-fade-in overflow-y-auto">
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
    <div className="p-8 lg:p-12 h-full flex flex-col gap-6 xl:flex-row animate-fade-in overflow-y-auto">
      {/* Left Column */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Total Investigations */}
          <div className="bento-tile relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 opacity-10 transform group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-[120px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-3 h-3 rounded-full ${totalIncidents > 0 ? 'bg-primary animate-pulse-soft' : 'bg-outline-variant'}`}></div>
              <h2 className="text-label-md font-label-md uppercase tracking-wider text-outline">Investigations</h2>
            </div>
            <div className="text-display-lg font-display-lg text-on-surface mb-2">
              {totalIncidents}
            </div>
            <p className="text-body-md font-body-md text-outline">{completedIncidents} completed · {runningIncidents} running</p>
          </div>

          {/* Active Incidents */}
          <div className="bento-tile relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 opacity-10 transform group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-[120px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-3 h-3 rounded-full ${activeIncidents.length > 0 ? 'bg-error animate-pulse' : 'bg-outline-variant'}`}></div>
              <h2 className="text-label-md font-label-md uppercase tracking-wider text-outline">Active</h2>
            </div>
            <div className="text-display-lg font-display-lg text-error mb-2">
              {activeIncidents.length}
            </div>
            <p className="text-body-md font-body-md text-outline">
              {needsClarification > 0 ? `${needsClarification} need clarification` : runningIncidents > 0 ? 'Pipeline running' : 'No active incidents'}
            </p>
          </div>

          {/* AI Confidence */}
          <div className="bento-tile relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-primary-container"></div>
                  <h2 className="text-label-md font-label-md uppercase tracking-wider text-outline">AI Confidence</h2>
                </div>
                <div className="text-display-lg font-display-lg text-on-surface mb-2">
                  {avgConfidence > 0 ? `${avgConfidence}%` : '—'}
                </div>
                <p className="text-body-md font-body-md text-outline max-w-[140px]">
                  {completedIncidents > 0 ? `Avg. across ${completedIncidents} resolved` : 'No data yet'}
                </p>
              </div>
              {avgConfidence > 0 && (
                <div className="relative mt-2">
                  <ConfidenceRing value={avgConfidence} size={80} stroke={8} color="#006b54" />
                  <span className="absolute inset-0 flex items-center justify-center text-label-md font-label-md text-primary">{avgConfidence}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Investigations List */}
        <div className="bento-tile flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-headline-lg font-headline-lg text-on-surface">Investigations</h2>
              <p className="text-body-md font-body-md text-on-surface-variant mt-1">
                {totalIncidents > 0 ? 'AI agents analyzing root causes' : 'Start a new investigation to see results here'}
              </p>
            </div>
          </div>

          {incidents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4">
              <span className="material-symbols-outlined text-[64px] bg-gradient-to-br from-secondary to-teal-300 bg-clip-text text-transparent drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>search_off</span>
              <h3 className="text-headline-md font-headline-md text-on-surface">No Investigations Yet</h3>
              <p className="text-body-md font-body-md text-on-surface-variant text-center max-w-sm">
                Click "New Scan" in the sidebar to upload incident data and start your first AI-powered root cause analysis.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 stagger-in">
              {incidents.map((inc) => (
                <IncidentCard key={inc.id} incident={inc} navigate={navigate} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Recent Activity */}
      <aside className="w-full xl:w-[400px] flex flex-col gap-6">
        <div className="bento-tile flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-headline-lg font-headline-lg text-on-surface flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${runningIncidents > 0 ? 'bg-primary animate-pulse-soft' : 'bg-outline-variant'}`}></span>
              Recent Activity
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {incidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-symbols-outlined text-outline-variant text-[40px] mb-3">inbox</span>
                <p className="text-body-md font-body-md text-outline">No activity yet</p>
              </div>
            ) : (
              incidents.slice(0, 5).map((inc, index, arr) => (
                <ActivityItem key={inc.id} incident={inc} navigate={navigate} isLast={index === arr.length - 1} />
              ))
            )}
          </div>

          {/* Command Input */}
          <div className="mt-6 pt-5 border-t border-surface-variant flex items-center gap-3">
            <span className="material-symbols-outlined text-outline text-[20px]">terminal</span>
            <input
              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 py-2 font-mono text-[14px] text-on-surface placeholder:text-outline"
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
  const isRunning = incident.status === 'RUNNING' || incident.status === 'pending' || incident.status === 'running';
  const confidence = incident.rca?.rca_metadata?.overall_confidence || incident.confidence_ceiling || 0;
  const evidenceCompleteness = incident.evidence_completeness || 0;
  const title = incident.user_context || incident.rca?.rca_metadata?.affected_services?.[0] || 'Untitled';
  const rootCause = incident.rca?.root_cause?.title;

  const targetPath = isComplete ? `/report/${incident.id}` : `/investigate/${incident.id}`;

  return (
    <div className={`bento-tile p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-surface-container-lowest transition-all hover:shadow-bento-hover cursor-pointer ${isComplete ? 'opacity-90' : ''}`} onClick={() => navigate(targetPath)}>
      <div className="flex items-start gap-4 flex-1">
        <span className={`material-symbols-outlined text-[48px] shrink-0 drop-shadow-sm ${isComplete ? 'text-primary' : 'text-secondary'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {isComplete ? 'check_circle' : 'dns'}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-headline-md font-headline-md text-on-surface truncate leading-tight">{title}</h3>
            <span className={`px-3 py-1 text-label-sm font-label-sm uppercase rounded-full tracking-wider ${
              isComplete ? 'bg-primary-container text-on-primary-container' : incident.status === 'NEEDS_CLARIFICATION' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'
            }`}>
              {isComplete ? 'Complete' : incident.status === 'NEEDS_CLARIFICATION' ? 'Needs Input' : 'Running'}
            </span>
          </div>
          <p className="text-body-md font-body-md text-on-surface-variant truncate">
            {rootCause || (isComplete ? `Confidence: ${confidence}%` : `Evidence: ${evidenceCompleteness}%`)}
          </p>
        </div>
      </div>

      {!isComplete && (
        <div className="flex-1 w-full md:w-auto md:max-w-[220px]">
          <div className="flex justify-between text-label-md font-label-md text-on-surface-variant mb-2">
            <span>Evidence</span>
            <span className="text-on-surface font-bold">{evidenceCompleteness}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-surface-variant overflow-hidden">
            <div className="h-full bg-primary rounded-full progress-stripe transition-all duration-500" style={{ width: `${evidenceCompleteness}%` }}></div>
          </div>
        </div>
      )}

      <button className="w-10 h-10 rounded-xl bg-surface hover:bg-surface-container-high flex items-center justify-center transition-colors border border-surface-variant shrink-0 ml-2">
        <span className="material-symbols-outlined text-[20px] text-on-surface">chevron_right</span>
      </button>
    </div>
  );
}

function ActivityItem({ incident, navigate, isLast }) {
  const isComplete = incident.status === 'COMPLETE';
  const title = incident.user_context || 'Untitled';
  const created = incident.created_at ? new Date(incident.created_at) : null;
  const timeAgo = created ? getTimeAgo(created) : '';

  return (
    <div className="relative pl-10 cursor-pointer group" onClick={() => navigate(isComplete ? `/report/${incident.id}` : `/investigate/${incident.id}`)}>
      <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-[3px] border-surface-container-lowest shadow-sm z-10 ${
        isComplete ? 'bg-primary' : 'bg-secondary'
      }`}>
        <span className={`material-symbols-outlined text-[14px] text-white`}>
          {isComplete ? 'done_all' : 'psychology'}
        </span>
      </div>
      {!isLast && <div className="absolute left-[15px] top-8 w-0.5 h-[calc(100%+8px)] bg-surface-variant"></div>}
      <div className="bg-surface-container rounded-2xl p-4 border border-surface-variant group-hover:bg-surface-container-high transition-colors">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-label-sm font-label-sm uppercase tracking-wider ${isComplete ? 'text-primary' : 'text-secondary'}`}>
            {isComplete ? 'Completed' : 'In Progress'}
          </span>
          <span className="font-mono text-[12px] text-outline">{timeAgo}</span>
        </div>
        <p className="text-body-md font-body-md text-on-surface leading-relaxed truncate">{title}</p>
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
