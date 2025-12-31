# Complete Flow Testing Guide - BidRoom Platform

## Prerequisites
- Backend running on: `http://192.168.1.113:5000`
- Frontend running on: `http://localhost:8081` (web) or mobile app
- Test users available in database

---

## Test Users (From Database)

| Email                  | Role                | Password (if known) |
|------------------------|---------------------|---------------------|
| admin@bidroom.com      | admin               | (set your password) |
| super@bidroom.com      | super_admin         | (set your password) |
| pm@test.com            | project_manager     | (set your password) |
| cont@bidroom.com       | general_contractor  | (set your password) |
| sub@bidroom.com        | subcontractor       | (set your password) |
| finance@bidroom.com    | finance_manager     | (set your password) |

---

## Manual Testing Flow

### **Step 1: Login Test** 🔐

#### Using cURL:
```bash
# Test PM Login
curl -X POST http://192.168.1.113:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pm@test.com",
    "password": "YOUR_PASSWORD"
  }'

# Expected Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "pm@test.com",
      "role": "project_manager",
      "first_name": "Test",
      "last_name": "PM"
    }
  }
}
```

#### Using Frontend:
1. Open app/web
2. Navigate to Login screen
3. Enter: `pm@test.com` / `YOUR_PASSWORD`
4. Click Login
5. ✅ Should redirect to dashboard

---

### **Step 2: Create a Job** 📋

#### Using cURL (Replace TOKEN):
```bash
curl -X POST http://192.168.1.113:5000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PM_TOKEN" \
  -d '{
    "title": "Commercial Building Construction",
    "description": "Need experienced contractors for a 5-story commercial building",
    "location": "New York, NY",
    "budget": 500000,
    "timeline": "6 months",
    "required_skills": ["Concrete Work", "Steel Framing", "HVAC"],
    "job_type": "contract",
    "experience_level": "expert"
  }'

# Expected Response:
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "id": "job-uuid-here",
    "title": "Commercial Building Construction",
    "status": "open",
    "posted_by": "pm-user-id"
  }
}
```

#### Using Frontend (PM Role):
1. Login as PM
2. Navigate to Jobs tab
3. Click "Create Job" button
4. Fill in job details:
   - Title: "Commercial Building Construction"
   - Description: "Need experienced contractors..."
   - Location: "New York, NY"
   - Budget: $500,000
   - Timeline: "6 months"
   - Skills: Concrete, Steel, HVAC
5. Click "Post Job"
6. ✅ Should see job in jobs list

---

### **Step 3: Submit a Bid** 💰

#### Using cURL (GC Token):
```bash
# First, login as GC to get token
curl -X POST http://192.168.1.113:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cont@bidroom.com",
    "password": "YOUR_PASSWORD"
  }'

# Then submit bid
curl -X POST http://192.168.1.113:5000/api/v1/bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_GC_TOKEN" \
  -d '{
    "job_id": "JOB_ID_FROM_STEP_2",
    "amount": 450000,
    "timeline": "5 months",
    "proposal": "We have 15 years experience in commercial construction...",
    "milestones": [
      {
        "title": "Foundation & Site Prep",
        "amount": 100000,
        "duration": "1 month"
      },
      {
        "title": "Structure & Framing",
        "amount": 200000,
        "duration": "2 months"
      },
      {
        "title": "MEP & Finishing",
        "amount": 150000,
        "duration": "2 months"
      }
    ]
  }'
```

#### Using Frontend (GC Role):
1. Login as GC (`cont@bidroom.com`)
2. Navigate to Jobs tab
3. Find the job created in Step 2
4. Click "View Details"
5. Click "Submit Bid"
6. Fill in bid details:
   - Amount: $450,000
   - Timeline: "5 months"
   - Proposal: Write detailed proposal
   - Add milestones
7. Click "Submit Bid"
8. ✅ Should see bid submitted confirmation

---

### **Step 4: Create a Project** 🏗️

#### Using cURL (PM Token):
```bash
curl -X POST http://192.168.1.113:5000/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PM_TOKEN" \
  -d '{
    "title": "Downtown Office Complex",
    "description": "Modern office building with retail space",
    "budget": 2000000,
    "start_date": "2025-02-01",
    "end_date": "2025-12-31",
    "location": "Chicago, IL",
    "status": "planning"
  }'
```

#### Using Frontend (PM Role):
1. Login as PM
2. Navigate to Projects tab
3. Click "Create Project"
4. Fill in project details:
   - Title: "Downtown Office Complex"
   - Description: "Modern office building..."
   - Budget: $2,000,000
   - Start Date: Feb 1, 2025
   - End Date: Dec 31, 2025
   - Location: "Chicago, IL"
5. Click "Create Project"
6. ✅ Should see project created

---

### **Step 5: Create Milestones** 🎯

#### Using cURL (PM Token):
```bash
# Milestone 1
curl -X POST http://192.168.1.113:5000/api/v1/milestones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PM_TOKEN" \
  -d '{
    "project_id": "PROJECT_ID_FROM_STEP_4",
    "title": "Site Preparation",
    "description": "Clear site and prepare foundation",
    "amount": 300000,
    "due_date": "2025-03-31",
    "status": "pending"
  }'

# Milestone 2
curl -X POST http://192.168.1.113:5000/api/v1/milestones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PM_TOKEN" \
  -d '{
    "project_id": "PROJECT_ID_FROM_STEP_4",
    "title": "Foundation Work",
    "description": "Complete foundation and basement",
    "amount": 500000,
    "due_date": "2025-06-30",
    "status": "pending"
  }'

# Milestone 3
curl -X POST http://192.168.1.113:5000/api/v1/milestones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PM_TOKEN" \
  -d '{
    "project_id": "PROJECT_ID_FROM_STEP_4",
    "title": "Building Construction",
    "description": "Complete structure and exterior",
    "amount": 800000,
    "due_date": "2025-10-31",
    "status": "pending"
  }'

# Milestone 4
curl -X POST http://192.168.1.113:5000/api/v1/milestones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PM_TOKEN" \
  -d '{
    "project_id": "PROJECT_ID_FROM_STEP_4",
    "title": "Interior & Finishing",
    "description": "Complete interior work and finishes",
    "amount": 400000,
    "due_date": "2025-12-31",
    "status": "pending"
  }'
```

#### Using Frontend (PM Role):
1. Login as PM
2. Navigate to Projects tab
3. Click on the project created in Step 4
4. Click "Add Milestone"
5. Create each milestone:
   - **Milestone 1**: Site Preparation - $300,000 - Due: Mar 31
   - **Milestone 2**: Foundation Work - $500,000 - Due: Jun 30
   - **Milestone 3**: Building Construction - $800,000 - Due: Oct 31
   - **Milestone 4**: Interior & Finishing - $400,000 - Due: Dec 31
6. ✅ Should see all 4 milestones listed

---

### **Step 6: Admin Panel Tests** 👥

#### Test 6.1: View All Users (Admin Role)
```bash
curl -X GET "http://192.168.1.113:5000/api/v1/admin/users?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Frontend:**
1. Login as admin (`admin@bidroom.com`)
2. Navigate to Admin Panel
3. Click "User Management"
4. ✅ Should see list of all users

#### Test 6.2: View All Projects (Admin Role)
```bash
curl -X GET http://192.168.1.113:5000/api/v1/admin/projects \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Frontend:**
1. In Admin Panel
2. Click "Projects"
3. ✅ Should see all projects including the one created

#### Test 6.3: View All Jobs (Admin Role)
```bash
curl -X GET http://192.168.1.113:5000/api/v1/admin/jobs \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### **Step 7: Dashboard Stats** 📊

#### PM Dashboard:
```bash
curl -X GET http://192.168.1.113:5000/api/v1/stats/user-dashboard \
  -H "Authorization: Bearer YOUR_PM_TOKEN"
```

**Frontend:**
1. Login as PM
2. View Dashboard (Home tab)
3. ✅ Should see:
   - Active Jobs count
   - Active Projects count
   - Pending Bids count
   - Recent activity

#### Admin Dashboard:
```bash
curl -X GET http://192.168.1.113:5000/api/v1/stats/admin-dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Frontend:**
1. Login as Admin
2. View Dashboard
3. ✅ Should see:
   - Total Users
   - Total Jobs
   - Total Projects
   - System stats

---

### **Step 8: Create a Dispute** ⚖️

```bash
curl -X POST http://192.168.1.113:5000/api/v1/disputes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PM_TOKEN" \
  -d '{
    "project_id": "PROJECT_ID_FROM_STEP_4",
    "title": "Payment Delay Issue",
    "description": "Milestone payment not received on time",
    "priority": "high",
    "status": "open"
  }'
```

**Frontend:**
1. Login as PM
2. Navigate to project
3. Click "Create Dispute"
4. Fill details and submit
5. ✅ Should see dispute created

---

### **Step 9: Finance - View Payouts** 💳

```bash
curl -X GET http://192.168.1.113:5000/api/v1/admin/payouts \
  -H "Authorization: Bearer YOUR_FINANCE_TOKEN"
```

**Frontend:**
1. Login as Finance Manager (`finance@bidroom.com`)
2. Navigate to Admin Panel → Finance
3. ✅ Should see payouts list

---

## Quick Test Checklist

- [ ] **Login** - All roles can login
- [ ] **PM**: Create Job
- [ ] **GC**: Submit Bid on Job
- [ ] **PM**: Create Project
- [ ] **PM**: Add Milestones to Project
- [ ] **PM**: View Dashboard Stats
- [ ] **Admin**: Access Admin Panel
- [ ] **Admin**: View All Users
- [ ] **Admin**: View All Projects
- [ ] **Admin**: View All Jobs
- [ ] **PM**: Create Dispute
- [ ] **Finance**: View Payouts
- [ ] **GC**: View Bids
- [ ] **SUB**: Apply to Job

---

## Common Issues & Solutions

### Issue: "Invalid email or password"
**Solution:** Reset password for test users or create new test users with known passwords

### Issue: "Unauthorized - Missing or invalid token"
**Solution:** 
1. Check token is included in Authorization header
2. Verify token hasn't expired
3. Re-login to get fresh token

### Issue: "Job not found" or "Project not found"
**Solution:** Use correct IDs from previous steps

### Issue: Role permission errors
**Solution:** Verify user has correct role for the action

---

## Password Reset (If Needed)

If you need to reset passwords for test users, run this SQL:

```sql
-- Update password for PM user (password: Test@123)
UPDATE users 
SET password_hash = '$2b$10$...' -- Use bcrypt hash
WHERE email = 'pm@test.com';
```

Or use the backend password reset endpoint if available.

---

## Success Criteria

✅ **All tests pass if:**
1. Users can login with all roles
2. PM can create jobs and projects
3. GC/SUB can submit bids
4. Milestones can be created and tracked
5. Admin can view all data
6. Finance can manage payouts
7. Disputes can be created and resolved
8. Dashboard stats load correctly

---

**Test Date:** December 27, 2025
**Platform:** BidRoom - Construction Management Platform
**Version:** 1.0
