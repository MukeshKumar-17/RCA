/**
 * RootLens AI — API Client
 * ~~~~~~~~~~~~~~~~~~~~~~~~
 * Centralised fetch helpers for the FastAPI backend.
 * Base URL comes from the VITE_API_URL env var (defaults to localhost:8000).
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Generic JSON POST helper.
 */
async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Generic GET helper.
 */
async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Upload endpoints ──────────────────────────────────────────────────

/**
 * Upload a log file via multipart form.
 * @param {File} file - The file to upload
 * @returns {{ type, content, length }}
 */
export async function uploadLogs(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/upload/logs`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

/**
 * Upload a timeline file via multipart form.
 */
export async function uploadTimeline(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/upload/timeline`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

/**
 * Upload a diff file via multipart form.
 */
export async function uploadDiff(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/upload/diff`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

// ── Incident endpoints ────────────────────────────────────────────────

/**
 * List all incidents from the backend.
 * @returns {{ incidents: Array, total: number }}
 */
export async function getIncidents() {
  return getJSON('/incidents');
}

/**
 * Fetch a single incident by id.
 * @param {string} id
 * @returns {object} Full incident record
 */
export async function getIncident(id) {
  return getJSON(`/incidents/${id}`);
}

/**
 * Submit all inputs and trigger the RCA pipeline.
 * @param {{ logs, timeline, diff, user_context, incident_date? }} data
 * @returns {{ id, status, evidence_completeness }}
 */
export async function createIncident(data) {
  return postJSON('/incidents', data);
}

// ── Report endpoints ──────────────────────────────────────────────────

/**
 * Fetch a completed report by incident id.
 * @param {string} id
 * @returns {{ id, status, rca, evidence_completeness, ... }}
 */
export async function getReport(id) {
  return getJSON(`/report/${id}`);
}

/**
 * Fetch similar historical incidents for a given incident id.
 * @param {string} id - incident id
 * @returns {{ incident_id, matches, match_count, source }}
 */
export async function getSimilarIncidents(id) {
  return getJSON(`/similar-incidents/${id}`);
}

/**
 * Poll for report completion every `intervalMs` until status is COMPLETE
 * or `maxAttempts` is reached.
 * @param {string} id - incident id
 * @param {number} intervalMs - poll interval (default 3000)
 * @param {number} maxAttempts - max polls (default 60 = 3 minutes)
 * @param {(report) => void} onProgress - called on each poll with the latest data
 * @returns {Promise<object>} the completed report
 */
export function pollReport(id, { intervalMs = 3000, maxAttempts = 60, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const report = await getReport(id);
        onProgress?.(report);

        if (report.status === 'COMPLETE' || report.status === 'NEEDS_CLARIFICATION') {
          resolve(report);
          return;
        }

        if (attempts >= maxAttempts) {
          reject(new Error('Polling timed out — analysis is taking longer than expected.'));
          return;
        }

        setTimeout(poll, intervalMs);
      } catch (err) {
        // 404 means report not ready yet — keep polling
        if (err.message.includes('not found') && attempts < maxAttempts) {
          setTimeout(poll, intervalMs);
          return;
        }
        reject(err);
      }
    };

    poll();
  });
}

// ── Copilot endpoints ─────────────────────────────────────────────────

/**
 * Stream a copilot chat response via SSE.
 *
 * @param {string|null} incidentId - Incident to load context for (null for general)
 * @param {string} message - User's message
 * @param {object} callbacks
 * @param {(token: string) => void} callbacks.onToken - Called for each token
 * @param {(sources: string[]) => void} callbacks.onSources - Called with evidence IDs
 * @param {(suggestions: string[]) => void} callbacks.onSuggestions - Called with follow-ups
 * @param {(data: object) => void} callbacks.onDone - Called when stream completes
 * @param {(error: string) => void} callbacks.onError - Called on error
 * @returns {Promise<void>}
 */
export async function streamCopilotChat(incidentId, message, callbacks = {}) {
  const { onToken, onSources, onSuggestions, onDone, onError } = callbacks;

  try {
    const res = await fetch(`${API_BASE}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incident_id: incidentId,
        message,
        conversation_id: incidentId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Chat request failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let eventType = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const rawData = line.slice(6);
          try {
            const data = JSON.parse(rawData);
            switch (eventType) {
              case 'token':
                onToken?.(data.content);
                break;
              case 'sources':
                onSources?.(data.sources);
                break;
              case 'suggestions':
                onSuggestions?.(data.suggestions);
                break;
              case 'done':
                onDone?.(data);
                break;
              case 'error':
                onError?.(data.error);
                break;
            }
          } catch {
            // Skip malformed JSON lines
          }
          eventType = '';
        }
      }
    }
  } catch (err) {
    onError?.(err.message);
  }
}

/**
 * Fetch copilot conversation history for an incident.
 * @param {string} incidentId
 * @returns {{ incident_id, messages, message_count }}
 */
export async function getCopilotHistory(incidentId) {
  return getJSON(`/copilot/history/${incidentId}`);
}

/**
 * Fetch context-aware suggested questions.
 * @param {string|null} incidentId
 * @returns {{ incident_id, suggestions }}
 */
export async function getCopilotSuggestions(incidentId) {
  const path = incidentId
    ? `/copilot/suggestions/${incidentId}`
    : '/copilot/suggestions';
  return getJSON(path);
}

/**
 * Clear copilot conversation history.
 * @param {string} incidentId
 */
export async function clearCopilotHistory(incidentId) {
  const res = await fetch(`${API_BASE}/copilot/history/${incidentId}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to clear history');
  }
  return res.json();
}

/**
 * Search historical incidents from the copilot sidebar.
 * @param {string} query - Search text
 * @param {number} limit - Max results (default 5)
 * @returns {{ query, results, count }}
 */
export async function searchCopilotIncidents(query, limit = 5) {
  return postJSON('/copilot/search', { query, limit });
}

/**
 * Get investigation context summary for the copilot sidebar.
 * @param {string} incidentId
 * @returns {object} Lightweight context with status, confidence, data sources
 */
export async function getCopilotContext(incidentId) {
  return getJSON(`/copilot/context/${incidentId}`);
}
