-- 1. AI Timelines Table
CREATE TABLE IF NOT EXISTS ai_timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    generated_timeline JSONB NOT NULL,
    milestones JSONB,
    dependencies JSONB,
    critical_path TEXT[],
    generation_time_ms INTEGER,
    ai_model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. AI Progress Analysis Table
CREATE TABLE IF NOT EXISTS ai_progress_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID REFERENCES project_milestones(id),
    progress_update_id UUID REFERENCES progress_updates(id),
    analysis_result JSONB NOT NULL,
    work_quality VARCHAR(50),
    completion_percentage DECIMAL(5, 2),
    issues_detected JSONB,
    recommendations TEXT[],
    compliance_check JSONB,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
