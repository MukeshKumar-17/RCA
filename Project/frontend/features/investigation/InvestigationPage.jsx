import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getReport, getSimilarIncidents, pollReport } from '../../data/api';
import { useToast } from '../../components/shared/ToastContext';
import { insforge } from '../../utils/insforge';

/**
 * InvestigationPage — Investigation workspace showing real pipeline data.
 */
export default function InvestigationPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
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

        // Load attachments
        try {
          const { data: files } = await insforge.database
            .from('incident_files')
            .select('*')
            .eq('incident_id', incidentId)
            .order('uploaded_at', { ascending: false });
          if (!cancelled && files) {
            setAttachments(files);
          }
        } catch (err) {
          console.error('Failed to load attachments', err);
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
        <span className="material-symbols-outlined text-[64px] bg-gradient-to-br from-primary to-teal-400 bg-clip-text text-transparent drop-shadow-md mb-5" style={{ fontVariationSettings: "'FILL' 1" }}>troubleshoot</span>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2 tracking-tight">No Investigation Selected</h2>
        <p className="font-body-md text-body-md text-outline max-w-md text-center leading-relaxed">
          Start a new investigation via "New Scan" or select one from the Dashboard.
        </p>
        <Link to="/" className="mt-6 bg-primary text-on-primary font-label-md text-label-md py-3 px-8 rounded-full hover:opacity-90 transition-all shadow-sm">
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
          <span className="material-symbols-outlined text-[48px] text-primary drop-shadow-sm animate-spin" style={{ animationDuration: '2s' }}>progress_activity</span>
          <p className="font-body-md text-body-md text-outline">Loading investigation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !incident) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 animate-fade-in">
        <span className="material-symbols-outlined text-[64px] text-error drop-shadow-md mb-5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Investigation Not Found</h2>
        <p className="font-body-md text-body-md text-outline max-w-md text-center">{error}</p>
        <Link to="/" className="mt-6 bg-primary text-on-primary font-label-md text-label-md py-3 px-8 rounded-full hover:opacity-90 transition-all shadow-sm">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Upload to InsForge Storage
      const { data: uploadData, error: uploadError } = await insforge.storage
        .from('incident-files')
        .uploadAuto(file);

      if (uploadError) throw uploadError;

      // 2. Link file to incident in Database
      const { data: dbData, error: dbError } = await insforge.database
        .from('incident_files')
        .insert([{
          incident_id: incidentId,
          file_name: file.name,
          file_url: uploadData.url,
          file_key: uploadData.key,
        }]);

      if (dbError) throw dbError;

      toast.success('File attached successfully');
      
      // Refresh attachments
      const { data: newFiles } = await insforge.database
        .from('incident_files')
        .select('*')
        .eq('incident_id', incidentId)
        .order('uploaded_at', { ascending: false });
      if (newFiles) setAttachments(newFiles);
      
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = async (fileKey, fileId) => {
    try {
      // 1. Delete from Storage
      const { error: storageError } = await insforge.storage
        .from('incident-files')
        .remove(fileKey);
      
      if (storageError) throw storageError;

      // 2. Delete from Database
      const { error: dbError } = await insforge.database
        .from('incident_files')
        .delete()
        .eq('id', fileId);
        
      if (dbError) throw dbError;

      setAttachments(prev => prev.filter(f => f.id !== fileId));
      toast.success('File removed');
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

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
      <aside className="w-[280px] h-full flex flex-col overflow-y-auto p-5 bg-surface-container-lowest border-r border-surface-variant shrink-0">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-surface-container-lowest z-10 pb-3 border-b border-surface-variant">
          <h2 className="font-headline-md text-[20px] text-on-surface tracking-tight">Runbook</h2>
          <span className="font-label-md text-label-md bg-secondary-container text-on-secondary-container rounded-md px-2 py-1 truncate max-w-[100px]">
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
      <section className="flex-1 h-full flex flex-col bg-surface-container-lowest overflow-hidden">
        <div className="border-b border-surface-variant px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${polling ? 'bg-error animate-pulse' : isComplete ? 'bg-primary' : 'bg-outline-variant'}`}></div>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
              {polling ? 'Live Activity Feed' : isComplete ? 'Investigation Complete' : 'Activity Feed'}
            </h2>
          </div>
          {isComplete && (
            <Link to={`/report/${incidentId}`} className="font-label-md text-label-md text-primary bg-primary-container rounded-full px-4 py-2 hover:opacity-90 transition-colors flex items-center gap-2">
              View Full Report <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          )}
        </div>
        <div className="flex-grow p-6 overflow-y-auto flex flex-col gap-6 stagger-in">
          {/* Log Agent Findings */}
          {hasLogs && (
            <AgentMessage
              name="Log Agent" icon="receipt_long"
              timestamp={logOut.log_summary?.time_range_start?.slice(11, 19) || ''}
            >
              <p className="font-body-md text-body-md text-on-surface mb-3 leading-relaxed">
                Analyzed logs: <strong>{logOut.log_summary?.total_lines || 0}</strong> lines, health status: <strong>{logOut.log_summary?.overall_health || 'Unknown'}</strong>.
                {logOut.log_summary?.dominant_service && <> Dominant service: <code className="bg-surface-container px-1.5 py-0.5 rounded text-[13px] font-mono border border-surface-variant">{logOut.log_summary.dominant_service}</code>.</>}
              </p>
              {logOut.events.slice(0, 3).map((ev) => (
                <div key={ev.event_id} className={`text-[13px] font-mono p-3 rounded-xl mb-2 border-l-4 ${
                  ev.severity === 'CRITICAL' ? 'bg-error-container/30 border-error text-error' :
                  ev.severity === 'ERROR' ? 'bg-error-container/10 border-error/50 text-on-surface' :
                  'bg-surface-container border-outline-variant text-on-surface'
                }`}>
                  <span className="font-bold">[{ev.event_id}] [{ev.severity}]</span> {ev.message}
                </div>
              ))}
              {logOut.events.length > 3 && (
                <p className="font-label-md text-label-md text-outline mt-2">+ {logOut.events.length - 3} more events</p>
              )}
            </AgentMessage>
          )}

          {/* Timeline Agent Findings */}
          {hasTimeline && (
            <AgentMessage
              name="Timeline Agent" icon="timeline"
              timestamp={timelineOut.metrics?.first_signal_timestamp?.slice(11, 19) || ''}
              align="right"
            >
              <p className="font-body-md text-body-md text-on-surface mb-4 leading-relaxed">
                Reconstructed timeline with <strong>{timelineOut.timeline.length}</strong> events.
                {timelineOut.metrics?.total_incident_minutes && <> Total duration: <strong>{timelineOut.metrics.total_incident_minutes} minutes</strong>.</>}
              </p>
              {timelineOut.timeline.slice(0, 4).map((ev) => (
                <div key={ev.event_id} className="flex items-start gap-3 mb-2.5">
                  <span className={`font-label-md text-[11px] px-2 py-0.5 rounded-full uppercase shrink-0 ${
                    ev.phase === 'DETECTION' ? 'bg-secondary-container text-on-secondary-container' :
                    ev.phase === 'MITIGATION' ? 'bg-primary-container text-on-primary-container' :
                    ev.phase === 'RESOLUTION' ? 'bg-surface-container-highest text-on-surface' :
                    'bg-surface-container text-on-surface-variant'
                  }`}>{ev.phase?.slice(0, 3)}</span>
                  <span className="font-body-md text-body-md text-on-surface">{ev.action}</span>
                </div>
              ))}
            </AgentMessage>
          )}

          {/* Git Agent Findings */}
          {hasGit && (
            <AgentMessage
              name="Git Agent" icon="code"
              timestamp=""
            >
              <p className="font-body-md text-body-md text-on-surface mb-4 leading-relaxed">
                Analyzed diff: <strong>{gitOut.diff_summary?.files_changed || 0}</strong> files changed.
                Deployment risk score: <strong>{gitOut.diff_summary?.deployment_risk_score || 0}/100</strong>.
              </p>
              {gitOut.changes.slice(0, 3).map((ch) => (
                <div key={ch.change_id} className={`rounded-xl overflow-hidden border mb-3 ${
                  ch.risk_level === 'CRITICAL' ? 'border-error/30' : ch.risk_level === 'HIGH' ? 'border-secondary/30' : 'border-surface-variant'
                }`}>
                  <div className="bg-surface-container px-4 py-2 text-on-surface font-mono text-[12px] flex justify-between">
                    <span>{ch.file}</span>
                    <span className={`${ch.risk_level === 'CRITICAL' ? 'text-error font-bold' : 'text-outline'}`}>{ch.risk_level}</span>
                  </div>
                  <div className="p-3 font-body-md text-body-md text-on-surface bg-surface-container-lowest">{ch.description}</div>
                </div>
              ))}
            </AgentMessage>
          )}

          {/* Polling state */}
          {polling && (
            <div className="flex items-center justify-center py-6">
              <div className="bento-tile bg-secondary-container px-5 py-4 flex items-center gap-3 w-auto border-none">
                <span className="material-symbols-outlined text-on-secondary-container text-[20px] animate-spin" style={{ animationDuration: '2s' }}>progress_activity</span>
                <span className="font-label-md text-label-md text-on-secondary-container uppercase tracking-wider">AI agents analyzing — this may take 30-60 seconds...</span>
              </div>
            </div>
          )}

          {/* No data state */}
          {!hasLogs && !hasTimeline && !hasGit && !polling && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <span className="material-symbols-outlined text-[64px] bg-gradient-to-br from-secondary to-teal-300 bg-clip-text text-transparent drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>search_off</span>
              <p className="font-body-md text-body-md text-outline text-center">No agent findings available for this investigation.</p>
            </div>
          )}
        </div>
      </section>

      {/* Right: RCA Summary */}
      <aside className="w-[320px] h-full flex flex-col overflow-y-auto p-5 bg-surface-container-lowest border-l border-surface-variant shrink-0 gap-5">
        {/* Confidence */}
        <div className="bento-tile bg-primary-container p-6 flex flex-col items-center gap-4">
          <h2 className="font-label-md text-label-md uppercase tracking-wider text-on-primary-container self-start">RCA Confidence</h2>
          <div className="relative">
            <svg width="100" height="100" className="transform -rotate-90 drop-shadow-sm">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#006b54" strokeWidth="8"
                strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - confidence/100)}
                strokeLinecap="round" className="confidence-ring transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="font-headline-lg text-[32px] text-on-primary-container leading-none">{confidence || '—'}</span>
              <span className="text-[12px] font-label-md text-on-primary-container/80 uppercase">{confidence ? '%' : ''}</span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-primary-container text-center leading-relaxed">
            {hasRca
              ? rca.root_cause.description?.slice(0, 100) + '...'
              : polling ? 'Waiting for analysis...' : 'No RCA generated yet.'}
          </p>
        </div>

        {/* Top Candidates */}
        {hasRca && (
          <div>
            <h2 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-3">Root Cause</h2>
            <div className="flex flex-col gap-3">
              <div className="bento-tile p-4 border-primary/20 bg-surface-container shadow-sm transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-label-md text-label-md text-on-surface leading-tight">{rca.root_cause.title}</h3>
                  <span className="font-label-md text-[11px] text-primary bg-primary-container rounded-md px-2 py-1 shrink-0 ml-2">
                    {rca.root_cause.confidence}%
                  </span>
                </div>
                <p className="font-body-md text-body-md text-outline leading-relaxed">
                  {rca.root_cause.description?.slice(0, 120)}
                </p>
              </div>
              {rca.contributing_factors?.slice(0, 2).map((cf) => (
                <div key={cf.factor_id} className="bento-tile p-4 border-surface-variant hover:bg-surface-container transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-label-md text-label-md text-outline leading-tight">{cf.title}</h3>
                    <span className="font-label-md text-[11px] text-outline bg-surface-variant/30 rounded-md px-2 py-1 shrink-0 ml-2">{cf.confidence}%</span>
                  </div>
                  <p className="font-body-md text-body-md text-outline leading-relaxed">{cf.description?.slice(0, 80)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-label-md text-label-md uppercase tracking-wider text-outline">Attachments</h2>
            <label className="cursor-pointer text-primary hover:text-primary-container-highest transition-colors flex items-center">
              {isUploading ? (
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
              )}
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
          </div>
          <div className="flex flex-col gap-2">
            {attachments.length > 0 ? attachments.map((f) => (
              <div key={f.id} className="bento-tile p-2 pl-3 flex items-center justify-between border-surface-variant hover:border-primary/30 transition-colors">
                <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="font-body-md text-[13px] text-on-surface truncate flex-1 hover:text-primary transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-outline">description</span>
                  <span className="truncate">{f.file_name}</span>
                </a>
                <button onClick={() => handleDeleteAttachment(f.file_key, f.id)} className="text-outline hover:text-error transition-colors p-1 flex items-center">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )) : (
              <p className="font-body-md text-body-md text-outline">No attached files.</p>
            )}
          </div>
        </div>

        {/* Similar Incidents */}
        <div className="mt-auto">
          <h2 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-3">Similar Incidents</h2>
          <div className="flex flex-col gap-3">
            {similar.length > 0 ? similar.slice(0, 3).map((m) => (
              <div key={m.id} className="bento-tile p-3 flex items-center justify-between border-surface-variant hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/report/${m.id}`)}>
                <span className="font-body-md text-body-md text-on-surface truncate pr-2">{(m.user_context || 'Untitled').slice(0, 30)}</span>
                <span className="font-label-md text-[11px] text-secondary bg-secondary-container px-2 py-1 rounded-md shrink-0">Match</span>
              </div>
            )) : (
              <p className="font-body-md text-body-md text-outline">No similar incidents found.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function AgentMessage({ name, icon, timestamp, children, align }) {
  const isRight = align === 'right';
  return (
    <div className={`flex flex-col gap-2 max-w-[85%] ${isRight ? 'self-end' : ''} animate-slide-up`}>
      <div className={`flex items-center gap-3 mb-1 ${isRight ? 'justify-end' : ''}`}>
        {isRight && <span className="font-label-md text-label-md text-outline mr-auto">{timestamp}</span>}
        {!isRight && (
          <span className="material-symbols-outlined text-[24px] text-primary drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        )}
        <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface">{name}</span>
        {!isRight && <span className="font-label-md text-label-md text-outline ml-auto">{timestamp}</span>}
        {isRight && (
          <span className="material-symbols-outlined text-[24px] text-primary drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        )}
      </div>
      <div className="bento-tile p-5 bg-surface-container-lowest">
        {children}
      </div>
    </div>
  );
}

function RunbookStep({ status, title, description }) {
  const isDone = status === 'done';
  const isActive = status === 'active';
  return (
    <div className={`bento-tile p-4 flex items-start gap-3 transition-all duration-300 ${
      isDone ? 'bg-surface-container opacity-80 border-surface-variant' :
      isActive ? 'bg-surface-container-lowest border-primary shadow-sm' :
      'bg-surface-container-lowest border-dashed border-outline-variant opacity-60'
    }`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        isDone ? 'bg-primary text-on-primary' :
        isActive ? 'bg-secondary-container text-on-secondary-container' :
        'bg-surface-variant text-on-surface-variant'
      }`}>
        {isDone && <span className="material-symbols-outlined text-[14px]">check</span>}
        {isActive && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
      </div>
      <div>
        <h3 className={`font-label-md text-label-md ${isActive ? 'text-on-surface' : 'text-outline'}`}>{title}</h3>
        <p className={`font-body-md text-body-md mt-1 ${isActive ? 'text-on-surface-variant' : 'text-outline'}`}>{description}</p>
      </div>
    </div>
  );
}
