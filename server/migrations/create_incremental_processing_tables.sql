-- Processing Queue Table for Chunked Processing
CREATE TABLE IF NOT EXISTS processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path VARCHAR(500) NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  total_rows INTEGER,
  processed_rows INTEGER DEFAULT 0,
  last_processed_row INTEGER DEFAULT 0,
  chunk_size INTEGER DEFAULT 100,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'paused')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(file_path, file_hash)
);

-- Indexes for processing queue
CREATE INDEX IF NOT EXISTS idx_processing_queue_status ON processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_processing_queue_file ON processing_queue(file_path, file_hash);
CREATE INDEX IF NOT EXISTS idx_processing_queue_created ON processing_queue(created_at);

-- Term Hashes Table for Change Detection
CREATE TABLE IF NOT EXISTS term_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
  term_name VARCHAR(500) NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  field_hashes JSONB, -- Individual field hashes for granular change detection
  last_checked TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(term_id)
);

-- Indexes for term hashes
CREATE INDEX IF NOT EXISTS idx_term_hashes_term_id ON term_hashes(term_id);
CREATE INDEX IF NOT EXISTS idx_term_hashes_name ON term_hashes(term_name);
CREATE INDEX IF NOT EXISTS idx_term_hashes_content ON term_hashes(content_hash);
CREATE INDEX IF NOT EXISTS idx_term_hashes_checked ON term_hashes(last_checked);

-- Import Sessions Table
CREATE TABLE IF NOT EXISTS import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path VARCHAR(500) NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for import sessions
CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON import_sessions(status);
CREATE INDEX IF NOT EXISTS idx_import_sessions_file ON import_sessions(file_path);
CREATE INDEX IF NOT EXISTS idx_import_sessions_started ON import_sessions(started_at);

-- Import Updates Table for Tracking Changes
CREATE TABLE IF NOT EXISTS import_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_session_id UUID NOT NULL REFERENCES import_sessions(id) ON DELETE CASCADE,
  term_id UUID REFERENCES terms(id) ON DELETE SET NULL,
  term_name VARCHAR(500),
  action VARCHAR(20) CHECK (action IN ('create', 'update', 'skip', 'error')),
  changed_fields TEXT[],
  previous_hash VARCHAR(64),
  new_hash VARCHAR(64),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for import updates
CREATE INDEX IF NOT EXISTS idx_import_updates_session ON import_updates(import_session_id);
CREATE INDEX IF NOT EXISTS idx_import_updates_action ON import_updates(action);
CREATE INDEX IF NOT EXISTS idx_import_updates_term ON import_updates(term_id);
CREATE INDEX IF NOT EXISTS idx_import_updates_created ON import_updates(created_at);

-- Processing Statistics View
CREATE OR REPLACE VIEW processing_stats AS
SELECT 
  pq.id,
  pq.file_path,
  pq.status,
  pq.total_rows,
  pq.processed_rows,
  CASE 
    WHEN pq.total_rows > 0 THEN ROUND((pq.processed_rows::NUMERIC / pq.total_rows) * 100, 2)
    ELSE 0
  END as progress_percentage,
  pq.started_at,
  pq.completed_at,
  CASE 
    WHEN pq.completed_at IS NOT NULL AND pq.started_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (pq.completed_at - pq.started_at))
    WHEN pq.started_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (NOW() - pq.started_at))
    ELSE 0
  END as processing_time_seconds
FROM processing_queue pq;

-- Import Statistics View
CREATE OR REPLACE VIEW import_stats AS
SELECT 
  ims.id,
  ims.file_path,
  ims.status,
  ims.started_at,
  ims.completed_at,
  COUNT(CASE WHEN iu.action = 'create' THEN 1 END) as new_terms,
  COUNT(CASE WHEN iu.action = 'update' THEN 1 END) as updated_terms,
  COUNT(CASE WHEN iu.action = 'skip' THEN 1 END) as skipped_terms,
  COUNT(CASE WHEN iu.action = 'error' THEN 1 END) as errors,
  COUNT(iu.id) as total_processed
FROM import_sessions ims
LEFT JOIN import_updates iu ON ims.id = iu.import_session_id
GROUP BY ims.id, ims.file_path, ims.status, ims.started_at, ims.completed_at;

-- Function to get import history
CREATE OR REPLACE FUNCTION get_import_history(
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  session_id UUID,
  file_path VARCHAR,
  status VARCHAR,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_seconds NUMERIC,
  new_terms BIGINT,
  updated_terms BIGINT,
  skipped_terms BIGINT,
  errors BIGINT,
  total_processed BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as session_id,
    s.file_path,
    s.status,
    s.started_at,
    s.completed_at,
    EXTRACT(EPOCH FROM (COALESCE(s.completed_at, NOW()) - s.started_at)) as duration_seconds,
    stats.new_terms,
    stats.updated_terms,
    stats.skipped_terms,
    stats.errors,
    stats.total_processed
  FROM import_sessions s
  JOIN import_stats stats ON s.id = stats.id
  ORDER BY s.started_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to resume processing
CREATE OR REPLACE FUNCTION resume_processing(p_file_path VARCHAR)
RETURNS TABLE (
  queue_id UUID,
  status VARCHAR,
  processed_rows INTEGER,
  total_rows INTEGER,
  last_processed_row INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update status to pending for resuming
  UPDATE processing_queue
  SET status = 'pending',
      updated_at = NOW()
  WHERE file_path = p_file_path
    AND status IN ('failed', 'paused')
    AND processed_rows < total_rows;
  
  -- Return the updated queue entry
  RETURN QUERY
  SELECT 
    pq.id as queue_id,
    pq.status,
    pq.processed_rows,
    pq.total_rows,
    pq.last_processed_row
  FROM processing_queue pq
  WHERE pq.file_path = p_file_path
  ORDER BY pq.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to get change detection summary
CREATE OR REPLACE FUNCTION get_change_summary(p_file_path VARCHAR)
RETURNS TABLE (
  total_terms INTEGER,
  unchanged_terms INTEGER,
  changed_terms INTEGER,
  new_terms INTEGER,
  last_import TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH term_data AS (
    SELECT 
      t.id,
      t.name,
      th.content_hash,
      th.last_checked
    FROM terms t
    LEFT JOIN term_hashes th ON t.id = th.term_id
  ),
  last_import AS (
    SELECT MAX(started_at) as last_import_date
    FROM import_sessions
    WHERE file_path = p_file_path
      AND status = 'completed'
  )
  SELECT 
    COUNT(DISTINCT td.id)::INTEGER as total_terms,
    COUNT(DISTINCT CASE WHEN td.content_hash IS NOT NULL THEN td.id END)::INTEGER as unchanged_terms,
    0::INTEGER as changed_terms, -- This would be calculated during actual import
    0::INTEGER as new_terms, -- This would be calculated during actual import
    li.last_import_date as last_import
  FROM term_data td
  CROSS JOIN last_import li;
END;
$$;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_processing_queue_updated_at BEFORE UPDATE ON processing_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_sessions_updated_at BEFORE UPDATE ON import_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();