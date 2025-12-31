# 📋 BidRoom Application - Complete User Flows

## 🎯 Overview
BidRoom is a construction project management platform connecting Project Managers (PMs) with Contractors. There are multiple user roles, each with different capabilities and workflows.

---

## 👥 User Roles

### 1. **Project Manager (PM)** - `role_code: 'PM'`
- Posts jobs
- Reviews applications
- Awards jobs to contractors
- Manages projects
- Creates bid invitations for projects

### 2. **Contractor (GC)** - `role_code: 'GC'`
- Browses available jobs
- Submits applications/bids
- Receives bid invitations
- Works on awarded projects

### 3. **Admin** - `role_code: 'ADMIN'`
- Manages users
- Oversees all jobs and projects
- Handles disputes
- Views analytics

### 4. **Super Admin** - `role_code: 'SUPER'`
- Full system access
- All admin capabilities
- System configuration

---

## 🔄 Complete Workflows

### **WORKFLOW 1: Job Posting & Application (Standard Flow)**

#### **Step 1: PM Creates a Job**
```
PM Login → Jobs Tab → Create Job Button
↓
Fill Form:
  - Title: "Kitchen Renovation"
  - Description: "Complete kitchen remodel..."
  - Location: "San Francisco, CA"
  - Trade Type: "General Contractor"
  - Budget: $15,000 - $25,000
↓
POST /api/v1/jobs
↓
Job created in 'jobs' table with status: 'open'
```

**Database:**
```sql
INSERT INTO jobs (
  title, descriptions, projects_manager_id, 
  location, trade_type, budget_min, budget_max, status
)
```

---

#### **Step 2: Contractor Browses & Applies**
```
Contractor Login → Jobs Tab → View Available Jobs
↓
Click on Job → View Job Details
↓
Click "Apply" Button → Fill Application Form:
  - Proposed Rate: $18,000
  - Cover Letter: "I have 10 years experience..."
↓
POST /api/v1/jobs/:jobId/apply
OR
POST /api/v1/applications (with job_id in body)
↓
Application created in 'job_applications' table with status: 'pending'
```

**Database:**
```sql
INSERT INTO job_applications (
  job_id, contractor_id, proposed_rate, 
  cover_letter, status
)
```

---

#### **Step 3: PM Reviews Applications**
```
PM Login → Jobs Tab → Click on Job
↓
View "Applications" Tab → See all applications
↓
GET /api/v1/jobs/:jobId/applications
↓
Review each application:
  - Contractor details
  - Proposed rate
  - Cover letter
  - Trust score
↓
Actions:
  - Accept Application → PUT /api/v1/jobs/applications/:id/status {status: 'accepted'}
  - Reject Application → PUT /api/v1/jobs/applications/:id/status {status: 'rejected'}
```

**Database:**
```sql
UPDATE job_applications 
SET status = 'accepted' 
WHERE id = :applicationId
```

---

#### **Step 4: Project Creation (After Acceptance)**
```
When PM accepts an application:
↓
System automatically creates a Project
↓
POST /api/v1/projects (triggered by acceptance)
↓
Project created in 'projects' table:
  - owner_id: PM's ID
  - contractor_id: Contractor's ID
  - status: 'active'
  - Linked to original job
```

**Database:**
```sql
INSERT INTO projects (
  title, description, owner_id, 
  contractor_id, budget, status
)
```

---

### **WORKFLOW 2: Project Bid Invitation (Alternative Flow)**

#### **Step 1: PM Creates Project First**
```
PM Login → Projects Tab → Create Project
↓
Fill Form:
  - Title: "Bathroom Remodel"
  - Description: "Full bathroom renovation"
  - Budget: $12,000
↓
POST /api/v1/projects
↓
Project created in 'projects' table
```

---

#### **Step 2: PM Invites Contractors to Bid**
```
PM → Project Details → "Invite Contractors"
↓
Select Contractors from list
↓
POST /api/v1/bids (creates bid invitation)
↓
Bid invitation created in 'bids' table:
  - projects_id: Project ID
  - contractor_id: Invited contractor
  - status: 'pending'
  - due_date: 7 days from now
```

**Database:**
```sql
INSERT INTO bids (
  projects_id, project_manager_id, 
  contractor_id, title, descriptions, 
  due_date, status
)
```

---

#### **Step 3: Contractor Submits Bid Response**
```
Contractor Login → Bids Tab → View Invitation
↓
Click "Submit Bid" → Fill Form:
  - Amount: $11,500
  - Proposal: "I will complete in 3 weeks..."
  - Timeline: 21 days
↓
POST /api/v1/bids/:bidId/submit
↓
Bid submission created in 'bid_submissions' table
```

**Database:**
```sql
INSERT INTO bid_submissions (
  bid_id, contractor_id, amount, 
  proposal_text, timeline_days, status
)
```

---

#### **Step 4: PM Reviews & Awards Bid**
```
PM → Bid Details → View "Submissions" Tab
↓
GET /api/v1/bids/:bidId/submissions
↓
Review all submissions → Click "Award Bid"
↓
PUT /api/v1/bids/:bidId/status {status: 'awarded'}
↓
Project status updated to 'active'
Contractor assigned to project
```

---

### **WORKFLOW 3: Project Management**

#### **Milestones**
```
PM creates milestones for project:
↓
POST /api/v1/projects/:projectId/milestones
↓
Contractor completes work → Marks milestone complete
↓
PM reviews → Approves milestone
↓
Payment released from escrow
```

#### **Communication**
```
Messages between PM and Contractor:
↓
POST /api/v1/messages
↓
Real-time notifications
```

---

## 🗄️ Database Tables & Relationships

### **Core Tables:**

1. **`users`** - All users (PM, Contractor, Admin)
   - `id`, `email`, `role_code`, `first_name`, `last_name`

2. **`jobs`** - Job postings by PMs
   - `id`, `title`, `descriptions`, `projects_manager_id`, `status`
   - Status: `open`, `closed`, `filled`

3. **`job_applications`** - Applications to jobs
   - `id`, `job_id`, `contractor_id`, `proposed_rate`, `cover_letter`, `status`
   - Status: `pending`, `accepted`, `rejected`

4. **`projects`** - Active projects
   - `id`, `title`, `owner_id`, `contractor_id`, `budget`, `status`
   - Status: `active`, `completed`, `cancelled`

5. **`bids`** - Project bid invitations
   - `id`, `projects_id`, `contractor_id`, `status`, `due_date`
   - Status: `pending`, `submitted`, `awarded`, `declined`

6. **`bid_submissions`** - Responses to bid invitations
   - `id`, `bid_id`, `contractor_id`, `amount`, `proposal_text`, `status`

7. **`milestones`** - Project milestones
   - `id`, `project_id`, `title`, `amount`, `status`

---

## 🔑 Key API Endpoints

### **Jobs**
- `GET /api/v1/jobs` - List all jobs
- `POST /api/v1/jobs` - Create job (PM only)
- `GET /api/v1/jobs/:id` - Get job details
- `POST /api/v1/jobs/:id/apply` - Apply to job (Contractor)
- `GET /api/v1/jobs/:id/applications` - Get applications (PM)

### **Applications**
- `GET /api/v1/applications/my-applications` - Contractor's applications
- `PUT /api/v1/jobs/applications/:id/status` - Update status (PM)
- `PUT /api/v1/applications/:id/withdraw` - Withdraw application

### **Bids**
- `GET /api/v1/bids` - Get all bids (filtered by role)
- `POST /api/v1/bids` - Create bid invitation (PM)
- `POST /api/v1/bids/:id/submit` - Submit bid response (Contractor)
- `GET /api/v1/bids/:id/submissions` - Get submissions (PM)
- `PUT /api/v1/bids/:id/status` - Award/decline bid (PM)

### **Projects**
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project (PM)
- `GET /api/v1/projects/:id` - Get project details
- `PUT /api/v1/projects/:id` - Update project

---

## 📱 Frontend Navigation

### **PM Dashboard:**
```
Tabs:
  - Home (Dashboard with stats)
  - Jobs (Posted jobs + applications)
  - Projects (Active projects)
  - Bids (Bid invitations sent)
  - Messages
  - Profile
```

### **Contractor Dashboard:**
```
Tabs:
  - Home (Dashboard with opportunities)
  - Jobs (Browse available jobs)
  - Bids (Bid invitations received)
  - Projects (Awarded projects)
  - Messages
  - Profile
```

---

## 🎬 Test Flow (Using Seeded Data)

### **Login Credentials:**
- **PM**: `pikachugaming899@gmail.com` / `ayan1212`
- **Contractor**: `gc@bidroom.com` / `ayan1212`
- **Super Admin**: `superadmin@bidroom.com` / `password123`

### **Test Scenario:**
1. Login as PM → Create a job
2. Login as Contractor → Apply to the job
3. Login as PM → Review application → Accept
4. Verify project is created
5. Both users can now manage the project

---

## 🐛 Common Issues & Solutions

### **404 Errors:**
- **Cause**: ID doesn't exist in database
- **Solution**: Use seeding script to create test data

### **403 Forbidden:**
- **Cause**: Wrong user role trying to access resource
- **Solution**: Check `role_code` and ownership

### **PGRST201 Errors:**
- **Cause**: Ambiguous foreign key relationships
- **Solution**: Use explicit relationship hints or manual joins

---

## 📊 Data Flow Summary

```
PM Creates Job
    ↓
Job stored in 'jobs' table (status: open)
    ↓
Contractor applies
    ↓
Application stored in 'job_applications' (status: pending)
    ↓
PM reviews & accepts
    ↓
Application status → 'accepted'
    ↓
System creates Project
    ↓
Project stored in 'projects' table (status: active)
    ↓
PM & Contractor manage project
    ↓
Milestones → Payments → Completion
```

---

## 🔧 Development Commands

```bash
# Seed test data
node backend/scripts/seed_test_data.cjs

# Create demo flow
node backend/scripts/create_demo_flow.js

# Reset password
node backend/scripts/reset_password.cjs
```

---

This documentation covers the complete application flow. Let me know if you need clarification on any specific part!
