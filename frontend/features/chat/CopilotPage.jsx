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
    <div className="h-full flex overflow-hidden animate-fade-in">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Messages / Welcome */}
        <div className="flex-1 overflow-y-auto chat-scroll px-6 py-5 flex flex-col gap-4">
          {!hasMessages && !isStreaming ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12">
              <span className="material-symbols-outlined text-[64px] bg-gradient-to-br from-primary to-teal-400 bg-clip-text text-transparent drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              <div className="text-center max-w-lg">
                <h2 className="text-headline-lg font-headline-lg text-on-surface mb-3">RootLens Copilot</h2>
                <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
                  {incidentId
                    ? 'I have full context of this investigation — RCA, evidence chain, logs, timeline, and git changes.'
                    : 'Ask me anything about incident management, SRE best practices, or how RootLens works.'}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                {suggestions.map((q, i) => (
                  <button key={i} onClick={() => handleSuggestion(q)}
                    className="px-4 py-3 bento-tile hover:bg-surface-container-high transition-all text-body-md font-body-md text-left flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-[18px] text-outline shrink-0">
                      {['help', 'policy', 'history', 'shield', 'security', 'summarize', 'task'][i % 7]}
                    </span>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="text-center text-label-sm font-label-sm text-outline my-2">
                <span className="bg-surface-container px-4 py-1.5 rounded-full">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {messages.map((msg) => <MessageBubble key={msg.message_id} message={msg} incidentId={incidentId} />)}

              {isStreaming && streamingContent && (
                <div className="flex justify-start w-full animate-slide-up">
                  <div className="max-w-[80%] bento-tile p-0 overflow-hidden">
                    <div className="px-5 py-3 border-b border-surface-variant flex items-center gap-3 bg-surface-container-lowest">
                      <span className="material-symbols-outlined text-[28px] text-primary drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                      <span className="text-label-md font-label-md text-on-surface uppercase tracking-wider">RootLens Copilot</span>
                      <span className="ml-auto flex items-center gap-2 text-label-sm font-label-sm text-primary bg-primary-container/30 rounded-full px-3 py-1 uppercase">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        Streaming
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="text-body-md font-body-md text-on-surface whitespace-pre-wrap leading-relaxed">{streamingContent}</div>
                      <TypingIndicator />
                    </div>
                  </div>
                </div>
              )}

              {isStreaming && !streamingContent && (
                <div className="flex justify-start w-full">
                  <div className="bento-tile p-5 flex items-center gap-4">
                    <span className="material-symbols-outlined text-[28px] text-primary drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    <TypingIndicator />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center">
                  <div className="bg-error-container rounded-xl p-4 flex items-center gap-3 max-w-lg border border-error/20">
                    <span className="material-symbols-outlined text-error text-[20px]">error</span>
                    <span className="text-body-md font-body-md text-on-error-container">{error}</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 py-5 bg-surface-container-lowest border-t border-surface-variant relative z-10 flex flex-col gap-3">
          {hasMessages && suggestions.length > 0 && !isStreaming && (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {suggestions.slice(0, 4).map((q, i) => (
                <button key={i} onClick={() => handleSuggestion(q)}
                  className="whitespace-nowrap px-4 py-2 bento-tile hover:bg-surface-container-high transition-colors text-label-md font-label-md flex items-center gap-2 shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px] text-outline">{['help', 'policy', 'history', 'shield'][i % 4]}</span>
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="relative w-full flex gap-3 items-end">
            <div className="relative flex-1 bento-tile p-0 overflow-hidden flex flex-col justify-center focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
              <textarea
                ref={textareaRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} disabled={isStreaming}
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none outline-none resize-none pr-14 pl-4 py-4 disabled:opacity-50 text-body-md font-body-md text-on-surface scrollbar-hide"
                placeholder={isStreaming ? 'Copilot is responding...' : 'Ask about this investigation...'}
                rows="1" style={{ minHeight: '56px', maxHeight: '160px' }}
              />
              <button onClick={handleSend} disabled={!input.trim() || isStreaming}
                className="absolute bottom-2 right-2 w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              </button>
            </div>
            {hasMessages && (
              <button onClick={clearConversation} disabled={isStreaming}
                className="w-14 h-[56px] bento-tile hover:bg-error-container hover:text-error flex items-center justify-center transition-colors disabled:opacity-30 self-end p-0"
                title="Clear conversation"
              >
                <span className="material-symbols-outlined text-[24px]">delete</span>
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
        <div className="max-w-[70%] bg-primary-container text-on-primary-container rounded-2xl rounded-br-md p-5 shadow-sm">
          <p className="text-body-md font-body-md whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start w-full animate-slide-up">
      <div className="max-w-[80%] bento-tile p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-variant flex items-center gap-3 bg-surface-container-lowest">
            <span className="material-symbols-outlined text-[28px] text-primary drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          <span className="text-label-md font-label-md uppercase tracking-wider text-on-surface">RootLens Copilot</span>
          {message.sources?.length > 0 && (
            <div className="ml-auto flex gap-2 flex-wrap justify-end">
              {message.sources.slice(0, 5).map((s) => (
                <Link key={s} to={incidentId ? `/report/${incidentId}` : '#'} className="text-label-sm font-label-sm bg-surface-container hover:bg-primary-container hover:text-on-primary-container transition-colors text-on-surface px-2 py-1 rounded-md uppercase">
                  {s}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="text-body-md font-body-md text-on-surface whitespace-pre-wrap leading-relaxed">
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
        if (para.startsWith('### ')) return <h4 key={i} className="text-label-md font-label-md uppercase tracking-wider text-outline mt-5 mb-2 pb-2 border-b border-surface-variant">{para.slice(4)}</h4>;
        if (para.startsWith('## ')) return <h3 key={i} className="text-headline-md font-headline-md text-on-surface mt-5 mb-3 tracking-tight">{para.slice(3)}</h3>;
        if (para.startsWith('```')) {
          const code = para.replace(/```\w*\n?/g, '').replace(/```$/g, '');
          return <div key={i} className="bg-inverse-surface text-inverse-on-surface p-4 font-mono text-[13px] overflow-x-auto my-4 rounded-xl whitespace-pre">{code}</div>;
        }
        if (para.includes('\n- ') || para.startsWith('- ')) {
          const items = para.split('\n').filter(l => l.startsWith('- '));
          return <ul key={i} className="my-3 space-y-2">{items.map((item, j) => <li key={j} className="flex gap-3"><span className="text-primary shrink-0 mt-1">▪</span><span>{formatInline(item.slice(2), incidentId)}</span></li>)}</ul>;
        }
        return <p key={i} className={i > 0 ? 'mt-4' : ''}>{formatInline(para, incidentId)}</p>;
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
    else if (match[2]) parts.push(<code key={match.index} className="bg-surface-container px-2 py-1 rounded text-[13px] font-mono border border-surface-variant">{match[2].slice(1, -1)}</code>);
    else if (match[3]) parts.push(
      <Link key={match.index} to={incidentId ? `/report/${incidentId}` : '#'} className="inline-flex items-center bg-surface-container hover:bg-primary-container hover:text-on-primary-container transition-colors text-on-surface px-2 py-0.5 rounded-md font-mono text-[11px] uppercase mx-1 align-middle">
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
    <div className="flex items-center gap-2 mt-2">
      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
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
    <aside className="w-[340px] bg-surface-container-lowest border-l border-surface-variant flex flex-col hidden xl:flex">
      <div className="p-5 border-b border-surface-variant flex items-center gap-3 bg-surface-container-lowest shrink-0">
        <span className="material-symbols-outlined text-[20px] text-outline">view_sidebar</span>
        <h2 className="text-label-md font-label-md uppercase tracking-wider text-on-surface">Context</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {loading ? (
          <div className="animate-pulse flex flex-col gap-5">
            <div className="h-28 bento-tile"></div>
            <div className="h-36 bento-tile"></div>
          </div>
        ) : incidentId && context ? (
          <>
            {/* Active Investigation Card */}
            <div className="bento-tile p-5 bg-secondary-container">
              <h3 className="text-label-sm font-label-sm uppercase tracking-wider text-on-secondary-container flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[16px]">troubleshoot</span>
                Active Investigation
              </h3>
              <div className="font-mono text-[13px] bg-surface-container-lowest rounded-md px-3 py-1.5 border border-surface-variant text-outline mb-4 truncate">
                {incidentId}
              </div>
              <p className="text-body-md font-body-md text-on-secondary-container mb-4 line-clamp-2" title={context.user_context}>
                {context.user_context}
              </p>
              
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-label-sm font-label-sm uppercase rounded-full ${
                  context.status === 'COMPLETE' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-on-surface'
                }`}>
                  {context.status === 'COMPLETE' ? 'Complete' : 'Running'}
                </span>
                {context.root_cause?.confidence > 0 && (
                  <span className="text-label-sm font-label-sm text-on-surface bg-surface-container-lowest rounded-md px-2 py-1 shrink-0">
                    {context.root_cause.confidence}% Conf
                  </span>
                )}
              </div>
            </div>

            {/* Evidence Sources Present */}
            <div className="bento-tile p-5">
              <h3 className="text-label-sm font-label-sm uppercase tracking-wider text-outline flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[16px]">database</span>
                Evidence Available
              </h3>
              <ul className="flex flex-col gap-3">
                <li className="flex items-center gap-3 text-body-md font-body-md text-on-surface">
                  <span className={`w-3 h-3 rounded-full ${context.has_logs ? 'bg-primary' : 'bg-surface-variant'}`}></span>
                  Logs
                </li>
                <li className="flex items-center gap-3 text-body-md font-body-md text-on-surface">
                  <span className={`w-3 h-3 rounded-full ${context.has_timeline ? 'bg-primary' : 'bg-surface-variant'}`}></span>
                  Timeline
                </li>
                <li className="flex items-center gap-3 text-body-md font-body-md text-on-surface">
                  <span className={`w-3 h-3 rounded-full ${context.has_git ? 'bg-primary' : 'bg-surface-variant'}`}></span>
                  Git Changes
                </li>
              </ul>
            </div>

            {/* Currently Referenced Sources */}
            {sources.length > 0 && (
              <div className="bento-tile p-5">
                <h3 className="text-label-sm font-label-sm uppercase tracking-wider text-outline flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[16px]">link</span>
                  Referenced in Chat
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sources.map((s) => (
                    <Link key={s} to={`/report/${incidentId}`} className="bg-surface-container hover:bg-primary-container hover:text-on-primary-container transition-colors text-on-surface px-3 py-1 rounded-md text-label-sm font-label-sm uppercase">
                      {s}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Incidents */}
            {similar.length > 0 && (
              <div className="bento-tile p-5">
                <h3 className="text-label-sm font-label-sm uppercase tracking-wider text-outline flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  Historical Matches
                </h3>
                <div className="flex flex-col gap-3">
                  {similar.filter(s => s.id !== incidentId).slice(0, 3).map((sim) => (
                    <Link key={sim.id} to={`/investigate/${sim.id}`} className="block p-3 rounded-xl bg-surface hover:bg-surface-container-high transition-colors">
                      <p className="text-body-md font-body-md text-on-surface line-clamp-1 mb-2">{sim.user_context}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-label-sm font-label-sm text-outline">Root Cause: {sim.root_cause ? 'Yes' : 'No'}</span>
                        {sim.confidence > 0 && <span className="text-label-sm font-label-sm text-primary">{sim.confidence}%</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bento-tile p-5 bg-primary-container">
              <h3 className="text-label-sm font-label-sm uppercase tracking-wider text-on-primary-container flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[16px]">info</span>General Mode
              </h3>
              <p className="text-body-md font-body-md text-on-primary-container leading-relaxed">Navigate to an investigation for context-aware analysis.</p>
            </div>
            <div className="bento-tile p-5">
              <h3 className="text-label-sm font-label-sm uppercase tracking-wider text-outline flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>Capabilities
              </h3>
              <ul className="flex flex-col gap-3">
                {['Incident management', 'Post-mortem structuring', 'SRE methodology', 'Platform guidance'].map(c => (
                  <li key={c} className="flex items-center gap-3 text-body-md font-body-md text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        
        {/* Shortcuts */}
        <div className="bento-tile p-5 mt-auto border border-surface-variant">
          <h3 className="text-label-sm font-label-sm uppercase tracking-wider text-outline mb-4">Shortcuts</h3>
          <div className="flex items-center justify-between text-body-md font-body-md text-on-surface mb-3">
            <span>Send</span><kbd className="bg-surface-container-highest px-2 py-1 rounded text-label-sm font-label-sm border border-outline-variant/20 shadow-sm">Enter</kbd>
          </div>
          <div className="flex items-center justify-between text-body-md font-body-md text-on-surface">
            <span>New line</span><kbd className="bg-surface-container-highest px-2 py-1 rounded text-label-sm font-label-sm border border-outline-variant/20 shadow-sm">Shift+Enter</kbd>
          </div>
        </div>
      </div>
    </aside>
  );
}
