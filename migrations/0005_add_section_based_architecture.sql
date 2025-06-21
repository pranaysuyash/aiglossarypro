-- Migration: Add Section-Based Content Architecture
-- This implements the 42-section structure identified from the Excel analysis
-- Each term will have standardized sections with flexible content items

-- Create sections table for the 42 standardized sections
CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  term_id INTEGER NOT NULL REFERENCES enhanced_terms(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- e.g., "Introduction", "Prerequisites", "Implementation"
  display_order INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure each term has exactly one of each section type
  UNIQUE(term_id, name)
);

-- Create section_items table for individual content pieces within sections
CREATE TABLE IF NOT EXISTS section_items (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  label VARCHAR(200) NOT NULL, -- e.g., "Definition and Overview", "Code Snippets"
  content TEXT, -- The actual content (markdown, JSON, etc.)
  content_type VARCHAR(50) DEFAULT 'markdown', -- 'markdown', 'mermaid', 'image', 'json', 'interactive', 'code'
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB, -- For storing additional data like chart configs, interactive params
  is_ai_generated BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(20) DEFAULT 'unverified', -- 'unverified', 'verified', 'flagged', 'expert_reviewed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create media table for rich media attachments
CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  section_item_id INTEGER REFERENCES section_items(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  media_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'document', 'notebook'
  filename VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  alt_text TEXT, -- For accessibility
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_progress table for fine-grained progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  term_id INTEGER NOT NULL REFERENCES enhanced_terms(id) ON DELETE CASCADE,
  section_id INTEGER REFERENCES sections(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'mastered'
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one progress record per user per section
  UNIQUE(user_id, section_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sections_term_id ON sections(term_id);
CREATE INDEX IF NOT EXISTS idx_sections_name ON sections(name);
CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(term_id, display_order);

CREATE INDEX IF NOT EXISTS idx_section_items_section_id ON section_items(section_id);
CREATE INDEX IF NOT EXISTS idx_section_items_content_type ON section_items(content_type);
CREATE INDEX IF NOT EXISTS idx_section_items_order ON section_items(section_id, display_order);
CREATE INDEX IF NOT EXISTS idx_section_items_verification ON section_items(verification_status);

CREATE INDEX IF NOT EXISTS idx_media_section_item_id ON media(section_item_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_term_id ON user_progress(term_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_section_id ON user_progress(section_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON user_progress(status);

-- Insert the 42 standardized sections for existing terms
-- This will be done via a separate data migration script

-- Add triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_section_items_updated_at BEFORE UPDATE ON section_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 