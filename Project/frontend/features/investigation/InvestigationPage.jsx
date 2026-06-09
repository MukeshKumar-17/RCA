import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getReport, getSimilarIncidents, pollReport } from '../../data/api';
import { useToast } from '../../components/shared/ToastContext';

/**
 * InvestigationPage — Investigation workspace showing real pipeline data.
 */
export default function InvestigationPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!incidentId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getReport(incidentId);
        if (cancelled) return;
        setIncident(data);
        setError(null);

        // If the investigation is still running, poll for completion
        if (data.status !== 'COMPLETE' && data.status !== 'NEEDS_CLARIFICATION') {
          setPolling(true);
          try {
            const completed = await pollReport(incidentId, {
              intervalMs: 3000,
              maxAttempts: 60,
              onProgress: (report) => {
                if (!cancelled) setIncident(report);
              },
            });
            if (!cancelled) {
              setIncident(completed);
              setPolling(false);
            }
          } catch (pollErr) {
            if (!cancelled) {
              setPolling(false);
              setError(pollErr.message);
            }
          }
        }

        // Load similar incidents
        try {
          const sim = await getSimilarIncidents(incidentId);
          if (!cancelled) setSimilar(sim.matches || []);
        } catch (err) {
          // OK if no similar found
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          toast.error(`Failed to load investigation: ${err.message}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [incidentId]);

  // No incident selected
  if (!incidentId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-lavender-50 flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-violet-200 text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>troubleshoot</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2 tracking-tight">No Investigation Selected</h2>
        <p className="font-body-md text-body-md text-outline max-w-md text-center leading-relaxed">
          Start a new investigation via "New Scan" or select one from the Dashboard.
        </p>
        <Link to="/" className="mt-6 bg-[#008B8B] text-white font-label-bold text-[12px] py-2.5 px-6 rounded-lg hover:shadow-elevated transition-all border-2 border-black">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-200 to-violet-400 flex items-center justify-center animate-pulse-soft">
            <span className="material-symbols-outlined text-white text-[28px] animate-spin" style={{ animationDuration: '2s' }}>progress_activity</span>
          </div>
          <p className="font-body-md text-outline">Loading investigation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !incident) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-error-container flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-error text-[32px]">error</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">Investigation Not Found</h2>
        <p className="font-body-md text-body-md text-outline max-w-md text-center">{error}</p>
        <Link to="/" className="mt-6 bg-[#008B8B] text-white font-label-bold text-[12px] py-2.5 px-6 rounded-lg hover:shadow-elevated transition-all border-2 border-black">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Derive data from the real incident
  const agentOutputs = incident?.agent_outputs || {};
  const logOut = agentOutputs.logs || {};
  const timelineOut = agentOutputs.timeline || {};
  const gitOut = agentOutputs.git || {};
  const mcpMatches = agentOutputs.mcp_matches || [];
  const rca = incident?.rca || {};

  const hasLogs = !!(logOut.events && logOut.events.length > 0);
  const hasTimeline = !!(timelineOut.timeline && timelineOut.timeline.length > 0);
  const hasGit = !!(gitOut.changes && gitOut.changes.length > 0);
  const hasRca = !!(rca.root_cause);

  const isComplete = incident?.status === 'COMPLETE';
  const confidence = rca?.rca_metadata?.overall_confidence || rca?.root_cause?.confidence || incident?.confidence_ceiling || 0;

  // Derive runbook steps from real data
  const steps = [
    { title: 'Parsing Logs', description: hasLogs ? `Found ${logOut.events.length} events. ${logOut.log_summary?.overall_health || ''}` : logOut.analyst_notes || 'No log data provided.', status: hasLogs ? 'done' : (logOut.analyst_notes ? 'done' : 'pending') },
    { title: 'Building Timeline', description: hasTimeline ? `${timelineOut.timeline.length} events across ${timelineOut.metrics?.total_incident_minutes || '?'} minutes.` : timelineOut.analyst_notes || 'No timeline data provided.', status: hasTimeline ? 'done' : (timelineOut.analyst_notes ? 'done' : 'pending') },
    { title: 'Analyzing Git Changes', description: hasGit ? `${gitOut.diff_summary?.files_changed || 0} files, risk score: ${gitOut.diff_summary?.deployment_risk_score || 0}/100.` : gitOut.analyst_notes || 'No diff data provided.', status: hasGit ? 'done' : (gitOut.analyst_notes ? 'done' : 'pending') },
    { title: 'Searching Historical', description: mcpMatches.length > 0 ? `Found ${mcpMatches.length} similar incident(s).` : 'No historical matches found.', status: isComplete ? 'done' : (polling ? 'active' : 'pending') },
    { title: 'Correlating Evidence', description: isComplete ? `Evidence completeness: ${incident?.evidence_completeness || 0}%` : 'Aggregating findings...', status: isComplete ? 'done' : (hasLogs || hasTimeline || hasGit ? 'active' : 'pending') },
    { title: 'Generating RCA', description: hasRca ? `Confidence: ${confidence}%` : (polling ? 'AI synthesizing root cause...' : 'Waiting...'), status: hasRca ? 'done' : (isComplete ? 'done' : 'pending') },
  ];

  return (
    <div className="h-full flex overflow-hidden animate-fade-in">
      {/* Left: Runbook */}
      <aside className="w-[280px] h-full flex flex-col overflow-y-auto p-5 bg-white border-r border-outline-variant/30 shrink-0">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 pb-3 border-b border-outline-variant/20">
          <h2 className="font-headline-sm text-[18px] text-on-surface tracking-tight">Runbook</h2>
          <span className="font-label-mono text-label-mono bg-lavender-50 text-violet-400 rounded-md px-2 py-1 text-[9px] truncate max-w-[100px]">
            {incidentId.slice(0, 8)}
          </span>
        </div>
        <div className="flex flex-col gap-2 stagger-in">
          {steps.map((step, i) => (
            <RunbookStep key={i} status={step.status} title={step.title} description={step.description} />
          ))}
        </div>
      </aside>

      {/* Center: Live Feed */}
      <section className="flex-1 h-full flex flex-col bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-mint-50 to-sky-100/30 border-b border-outline-variant/20 px-5 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${polling ? 'bg-error animate-pulse' : isComplete ? 'bg-emerald-400' : 'bg-outline-variant'}`}></div>
            <h2 className="font-headline-sm text-[18px] text-on-surface tracking-tight">
              {polling ? 'Live Activity Feed' : isComplete ? 'Investigation Complete' : 'Activity Feed'}
            </h2>
          </div>
          {isComplete && (
            <Link to={`/report/${incidentId}`} className="font-label-bold text-[11px] text-violet-400 bg-white rounded-md px-3 py-1.5 border border-violet-200/30 hover:bg-lavender-50 transition-colors">
              View Full Report →
            </Link>
          )}
        </div>
        <div className="flex-grow p-5 overflow-y-auto flex flex-col gap-5 stagger-in">
          {/* Log Agent Findings */}
          {hasLogs && (
            <AgentMessage
              name="Log Agent" icon="smart_toy" color="mint-50" textColor="sky-200"
              timestamp={logOut.log_summary?.time_range_start?.slice(11, 19) || ''}
            >
              <p className="font-body-md text-body-md text-on-surface mb-3 leading-relaxed">
                Analyzed logs: <strong>{logOut.log_summary?.total_lines || 0}</strong> lines, health status: <strong>{logOut.log_summary?.overall_health || 'Unknown'}</strong>.
                {logOut.log_summary?.dominant_service && <> Dominant service: <code className="bg-white px-1.5 py-0.5 rounded text-[12px] font-label-mono border border-outline-variant/30">{logOut.log_summary.dominant_service}</code>.</>}
              </p>
              {logOut.events.slice(0, 3).map((ev) => (
                <div key={ev.event_id} className={`text-[12px] font-label-mono p-2 rounded mb-1 border-l-2 ${
                  ev.severity === 'CRITICAL' ? 'bg-error/5 border-error text-error' :
                  ev.severity === 'ERROR' ? 'bg-error/5 border-error/50 text-on-surface' :
                  'bg-surface-container/50 border-outline-variant text-on-surface'
                }`}>
                  <span className="font-bold">[{ev.event_id}] [{ev.severity}]</span> {ev.message}
                </div>
              ))}
              {logOut.events.length > 3 && (
                <p className="font-label-mono text-[10px] text-outline mt-1">+ {logOut.events.length - 3} more events</p>
              )}
            </AgentMessage>
          )}

          {/* Timeline Agent Findings */}
          {hasTimeline && (
            <AgentMessage
              name="Timeline Agent" icon="timeline" color="lavender-50" textColor="violet-200"
              timestamp={timelineOut.metrics?.first_signal_timestamp?.slice(11, 19) || ''}
              align="right"
            >
              <p className="font-body-md text-body-md text-on-surface mb-3 leading-relaxed">
                Reconstructed timeline with <strong>{timelineOut.timeline.length}</strong> events.
                {timelineOut.metrics?.total_incident_minutes && <> Total duration: <strong>{timelineOut.metrics.total_incident_minutes} minutes</strong>.</>}
              </p>
              {timelineOut.timeline.slice(0, 4).map((ev) => (
                <div key={ev.event_id} className="flex items-start gap-2 mb-1.5">
                  <span className={`font-label-mono text-[9px] px-1.5 py-0.5 rounded-full uppercase shrink-0 ${
                    ev.phase === 'DETECTION' ? 'bg-sky-100/30 text-sky-200' :
                    ev.phase === 'MITIGATION' ? 'bg-mint-50 text-sky-200' :
                    ev.phase === 'RESOLUTION' ? 'bg-emerald-50 text-emerald-500' :
                    'bg-lavender-50 text-violet-400'
                  }`}>{ev.phase?.slice(0, 3)}</span>
                  <span className="font-body-sm text-[12px] text-on-surface">{ev.action}</span>
                </div>
              ))}
            </AgentMessage>
          )}

          {/* Git Agent Findings */}
          {hasGit && (
            <AgentMessage
              name="Git Agent" icon="code" color="lavender-50" textColor="violet-400"
              timestamp=""
            >
              <p className="font-body-md text-body-md text-on-surface mb-3 leading-relaxed">
                Analyzed diff: <strong>{gitOut.diff_summary?.files_changed || 0}</strong> files changed.
                Deployment risk score: <strong>{gitOut.diff_summary?.deployment_risk_score || 0}/100</strong>.
              </p>
              {gitOut.changes.slice(0, 3).map((ch) => (
                <div key={ch.change_id} className={`rounded-lg overflow-hidden border mb-2 ${
                  ch.risk_level === 'CRITICAL' ? 'border-error/30' : ch.risk_level === 'HIGH' ? 'border-violet-200/30' : 'border-outline-variant/20'
                }`}>
                  <div className="bg-inverse-surface px-3 py-1.5 text-inverse-on-surface font-label-mono text-[11px] flex justify-between">
                    <span>{ch.file}</span>
                    <span className={`${ch.risk_level === 'CRITICAL' ? 'text-error' : 'text-outline-variant'}`}>{ch.risk_level}</span>
                  </div>
                  <div className="p-2 font-body-sm text-[12px] text-on-surface bg-white">{ch.description}</div>
                </div>
              ))}
            </AgentMessage>
          )}

          {/* Polling state */}
          {polling && (
            <div className="flex items-center justify-center py-4">
              <div className="bg-lavender-50 rounded-lg p-3 flex items-center gap-2 border border-violet-200/20">
                <span className="material-symbols-outlined text-violet-400 text-[16px] animate-spin" style={{ animationDuration: '2s' }}>progress_activity</span>
                <span className="font-label-bold text-[12px] text-on-surface">AI agents analyzing — this may take 30-60 seconds...</span>
              </div>
            </div>
          )}

          {/* No data state */}
          {!hasLogs && !hasTimeline && !hasGit && !polling && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="material-symbols-outlined text-outline-variant text-[40px]">search_off</span>
              <p className="font-body-md text-outline text-center">No agent findings available for this investigation.</p>
            </div>
          )}
        </div>
      </section>

      {/* Right: RCA Summary */}
      <aside className="w-[280px] h-full flex flex-col overflow-y-auto p-5 bg-white border-l border-outline-variant/30 shrink-0 gap-5">
        {/* Confidence */}
        <div className="rounded-xl border border-outline-variant/20 bg-gradient-to-b from-lavender-50/30 to-white p-5 flex flex-col items-center gap-3">
          <h2 className="font-label-bold text-label-bold uppercase tracking-widest text-outline self-start">RCA Confidence</h2>
          <div className="relative">
            <svg width="100" height="100" className="transform -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#edf2f7" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#gradient)" strokeWidth="8"
                strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - confidence/100)}
                strokeLinecap="round" className="confidence-ring" />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#69D2E7" />
                  <stop offset="100%" stopColor="#9723C9" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="font-headline-md text-[28px] text-on-surface leading-none">{confidence || '—'}</span>
              <span className="text-[11px] text-outline">{confidence ? 'percent' : ''}</span>
            </div>
          </div>
          <p className="font-body-sm text-[12px] text-outline text-center leading-relaxed">
            {hasRca
              ? rca.root_cause.description?.slice(0, 100) + '...'
              : polling ? 'Waiting for analysis...' : 'No RCA generated yet.'}
          </p>
        </div>

        {/* Top Candidates */}
        {hasRca && (
          <div>
            <h2 className="font-label-bold text-label-bold uppercase tracking-widest text-outline mb-3">Root Cause</h2>
            <div className="flex flex-col gap-2">
              <div className="rounded-lg p-3.5 bg-gradient-to-r from-lavender-50 to-lavender-50/40 border border-violet-200/20 card-hover">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-label-bold text-[13px] text-on-surface">{rca.root_cause.title}</h3>
                  <span className="font-label-mono text-[10px] text-violet-400 bg-white rounded px-1.5 py-0.5 border border-violet-200/30 shrink-0 ml-1">
                    {rca.root_cause.confidence}%
                  </span>
                </div>
                <p className="font-body-sm text-[12px] text-outline leading-relaxed">
                  {rca.root_cause.description?.slice(0, 120)}
                </p>
              </div>
              {rca.contributing_factors?.slice(0, 2).map((cf) => (
                <div key={cf.factor_id} className="rounded-lg border border-outline-variant/20 p-3.5 hover:bg-surface-container/30 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-label-bold text-[13px] text-outline">{cf.title}</h3>
                    <span className="font-label-mono text-[10px] text-outline bg-surface-dim rounded px-1.5 py-0.5 shrink-0 ml-1">{cf.confidence}%</span>
                  </div>
                  <p className="font-body-sm text-[12px] text-outline leading-relaxed">{cf.description?.slice(0, 80)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Incidents */}
        <div className="mt-auto">
          <h2 className="font-label-bold text-label-bold uppercase tracking-widest text-outline mb-3">Similar Incidents</h2>
          <div className="flex flex-col gap-2">
            {similar.length > 0 ? similar.slice(0, 3).map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg border border-outline-variant/20 bg-white hover:bg-mint-50/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/report/${m.id}`)}>
                <span className="font-body-sm text-[12px] text-on-surface truncate">{(m.user_context || 'Untitled').slice(0, 30)}</span>
                <span className="font-label-mono text-[11px] text-sky-200 font-bold shrink-0 ml-2">Match</span>
              </div>
            )) : (
              <p className="font-body-sm text-[11px] text-outline">No similar incidents found.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function AgentMessage({ name, icon, color, textColor, timestamp, children, align }) {
  const isRight = align === 'right';
  return (
    <div className={`flex flex-col gap-2 max-w-[85%] ${isRight ? 'self-end' : ''} animate-slide-up hover:scale-[1.01] transition-transform`}>
      <div className={`flex items-center gap-2 mb-1 ${isRight ? 'justify-end' : ''}`}>
        {isRight && <span className="font-label-mono text-[10px] text-outline mr-auto">{timestamp}</span>}
        {!isRight && (
          <div className={`w-7 h-7 rounded-lg bg-${color} flex items-center justify-center shadow-sm`}>
            <span className={`material-symbols-outlined text-${textColor} text-[14px]`}>{icon}</span>
          </div>
        )}
        <span className="font-label-bold text-[12px] text-on-surface">{name}</span>
        {!isRight && <span className="font-label-mono text-[10px] text-outline ml-auto">{timestamp}</span>}
        {isRight && (
          <div className={`w-7 h-7 rounded-lg bg-${color} flex items-center justify-center shadow-sm`}>
            <span className={`material-symbols-outlined text-${textColor} text-[14px]`}>{icon}</span>
          </div>
        )}
      </div>
      <div className={`${isRight ? 'bg-mint-50/40 border-sky-200/20' : 'bg-surface-container/40 border-outline-variant/20'} rounded-lg border p-4 shadow-sm`}>
        {children}
      </div>
    </div>
  );
}

function RunbookStep({ status, title, description }) {
  const isDone = status === 'done';
  const isActive = status === 'active';
  return (
    <div className={`rounded-lg p-3 flex items-start gap-3 transition-all ${
      isDone ? 'bg-surface-container/30 opacity-70' :
      isActive ? 'bg-gradient-to-r from-mint-50/50 to-sky-100/20 border border-sky-200/30 shadow-card' :
      'bg-surface-container/20 border border-dashed border-outline-variant/30'
    }`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        isDone ? 'bg-mint-50 text-sky-200' :
        isActive ? 'bg-white border-2 border-sky-200' :
        'bg-surface-dim'
      }`}>
        {isDone && <span className="material-symbols-outlined text-[14px]">check</span>}
        {isActive && <span className="material-symbols-outlined text-[14px] text-sky-200 animate-spin">progress_activity</span>}
      </div>
      <div>
        <h3 className={`font-label-bold text-[12px] ${isActive ? 'text-on-surface' : isDone ? 'text-outline' : 'text-outline-variant'}`}>{title}</h3>
        <p className={`font-body-sm text-[11px] mt-0.5 leading-relaxed ${isActive ? 'text-outline' : 'text-outline-variant'}`}>{description}</p>
      </div>
    </div>
  );
}
