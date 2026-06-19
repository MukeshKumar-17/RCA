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
    <div className="h-full overflow-y-auto bg-surface">
      <div className="p-6 lg:p-8 max-w-[1400px] w-full mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-2">Historical Incidents</h2>
            <p className="font-body-md text-body-md text-outline">
              {loading ? 'Loading...' : `${incidents.length} incident${incidents.length !== 1 ? 's' : ''} from the database.`}
            </p>
          </div>
          
          {/* Search & Filter */}
          {!loading && incidents.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex bento-tile p-1 bg-surface-container/50">
                {['ALL', 'COMPLETE', 'RUNNING'].map(f => (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className={`px-4 py-2 font-label-md text-label-md uppercase rounded-lg transition-all ${
                      statusFilter === f ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-outline">search</span>
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bento-tile py-2.5 pl-11 pr-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bento-tile bg-error-container p-4 flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-error text-[20px]">cloud_off</span>
            <span className="font-body-md text-body-md text-on-error-container flex-1">Backend unavailable: {error}</span>
            <button onClick={() => setError(null)} className="text-on-error-container hover:opacity-70 transition-opacity">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bento-tile overflow-hidden p-0">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-6 px-6 py-5 border-b border-surface-variant animate-pulse">
                <div className="h-5 w-24 bg-surface-container-high rounded"></div>
                <div className="h-5 w-48 bg-surface-container-high rounded"></div>
                <div className="h-4 w-20 bg-surface-container-high rounded"></div>
                <div className="h-4 w-72 bg-surface-container-high rounded flex-1"></div>
                <div className="h-4 w-28 bg-surface-container-high rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredIncidents.length === 0 && (
          <div className="bento-tile p-16 flex flex-col items-center justify-center gap-5 text-center">
            <span className="material-symbols-outlined text-[64px] bg-gradient-to-br from-primary to-teal-400 bg-clip-text text-transparent drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            <h3 className="font-headline-md text-headline-md text-on-surface">No Incidents Found</h3>
            <p className="font-body-md text-body-md text-outline max-w-md">
              {incidents.length === 0 
                ? 'Start a new investigation from the Dashboard to build your historical knowledge base.'
                : 'Try adjusting your search query or filters.'}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filteredIncidents.length > 0 && (
          <div className="bento-tile overflow-hidden p-0">
            {/* Header Row */}
            <div className="grid grid-cols-[140px_1fr_120px_100px_2fr_120px] gap-5 px-6 py-4 border-b border-surface-variant bg-surface-container-lowest">
              {['ID', 'Description', 'Status', 'Confidence', 'Root Cause', 'Actions'].map((col) => (
                <div key={col} className="font-label-md text-label-md uppercase tracking-wider text-outline">{col}</div>
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
                    className={`grid grid-cols-[140px_1fr_120px_100px_2fr_120px] gap-5 px-6 py-5 items-center group cursor-pointer transition-colors hover:bg-surface-container-highest ${
                      i < filteredIncidents.length - 1 ? 'border-b border-surface-variant' : ''
                    }`}
                    onClick={() => navigate(isComplete ? `/report/${inc.id}` : `/investigate/${inc.id}`)}
                  >
                    {/* ID */}
                    <div>
                      <div className="font-mono text-[13px] text-on-surface group-hover:text-primary transition-colors truncate">
                        {inc.id.slice(0, 8)}...
                      </div>
                    </div>
                    {/* Description */}
                    <div className="font-body-md text-body-md text-on-surface truncate pr-4">{description}</div>
                    {/* Status */}
                    <div>
                      <span className={`font-label-md text-label-md px-3 py-1.5 rounded-md uppercase border ${
                        isComplete ? 'bg-primary-container text-on-primary-container border-primary/20' :
                        inc.status === 'NEEDS_CLARIFICATION' ? 'bg-error-container text-on-error-container border-error/30' :
                        'bg-secondary-container text-on-secondary-container border-secondary/20'
                      }`}>
                        {isComplete ? 'Complete' : inc.status === 'NEEDS_CLARIFICATION' ? 'Review' : 'Running'}
                      </span>
                    </div>
                    {/* Confidence */}
                    <div className="flex items-center gap-3">
                      {isComplete && confidence > 0 ? (
                        <>
                          <div className="w-full max-w-[48px]">
                            <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-primary to-teal-400 transition-all duration-700" style={{ width: `${confidence}%` }}></div>
                            </div>
                          </div>
                          <span className="font-label-md text-label-md text-primary font-bold">{confidence}%</span>
                        </>
                      ) : (
                        <span className="font-label-md text-label-md text-outline">—</span>
                      )}
                    </div>
                    {/* Root Cause */}
                    <div className="font-body-md text-body-md text-outline line-clamp-2 leading-relaxed pr-4">{rootCause}</div>
                    {/* Actions */}
                    <div>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(isComplete ? `/report/${inc.id}` : `/investigate/${inc.id}`); }}
                        className="font-label-md text-label-md text-outline group-hover:text-primary transition-colors flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg hover:bg-primary-container"
                      >
                        {isComplete ? 'Report' : 'View'}
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
