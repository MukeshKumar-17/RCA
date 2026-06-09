import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadLogs, uploadTimeline, uploadDiff, createIncident } from '../../data/api';
import { useToast } from '../../components/shared/ToastContext';

export default function NewScanPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const [userContext, setUserContext] = useState('');
  const [timelineText, setTimelineText] = useState('');
  const [logsText, setLogsText] = useState('');
  const [diffText, setDiffText] = useState('');

  const [timelineFile, setTimelineFile] = useState(null);
  const [logsFile, setLogsFile] = useState(null);
  const [diffFile, setDiffFile] = useState(null);

  const timelineFileRef = useRef(null);
  const logsFileRef = useRef(null);
  const diffFileRef = useRef(null);

  const [stageIndex, setStageIndex] = useState(0);
  const stages = [
    'Parsing Data...',
    'Building Timeline...',
    'Analyzing Git Changes...',
    'Searching Historical Incidents...',
    'Correlating Evidence...',
    'Generating RCA...',
  ];

  useEffect(() => {
    let timer;
    if (isGenerating) {
      timer = setInterval(() => {
        setStageIndex((prev) => Math.min(prev + 1, stages.length - 1));
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  const handleFileUpload = async (file, type) => {
    try {
      let result;
      if (type === 'timeline') {
        result = await uploadTimeline(file);
        setTimelineText(result.content);
        setTimelineFile(file.name);
        toast.success('Timeline parsed successfully');
      } else if (type === 'logs') {
        result = await uploadLogs(file);
        setLogsText(result.content);
        setLogsFile(file.name);
        toast.success('Logs parsed successfully');
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

  const handleStartInvestigation = async () => {
    if (!logsText.trim() && !timelineText.trim() && !diffText.trim()) {
      toast.warning('Please provide at least one data source.');
      return;
    }
    setIsGenerating(true);
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
      setTimeout(() => navigate(`/investigate/${result.id}`), 500);
    } catch (err) {
      setIsGenerating(false);
      setError(`Pipeline failed: ${err.message}`);
      toast.error('Investigation failed to start');
    }
  };

  const steps = [
    { num: 1, label: 'Timeline' },
    { num: 2, label: 'Error Logs' },
    { num: 3, label: 'Git Diff' },
    { num: 4, label: 'Generate RCA' },
  ];

  return (
    <main className="flex-1 overflow-y-auto p-8 lg:p-12 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Tile */}
        <div className="bento-tile text-center py-8">
          <h2 className="text-headline-lg font-headline-lg text-on-surface mb-2">Analyse Incident</h2>
          <p className="text-body-md font-body-md text-on-surface-variant">Follow the guided workflow to generate a multi-agent RCA report.</p>
        </div>

        {/* Progress Tile */}
        <div className="bento-tile flex items-center justify-center py-10 px-8">
          <div className="flex items-center w-full max-w-3xl relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-variant -z-10 -translate-y-1/2"></div>
            <div
              className="absolute left-0 top-1/2 h-0.5 bg-primary transition-all duration-500 -z-10 -translate-y-1/2"
              style={{ width: `calc((${currentStep - 1} / 3) * 100%)` }}
            />
            <div className="flex justify-between w-full relative z-10">
              {steps.map((step) => {
                const isActive = currentStep === step.num;
                const isCompleted = currentStep > step.num;
                return (
                  <div
                    key={step.num}
                    onClick={() => step.num < currentStep && setCurrentStep(step.num)}
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-headline-md font-headline-md mb-3 transition-all duration-300 ${
                        isActive
                          ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(13,255,203,0.5)]'
                          : isCompleted
                          ? 'bg-primary text-on-primary border-2 border-primary'
                          : 'bg-surface-container-lowest border-2 border-surface-variant text-on-surface-variant'
                      }`}
                    >
                      {isCompleted ? <span className="material-symbols-outlined">check</span> : step.num}
                    </div>
                    <span className={`text-label-sm font-label-sm font-bold uppercase tracking-wider ${isActive ? 'text-primary' : isCompleted ? 'text-primary-fixed-dim' : 'text-outline'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* ── Step 1: Timeline ── */}
          {currentStep === 1 && (
            <>
              {/* Incident Title Tile */}
              <div className="bento-tile animate-slide-up">
                <label className="block text-label-sm font-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3" htmlFor="incident-title">
                  Incident Title (Optional)
                </label>
                <input
                  id="incident-title"
                  type="text"
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                  className="w-full bg-inverse-surface text-inverse-on-surface placeholder-outline rounded-full px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary border-none text-body-md font-body-md shadow-inner"
                  placeholder="e.g. Database Connection Timeout"
                />
              </div>

              {/* Main Content Tile (Timeline) */}
              <div className="bento-tile flex flex-col h-full animate-slide-up" style={{ animationDelay: '50ms' }}>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                    <span className="material-symbols-outlined text-[20px]">show_chart</span>
                  </div>
                  <div>
                    <h3 className="text-headline-md font-headline-md text-on-surface">Timeline Information</h3>
                    <p className="text-body-md font-body-md text-on-surface-variant">Provide the sequence of events that occurred during the incident.</p>
                  </div>
                </div>
                <div className="flex-1 min-h-[250px]">
                  <textarea
                    value={timelineText}
                    onChange={(e) => setTimelineText(e.target.value)}
                    className="w-full h-full p-5 bg-surface-container-lowest border-2 border-primary rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-on-surface-variant font-mono text-sm resize-none"
                    placeholder={'10:00 AM Deployment Started\n10:05 AM Error Rate Increased...'}
                  />
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-variant">
                  <div>
                    <input ref={timelineFileRef} type="file" className="hidden" onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'timeline')} />
                    <button onClick={() => timelineFileRef.current.click()} className="flex items-center space-x-2 text-outline hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">upload</span>
                      <span className="text-label-sm font-label-sm font-bold uppercase tracking-wider">{timelineFile || 'Upload File'}</span>
                    </button>
                  </div>
                  <button onClick={() => setCurrentStep(2)} className="bg-primary hover:bg-[#00513e] text-on-primary px-8 py-3 rounded-full flex items-center space-x-2 transition-colors duration-200">
                    <span className="text-label-md font-label-md">Continue</span>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: Error Logs ── */}
          {currentStep === 2 && (
            <div className="bento-tile flex flex-col h-full animate-slide-up">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <span className="material-symbols-outlined text-[20px]">terminal</span>
                </div>
                <div>
                  <h3 className="text-headline-md font-headline-md text-on-surface">Error Logs</h3>
                  <p className="text-body-md font-body-md text-on-surface-variant">Paste or upload application logs for AI analysis.</p>
                </div>
              </div>
              <div className="flex-1 min-h-[250px]">
                <textarea
                  value={logsText}
                  onChange={(e) => setLogsText(e.target.value)}
                  className="w-full h-full p-5 bg-surface-container-lowest border-2 border-primary rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-on-surface-variant font-mono text-sm resize-none"
                  placeholder={'[ERROR] 2024-03-10 10:05:22 Database connection timeout...\n[WARN] 2024-03-10 10:05:25 Retrying connection...'}
                />
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-variant">
                <div>
                  <input ref={logsFileRef} type="file" className="hidden" onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'logs')} />
                  <button onClick={() => logsFileRef.current.click()} className="flex items-center space-x-2 text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">upload</span>
                    <span className="text-label-sm font-label-sm font-bold uppercase tracking-wider">{logsFile || 'Upload File'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentStep(1)} className="text-label-md font-label-md text-outline hover:text-on-surface transition-colors px-4 py-2">
                    Back
                  </button>
                  <button onClick={() => setCurrentStep(3)} className="bg-primary hover:bg-[#00513e] text-on-primary px-8 py-3 rounded-full flex items-center space-x-2 transition-colors duration-200">
                    <span className="text-label-md font-label-md">Continue</span>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Git Diff ── */}
          {currentStep === 3 && (
            <div className="bento-tile flex flex-col h-full animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                    <span className="material-symbols-outlined text-[20px]">difference</span>
                  </div>
                  <div>
                    <h3 className="text-headline-md font-headline-md text-on-surface">Recent Git Changes</h3>
                    <p className="text-body-md font-body-md text-on-surface-variant">Paste recent code changes to help AI correlate deployment risks.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant px-3 py-1.5 rounded-full">
                  Optional
                </span>
              </div>
              <div className="flex-1 min-h-[250px]">
                <textarea
                  value={diffText}
                  onChange={(e) => setDiffText(e.target.value)}
                  className="w-full h-full p-5 bg-surface-container-lowest border-2 border-primary rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-on-surface-variant font-mono text-sm resize-none"
                  placeholder={'commit 9d2c41a...\n--- config/database.env\n+ DB_POOL_SIZE=50'}
                />
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-variant">
                <div>
                  <input ref={diffFileRef} type="file" className="hidden" onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'diff')} />
                  <button onClick={() => diffFileRef.current.click()} className="flex items-center space-x-2 text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">upload</span>
                    <span className="text-label-sm font-label-sm font-bold uppercase tracking-wider">{diffFile || 'Upload File'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentStep(2)} className="text-label-md font-label-md text-outline hover:text-on-surface transition-colors px-4 py-2">
                    Back
                  </button>
                  <button onClick={() => setCurrentStep(4)} className="text-label-md font-label-md text-outline hover:text-on-surface transition-colors px-4 py-2">
                    Skip
                  </button>
                  <button onClick={() => setCurrentStep(4)} className="bg-primary hover:bg-[#00513e] text-on-primary px-8 py-3 rounded-full flex items-center space-x-2 transition-colors duration-200">
                    <span className="text-label-md font-label-md">Continue</span>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Generate RCA ── */}
          {currentStep === 4 && (
            <div className="bento-tile p-12 text-center animate-slide-up">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-8 py-6">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-primary-container animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center relative z-10 shadow-xl">
                      <span className="material-symbols-outlined text-on-primary text-[32px] animate-spin" style={{ animationDuration: '3s' }}>
                        progress_activity
                      </span>
                    </div>
                  </div>
                  <h3 className="text-headline-lg font-headline-lg text-on-surface">AI Agents Working</h3>
                  
                  <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant w-full max-w-md mx-auto text-left shadow-inner">
                    <div className="flex flex-col gap-4">
                      {stages.map((stage, idx) => {
                        const isActive = idx === stageIndex;
                        const isDone = idx < stageIndex;
                        if (Math.abs(idx - stageIndex) > 1) return null;
                        return (
                          <div
                            key={stage}
                            className={`flex items-center gap-4 transition-all duration-300 ${
                              isActive ? 'opacity-100' : isDone ? 'opacity-50' : 'opacity-30'
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[24px] ${
                                isActive ? 'text-primary animate-spin' : isDone ? 'text-primary' : 'text-outline'
                              }`}
                              style={isActive ? { animationDuration: '2s' } : {}}
                            >
                              {isDone ? 'check_circle' : isActive ? 'settings' : 'radio_button_unchecked'}
                            </span>
                            <span className={`text-label-md font-label-md uppercase tracking-wider ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                              {stage}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <div className="w-20 h-20 mx-auto bg-primary-container rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-primary text-[40px]">auto_awesome</span>
                  </div>
                  <h2 className="text-display-lg font-display-lg text-on-surface mb-4">Ready For AI Analysis</h2>
                  <p className="text-body-lg font-body-lg text-on-surface-variant mb-10 max-w-lg mx-auto">
                    The Multi-Agent system will combine your timeline, error logs, and git changes to generate a structured Root Cause Analysis.
                  </p>

                  {error && (
                    <div className="mb-8 bg-error-container text-on-error-container rounded-3xl p-5 flex items-center justify-center gap-3 border border-outline max-w-md mx-auto">
                      <span className="material-symbols-outlined text-[24px]">error</span>
                      <span className="text-body-md font-body-md font-medium">{error}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="text-label-md font-label-md text-outline hover:text-on-surface transition-colors px-6 py-3"
                    >
                      Go Back
                    </button>
                    <button
                      onClick={handleStartInvestigation}
                      className="bg-primary hover:bg-[#00513e] text-on-primary font-bold py-4 px-12 rounded-full transition-all text-body-md shadow-bento-hover"
                    >
                      Generate RCA Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
