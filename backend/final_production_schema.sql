-- ==============================================================================
-- FINAL EXTENDED SCHEMA (Fixed for Existing Database)
-- ==============================================================================

-- 1. EXTENSIONS & TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'moderator', 'support_agent', 'finance_manager', 'general_contractor', 'project_manager', 'subcontractor', 'trade_specialist', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. MISSING AI TABLES (Required for AI Features)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ai_generated_contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  bid_id uuid,
  owner_notes text,
  generated_contract jsonb NOT NULL,
  california_law_provisions jsonb NOT NULL,
  generation_time_ms integer,
  ai_model_version text,
  owner_edits jsonb,
  contractor_edits jsonb,
  final_contract jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_generated_contracts_pkey PRIMARY KEY (id),
  CONSTRAINT ai_generated_contracts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT ai_generated_contracts_bid_id_fkey FOREIGN KEY (bid_id) REFERENCES public.bids(id)
);

CREATE TABLE IF NOT EXISTS public.ai_timelines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  generated_timeline jsonb NOT NULL,
  milestones jsonb NOT NULL,
  dependencies jsonb,
  critical_path text[],
  generation_time_ms integer,
  ai_model_version character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_timelines_pkey PRIMARY KEY (id),
  CONSTRAINT ai_timelines_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE IF NOT EXISTS public.ai_progress_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  milestone_id uuid,
  progress_update_id uuid,
  analysis_result jsonb NOT NULL,
  work_quality character varying,
  completion_percentage integer,
  issues_detected jsonb,
  recommendations text[],
  compliance_check jsonb,
  analyzed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_progress_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT ai_progress_analysis_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id),
  CONSTRAINT ai_progress_analysis_progress_update_id_fkey FOREIGN KEY (progress_update_id) REFERENCES public.progress_updates(id)
);

-- ==============================================================================
-- 3. RLS POLICIES (Aligned with Existing Tables)
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_progress_analysis ENABLE ROW LEVEL SECURITY;

-- USERS
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- JOBS
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON public.jobs;
CREATE POLICY "Jobs are viewable by everyone" ON public.jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "PMs can create jobs" ON public.jobs;
-- Uses 'project_manager_id' (Existing Schema) instead of 'created_by'
CREATE POLICY "PMs can create jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = project_manager_id);

DROP POLICY IF EXISTS "PMs can update own jobs" ON public.jobs;
CREATE POLICY "PMs can update own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = project_manager_id);

-- PROJECTS
DROP POLICY IF EXISTS "Users can view involved projects" ON public.projects;
CREATE POLICY "Users can view involved projects" ON public.projects FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = contractor_id);

DROP POLICY IF EXISTS "Owners can update projects" ON public.projects;
CREATE POLICY "Owners can update projects" ON public.projects FOR UPDATE USING (auth.uid() = owner_id);

-- AI Tables Policies (Allow involved users to see AI data)
DROP POLICY IF EXISTS "View AI Contracts" ON public.ai_generated_contracts;
CREATE POLICY "View AI Contracts" ON public.ai_generated_contracts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR contractor_id = auth.uid()))
);

DROP POLICY IF EXISTS "View AI Timelines" ON public.ai_timelines;
CREATE POLICY "View AI Timelines" ON public.ai_timelines FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR contractor_id = auth.uid()))
);

