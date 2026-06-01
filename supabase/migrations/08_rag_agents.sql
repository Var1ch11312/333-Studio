-- ============================================================
--  AMUR.BG — RAG agents: knowledge base + reports
--  Requires pgvector extension (text-embedding-3-small = 1536 dims)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ── Knowledge documents: seeded with BG tax/labor/marketing law ──

CREATE TABLE knowledge_documents (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category   TEXT        NOT NULL CHECK (category IN ('accounting', 'legal', 'marketing')),
  title      TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  embedding  extensions.vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON knowledge_documents
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

-- ── Agent reports: persisted after every run ──

CREATE TABLE agent_reports (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type   TEXT        NOT NULL CHECK (agent_type IN ('accountant', 'lawyer', 'marketing')),
  period_start DATE        NOT NULL,
  period_end   DATE        NOT NULL,
  summary      TEXT        NOT NULL,
  full_report  JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── RLS: service-role only ──

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_reports       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON knowledge_documents
  USING (auth.role() = 'service_role');

CREATE POLICY "service role only" ON agent_reports
  USING (auth.role() = 'service_role');

-- ── Similarity search function ──

CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding extensions.vector(1536),
  search_category TEXT,
  match_count     INT DEFAULT 5
)
RETURNS TABLE (id UUID, title TEXT, content TEXT, similarity FLOAT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT k.id, k.title, k.content,
         1 - (k.embedding <=> query_embedding) AS similarity
  FROM   knowledge_documents k
  WHERE  k.category = search_category
    AND  k.embedding IS NOT NULL
  ORDER BY k.embedding <=> query_embedding
  LIMIT  match_count;
END;
$$;
