import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { uploadLogs, uploadTimeline, uploadDiff, createIncident } from '../../data/api';
import { useToast } from './ToastContext';

/**
 * NewScanModal — Functional investigation creation form.
 * Uploads files via the backend, then triggers the RCA pipeline.
 */
export default function NewScanModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState('input'); // 'input' | 'running' | 'error'
  const [error, setError] = useState(null);
  
  // Pipeline stage animation
  const [stageIndex, setStageIndex] = useState(0);
  const stages = [
    'Parsing Logs...',
    'Building Timeline...',
    'Analyzing Git Changes...',
    'Searching Historical Incidents...',
    'Correlating Evidence...',
    'Generating RCA...'
  ];

  // Collected text content
  const [logsText, setLogsText] = useState('');
  const [timelineText, setTimelineText] = useState('');
  const [diffText, setDiffText] = useState('');
  const [userContext, setUserContext] = useState('');

  // File refs
  const logsFileRef = useRef(null);
  const timelineFileRef = useRef(null);
  const diffFileRef = useRef(null);

  // File names for display
  const [logsFile, setLogsFile] = useState(null);
  const [timelineFile, setTimelineFile] = useState(null);
  const [diffFile, setDiffFile] = useState(null);

  useEffect(() => {
    let timer;
    if (step === 'running') {
      timer = setInterval(() => {
        setStageIndex(prev => Math.min(prev + 1, stages.length - 1));
      }, 4000); // Progress stage every 4 seconds to simulate pipeline
    }
    return () => clearInterval(timer);
  }, [step]);

  const handleFileUpload = async (file, type) => {
    try {
      let result;
      if (type === 'logs') {
        result = await uploadLogs(file);
        setLogsText(result.content);
        setLogsFile(file.name);
        toast.success('Logs parsed successfully');
      } else if (type === 'timeline') {
        result = await uploadTimeline(file);
        setTimelineText(result.content);
        setTimelineFile(file.name);
        toast.success('Timeline parsed successfully');
      } else if (type === 'diff') {
        result = await uploadDiff(file);
        setDiffText(result.content);
        setDiffFile(file.name);
        toast.success('Git diff parsed successfully');
      }
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileUpload(file, type);
  };

  const handleStartInvestigation = async () => {
    if (!logsText.trim() && !timelineText.trim() && !diffText.trim()) {
      toast.warning('Please provide at least one data source (logs, timeline, or diff).');
      return;
    }

    setStep('running');
    setStageIndex(0);
    setError(null);

    try {
      const result = await createIncident({
        logs: logsText,
        timeline: timelineText,
        diff: diffText,
        user_context: userContext || 'Untitled Investigation',
      });

      toast.success('Investigation launched!');
      setTimeout(() => {
        resetForm();
        onClose();
        navigate(`/investigate/${result.id}`);
      }, 500);
    } catch (err) {
      setStep('error');
      setError(`Pipeline failed: ${err.message}`);
      toast.error('Investigation failed to start');
    }
  };

  const resetForm = () => {
    setStep('input');
    setError(null);
    setStageIndex(0);
    setLogsText('');
    setTimelineText('');
    setDiffText('');
    setUserContext('');
    setLogsFile(null);
    setTimelineFile(null);
    setDiffFile(null);
  };

  const handleClose = () => {
    if (step !== 'running') {
      resetForm();
      onClose();
    }
  };

  const hasData = logsText.trim() || timelineText.trim() || diffText.trim();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Investigation">
      {step === 'running' ? (
        <div className="flex flex-col items-center justify-center py-12 gap-5 animate-fade-in">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full bg-sky-200/20 animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-2 rounded-full bg-violet-200/30 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-200 to-violet-400 flex items-center justify-center relative z-10 shadow-neo">
              <span className="material-symbols-outlined text-white text-[28px] animate-spin" style={{ animationDuration: '3s' }}>progress_activity</span>
            </div>
          </div>
          <div className="text-center w-full max-w-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3 tracking-tight">AI Agents Working</h3>
            
            {/* Dynamic Stage Indicators */}
            <div className="bg-surface-container/30 rounded-xl p-4 border border-outline-variant/20">
              <div className="flex flex-col gap-2">
                {stages.map((stage, idx) => {
                  const isActive = idx === stageIndex;
                  const isDone = idx < stageIndex;
                  const isPending = idx > stageIndex;
                  
                  // Only show active, previous (done), and next (pending)
                  if (Math.abs(idx - stageIndex) > 1) return null;
                  
                  return (
                    <div key={stage} className={`flex items-center gap-2 text-left transition-all duration-300 ${
                      isActive ? 'opacity-100 scale-100' : 
                      isDone ? 'opacity-50 scale-95' : 'opacity-30 scale-95'
                    }`}>
                      <span className={`material-symbols-outlined text-[16px] ${
                        isActive ? 'text-sky-200 animate-spin-slow' : 
                        isDone ? 'text-emerald-400' : 'text-outline-variant'
                      }`}>
                        {isDone ? 'check_circle' : isActive ? 'settings' : 'radio_button_unchecked'}
                      </span>
                      <span className={`font-label-mono text-[11px] uppercase tracking-wider ${
                        isActive ? 'text-on-surface font-bold' : 'text-outline'
                      }`}>
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Error Banner */}
          {error && (
            <div className="mb-4 bg-error-container rounded-lg p-3 flex items-center gap-2 border border-error/10 animate-slide-up">
              <span className="material-symbols-outlined text-error text-[16px]">error</span>
              <span className="font-body-sm text-[12px] text-on-surface flex-1">{error}</span>
              <button onClick={() => { setError(null); if (step === 'error') setStep('input'); }}
                className="text-outline hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Incident Context */}
          <div className="mb-5">
            <label className="font-label-bold text-[11px] uppercase tracking-widest text-outline block mb-2">
              Incident Description
            </label>
            <input
              type="text"
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              className="w-full bg-surface-container/30 border border-outline-variant/30 rounded-lg py-2.5 px-4 font-body-md text-[14px] text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-sky-200/50 focus:border-sky-200 transition-all"
              placeholder="e.g. Database connection pool exhaustion causing 503 errors"
            />
          </div>

          {/* Upload Zones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <UploadZone
              icon="description" title="Logs" desc={logsFile || 'Drop .log/.txt or paste'}
              hasData={!!logsText} color="from-mint-50 to-sky-100/30"
              onDrop={(e) => handleDrop(e, 'logs')}
              onFileClick={() => logsFileRef.current?.click()}
              onPaste={(text) => { setLogsText(text); setLogsFile(null); }}
              pastedText={logsText} fileInputRef={logsFileRef}
              onFileChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'logs'); }}
            />
            <UploadZone
              icon="timeline" title="Timeline" desc={timelineFile || 'Drop file or paste'}
              hasData={!!timelineText} color="from-lavender-50 to-lavender-50/30"
              onDrop={(e) => handleDrop(e, 'timeline')}
              onFileClick={() => timelineFileRef.current?.click()}
              onPaste={(text) => { setTimelineText(text); setTimelineFile(null); }}
              pastedText={timelineText} fileInputRef={timelineFileRef}
              onFileChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'timeline'); }}
            />
            <UploadZone
              icon="difference" title="Git Diff" desc={diffFile || 'Drop .diff or paste'}
              hasData={!!diffText} color="from-sky-100/30 to-mint-50"
              onDrop={(e) => handleDrop(e, 'diff')}
              onFileClick={() => diffFileRef.current?.click()}
              onPaste={(text) => { setDiffText(text); setDiffFile(null); }}
              pastedText={diffText} fileInputRef={diffFileRef}
              onFileChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'diff'); }}
            />
          </div>

          {/* Start Button */}
          <div className="flex justify-center pt-4 border-t border-dashed border-outline-variant/30">
            <button
              onClick={handleStartInvestigation}
              disabled={!hasData}
              className="bg-gradient-to-r from-sky-200 to-violet-200 text-on-surface font-label-bold text-[13px] uppercase py-3.5 px-10 rounded-xl hover:shadow-elevated transition-all flex items-center gap-2 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start Investigation
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function UploadZone({ icon, title, desc, hasData, color, onDrop, onFileClick, onPaste, pastedText, fileInputRef, onFileChange }) {
  const [showPaste, setShowPaste] = useState(false);

  return (
    <div
      className={`bg-gradient-to-b ${color} rounded-xl border ${hasData ? 'border-sky-200/50' : 'border-outline-variant/20 border-dashed'} p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group h-40 card-hover relative`}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => { if (!showPaste) onFileClick(); }}
    >
      {hasData && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sky-200 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[12px]">check</span>
        </div>
      )}
      <span className="material-symbols-outlined text-[28px] mb-2 text-on-surface group-hover:scale-110 transition-transform">{icon}</span>
      <h3 className="font-label-bold text-[12px] uppercase text-on-surface mb-1">{title}</h3>
      <p className="font-body-sm text-[10px] text-outline mb-2">{desc}</p>
      <button
        onClick={(e) => { e.stopPropagation(); setShowPaste(!showPaste); }}
        className="font-label-mono text-[9px] text-violet-400 hover:text-violet-400 uppercase tracking-wider"
      >
        {showPaste ? 'Hide' : 'Paste text'}
      </button>
      <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} />
      {showPaste && (
        <div className="absolute inset-0 bg-white rounded-xl p-2 z-10" onClick={(e) => e.stopPropagation()}>
          <textarea
            className="w-full h-full bg-surface-container/30 border border-outline-variant/30 rounded-lg p-2 font-label-mono text-[10px] text-on-surface resize-none focus:outline-none focus:ring-1 focus:ring-sky-200/50"
            placeholder={`Paste ${title.toLowerCase()} here...`}
            value={pastedText}
            onChange={(e) => onPaste(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
