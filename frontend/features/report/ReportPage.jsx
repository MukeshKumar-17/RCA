import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReport } from '../../data/api';
import { useToast } from '../../components/shared/ToastContext';
import EmailReportModal from './EmailReportModal';

/**
 * Color helper functions for distinct visual styling
 */
const getSeverityStyle = (sev) => {
  if (!sev) return 'bg-surface-variant text-on-surface-variant';
  const s = sev.toUpperCase();
  if (s.includes('SEV-1') || s.includes('CRITICAL')) return 'bg-error text-on-error shadow-sm';
  if (s.includes('SEV-2') || s.includes('HIGH')) return 'bg-[#FF7A00] text-[#FFFFFF] shadow-sm';
  if (s.includes('SEV-3') || s.includes('MEDIUM')) return 'bg-[#FFC300] text-[#332500] shadow-sm';
  if (s.includes('SEV-4') || s.includes('LOW')) return 'bg-[#00A3FF] text-[#FFFFFF] shadow-sm';
  return 'bg-error-container text-on-error-container';
};

const getPhaseStyle = (phase) => {
  if (!phase) return 'bg-surface-container text-on-surface-variant border border-surface-variant';
  const p = phase.toUpperCase();
  if (p === 'DETECTION') return 'bg-[#FFF3E0] text-[#E65C00] border border-[#FFCC80]';
  if (p === 'MITIGATION') return 'bg-[#E3F2FD] text-[#0277BD] border border-[#81D4FA]';
  if (p === 'RESOLUTION') return 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]';
  return 'bg-surface-container text-on-surface-variant border border-surface-variant';
};

const getPhaseDotStyle = (phase) => {
  if (!phase) return 'bg-surface-variant';
  const p = phase.toUpperCase();
  if (p === 'DETECTION') return 'bg-[#FF8A00]';
  if (p === 'MITIGATION') return 'bg-[#00A3FF]';
  if (p === 'RESOLUTION') return 'bg-primary';
  return 'bg-surface-variant';
};

const getPriorityStyle = (priority) => {
  if (!priority) return 'bg-surface-container-highest text-on-surface border-surface-variant';
  const p = priority.toUpperCase();
  if (p === 'IMMEDIATE') return 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]';
  if (p === 'SHORT_TERM') return 'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]';
  if (p === 'LONG_TERM') return 'bg-[#E0F7FA] text-[#00838F] border-[#B2EBF2]';
  return 'bg-surface-container-highest text-on-surface border-surface-variant';
};

/**
 * ReportPage — Loads and renders a real RCA report from the backend.
 */
export default function ReportPage() {
  const { incidentId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
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
      <div className="h-full flex flex-col items-center justify-center p-12 animate-fade-in bg-surface">
        <span className="material-symbols-outlined text-[64px] bg-gradient-to-br from-primary to-teal-400 bg-clip-text text-transparent drop-shadow-md mb-5" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2 tracking-tight">No Report Selected</h2>
        <p className="font-body-md text-body-md text-outline max-w-md text-center leading-relaxed">Select an incident from the Dashboard or Investigations view to see the full RCA report.</p>
        <Link to="/" className="mt-6 bg-primary text-on-primary font-label-md text-label-md py-3 px-8 rounded-full hover:opacity-90 transition-all shadow-sm">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in bg-surface">
        <div className="h-6 w-40 bg-surface-container-high rounded mb-4 animate-pulse"></div>
        <div className="h-12 w-3/4 bg-surface-container-high rounded mb-3 animate-pulse"></div>
        <div className="h-5 w-64 bg-surface-container-high rounded mb-8 animate-pulse"></div>
        <div className="bento-tile p-6 mb-6 animate-pulse border-none bg-surface-container-lowest shadow-sm">
          <div className="h-5 w-48 bg-surface-container-high rounded mb-5"></div>
          <div className="h-20 w-full bg-surface-container-high rounded"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-surface-container-lowest rounded-xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  // Not complete yet
  if (report?.status !== 'COMPLETE') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 animate-fade-in bg-surface">
        <span className="material-symbols-outlined text-[64px] text-primary drop-shadow-sm animate-spin mb-5" style={{ animationDuration: '2s' }}>progress_activity</span>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Analysis In Progress</h2>
        <p className="font-body-md text-body-md text-outline max-w-md text-center mb-6">
          Status: <span className="font-bold text-on-surface">{report?.status || 'Unknown'}</span>. Evidence completeness: {report?.evidence_completeness || 0}%.
        </p>
        <Link to={`/investigate/${incidentId}`} className="bg-primary text-on-primary font-label-md text-label-md py-3 px-8 rounded-full hover:opacity-90 transition-all shadow-sm">
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
    <div className="h-full overflow-y-auto bg-surface">
    <div className="p-6 lg:p-8 max-w-[1200px] w-full mx-auto animate-fade-in">
      {/* Report Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/" className="text-outline hover:text-primary transition-colors flex items-center justify-center p-1 rounded-full hover:bg-surface-container">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <span className="font-mono text-[12px] text-outline bg-surface-container rounded-md px-2 py-1 truncate max-w-[120px]">
            {incidentId.slice(0, 8)}...
          </span>
          <span className="px-3 py-1 bg-primary-container text-on-primary-container font-label-md text-[11px] uppercase rounded-md tracking-wider">Complete</span>
          {meta.severity && (
            <span className={`px-3 py-1 font-label-md text-[11px] uppercase rounded-md tracking-wider ${getSeverityStyle(meta.severity)}`}>
              {meta.severity}
            </span>
          )}
        </div>
        <h1 className="font-headline-lg text-[42px] text-on-surface tracking-tight leading-tight mb-3">{report.user_context || 'Root Cause Analysis Report'}</h1>
        <p className="font-body-md text-body-md text-outline flex items-center gap-2">
          {report.user_context ? 'Investigation Details' : 'Untitled Investigation'} <span className="text-surface-variant">•</span> Confidence: {meta.overall_confidence || rootCause.confidence || 0}%
        </p>
      </div>

      <div className="flex flex-col gap-6 stagger-in">
        {/* Executive Summary & Confidence Split */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bento-tile p-8 flex flex-col bg-gradient-to-br from-surface-container-lowest to-surface-container/30 border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/10 transition-colors"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <span className="material-symbols-outlined text-primary text-[24px]">summarize</span>
              <h2 className="font-label-md text-label-md uppercase tracking-wider text-outline">Executive Summary</h2>
            </div>
            <p className="font-body-md text-[17px] text-on-surface leading-loose flex-1 relative z-10">
              {rca.executive_summary || 'No executive summary available.'}
            </p>
          </div>
          
          <div className="bento-tile p-8 flex flex-col items-center justify-center text-center bg-surface-container-lowest">
            <h2 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-6">Overall Confidence</h2>
            <div className="relative mb-3">
              <svg width="120" height="120" className="transform -rotate-90 drop-shadow-sm">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(0,107,84,0.1)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#conf-gradient)" strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 50} strokeDashoffset={2 * Math.PI * 50 * (1 - (meta.overall_confidence || rootCause.confidence || 0)/100)}
                  strokeLinecap="round" className="confidence-ring transition-all duration-1000" />
                <defs>
                  <linearGradient id="conf-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#006b54" />
                    <stop offset="100%" stopColor="#0dffcb" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="font-headline-lg text-[36px] text-on-surface leading-none">{meta.overall_confidence || rootCause.confidence || '—'}</span>
                <span className="text-[14px] font-label-md text-outline">%</span>
              </div>
            </div>
            <p className="font-body-md text-body-md text-outline mt-3">AI synthesis probability</p>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Duration', value: meta.incident_duration || impact.duration_minutes ? `${impact.duration_minutes} min` : '—', icon: 'schedule', color: 'text-secondary' },
            { label: 'Severity', value: meta.severity || '—', icon: 'priority_high', color: 'text-error' },
            { label: 'Services', value: `${meta.affected_services?.length || impact.services_affected?.length || 0}`, icon: 'dns', color: 'text-primary' },
            { label: 'Evidence', value: `${report.evidence_completeness || 0}%`, icon: 'database', color: 'text-on-surface' },
          ].map((m) => (
            <div key={m.label} className="bento-tile p-5 bg-surface-container-lowest hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <span className={`material-symbols-outlined text-[18px] ${m.color}`}>{m.icon}</span>
                <span className="font-label-md text-[11px] uppercase tracking-wider text-outline">{m.label}</span>
              </div>
              <div className="font-headline-md text-[26px] text-on-surface">{m.value}</div>
            </div>
          ))}
        </div>

        {/* Root Cause */}
        {rootCause.title && (
          <div className="bento-tile p-8 bg-surface-container-lowest">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-error text-[24px]">target</span>
              <h2 className="font-label-md text-label-md uppercase tracking-wider text-outline">Root Cause</h2>
              <span className="ml-auto font-label-md text-[11px] text-primary bg-primary-container rounded-md px-3 py-1.5">{rootCause.confidence || 0}% confidence</span>
            </div>
            <h3 className="font-headline-md text-[28px] text-on-surface mb-5">{rootCause.title}</h3>
            <p className="font-body-md text-[17px] text-on-surface leading-loose mb-8">{rootCause.description}</p>

            {/* Causal Chain */}
            {rootCause.causal_chain?.length > 0 && (
              <div className="flex flex-col gap-0 mb-6 bg-surface-container/30 p-6 rounded-xl border border-surface-variant">
                <h4 className="font-label-md text-label-md text-outline mb-4">Causal Chain</h4>
                {rootCause.causal_chain.map((step, i) => (
                  <div key={i} className="flex items-start gap-4 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 text-on-surface text-[12px] font-bold border border-surface-variant z-10">{i + 1}</div>
                      {i < rootCause.causal_chain.length - 1 && <div className="w-px h-8 bg-surface-variant -mt-1 -mb-1"></div>}
                    </div>
                    <div className="pb-6 pt-1">
                      <p className="font-body-md text-[15px] text-on-surface leading-relaxed">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Evidence references */}
            {rootCause.evidence?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <span className="font-label-md text-[11px] text-outline self-center mr-2">Evidence:</span>
                {rootCause.evidence.map((ev) => (
                  <span key={ev} className="font-mono text-[10px] text-secondary bg-secondary-container rounded-md px-2 py-1 uppercase">{ev}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contributing Factors */}
        {contributingFactors.length > 0 && (
          <div className="bento-tile p-8 bg-surface-container-lowest">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-secondary text-[24px]">account_tree</span>
              <h2 className="font-label-md text-label-md uppercase tracking-wider text-outline">Contributing Factors</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contributingFactors.map((cf) => (
                <div key={cf.factor_id} className="flex flex-col p-5 rounded-xl bg-surface-container/50 border border-surface-variant hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-label-md text-label-md text-on-surface font-bold">{cf.title}</p>
                    <span className="font-label-md text-[11px] text-secondary bg-secondary-container rounded-md px-2 py-1">{cf.confidence}%</span>
                  </div>
                  <p className="font-body-md text-[15px] leading-relaxed text-on-surface-variant">{cf.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {rcaTimeline.length > 0 && (
          <div className="bento-tile p-8 bg-surface-container-lowest">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-[24px]">timeline</span>
              <h2 className="font-label-md text-label-md uppercase tracking-wider text-outline">Incident Timeline</h2>
            </div>
            <div className="flex flex-col gap-0 pl-2">
              {rcaTimeline.map((ev, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3.5 h-3.5 rounded-full shrink-0 mt-1 ring-4 ring-white shadow-sm ${getPhaseDotStyle(ev.phase)}`}></div>
                    {i < rcaTimeline.length - 1 && <div className="w-px h-16 bg-surface-variant"></div>}
                  </div>
                  <div className="pb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-[12px] text-outline font-semibold">{ev.timestamp?.slice(11, 19) || ''}</span>
                      <span className={`font-label-md text-[10px] px-2.5 py-0.5 rounded-md uppercase ${getPhaseStyle(ev.phase)}`}>
                        {ev.phase}
                      </span>
                    </div>
                    <p className="font-body-md text-[15px] text-on-surface leading-relaxed">{ev.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <div className="bento-tile p-8 bg-surface-container-lowest">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-[24px]">task_alt</span>
              <h2 className="font-label-md text-label-md uppercase tracking-wider text-outline">Action Items</h2>
            </div>
            <div className="flex flex-col gap-3">
              {actionItems.map((item) => (
                <div key={item.item_id} className="flex flex-col md:flex-row items-start gap-4 p-5 rounded-xl bg-surface-container/30 border border-surface-variant">
                  <span className={`font-label-md text-[10px] px-3 py-1 rounded-md uppercase shrink-0 mt-0.5 border shadow-sm ${getPriorityStyle(item.priority)}`}>
                    {item.priority?.replace('_', ' ')}
                  </span>
                  <div className="flex-1">
                    <p className="font-label-md text-[16px] text-on-surface mb-2">{item.title}</p>
                    <p className="font-body-md text-[15px] leading-relaxed text-on-surface-variant mb-4">{item.rationale}</p>
                    {item.owner_role && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] text-outline">person</span>
                        <p className="font-label-md text-[11px] text-outline uppercase tracking-wider">{item.owner_role}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prevention */}
        {(prevention.detection_improvements?.length > 0 || prevention.prevention_improvements?.length > 0) && (
          <div className="bento-tile p-8 bg-surface-container-lowest">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-[24px]">shield</span>
              <h2 className="font-label-md text-label-md uppercase tracking-wider text-outline">Prevention Plan</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prevention.detection_improvements?.length > 0 && (
                <div className="bg-surface-container/20 p-5 rounded-xl border border-surface-variant">
                  <h3 className="font-label-md text-[12px] uppercase tracking-wider text-outline mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">radar</span> Detection</h3>
                  <ul className="space-y-3">{prevention.detection_improvements.map((d, i) => (
                    <li key={i} className="font-body-md text-[14px] text-on-surface-variant flex gap-3"><span className="text-primary shrink-0 mt-0.5 material-symbols-outlined text-[16px]">check</span>{d}</li>
                  ))}</ul>
                </div>
              )}
              {prevention.prevention_improvements?.length > 0 && (
                <div className="bg-surface-container/20 p-5 rounded-xl border border-surface-variant">
                  <h3 className="font-label-md text-[12px] uppercase tracking-wider text-outline mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">health_and_safety</span> Prevention</h3>
                  <ul className="space-y-3">{prevention.prevention_improvements.map((p, i) => (
                    <li key={i} className="font-body-md text-[14px] text-on-surface-variant flex gap-3"><span className="text-secondary shrink-0 mt-0.5 material-symbols-outlined text-[16px]">check</span>{p}</li>
                  ))}</ul>
                </div>
              )}
              {prevention.process_improvements?.length > 0 && (
                <div className="bg-surface-container/20 p-5 rounded-xl border border-surface-variant md:col-span-2">
                  <h3 className="font-label-md text-[12px] uppercase tracking-wider text-outline mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">account_tree</span> Process</h3>
                  <ul className="space-y-4">{prevention.process_improvements.map((p, i) => (
                    <li key={i} className="font-body-md text-[15px] text-on-surface-variant flex gap-3 leading-relaxed"><span className="text-outline shrink-0 mt-1 material-symbols-outlined text-[16px]">check</span>{p}</li>
                  ))}</ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* What Went Well + Open Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {whatWentWell.length > 0 && (
            <div className="bento-tile p-6 bg-primary-container/20 border-primary/20">
              <h2 className="font-label-md text-[12px] uppercase tracking-wider text-on-surface mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-primary">thumb_up</span> What Went Well</h2>
              <ul className="space-y-3">{whatWentWell.map((w, i) => (
                <li key={i} className="font-body-md text-[14px] text-on-surface flex gap-3"><span className="text-primary shrink-0 mt-0.5 material-symbols-outlined text-[16px]">done</span>{w}</li>
              ))}</ul>
            </div>
          )}
          {openQuestions.length > 0 && (
            <div className="bento-tile p-6 bg-secondary-container/20 border-secondary/20">
              <h2 className="font-label-md text-[12px] uppercase tracking-wider text-on-surface mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-secondary">help</span> Open Questions</h2>
              <ul className="space-y-3">{openQuestions.map((q, i) => (
                <li key={i} className="font-body-md text-[14px] text-on-surface flex gap-3"><span className="text-secondary shrink-0 mt-0.5 material-symbols-outlined text-[16px]">question_mark</span>{q}</li>
              ))}</ul>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 pb-12">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={async () => {
                try {
                  const response = await fetch(
                    `http://localhost:8000/api/report/${incidentId}/export-pdf`
                  );
                  if (!response.ok) throw new Error('PDF export failed');
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `RCA_${incidentId}.pdf`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  console.error('PDF export error:', err);
                  alert('Failed to export PDF. Please try again.');
                }
              }}
              className="bento-tile px-6 py-4 flex items-center justify-center gap-3 bg-secondary-container text-on-secondary-container hover:shadow-md transition-shadow font-label-md text-[14px]"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Export PDF
            </button>
            <button
              onClick={() => setEmailModalOpen(true)}
              className="bento-tile px-6 py-4 flex items-center justify-center gap-3 bg-tertiary-container text-on-tertiary-container hover:shadow-md transition-shadow font-label-md text-[14px]"
            >
              <span className="material-symbols-outlined text-[20px]">mail</span>
              Send to Developer
            </button>
            <Link to={`/copilot/${incidentId}`} className="bento-tile px-6 py-4 flex items-center justify-center gap-3 bg-primary-container text-on-primary-container hover:shadow-md transition-shadow font-label-md text-[14px]">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              Ask Copilot about this RCA
            </Link>
          </div>
          <Link to="/history" className="bento-tile w-full sm:w-auto px-6 py-4 flex items-center justify-center gap-3 bg-surface-container-lowest text-on-surface hover:border-primary transition-colors font-label-md text-[14px]">
            View All Incidents
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
    <EmailReportModal
      isOpen={emailModalOpen}
      onClose={() => setEmailModalOpen(false)}
      incidentId={incidentId}
      incidentTitle={report?.user_context || 'Untitled Investigation'}
    />
    </div>
  );
}
