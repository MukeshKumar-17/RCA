import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReport } from '../../data/api';
import { useToast } from '../../components/shared/ToastContext';

/**
 * ReportPage — Loads and renders a real RCA report from the backend.
 */
export default function ReportPage() {
  const { incidentId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        if (!cancelled) {
          setReport(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          toast.error(`Failed to load report: ${err.message}`);
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
      <div className="h-full flex flex-col items-center justify-center p-12 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-lavender-50 flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-violet-200 text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2 tracking-tight">No Report Selected</h2>
        <p className="font-body-md text-body-md text-outline max-w-md text-center leading-relaxed">Select an incident from the Dashboard or Investigations view to see the full RCA report.</p>
        <Link to="/" className="mt-6 bg-[#008B8B] text-white font-label-bold text-[12px] py-2.5 px-6 rounded-lg hover:shadow-elevated transition-all border-2 border-black">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
        <div className="h-5 w-32 bg-surface-dim rounded mb-4 animate-pulse"></div>
        <div className="h-10 w-96 bg-surface-dim rounded mb-2 animate-pulse"></div>
        <div className="h-4 w-64 bg-surface-dim rounded mb-8 animate-pulse"></div>
        <div className="bg-white rounded-xl border border-outline-variant/20 p-6 mb-5 animate-pulse">
          <div className="h-4 w-40 bg-surface-dim rounded mb-4"></div>
          <div className="h-16 w-full bg-surface-dim rounded"></div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-surface-dim rounded-xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  // Not complete yet
  if (report?.status !== 'COMPLETE') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-lavender-50 flex items-center justify-center mb-5 animate-pulse-soft">
          <span className="material-symbols-outlined text-violet-200 text-[32px] animate-spin" style={{ animationDuration: '3s' }}>progress_activity</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">Analysis In Progress</h2>
        <p className="font-body-md text-body-md text-outline max-w-md text-center mb-4">
          Status: {report?.status || 'Unknown'}. Evidence completeness: {report?.evidence_completeness || 0}%.
        </p>
        <Link to={`/investigate/${incidentId}`} className="bg-[#008B8B] text-white font-label-bold text-[12px] py-2.5 px-6 rounded-lg hover:shadow-elevated transition-all border-2 border-black">
          View Investigation
        </Link>
      </div>
    );
  }

  // Extract real RCA data
  const rca = report.rca || {};
  const meta = rca.rca_metadata || {};
  const rootCause = rca.root_cause || {};
  const actionItems = rca.action_items || [];
  const contributingFactors = rca.contributing_factors || [];
  const prevention = rca.prevention || {};
  const whatWentWell = rca.what_went_well || [];
  const openQuestions = rca.open_questions || [];
  const impact = rca.impact || {};
  const rcaTimeline = rca.timeline || [];

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Report Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
          <span className="font-label-mono text-label-mono text-outline bg-surface-container rounded-md px-2 py-1 text-[10px] truncate max-w-[120px]">
            {incidentId.slice(0, 8)}...
          </span>
          <span className="px-2 py-0.5 bg-mint-50 text-sky-200 font-label-mono text-[10px] uppercase rounded-full">Complete</span>
          {meta.severity && (
            <span className="px-2 py-0.5 bg-error/10 text-error font-label-mono text-[10px] uppercase rounded-full border border-error/20">{meta.severity}</span>
          )}
        </div>
        <h1 className="font-headline-lg text-[36px] text-on-surface tracking-tight leading-tight mb-2">Root Cause Analysis Report</h1>
        <p className="font-body-md text-outline">
          {report.user_context || 'Untitled Investigation'} · Confidence: {meta.overall_confidence || rootCause.confidence || 0}%
        </p>
      </div>

      <div className="flex flex-col gap-5 stagger-in">
        {/* Executive Summary & Confidence Split */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 bg-gradient-to-br from-lavender-50/50 to-mint-50/30 rounded-xl border border-outline-variant/20 p-6 shadow-card flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-violet-400 text-[18px]">summarize</span>
              <h2 className="font-label-bold text-[13px] uppercase tracking-widest text-outline">Executive Summary</h2>
            </div>
            <p className="font-body-lg text-[15px] text-on-surface leading-relaxed flex-1">
              {rca.executive_summary || 'No executive summary available.'}
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-outline-variant/20 p-6 shadow-card flex flex-col items-center justify-center text-center">
            <h2 className="font-label-bold text-[13px] uppercase tracking-widest text-outline mb-4">Overall Confidence</h2>
            <div className="relative mb-2">
              <svg width="100" height="100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#edf2f7" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="url(#conf-gradient)" strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - (meta.overall_confidence || rootCause.confidence || 0)/100)}
                  strokeLinecap="round" className="confidence-ring" />
                <defs>
                  <linearGradient id="conf-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#69D2E7" />
                    <stop offset="100%" stopColor="#9723C9" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="font-headline-md text-[28px] text-on-surface leading-none">{meta.overall_confidence || rootCause.confidence || '—'}</span>
                <span className="text-[11px] text-outline">%</span>
              </div>
            </div>
            <p className="font-body-sm text-[12px] text-outline mt-2">AI synthesis probability</p>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Duration', value: meta.incident_duration || impact.duration_minutes ? `${impact.duration_minutes} min` : '—', icon: 'schedule', bg: 'bg-mint-50' },
            { label: 'Severity', value: meta.severity || '—', icon: 'priority_high', bg: 'bg-error-container' },
            { label: 'Services', value: `${meta.affected_services?.length || impact.services_affected?.length || 0}`, icon: 'dns', bg: 'bg-sky-100/30' },
            { label: 'Evidence', value: `${report.evidence_completeness || 0}%`, icon: 'database', bg: 'bg-lavender-50' },
          ].map((m) => (
            <div key={m.label} className={`${m.bg} rounded-xl p-4 border border-outline-variant/10 shadow-sm transition-transform hover:scale-[1.02]`}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[14px] text-outline">{m.icon}</span>
                <span className="font-label-bold text-[10px] uppercase tracking-widest text-outline">{m.label}</span>
              </div>
              <div className="font-headline-sm text-[22px] text-on-surface">{m.value}</div>
            </div>
          ))}
        </div>

        {/* Root Cause */}
        {rootCause.title && (
          <div className="bg-white rounded-xl border border-outline-variant/20 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-error text-[18px]">target</span>
              <h2 className="font-label-bold text-[13px] uppercase tracking-widest text-outline">Root Cause</h2>
              <span className="ml-auto font-label-mono text-[10px] text-violet-400 bg-lavender-50 rounded px-2 py-0.5">{rootCause.confidence || 0}% confidence</span>
            </div>
            <h3 className="font-headline-sm text-[18px] text-on-surface mb-3">{rootCause.title}</h3>
            <p className="font-body-md text-body-md text-outline leading-relaxed mb-4">{rootCause.description}</p>

            {/* Causal Chain */}
            {rootCause.causal_chain?.length > 0 && (
              <div className="flex flex-col gap-0">
                {rootCause.causal_chain.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-200 to-violet-200 flex items-center justify-center shrink-0 text-white text-[11px] font-bold">{i + 1}</div>
                      {i < rootCause.causal_chain.length - 1 && <div className="w-px h-6 bg-outline-variant/30"></div>}
                    </div>
                    <div className="pb-4">
                      <p className="font-body-sm text-[13px] text-on-surface">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Evidence references */}
            {rootCause.evidence?.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {rootCause.evidence.map((ev) => (
                  <span key={ev} className="font-label-mono text-[9px] text-violet-400 bg-lavender-50 rounded px-1.5 py-0.5 uppercase">{ev}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contributing Factors */}
        {contributingFactors.length > 0 && (
          <div className="bg-white rounded-xl border border-outline-variant/20 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-violet-200 text-[18px]">account_tree</span>
              <h2 className="font-label-bold text-[13px] uppercase tracking-widest text-outline">Contributing Factors</h2>
            </div>
            <div className="flex flex-col gap-2">
              {contributingFactors.map((cf) => (
                <div key={cf.factor_id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-container/30 border border-outline-variant/10">
                  <span className="font-label-mono text-[10px] text-violet-400 bg-lavender-50 rounded px-2 py-0.5 shrink-0 mt-0.5">{cf.confidence}%</span>
                  <div className="flex-1">
                    <p className="font-label-bold text-[13px] text-on-surface">{cf.title}</p>
                    <p className="font-body-sm text-[11px] text-outline mt-0.5">{cf.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {rcaTimeline.length > 0 && (
          <div className="bg-white rounded-xl border border-outline-variant/20 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-sky-200 text-[18px]">timeline</span>
              <h2 className="font-label-bold text-[13px] uppercase tracking-widest text-outline">Incident Timeline</h2>
            </div>
            <div className="flex flex-col gap-0">
              {rcaTimeline.map((ev, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full shrink-0 mt-1 ${
                      ev.phase === 'DETECTION' ? 'bg-sky-200' :
                      ev.phase === 'MITIGATION' ? 'bg-violet-200' :
                      ev.phase === 'RESOLUTION' ? 'bg-emerald-400' :
                      'bg-outline-variant'
                    }`}></div>
                    {i < rcaTimeline.length - 1 && <div className="w-px h-8 bg-outline-variant/30"></div>}
                  </div>
                  <div className="pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-label-mono text-[10px] text-outline">{ev.timestamp?.slice(11, 19) || ''}</span>
                      <span className={`font-label-mono text-[9px] px-1.5 py-0.5 rounded-full uppercase ${
                        ev.phase === 'DETECTION' ? 'bg-sky-100/30 text-sky-200' :
                        ev.phase === 'MITIGATION' ? 'bg-lavender-50 text-violet-400' :
                        ev.phase === 'RESOLUTION' ? 'bg-mint-50 text-emerald-600' :
                        'bg-surface-dim text-outline'
                      }`}>{ev.phase}</span>
                    </div>
                    <p className="font-body-sm text-[12px] text-on-surface mt-0.5">{ev.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <div className="bg-white rounded-xl border border-outline-variant/20 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-sky-200 text-[18px]">task_alt</span>
              <h2 className="font-label-bold text-[13px] uppercase tracking-widest text-outline">Action Items</h2>
            </div>
            <div className="flex flex-col gap-2">
              {actionItems.map((item) => (
                <div key={item.item_id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-container/30 border border-outline-variant/10">
                  <span className={`font-label-mono text-[9px] px-2 py-0.5 rounded-full border uppercase shrink-0 mt-0.5 ${
                    item.priority === 'IMMEDIATE' ? 'bg-error/10 text-error border-error/20' :
                    item.priority === 'SHORT_TERM' ? 'bg-violet-200/10 text-violet-400 border-violet-200/20' :
                    'bg-sky-100/30 text-sky-200 border-sky-200/20'
                  }`}>{item.priority?.replace('_', ' ')}</span>
                  <div className="flex-1">
                    <p className="font-label-bold text-[13px] text-on-surface">{item.title}</p>
                    <p className="font-body-sm text-[11px] text-outline mt-0.5">{item.rationale}</p>
                    {item.owner_role && <p className="font-label-mono text-[10px] text-outline mt-1">Owner: {item.owner_role}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prevention */}
        {(prevention.detection_improvements?.length > 0 || prevention.prevention_improvements?.length > 0) && (
          <div className="bg-white rounded-xl border border-outline-variant/20 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-emerald-500 text-[18px]">shield</span>
              <h2 className="font-label-bold text-[13px] uppercase tracking-widest text-outline">Prevention Plan</h2>
            </div>
            {prevention.detection_improvements?.length > 0 && (
              <div className="mb-3">
                <h3 className="font-label-bold text-[11px] uppercase tracking-widest text-outline mb-2">Detection</h3>
                <ul className="space-y-1">{prevention.detection_improvements.map((d, i) => (
                  <li key={i} className="font-body-sm text-[12px] text-on-surface flex gap-2"><span className="text-sky-200 shrink-0">▪</span>{d}</li>
                ))}</ul>
              </div>
            )}
            {prevention.prevention_improvements?.length > 0 && (
              <div className="mb-3">
                <h3 className="font-label-bold text-[11px] uppercase tracking-widest text-outline mb-2">Prevention</h3>
                <ul className="space-y-1">{prevention.prevention_improvements.map((p, i) => (
                  <li key={i} className="font-body-sm text-[12px] text-on-surface flex gap-2"><span className="text-violet-200 shrink-0">▪</span>{p}</li>
                ))}</ul>
              </div>
            )}
            {prevention.process_improvements?.length > 0 && (
              <div>
                <h3 className="font-label-bold text-[11px] uppercase tracking-widest text-outline mb-2">Process</h3>
                <ul className="space-y-1">{prevention.process_improvements.map((p, i) => (
                  <li key={i} className="font-body-sm text-[12px] text-on-surface flex gap-2"><span className="text-outline shrink-0">▪</span>{p}</li>
                ))}</ul>
              </div>
            )}
          </div>
        )}

        {/* What Went Well + Open Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {whatWentWell.length > 0 && (
            <div className="bg-mint-50/30 rounded-xl border border-sky-200/10 p-5">
              <h2 className="font-label-bold text-[11px] uppercase tracking-widest text-outline mb-3">What Went Well</h2>
              <ul className="space-y-1.5">{whatWentWell.map((w, i) => (
                <li key={i} className="font-body-sm text-[12px] text-on-surface flex gap-2"><span className="text-emerald-400 shrink-0">✓</span>{w}</li>
              ))}</ul>
            </div>
          )}
          {openQuestions.length > 0 && (
            <div className="bg-lavender-50/30 rounded-xl border border-violet-200/10 p-5">
              <h2 className="font-label-bold text-[11px] uppercase tracking-widest text-outline mb-3">Open Questions</h2>
              <ul className="space-y-1.5">{openQuestions.map((q, i) => (
                <li key={i} className="font-body-sm text-[12px] text-on-surface flex gap-2"><span className="text-violet-400 shrink-0">?</span>{q}</li>
              ))}</ul>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4">
          <Link to={`/copilot/${incidentId}`} className="flex items-center gap-2 text-outline hover:text-violet-400 transition-colors font-label-bold text-[12px]">
            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
            Ask Copilot about this RCA
          </Link>
          <Link to="/history" className="flex items-center gap-2 text-outline hover:text-sky-200 transition-colors font-label-bold text-[12px]">
            View All Incidents
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
}
