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
    <div
      className="flex-1 w-full flex flex-col overflow-y-auto"
      style={{
        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        backgroundColor: '#f8fafc',
      }}
    >
      {/* m-auto centers both axes in a flex parent; collapses to 0 when content overflows */}
      <div className="w-full max-w-2xl m-auto px-6 py-8 flex flex-col gap-5">

        {/* ── Title ── */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">Analyse Incident</h1>
          <p className="text-slate-400 text-sm">Follow the guided workflow to generate a multi-agent RCA report.</p>
        </div>

        {/* ── Stepper ── */}
        <div className="relative flex items-start justify-between px-2" style={{ paddingBottom: '4px' }}>
          {/* Grey track */}
          <div className="absolute left-6 right-6 top-5 h-0.5 bg-slate-200" />
          {/* Violet progress */}
          <div
            className="absolute left-6 top-5 h-0.5 bg-violet-500 transition-all duration-500"
            style={{ width: `calc((${currentStep - 1} / 3) * (100% - 48px))` }}
          />
          {steps.map((step) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;
            return (
              <div
                key={step.num}
                className="flex flex-col items-center gap-1.5 cursor-pointer relative z-10"
                style={{ width: '25%' }}
                onClick={() => step.num < currentStep && setCurrentStep(step.num)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-violet-500 text-white shadow-md shadow-violet-200 scale-110'
                      : isCompleted
                      ? 'bg-violet-400 text-white'
                      : 'bg-white text-slate-400 border-2 border-slate-200'
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  ) : (
                    step.num
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider text-center leading-tight ${
                    isActive ? 'text-violet-500' : isCompleted ? 'text-violet-400' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Timeline ── */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">
                Incident Title (Optional)
              </label>
              <input
                type="text"
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 border-none rounded-xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm placeholder:text-slate-500"
                placeholder="e.g. Database Connection Timeout"
              />
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sky-500 text-[20px]">timeline</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 leading-tight">Timeline Information</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Provide the sequence of events that occurred during the incident.</p>
                </div>
              </div>
              <textarea
                value={timelineText}
                onChange={(e) => setTimelineText(e.target.value)}
                className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none shadow-inner"
                placeholder={'10:00 AM Deployment Started\n10:05 AM Error Rate Increased...'}
              />
              <div className="flex items-center justify-between mt-4">
                <div>
                  <input
                    ref={timelineFileRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'timeline')}
                  />
                  <button
                    onClick={() => timelineFileRef.current.click()}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-violet-500 transition-colors uppercase tracking-wide"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload</span>
                    {timelineFile || 'Upload File'}
                  </button>
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-[#008B8B] hover:bg-teal-700 text-white font-bold py-2.5 px-7 rounded-full flex items-center gap-1.5 transition-colors shadow-md text-sm border-2 border-black"
                >
                  Continue <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Error Logs ── */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-sky-500 text-[20px]">terminal</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 leading-tight">Error Logs</h2>
                <p className="text-slate-400 text-xs mt-0.5">Paste or upload application logs for AI analysis.</p>
              </div>
            </div>
            <textarea
              value={logsText}
              onChange={(e) => setLogsText(e.target.value)}
              className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none shadow-inner"
              placeholder={'[ERROR] 2024-03-10 10:05:22 Database connection timeout...\n[WARN] 2024-03-10 10:05:25 Retrying connection...'}
            />
            <div className="flex items-center justify-between mt-4">
              <div>
                <input
                  ref={logsFileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'logs')}
                />
                <button
                  onClick={() => logsFileRef.current.click()}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-violet-500 transition-colors uppercase tracking-wide"
                >
                  <span className="material-symbols-outlined text-[16px]">upload</span>
                  {logsFile || 'Upload File'}
                </button>
              </div>
              <div className="flex items-center gap-5">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-[#008B8B] hover:bg-teal-700 text-white font-bold py-2.5 px-7 rounded-full flex items-center gap-1.5 transition-colors shadow-md text-sm border-2 border-black"
                >
                  Continue <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Git Diff ── */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sky-500 text-[20px]">difference</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 leading-tight">Recent Git Changes</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Paste recent code changes to help AI correlate deployment risks.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full shrink-0 ml-3">
                Optional
              </span>
            </div>
            <textarea
              value={diffText}
              onChange={(e) => setDiffText(e.target.value)}
              className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none shadow-inner"
              placeholder={'commit 9d2c41a...\n--- config/database.env\n+ DB_POOL_SIZE=50'}
            />
            <div className="flex items-center justify-between mt-4">
              <div>
                <input
                  ref={diffFileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'diff')}
                />
                <button
                  onClick={() => diffFileRef.current.click()}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-violet-500 transition-colors uppercase tracking-wide"
                >
                  <span className="material-symbols-outlined text-[16px]">upload</span>
                  {diffFile || 'Upload File'}
                </button>
              </div>
              <div className="flex items-center gap-5">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="bg-[#008B8B] hover:bg-teal-700 text-white font-bold py-2.5 px-7 rounded-full flex items-center gap-1.5 transition-colors shadow-md text-sm border-2 border-black"
                >
                  Continue <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Generate RCA ── */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-200 animate-fade-in text-center">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-violet-100 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-2 rounded-full bg-sky-100 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center relative z-10 shadow-xl shadow-violet-200">
                    <span className="material-symbols-outlined text-white text-[28px] animate-spin" style={{ animationDuration: '3s' }}>
                      progress_activity
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-slate-800">AI Agents Working</h3>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 w-full max-w-xs mx-auto text-left">
                  <div className="flex flex-col gap-3">
                    {stages.map((stage, idx) => {
                      const isActive = idx === stageIndex;
                      const isDone = idx < stageIndex;
                      if (Math.abs(idx - stageIndex) > 1) return null;
                      return (
                        <div
                          key={stage}
                          className={`flex items-center gap-3 transition-all duration-300 ${
                            isActive ? 'opacity-100' : isDone ? 'opacity-50' : 'opacity-30'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[18px] ${
                              isActive ? 'text-violet-500 animate-spin' : isDone ? 'text-emerald-500' : 'text-slate-300'
                            }`}
                            style={isActive ? { animationDuration: '2s' } : {}}
                          >
                            {isDone ? 'check_circle' : isActive ? 'settings' : 'radio_button_unchecked'}
                          </span>
                          <span
                            className={`font-bold text-xs uppercase tracking-wider ${
                              isActive ? 'text-slate-800' : 'text-slate-500'
                            }`}
                          >
                            {stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-sky-100 to-violet-100 rounded-2xl flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-violet-500 text-[28px]">auto_awesome</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Ready For AI Analysis</h2>
                <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                  The Multi-Agent system will combine your timeline, error logs, and git changes to generate a structured Root Cause Analysis.
                </p>

                {error && (
                  <div className="mb-6 bg-red-50 text-red-600 rounded-xl p-3.5 flex items-center justify-center gap-2 border border-red-100 max-w-sm mx-auto text-sm">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleStartInvestigation}
                    className="bg-[#008B8B] hover:bg-teal-700 text-white font-bold py-3 px-10 rounded-full transition-all shadow-lg active:translate-y-0.5 text-sm border-2 border-black"
                  >
                    Generate RCA Report
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
