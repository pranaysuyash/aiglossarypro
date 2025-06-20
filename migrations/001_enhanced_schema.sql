-- AIGlossaryPro: Enhanced Schema for Hierarchical Content
-- Run this migration after backing up your database

-- Enhanced content sections table
CREATE TABLE IF NOT EXISTS term_content_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    section_path VARCHAR(200) NOT NULL,
    section_name VARCHAR(200) NOT NULL,
    content TEXT,
    content_type VARCHAR(50) DEFAULT 'text',
    order_index INTEGER DEFAULT 0,
    parent_section_id UUID REFERENCES term_content_sections(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Content structure hierarchy
CREATE TABLE IF NOT EXISTS content_structure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_path VARCHAR(200) UNIQUE NOT NULL,
    parent_path VARCHAR(200),
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_interactive BOOLEAN DEFAULT false,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- People in AI/ML space
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    title VARCHAR(200),
    bio TEXT,
    company_id UUID REFERENCES companies(id),
    areas_of_expertise TEXT[],
    social_links JSONB DEFAULT '{}',
    image_url TEXT,
    notable_works TEXT[],
    location VARCHAR(200),
    website_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Companies in AI/ML space
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    founding_year INTEGER,
    headquarters VARCHAR(200),
    company_size VARCHAR(50),
    specializations TEXT[],
    website_url TEXT,
    logo_url TEXT,
    funding_info JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Datasets
CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    source_url TEXT,
    license VARCHAR(100),
    size_info VARCHAR(100),
    format VARCHAR(50),
    categories TEXT[],
    download_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Useful websites/resources
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    resource_type VARCHAR(50), -- 'tutorial', 'tool', 'documentation', 'blog'
    difficulty_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
    tags TEXT[],
    rating DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,
    last_checked TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Subscription plans (for monetization)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB NOT NULL,
    max_users INTEGER,
    stripe_price_id VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    stripe_subscription_id VARCHAR(100),
    status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due'
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Feature usage tracking
CREATE TABLE IF NOT EXISTS feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    feature_name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    date DATE DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}'
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_term_content_sections_term_path ON term_content_sections(term_id, section_path);
CREATE INDEX IF NOT EXISTS idx_term_content_sections_order ON term_content_sections(term_id, order_index);
CREATE INDEX IF NOT EXISTS idx_content_structure_parent ON content_structure(parent_path);
CREATE INDEX IF NOT EXISTS idx_people_company ON people(company_id);
CREATE INDEX IF NOT EXISTS idx_people_expertise ON people USING GIN(areas_of_expertise);
CREATE INDEX IF NOT EXISTS idx_companies_specializations ON companies USING GIN(specializations);
CREATE INDEX IF NOT EXISTS idx_datasets_categories ON datasets USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON resources USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_date ON feature_usage(user_id, date);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price_monthly, price_yearly, features, max_users, is_active) VALUES
('Free', 0, 0, '{
  "termAccess": 50,
  "searchQueries": 100,
  "favorites": 25,
  "progressTracking": false,
  "advancedSearch": false,
  "exportOptions": false,
  "prioritySupport": false
}', 1, true),
('Professional', 29, 290, '{
  "termAccess": "unlimited",
  "searchQueries": "unlimited", 
  "favorites": "unlimited",
  "progressTracking": true,
  "advancedSearch": true,
  "exportOptions": ["pdf", "markdown"],
  "prioritySupport": true,
  "learningPaths": true,
  "offlineAccess": true
}', 1, true),
('Enterprise', 79, 790, '{
  "termAccess": "unlimited",
  "searchQueries": "unlimited",
  "favorites": "unlimited", 
  "progressTracking": true,
  "advancedSearch": true,
  "exportOptions": ["pdf", "markdown", "json"],
  "prioritySupport": true,
  "learningPaths": true,
  "offlineAccess": true,
  "teamManagement": true,
  "customBranding": true,
  "apiAccess": true,
  "analytics": true,
  "sso": true,
  "dedicatedSupport": true
}', 100, true)
ON CONFLICT DO NOTHING;

-- Insert basic content structure
INSERT INTO content_structure (section_path, parent_path, display_name, description, order_index) VALUES
('introduction', NULL, 'Introduction', 'Basic introduction and overview', 1),
('introduction.definition', 'introduction', 'Definition', 'Core definition and meaning', 1),
('introduction.overview', 'introduction', 'Overview', 'High-level overview', 2),
('introduction.history', 'introduction', 'History', 'Historical background', 3),
('prerequisites', NULL, 'Prerequisites', 'Required knowledge and skills', 2),
('prerequisites.math', 'prerequisites', 'Mathematics', 'Mathematical background needed', 1),
('prerequisites.programming', 'prerequisites', 'Programming', 'Programming skills required', 2),
('theory', NULL, 'Theory', 'Theoretical foundations', 3),
('theory.concepts', 'theory', 'Core Concepts', 'Fundamental theoretical concepts', 1),
('theory.algorithms', 'theory', 'Algorithms', 'Related algorithms and methods', 2),
('implementation', NULL, 'Implementation', 'Practical implementation details', 4),
('implementation.python', 'implementation', 'Python', 'Python implementation examples', 1),
('implementation.frameworks', 'implementation', 'Frameworks', 'Popular frameworks and libraries', 2),
('applications', NULL, 'Applications', 'Real-world applications and use cases', 5),
('applications.industry', 'applications', 'Industry Use Cases', 'Industry applications', 1),
('applications.examples', 'applications', 'Examples', 'Practical examples', 2),
('evaluation', NULL, 'Evaluation', 'Evaluation methods and metrics', 6),
('evaluation.metrics', 'evaluation', 'Metrics', 'Performance metrics', 1),
('evaluation.benchmarks', 'evaluation', 'Benchmarks', 'Standard benchmarks', 2)
ON CONFLICT (section_path) DO NOTHING;

COMMENT ON TABLE term_content_sections IS 'Hierarchical content sections for terms';
COMMENT ON TABLE content_structure IS 'Defines the overall content structure hierarchy';
COMMENT ON TABLE people IS 'Notable people in the AI/ML field';
COMMENT ON TABLE companies IS 'Companies working in AI/ML space';
COMMENT ON TABLE datasets IS 'Curated datasets for machine learning';
COMMENT ON TABLE resources IS 'Useful resources, tools, and websites';
COMMENT ON TABLE subscription_plans IS 'Available subscription plans';
COMMENT ON TABLE user_subscriptions IS 'User subscription tracking';
COMMENT ON TABLE feature_usage IS 'Track feature usage for billing/limits';
