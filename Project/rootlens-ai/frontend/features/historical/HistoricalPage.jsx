import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncidents } from '../../data/api';
import { useToast } from '../../components/shared/ToastContext';

/**
 * HistoricalPage — Loads real incidents from the backend and displays as a table.
 */
export default function HistoricalPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
    return () => { cancelled = true; };
  }, []);

  const filteredIncidents = incidents.filter(inc => {
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'COMPLETE' && inc.status === 'COMPLETE') ||
      (statusFilter === 'RUNNING' && inc.status !== 'COMPLETE');
    const matchesSearch = inc.user_context?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      inc.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] w-full mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight mb-1">Historical Incidents</h2>
          <p className="font-body-md text-body-md text-outline">
            {loading ? 'Loading...' : `${incidents.length} incident${incidents.length !== 1 ? 's' : ''} from the database.`}
          </p>
        </div>
        
        {/* Search & Filter */}
        {!loading && incidents.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex bg-surface-container/50 rounded-lg p-1 border border-outline-variant/30">
              {['ALL', 'COMPLETE', 'RUNNING'].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 text-[11px] font-label-bold uppercase rounded-md transition-all ${
                    statusFilter === f ? 'bg-white shadow-sm text-on-surface' : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-outline">search</span>
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-outline-variant/40 rounded-lg py-2 pl-9 pr-4 font-body-sm text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-200/50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-error-container rounded-lg p-3 flex items-center gap-2 border border-error/10 mb-4">
          <span className="material-symbols-outlined text-error text-[16px]">cloud_off</span>
          <span className="font-body-sm text-[12px] text-on-surface flex-1">Backend unavailable: {error}</span>
          <button onClick={() => setError(null)} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl border border-outline-variant/30 overflow-hidden shadow-card">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-outline-variant/10 animate-pulse">
              <div className="h-4 w-20 bg-surface-dim rounded"></div>
              <div className="h-4 w-32 bg-surface-dim rounded"></div>
              <div className="h-3 w-16 bg-surface-dim rounded"></div>
              <div className="h-3 w-64 bg-surface-dim rounded flex-1"></div>
              <div className="h-3 w-24 bg-surface-dim rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredIncidents.length === 0 && (
        <div className="bg-white rounded-xl border border-outline-variant/30 p-12 shadow-card flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-lavender-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-violet-200 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
          </div>
          <h3 className="font-headline-sm text-[16px] text-on-surface">No Incidents Found</h3>
          <p className="font-body-sm text-body-sm text-outline text-center max-w-sm">
            {incidents.length === 0 
              ? 'Start a new investigation from the Dashboard to build your historical knowledge base.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && filteredIncidents.length > 0 && (
        <div className="bg-white rounded-xl border border-outline-variant/30 overflow-hidden shadow-card">
          {/* Header Row */}
          <div className="grid grid-cols-[120px_1fr_100px_80px_2fr_100px] gap-4 px-5 py-3 border-b border-outline-variant/20 bg-surface-container/50">
            {['ID', 'Description', 'Status', 'Confidence', 'Root Cause', 'Actions'].map((col) => (
              <div key={col} className="font-label-bold text-[10px] uppercase tracking-[0.1em] text-outline">{col}</div>
            ))}
          </div>

          {/* Data Rows */}
          <div className="stagger-in">
            {filteredIncidents.map((inc, i) => {
              const rca = inc.rca || {};
              const confidence = rca.rca_metadata?.overall_confidence || rca.root_cause?.confidence || 0;
              const rootCause = rca.root_cause?.title || '—';
              const isComplete = inc.status === 'COMPLETE';
              const description = inc.user_context || 'Untitled';

              return (
                <div
                  key={inc.id}
                  className={`grid grid-cols-[120px_1fr_100px_80px_2fr_100px] gap-4 px-5 py-4 items-center group cursor-pointer transition-all hover:bg-mint-50/20 ${
                    i < filteredIncidents.length - 1 ? 'border-b border-outline-variant/10' : ''
                  }`}
                  onClick={() => navigate(isComplete ? `/report/${inc.id}` : `/investigate/${inc.id}`)}
                >
                  {/* ID */}
                  <div>
                    <div className="font-label-mono text-[11px] text-on-surface group-hover:text-violet-400 transition-colors truncate">
                      {inc.id.slice(0, 8)}...
                    </div>
                  </div>
                  {/* Description */}
                  <div className="font-body-sm text-[12px] text-on-surface truncate">{description}</div>
                  {/* Status */}
                  <div>
                    <span className={`font-label-mono text-[10px] px-2 py-1 rounded-full border uppercase ${
                      isComplete ? 'bg-mint-50 text-sky-200 border-sky-200/20' :
                      inc.status === 'NEEDS_CLARIFICATION' ? 'bg-violet-200/10 text-violet-400 border-violet-200/30' :
                      'bg-error/10 text-error border-error/20'
                    }`}>
                      {isComplete ? 'Complete' : inc.status === 'NEEDS_CLARIFICATION' ? 'Review' : 'Running'}
                    </span>
                  </div>
                  {/* Confidence */}
                  <div className="flex items-center gap-2">
                    {isComplete && confidence > 0 ? (
                      <>
                        <div className="w-full max-w-[40px]">
                          <div className="h-1.5 w-full bg-surface-dim rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-sky-200 to-violet-200 transition-all duration-700" style={{ width: `${confidence}%` }}></div>
                          </div>
                        </div>
                        <span className="font-label-bold text-[13px] text-sky-200">{confidence}%</span>
                      </>
                    ) : (
                      <span className="font-label-mono text-[11px] text-outline">—</span>
                    )}
                  </div>
                  {/* Root Cause */}
                  <div className="font-body-sm text-[12px] text-outline line-clamp-2 leading-relaxed">{rootCause}</div>
                  {/* Actions */}
                  <div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(isComplete ? `/report/${inc.id}` : `/investigate/${inc.id}`); }}
                      className="font-label-bold text-[11px] text-outline hover:text-violet-400 transition-colors flex items-center gap-1"
                    >
                      {isComplete ? 'Report' : 'View'}
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
