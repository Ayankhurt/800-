-- Sample Data - VERIFIED against schema_complete.sql
-- All columns checked and confirmed

-- ===== PROJECTS =====
-- Required: owner_id, contractor_id, title, total_amount
INSERT INTO public.projects (
  owner_id,
  contractor_id,
  title,
  description,
  status,
  total_amount,
  paid_amount,
  escrow_balance
) VALUES
(
  (SELECT id FROM public.users WHERE role = 'project_manager' LIMIT 1),
  (SELECT id FROM public.users WHERE role = 'general_contractor' LIMIT 1),
  'Kitchen Renovation - Downtown Condo',
  'Complete kitchen remodel including cabinets, countertops, and appliances',
  'active',
  45000.00,
  15000.00,
  30000.00
),
(
  (SELECT id FROM public.users WHERE role = 'project_manager' ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM public.users WHERE role = 'subcontractor' LIMIT 1),
  'Bathroom Addition',
  'Add new master bathroom with walk-in shower',
  'setup',
  28000.00,
  0.00,
  28000.00
);

-- ===== JOBS =====
-- Required: project_manager_id, title, description, location, trade_type
-- NO created_by column!
INSERT INTO public.jobs (
  project_manager_id,
  title,
  description,
  location,
  trade_type,
  status,
  budget_min,
  budget_max
) VALUES
(
  (SELECT id FROM public.users WHERE role = 'project_manager' LIMIT 1),
  'Electrical Wiring for New Construction',
  'Need licensed electrician for complete electrical installation',
  'San Francisco, CA',
  'Electrical',
  'open',
  10000.00,
  14000.00
),
(
  (SELECT id FROM public.users WHERE role = 'general_contractor' LIMIT 1),
  'HVAC System Installation',
  'Install new HVAC system for 1800 sq ft home',
  'Oakland, CA',
  'HVAC',
  'open',
  7500.00,
  9500.00
);

-- ===== BIDS =====
-- Required: project_manager_id, title
-- NO submitted_by or amount columns!
INSERT INTO public.bids (
  project_manager_id,
  title,
  description,
  status,
  due_date
) VALUES
(
  (SELECT id FROM public.users WHERE role = 'project_manager' LIMIT 1),
  'Roofing Replacement - Commercial Building',
  'Seeking bids for complete roof replacement on 5000 sq ft commercial building',
  'draft',
  CURRENT_DATE + INTERVAL '10 days'
),
(
  (SELECT id FROM public.users WHERE role = 'general_contractor' LIMIT 1),
  'Concrete Driveway and Walkway',
  'Need concrete contractor for new driveway and front walkway',
  'draft',
  CURRENT_DATE + INTERVAL '7 days'
);

-- Verify
SELECT 'Projects Created:' as info, COUNT(*) as count FROM public.projects
UNION ALL
SELECT 'Jobs Created:', COUNT(*) FROM public.jobs
UNION ALL
SELECT 'Bids Created:', COUNT(*) FROM public.bids;
