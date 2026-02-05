-- Flashed Database Schema for Supabase
-- Run this in your Supabase SQL editor to set up the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Published Pages Table
CREATE TABLE IF NOT EXISTS published_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    short_id VARCHAR(12) UNIQUE NOT NULL,
    html TEXT NOT NULL,
    seo_title VARCHAR(100),
    seo_description VARCHAR(200),
    og_image TEXT,
    form_settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    views INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id),
    project_id UUID,
    custom_domain VARCHAR(255)
);

-- Create index for faster short_id lookups
CREATE INDEX IF NOT EXISTS idx_published_pages_short_id ON published_pages(short_id);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_published_pages_user_id ON published_pages(user_id);

-- Form Submissions Table (for collecting form data)
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES published_pages(id) ON DELETE CASCADE,
    short_id VARCHAR(12) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    notified BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Create index for page lookups
CREATE INDEX IF NOT EXISTS idx_form_submissions_page_id ON form_submissions(page_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_short_id ON form_submissions(short_id);

-- Page Views Table (for analytics)
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES published_pages(id) ON DELETE CASCADE,
    short_id VARCHAR(12) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    referrer TEXT,
    user_agent TEXT,
    country VARCHAR(2),
    ip_hash VARCHAR(64)
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_page_views_page_id ON page_views(page_id);
CREATE INDEX IF NOT EXISTS idx_page_views_short_id ON page_views(short_id);
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp);

-- Projects Table (Phase 2)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    client_name VARCHAR(100),
    brand_kit JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user's projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Add foreign key from published_pages to projects
ALTER TABLE published_pages 
ADD CONSTRAINT fk_published_pages_project 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE published_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Published Pages Policies
-- Anyone can read published pages (they're public)
CREATE POLICY "Published pages are viewable by everyone" ON published_pages
    FOR SELECT USING (true);

-- Authenticated users can insert their own pages
CREATE POLICY "Users can insert their own pages" ON published_pages
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own pages
CREATE POLICY "Users can update their own pages" ON published_pages
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can delete their own pages
CREATE POLICY "Users can delete their own pages" ON published_pages
    FOR DELETE USING (auth.uid() = user_id);

-- Form Submissions Policies
-- Anyone can insert form submissions (public forms)
CREATE POLICY "Anyone can submit forms" ON form_submissions
    FOR INSERT WITH CHECK (true);

-- Page owners can view submissions for their pages
CREATE POLICY "Page owners can view submissions" ON form_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM published_pages 
            WHERE published_pages.id = form_submissions.page_id 
            AND published_pages.user_id = auth.uid()
        )
    );

-- Page Views Policies
-- Anyone can insert page views (for tracking)
CREATE POLICY "Anyone can track page views" ON page_views
    FOR INSERT WITH CHECK (true);

-- Page owners can view analytics
CREATE POLICY "Page owners can view analytics" ON page_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM published_pages 
            WHERE published_pages.id = page_views.page_id 
            AND published_pages.user_id = auth.uid()
        )
    );

-- Projects Policies
-- Users can only access their own projects
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_published_pages_updated_at
    BEFORE UPDATE ON published_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to increment page views (called by Edge Function)
CREATE OR REPLACE FUNCTION increment_page_views(page_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE published_pages
    SET views = views + 1
    WHERE id = page_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION increment_page_views(UUID) TO service_role;

-- Edge Function for serving published pages (create this in Supabase Edge Functions)
-- This is a reference - actual edge function code goes in supabase/functions/serve-page/index.ts
COMMENT ON TABLE published_pages IS 'Stores HTML content for published landing pages. short_id is used in URLs like flashed.app/p/{short_id}';
