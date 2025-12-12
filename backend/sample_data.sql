-- Sample Data for Testing Admin Panel Core Features
-- Matches actual database schema
-- All enum values and column names verified

-- ========== SAMPLE PROJECTS ==========
INSERT INTO public.projects (
  id,
  title,
  description,
  status,
  owner_id,
  contractor_id,
  budget,
  created_at,
  updated_at
) VALUES
(
  gen_random_uuid(),
  'Kitchen Renovation - Downtown Condo',
  'Complete kitchen remodel including cabinets, countertops, and appliances',
  'in_progress',
  (SELECT id FROM public.users WHERE role = 'project_manager' LIMIT 1),
  (SELECT id FROM public.users WHERE role = 'general_contractor' LIMIT 1),
  45000.00,
  NOW() - INTERVAL '15 days',
  NOW()
),
(
  gen_random_uuid(),
  'Bathroom Addition - Suburban Home',
  'Add new master bathroom with walk-in shower and double vanity',
  'open',
  (SELECT id FROM public.users WHERE role = 'project_manager' ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM public.users WHERE role = 'subcontractor' LIMIT 1),
  28000.00,
  NOW() - INTERVAL '3 days',
  NOW()
);

-- ========== SAMPLE JOBS ==========
INSERT INTO public.jobs (
  id,
  title,
  description,
  location,
  trade_type,
  status,
  budget_min,
  budget_max,
  project_manager_id,
  created_by,
  start_date,
  end_date,
  created_at,
  updated_at
) VALUES
(
  gen_random_uuid(),
  'Electrical Wiring for New Construction',
  'Need licensed electrician for complete electrical installation in new 2-story home.',
  'San Francisco, CA',
  'Electrical',
  'open',
  10000.00,
  14000.00,
  (SELECT id FROM public.users WHERE role = 'project_manager' LIMIT 1),
  (SELECT id FROM public.users WHERE role = 'project_manager' LIMIT 1),
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '21 days',
  NOW() - INTERVAL '5 days',
  NOW()
),
(
  gen_random_uuid(),
  'HVAC System Installation',
  'Install new HVAC system for 1800 sq ft home.',
  'Oakland, CA',
  'HVAC',
  'open',
  7500.00,
  9500.00,
  (SELECT id FROM public.users WHERE role = 'general_contractor' LIMIT 1),
  (SELECT id FROM public.users WHERE role = 'general_contractor' LIMIT 1),
  CURRENT_DATE + INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '35 days',
  NOW() - INTERVAL '2 days',
  NOW()
);

-- ========== SAMPLE BIDS ==========
INSERT INTO public.bids (
  id,
  project_id,
  submitted_by,
  amount,
  notes,
  status,
  created_at,
  updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM public.projects LIMIT 1),
  (SELECT id FROM public.users WHERE role = 'general_contractor' LIMIT 1),
  32000.00,
  'We have 15 years of experience. Premium materials with 20-year warranty.',
  'pending',
  NOW() - INTERVAL '4 days',
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM public.projects ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM public.users WHERE role = 'subcontractor' LIMIT 1),
  8800.00,
  'Experienced contractor. 5-year warranty on workmanship.',
  'pending',
  NOW() - INTERVAL '1 day',
  NOW()
);

-- ========== SAMPLE TRANSACTIONS (PAYMENTS) ==========
INSERT INTO public.transactions (
  id,
  project_id,
  payer_id,
  payee_id,
  type,
  status,
  amount,
  platform_fee,
  processor_fee,
  payment_processor,
  created_at,
  updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM public.projects WHERE status = 'in_progress' LIMIT 1),
  (SELECT owner_id FROM public.projects WHERE status = 'in_progress' LIMIT 1),
  (SELECT contractor_id FROM public.projects WHERE status = 'in_progress' LIMIT 1),
  'milestone_payment',
  'pending',
  15000.00,
  750.00,
  450.00,
  'stripe',
  NOW() - INTERVAL '10 days',
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM public.projects WHERE status = 'open' LIMIT 1),
  (SELECT owner_id FROM public.projects WHERE status = 'open' LIMIT 1),
  NULL,
  'escrow_deposit',
  'pending',
  28000.00,
  1400.00,
  840.00,
  'stripe',
  NOW() - INTERVAL '2 days',
  NOW()
);

-- Verify the data was inserted
SELECT 'Projects Created:' as info, COUNT(*) as count FROM public.projects;
SELECT 'Jobs Created:' as info, COUNT(*) as count FROM public.jobs;
SELECT 'Bids Created:' as info, COUNT(*) as count FROM public.bids;
SELECT 'Transactions Created:' as info, COUNT(*) as count FROM public.transactions;
