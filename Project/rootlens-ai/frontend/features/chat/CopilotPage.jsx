import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useCopilot from '../../hooks/useCopilot';
import { getCopilotContext, searchCopilotIncidents } from '../../data/api';

/**
 * CopilotPage — Enterprise AI Copilot chat interface with streaming, source references, and context sidebar.
 */
export default function CopilotPage() {
  const { incidentId } = useParams();
  const {
    messages, isStreaming, streamingContent, error, sources, suggestions, isLoading, sendMessage, clearConversation,
  } = useCopilot(incidentId || null);

  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleSuggestion = (q) => { if (!isStreaming) sendMessage(q); };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex overflow-hidden animate-fade-in">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Messages / Welcome */}
        <div className="flex-1 overflow-y-auto chat-scroll px-6 py-5 flex flex-col gap-4">
          {!hasMessages && !isStreaming ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-200 to-violet-400 flex items-center justify-center shadow-elevated">
                <span className="material-symbols-outlined text-white text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <div className="text-center max-w-lg">
                <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight mb-2">RootLens Copilot</h2>
                <p className="font-body-md text-body-md text-outline leading-relaxed">
                  {incidentId
                    ? 'I have full context of this investigation — RCA, evidence chain, logs, timeline, and git changes.'
                    : 'Ask me anything about incident management, SRE best practices, or how RootLens works.'}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                {suggestions.map((q, i) => (
                  <button key={i} onClick={() => handleSuggestion(q)}
                    className="px-3.5 py-2.5 bg-surface-container/50 text-on-surface rounded-lg border border-outline-variant/20 hover:bg-mint-50/40 hover:border-sky-200/30 transition-all font-body-sm text-[12px] text-left card-hover flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[14px] text-outline shrink-0">
                      {['help', 'policy', 'history', 'shield', 'security', 'summarize', 'task'][i % 7]}
                    </span>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="text-center font-label-mono text-[10px] text-outline my-1">
                <span className="bg-surface-container/50 px-3 py-1 rounded-full">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {messages.map((msg) => <MessageBubble key={msg.message_id} message={msg} incidentId={incidentId} />)}

              {isStreaming && streamingContent && (
                <div className="flex justify-start w-full animate-slide-up">
                  <div className="max-w-[80%] rounded-xl bg-white border border-outline-variant/20 overflow-hidden shadow-card">
                    <div className="px-4 py-2.5 border-b border-outline-variant/10 flex items-center gap-2 bg-surface-container/30">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-200 to-violet-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[12px]">smart_toy</span>
                      </div>
                      <span className="font-label-bold text-[11px] text-on-surface">RootLens Copilot</span>
                      <span className="ml-auto flex items-center gap-1.5 font-label-mono text-[9px] text-violet-400 bg-lavender-50 rounded-full px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
                        Streaming
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="font-body-md text-[14px] text-on-surface whitespace-pre-wrap leading-relaxed">{streamingContent}</div>
                      <TypingIndicator />
                    </div>
                  </div>
                </div>
              )}

              {isStreaming && !streamingContent && (
                <div className="flex justify-start w-full">
                  <div className="bg-surface-container/30 rounded-xl border border-outline-variant/20 p-4 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-200 to-violet-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[12px]">smart_toy</span>
                    </div>
                    <TypingIndicator />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center">
                  <div className="bg-error-container rounded-lg p-3 flex items-center gap-2 max-w-lg border border-error/10">
                    <span className="material-symbols-outlined text-error text-[16px]">error</span>
                    <span className="font-body-sm text-[12px] text-on-surface">{error}</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 bg-white border-t border-outline-variant/20 relative z-10 flex flex-col gap-2.5">
          {hasMessages && suggestions.length > 0 && !isStreaming && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {suggestions.slice(0, 4).map((q, i) => (
                <button key={i} onClick={() => handleSuggestion(q)}
                  className="whitespace-nowrap px-3 py-1.5 bg-surface-container/40 text-outline rounded-lg border border-outline-variant/20 hover:bg-mint-50/30 transition-colors font-body-sm text-[11px] flex items-center gap-1.5 shrink-0"
                >
                  <span className="material-symbols-outlined text-[12px]">{['help', 'policy', 'history', 'shield'][i % 4]}</span>
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="relative w-full flex gap-2">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} disabled={isStreaming}
                className="w-full bg-surface-container/30 text-on-surface font-body-md text-[14px] p-3.5 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-sky-200/30 focus:border-sky-200 focus:outline-none transition-all resize-none pr-12 disabled:opacity-50"
                placeholder={isStreaming ? 'Copilot is responding...' : 'Ask about this investigation...'}
                rows="1" style={{ minHeight: '48px' }}
              />
              <button onClick={handleSend} disabled={!input.trim() || isStreaming}
                className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-lg bg-gradient-to-r from-sky-200 to-violet-200 text-on-surface flex items-center justify-center hover:shadow-card transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              </button>
            </div>
            {hasMessages && (
              <button onClick={clearConversation} disabled={isStreaming}
                className="w-11 h-12 rounded-xl border border-outline-variant/30 bg-white hover:bg-error-container/30 text-outline hover:text-error flex items-center justify-center transition-colors disabled:opacity-30 self-end"
                title="Clear conversation"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Context Sidebar */}
      <ContextSidebar incidentId={incidentId} sources={sources} />
    </div>
  );
}

function MessageBubble({ message, incidentId }) {
  const isUser = message.role === 'user';
  if (isUser) {
    return (
      <div className="flex justify-end w-full animate-scale-in">
        <div className="max-w-[70%] bg-gradient-to-r from-mint-50 to-sky-100/30 text-on-surface rounded-xl rounded-br-sm p-4 border border-sky-200/20">
          <p className="font-body-md text-[14px] whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start w-full animate-slide-up">
      <div className="max-w-[80%] rounded-xl bg-white border border-outline-variant/20 overflow-hidden shadow-card">
        <div className="px-4 py-2.5 border-b border-outline-variant/10 flex items-center gap-2 bg-surface-container/30">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-200 to-violet-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[12px]">smart_toy</span>
          </div>
          <span className="font-label-bold text-[11px] text-on-surface">RootLens Copilot</span>
          {message.sources?.length > 0 && (
            <div className="ml-auto flex gap-1 flex-wrap justify-end">
              {message.sources.slice(0, 5).map((s) => (
                <Link key={s} to={incidentId ? `/report/${incidentId}` : '#'} className="font-label-mono text-[8px] bg-lavender-50 hover:bg-violet-200 hover:text-white transition-colors text-violet-400 px-1.5 py-0.5 rounded uppercase">
                  {s}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="font-body-md text-[14px] text-on-surface whitespace-pre-wrap leading-relaxed">
            <FormattedContent content={message.content} incidentId={incidentId} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FormattedContent({ content, incidentId }) {
  if (!content) return null;
  const paragraphs = content.split('\n\n');
  return (
    <>
      {paragraphs.map((para, i) => {
        if (para.startsWith('### ')) return <h4 key={i} className="font-label-bold text-[12px] uppercase tracking-widest text-outline mt-4 mb-2 pb-1 border-b border-outline-variant/20">{para.slice(4)}</h4>;
        if (para.startsWith('## ')) return <h3 key={i} className="font-headline-sm text-[16px] text-on-surface mt-4 mb-2 tracking-tight">{para.slice(3)}</h3>;
        if (para.startsWith('```')) {
          const code = para.replace(/```\w*\n?/g, '').replace(/```$/g, '');
          return <div key={i} className="bg-inverse-surface text-inverse-on-surface p-3 font-label-mono text-[11px] overflow-x-auto my-3 rounded-lg whitespace-pre">{code}</div>;
        }
        if (para.includes('\n- ') || para.startsWith('- ')) {
          const items = para.split('\n').filter(l => l.startsWith('- '));
          return <ul key={i} className="my-2 space-y-1">{items.map((item, j) => <li key={j} className="flex gap-2"><span className="text-violet-200 shrink-0 mt-1">▪</span><span>{formatInline(item.slice(2), incidentId)}</span></li>)}</ul>;
        }
        return <p key={i} className={i > 0 ? 'mt-3' : ''}>{formatInline(para, incidentId)}</p>;
      })}
    </>
  );
}

function formatInline(text, incidentId) {
  if (!text) return text;
  const parts = [];
  const regex = /(\*\*[^*]+\*\*)|(`[^`]+`)|(\b(?:LOG|TL|GIT|CF|AI|AW)-\d+\b)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1]) parts.push(<strong key={match.index} className="font-bold text-on-surface">{match[1].slice(2, -2)}</strong>);
    else if (match[2]) parts.push(<code key={match.index} className="bg-surface-container px-1 py-0.5 rounded text-[11px] font-label-mono border border-outline-variant/20">{match[2].slice(1, -1)}</code>);
    else if (match[3]) parts.push(
      <Link key={match.index} to={incidentId ? `/report/${incidentId}` : '#'} className="inline-flex items-center bg-lavender-50 hover:bg-violet-200 hover:text-white transition-colors text-violet-400 px-1.5 py-0 rounded font-label-mono text-[9px] uppercase mx-0.5 align-middle">
        {match[3]}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 mt-2">
      <span className="w-1.5 h-1.5 bg-violet-200 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
      <span className="w-1.5 h-1.5 bg-violet-200 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
      <span className="w-1.5 h-1.5 bg-violet-200 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
    </div>
  );
}

function ContextSidebar({ incidentId, sources }) {
  const [context, setContext] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!incidentId) {
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const ctx = await getCopilotContext(incidentId);
        if (cancelled) return;
        setContext(ctx);
        
        // If the context indicates we have a search query (like user_context), find similar ones
        if (ctx.user_context) {
          const sim = await searchCopilotIncidents(ctx.user_context, 3);
          if (!cancelled) setSimilar(sim.results || []);
        }
      } catch (err) {
        console.error('Failed to load copilot context:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [incidentId]);

  return (
    <aside className="w-[300px] bg-white border-l border-outline-variant/30 flex flex-col hidden xl:flex">
      <div className="p-4 border-b border-outline-variant/20 flex items-center gap-2 bg-surface-container/30 shrink-0">
        <span className="material-symbols-outlined text-[18px] text-outline">view_sidebar</span>
        <h2 className="font-label-bold text-[13px] text-on-surface tracking-tight">Context</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {loading ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-24 bg-surface-dim rounded-xl"></div>
            <div className="h-32 bg-surface-dim rounded-xl"></div>
          </div>
        ) : incidentId && context ? (
          <>
            {/* Active Investigation Card */}
            <div className="rounded-xl bg-gradient-to-b from-lavender-50/50 to-white p-4 border border-violet-200/20 shadow-sm">
              <h3 className="font-label-bold text-[11px] uppercase tracking-widest text-outline flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[14px]">troubleshoot</span>
                Active Investigation
              </h3>
              <div className="font-label-mono text-[10px] bg-white rounded px-2 py-1 border border-outline-variant/20 text-outline mb-3 truncate">
                {incidentId}
              </div>
              <p className="font-body-sm text-[12px] text-on-surface mb-3 line-clamp-2" title={context.user_context}>
                {context.user_context}
              </p>
              
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`px-2 py-0.5 font-label-mono text-[9px] uppercase rounded-full border ${
                  context.status === 'COMPLETE' ? 'bg-mint-50 text-sky-200 border-sky-200/20' : 'bg-error/10 text-error border-error/20'
                }`}>
                  {context.status === 'COMPLETE' ? 'Complete' : 'Running'}
                </span>
                {context.root_cause?.confidence > 0 && (
                  <span className="font-label-mono text-[10px] text-violet-400 bg-lavender-50 rounded px-1.5 py-0.5 border border-violet-200/30 shrink-0">
                    {context.root_cause.confidence}% Conf
                  </span>
                )}
              </div>
            </div>

            {/* Evidence Sources Present */}
            <div className="rounded-xl bg-white p-4 border border-outline-variant/20 shadow-sm">
              <h3 className="font-label-bold text-[11px] uppercase tracking-widest text-outline flex items-center gap-1.5 mb-3">
                <span className="material-symbols-outlined text-[14px]">database</span>
                Evidence Available
              </h3>
              <ul className="flex flex-col gap-2">
                <li className="flex items-center gap-2 font-body-sm text-[11px] text-on-surface">
                  <span className={`w-2 h-2 rounded-full ${context.has_logs ? 'bg-mint-50' : 'bg-outline-variant'}`}></span>
                  Logs
                </li>
                <li className="flex items-center gap-2 font-body-sm text-[11px] text-on-surface">
                  <span className={`w-2 h-2 rounded-full ${context.has_timeline ? 'bg-lavender-50' : 'bg-outline-variant'}`}></span>
                  Timeline
                </li>
                <li className="flex items-center gap-2 font-body-sm text-[11px] text-on-surface">
                  <span className={`w-2 h-2 rounded-full ${context.has_git ? 'bg-sky-100/50' : 'bg-outline-variant'}`}></span>
                  Git Changes
                </li>
              </ul>
            </div>

            {/* Currently Referenced Sources */}
            {sources.length > 0 && (
              <div className="rounded-xl bg-white p-4 border border-outline-variant/20 shadow-sm">
                <h3 className="font-label-bold text-[11px] uppercase tracking-widest text-outline flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  Referenced in Chat
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {sources.map((s) => (
                    <Link key={s} to={`/report/${incidentId}`} className="bg-lavender-50 hover:bg-violet-200 hover:text-white transition-colors text-violet-400 px-2 py-0.5 rounded font-label-mono text-[9px] uppercase">
                      {s}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Incidents */}
            {similar.length > 0 && (
              <div className="rounded-xl bg-white p-4 border border-outline-variant/20 shadow-sm">
                <h3 className="font-label-bold text-[11px] uppercase tracking-widest text-outline flex items-center gap-1.5 mb-3">
                  <span className="material-symbols-outlined text-[14px]">history</span>
                  Historical Matches
                </h3>
                <div className="flex flex-col gap-2">
                  {similar.filter(s => s.id !== incidentId).slice(0, 3).map((sim) => (
                    <Link key={sim.id} to={`/investigate/${sim.id}`} className="block p-2 rounded-lg border border-outline-variant/10 hover:bg-mint-50/30 transition-colors">
                      <p className="font-body-sm text-[11px] text-on-surface line-clamp-1 mb-1">{sim.user_context}</p>
                      <div className="flex justify-between items-center">
                        <span className="font-label-mono text-[9px] text-outline">Root Cause: {sim.root_cause ? 'Yes' : 'No'}</span>
                        {sim.confidence > 0 && <span className="font-label-mono text-[9px] text-sky-200">{sim.confidence}%</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="rounded-xl bg-gradient-to-b from-mint-50/50 to-white p-4 border border-sky-200/10 shadow-sm">
              <h3 className="font-label-bold text-[11px] uppercase tracking-widest text-outline flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[14px]">info</span>General Mode
              </h3>
              <p className="font-body-sm text-[11px] text-outline leading-relaxed">Navigate to an investigation for context-aware analysis.</p>
            </div>
            <div className="rounded-xl bg-white p-4 border border-outline-variant/20 shadow-sm">
              <h3 className="font-label-bold text-[11px] uppercase tracking-widest text-outline flex items-center gap-1.5 mb-3">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>Capabilities
              </h3>
              <ul className="flex flex-col gap-2">
                {['Incident management', 'Post-mortem structuring', 'SRE methodology', 'Platform guidance'].map(c => (
                  <li key={c} className="flex items-center gap-2 font-body-sm text-[11px] text-outline">
                    <span className="material-symbols-outlined text-[14px] text-sky-200">check_circle</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        
        {/* Shortcuts */}
        <div className="rounded-xl bg-surface-container/30 p-4 mt-auto border border-outline-variant/10">
          <h3 className="font-label-bold text-[10px] uppercase tracking-widest text-outline-variant mb-3">Shortcuts</h3>
          <div className="flex items-center justify-between font-body-sm text-[10px] text-outline mb-2">
            <span>Send</span><kbd className="bg-white px-1.5 py-0.5 rounded text-[9px] font-label-mono border border-outline-variant/20 shadow-sm">Enter</kbd>
          </div>
          <div className="flex items-center justify-between font-body-sm text-[10px] text-outline">
            <span>New line</span><kbd className="bg-white px-1.5 py-0.5 rounded text-[9px] font-label-mono border border-outline-variant/20 shadow-sm">Shift+Enter</kbd>
          </div>
        </div>
      </div>
    </aside>
  );
}
