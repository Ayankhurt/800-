# 🗄️ DATABASE MIGRATIONS - CORRECT ORDER

## ⚠️ IMPORTANT: Run in This EXACT Order!

---

## 📋 MIGRATION ORDER

### **STEP 1: Create Missing Base Tables** ✅ **RUN THIS FIRST!**
```sql
-- File: migrations/create_missing_tables.sql
-- Creates: reports, contractor_verifications, conversations, 
--          messages, typing_indicators, uploads, project_milestones,
--          progress_updates, notifications
-- Adds: Missing columns to users and reviews tables
```

**Why First?** 
- Other migrations reference these tables
- Creates base structure needed by AI and payment features

---

### **STEP 2: Create AI Tables**
```sql
-- File: migrations/create_ai_tables.sql
-- Creates: ai_generated_contracts, ai_progress_analysis, ai_timelines
-- Depends on: project_milestones (from Step 1)
```

---

### **STEP 3: Create Escrow Tables**
```sql
-- File: migrations/create_escrow_tables.sql
-- Creates: escrow_transactions
-- Adds: Stripe fields to users table
-- Depends on: project_milestones (from Step 1)
```

---

### **STEP 4: Create Enhanced Features** (Optional)
```sql
-- File: migrations/create_enhanced_features.sql
-- Enhances: reviews, messages, users tables
-- Note: Most of these are already in Step 1, so this might give "already exists" warnings
--       That's OK! It's safe to run.
```

---

## 🚀 QUICK COPY-PASTE GUIDE

### Open Supabase SQL Editor
1. Go to your Supabase project
2. Click **SQL Editor** in left sidebar
3. Click **New Query**

### Run Each Migration

#### Migration 1: Missing Tables (REQUIRED)
```sql
-- Copy entire content from: migrations/create_missing_tables.sql
-- Paste here and click "Run"
```

#### Migration 2: AI Tables (REQUIRED)
```sql
-- Copy entire content from: migrations/create_ai_tables.sql
-- Paste here and click "Run"
```

#### Migration 3: Escrow Tables (REQUIRED)
```sql
-- Copy entire content from: migrations/create_escrow_tables.sql
-- Paste here and click "Run"
```

#### Migration 4: Enhanced Features (OPTIONAL)
```sql
-- Copy entire content from: migrations/create_enhanced_features.sql
-- Paste here and click "Run"
-- (May show warnings - that's OK!)
```

---

## ✅ VERIFICATION

After running all migrations, verify with this query:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'reports',
    'contractor_verifications',
    'conversations',
    'messages',
    'typing_indicators',
    'uploads',
    'project_milestones',
    'progress_updates',
    'notifications',
    'ai_generated_contracts',
    'ai_progress_analysis',
    'ai_timelines',
    'escrow_transactions'
  )
ORDER BY table_name;
```

**Expected Result:** Should return 13 rows (all table names)

---

## 🔧 TROUBLESHOOTING

### Error: "relation already exists"
**Solution:** This is OK! It means the table was already created. Continue to next migration.

### Error: "relation does not exist"
**Solution:** You skipped a migration. Go back and run them in order.

### Error: "column already exists"
**Solution:** This is OK! The column was already added. Continue.

### Error: "foreign key constraint"
**Solution:** Make sure you ran Step 1 first. It creates the base tables.

---

## 📊 WHAT EACH MIGRATION DOES

| Migration | Tables Created | Purpose |
|-----------|---------------|---------|
| **create_missing_tables.sql** | 9 tables + enhancements | Base tables for all features |
| **create_ai_tables.sql** | 3 tables | AI contract, progress, timeline |
| **create_escrow_tables.sql** | 1 table + user fields | Stripe payments & escrow |
| **create_enhanced_features.sql** | 0 new (just enhancements) | Additional columns |

---

## ⏱️ ESTIMATED TIME

- **Step 1:** 30 seconds
- **Step 2:** 10 seconds
- **Step 3:** 10 seconds
- **Step 4:** 10 seconds

**Total:** ~1 minute

---

## 🎯 AFTER MIGRATIONS

Once all migrations are complete:

1. ✅ Enable Supabase Realtime on:
   - `messages`
   - `notifications`
   - `typing_indicators`
   - `conversations`

2. ✅ Create Supabase Storage bucket:
   - Name: `uploads`
   - Public or with RLS policies

3. ✅ Set environment variables:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   FRONTEND_URL=http://localhost:3000
   ```

4. ✅ Test your API endpoints!

---

## 📝 NOTES

- All migrations use `IF NOT EXISTS` - safe to re-run
- All indexes use `IF NOT EXISTS` - safe to re-run
- Order matters! Always run Step 1 first
- Warnings are OK, errors are not

---

**🎉 After running these migrations, your database will be 100% ready!**
