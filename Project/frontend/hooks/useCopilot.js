import { useState, useEffect, useCallback, useRef } from 'react';
import {
  streamCopilotChat,
  getCopilotHistory,
  getCopilotSuggestions,
  clearCopilotHistory,
} from '../data/api';

/**
 * useCopilot — Custom hook encapsulating all copilot chat state and streaming logic.
 *
 * @param {string|null} incidentId - Incident ID for context-aware chat
 */
export default function useCopilot(incidentId = null) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState(null);
  const [sources, setSources] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const streamingContentRef = useRef('');

  // Load history and suggestions on mount / incident change
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Load conversation history if incident exists
        if (incidentId) {
          try {
            const historyData = await getCopilotHistory(incidentId);
            if (historyData.messages?.length > 0) {
              setMessages(historyData.messages);
            }
          } catch {
            // No history — that's OK
          }
        }

        // Load suggestions
        try {
          const suggestionsData = await getCopilotSuggestions(incidentId);
          setSuggestions(suggestionsData.suggestions || []);
        } catch {
          setSuggestions([
            'How does RootLens work?',
            'What are SRE best practices?',
            'How should I structure a post-mortem?',
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [incidentId]);

  /**
   * Send a message and stream the response.
   */
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isStreaming) return;

      setError(null);

      // Add user message immediately
      const userMessage = {
        message_id: `temp-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        sources: [],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Start streaming
      setIsStreaming(true);
      setStreamingContent('');
      streamingContentRef.current = '';

      let responseSources = [];

      await streamCopilotChat(incidentId, text.trim(), {
        onToken: (token) => {
          streamingContentRef.current += token;
          setStreamingContent(streamingContentRef.current);
        },
        onSources: (srcs) => {
          responseSources = srcs;
          setSources(srcs);
        },
        onSuggestions: (sugs) => {
          setSuggestions(sugs);
        },
        onDone: (data) => {
          // Move streaming content into a permanent message
          const assistantMessage = {
            message_id: data.message_id || `ai-${Date.now()}`,
            role: 'assistant',
            content: streamingContentRef.current,
            sources: responseSources,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingContent('');
          streamingContentRef.current = '';
          setIsStreaming(false);
        },
        onError: (err) => {
          setError(err);
          // If we got partial content, save it as a message
          if (streamingContentRef.current) {
            const partialMessage = {
              message_id: `ai-error-${Date.now()}`,
              role: 'assistant',
              content: streamingContentRef.current + '\n\n*[Response interrupted]*',
              sources: responseSources,
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, partialMessage]);
          }
          setStreamingContent('');
          streamingContentRef.current = '';
          setIsStreaming(false);
        },
      });
    },
    [incidentId, isStreaming]
  );

  /**
   * Clear the conversation.
   */
  const clearConversation = useCallback(async () => {
    setMessages([]);
    setStreamingContent('');
    streamingContentRef.current = '';
    setError(null);
    setSources([]);

    if (incidentId) {
      try {
        await clearCopilotHistory(incidentId);
      } catch {
        // Silent fail — UI is already cleared
      }
    }

    // Reload suggestions
    try {
      const suggestionsData = await getCopilotSuggestions(incidentId);
      setSuggestions(suggestionsData.suggestions || []);
    } catch {
      // Keep existing suggestions
    }
  }, [incidentId]);

  return {
    messages,
    isStreaming,
    streamingContent,
    error,
    sources,
    suggestions,
    isLoading,
    sendMessage,
    clearConversation,
  };
}
