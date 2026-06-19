CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    user_context TEXT,
    status TEXT DEFAULT 'PENDING',
    evidence_completeness INTEGER DEFAULT 0,
    confidence_ceiling INTEGER,
    rca JSONB,
    agent_outputs JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    searchable_text TEXT
);
