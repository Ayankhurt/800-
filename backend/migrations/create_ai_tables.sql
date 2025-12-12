-- AI Generated Contracts Table
CREATE TABLE IF NOT EXISTS ai_generated_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bid_id UUID NOT NULL REFERENCES bids(id),
  owner_notes TEXT,
  generated_contract JSONB NOT NULL,
  california_law_provisions JSONB NOT NULL,
  generation_time_ms INTEGER,
  ai_model_version VARCHAR(50),
  owner_edits JSONB,
  contractor_edits JSONB,
  final_contract JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_contracts_project ON ai_generated_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_contracts_bid ON ai_generated_contracts(bid_id);

-- AI Progress Analysis Table
CREATE TABLE IF NOT EXISTS ai_progress_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES project_milestones(id),
  progress_update_id UUID REFERENCES progress_updates(id),
  analysis_result JSONB NOT NULL,
  work_quality VARCHAR(50),
  completion_percentage INTEGER,
  issues_detected JSONB,
  recommendations TEXT[],
  compliance_check JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_milestone ON ai_progress_analysis(milestone_id);

-- AI Timelines Table
CREATE TABLE IF NOT EXISTS ai_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  generated_timeline JSONB NOT NULL,
  milestones JSONB NOT NULL,
  dependencies JSONB,
  critical_path JSONB,
  generation_time_ms INTEGER,
  ai_model_version VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_timelines_project ON ai_timelines(project_id);
