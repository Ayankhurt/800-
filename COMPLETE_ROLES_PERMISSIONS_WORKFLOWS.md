# 🎯 BIDROOM - COMPLETE ROLES, PERMISSIONS & WORKFLOWS GUIDE

## 📅 Date: 2025-12-22 01:28 PKT

---

# 📋 TABLE OF CONTENTS

1. [All User Roles Overview](#roles-overview)
2. [Permission Matrix](#permission-matrix)
3. [Step-by-Step Workflows](#workflows)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)

---

<a name="roles-overview"></a>
# 👥 ALL USER ROLES

## **Total Roles: 7**

```
1. PM (Project Manager)      - Job creators
2. GC (General Contractor)    - Main contractors
3. SUB (Subcontractor)        - Specialized contractors
4. TS (Trade Specialist)      - Trade-specific workers
5. VIEWER                     - Read-only users
6. ADMIN                      - Platform administrators
7. SUPER                      - Super administrators
```

---

## **1. PM (Project Manager)**
**Role Code:** `project_manager` or `PM`

### **Who are they?**
- Property owners
- Construction companies
- Real estate developers
- Anyone who needs construction work

### **What they do:**
```
✅ Post construction jobs
✅ Review contractor applications
✅ Accept/Reject applications
✅ Create projects
✅ Invite contractors to bid
✅ Award bids
✅ Manage projects
✅ Release payments
```

---

## **2. GC (General Contractor)**
**Role Code:** `general_contractor` or `GC`

### **Who are they?**
- Licensed general contractors
- Construction companies
- Full-service contractors

### **What they do:**
```
✅ Browse and apply to jobs
✅ Submit bids
✅ Work on projects
✅ Hire subcontractors
✅ Invite subs to bid
✅ Manage sub-projects
✅ Receive payments
```

---

## **3. SUB (Subcontractor)**
**Role Code:** `subcontractor` or `SUB`

### **Who are they?**
- Specialized contractors
- Work under GCs
- Specific trade experts

### **What they do:**
```
✅ Browse and apply to jobs
✅ Receive bid invitations (from GCs)
✅ Submit bids
✅ Work on assigned tasks
✅ Receive payments
```

---

## **4. TS (Trade Specialist)**
**Role Code:** `trade_specialist` or `TS`

### **Who are they?**
- Single-trade experts
- Electricians, plumbers, HVAC, etc.
- Independent specialists

### **What they do:**
```
✅ Browse jobs (filtered by trade)
✅ Apply to jobs
✅ Submit bids
✅ Work on projects
✅ Receive payments
```

**Note:** TS and SUB have same permissions, difference is conceptual.

---

## **5. VIEWER**
**Role Code:** `viewer` or `VIEWER`

### **Who are they?**
- Observers
- Inspectors
- Stakeholders
- Investors

### **What they do:**
```
✅ View jobs (read-only)
✅ View projects (read-only)
✅ View contractor profiles
❌ Cannot apply or create anything
```

---

## **6. ADMIN**
**Role Code:** `admin` or `ADMIN`

### **Who are they?**
- Platform administrators
- Support staff
- Moderators

### **What they do:**
```
✅ Manage all users
✅ Manage all jobs
✅ Manage all projects
✅ Approve payouts
✅ Resolve disputes
✅ View analytics
✅ Moderate content
✅ System settings
```

---

## **7. SUPER (Super Admin)**
**Role Code:** `super_admin` or `SUPER`

### **Who are they?**
- Platform owners
- System administrators
- Top-level access

### **What they do:**
```
✅ Everything ADMIN can do
✅ Delete users
✅ Change user roles
✅ System-critical settings
✅ Database management
✅ Full platform control
```

---

<a name="permission-matrix"></a>
# 🔐 PERMISSION MATRIX

## **Complete Permissions Table**

| Permission | PM | GC | SUB | TS | VIEWER | ADMIN | SUPER |
|------------|----|----|-----|-------|--------|-------|-------|
| **JOBS** |
| View Jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Jobs | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit Own Jobs | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit Any Jobs | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete Own Jobs | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete Any Jobs | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Apply to Jobs | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **APPLICATIONS** |
| View Own Applications | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| View Job Applications | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Accept Applications | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Reject Applications | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Withdraw Applications | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **BIDS** |
| Create Bid Invitations | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| View Bid Invitations | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Submit Bid Response | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| View Bid Submissions | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Award Bids | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **PROJECTS** |
| View Own Projects | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| View All Projects | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Create Projects | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Own Projects | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Any Projects | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Update Project Status | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **PAYMENTS** |
| Deposit Funds | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Release Payments | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Receive Payments | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Refund Payments | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| View All Transactions | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **USERS** |
| View Own Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View All Users | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit Any User | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Suspend Users | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete Users | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Change User Roles | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **ADMIN** |
| View Analytics | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Resolve Disputes | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Moderate Content | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| System Settings | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| View System Logs | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

<a name="workflows"></a>
# 🔄 STEP-BY-STEP WORKFLOWS

---

## **WORKFLOW 1: PM POSTS JOB → CONTRACTOR APPLIES → PROJECT CREATED**

### **Step 1: PM Creates Job**

```
👤 User: PM (Project Manager)
📱 Screen: Jobs Tab → "Post Job" button

Action:
1. PM clicks "Post Job"
2. Fills form:
   - Title: "Kitchen Renovation"
   - Description: "Complete kitchen remodel with new cabinets"
   - Location: "San Francisco, CA"
   - Trade Type: "General Contractor"
   - Budget: $15,000 - $25,000
   - Start Date: 2025-01-15
   - End Date: 2025-02-28

3. Clicks "Post Job"

Backend:
POST /api/v1/jobs
{
  title: "Kitchen Renovation",
  descriptions: "Complete kitchen remodel with new cabinets",
  locations: "San Francisco, CA",
  trade_type: "General Contractor",
  budget_min: 15000,
  budget_max: 25000,
  start_date: "2025-01-15",
  end_date: "2025-02-28"
}

Database:
✅ New row in jobs table
✅ Status: "open"
✅ projects_manager_id: PM's user ID

Result:
✅ Job posted successfully
✅ Job appears in all contractors' browse list
```

---

### **Step 2: GC Browses Jobs**

```
👤 User: GC (General Contractor)
📱 Screen: Jobs Tab

Action:
1. GC logs in
2. Opens Jobs tab
3. Sees list of available jobs
4. Filters by trade type (optional)
5. Sees "Kitchen Renovation" job

Backend:
GET /api/v1/jobs

Response:
{
  success: true,
  data: {
    jobs: [
      {
        id: "job-uuid-123",
        title: "Kitchen Renovation",
        descriptions: "Complete kitchen remodel...",
        locations: "San Francisco, CA",
        trade_type: "General Contractor",
        budget_min: 15000,
        budget_max: 25000,
        status: "open",
        applications_count: 0
      }
    ]
  }
}

Result:
✅ GC sees the job in list
✅ Can click to view details
```

---

### **Step 3: GC Views Job Details**

```
👤 User: GC
📱 Screen: Job Details

Action:
1. GC clicks on "Kitchen Renovation" job
2. Views complete details:
   - Full description
   - Location
   - Budget range
   - Timeline
   - Requirements
   - PM's profile
   - PM's company

Backend:
GET /api/v1/jobs/job-uuid-123

Response:
{
  success: true,
  data: {
    id: "job-uuid-123",
    title: "Kitchen Renovation",
    descriptions: "Complete kitchen remodel with new cabinets",
    locations: "San Francisco, CA",
    budget_min: 15000,
    budget_max: 25000,
    posted_by: {
      name: "John Doe",
      company: "ABC Properties",
      trust_score: 92
    }
  }
}

Result:
✅ GC sees all job information
✅ "Apply" button visible
```

---

### **Step 4: GC Applies to Job**

```
👤 User: GC
📱 Screen: Job Details → "Apply" button

Action:
1. GC clicks "Apply"
2. Modal opens with application form
3. GC fills:
   - Proposed Rate: $18,000
   - Cover Letter: "I have 10 years of experience in kitchen renovations..."
   - Availability: "Can start immediately"
   - Estimated Timeline: "6 weeks"

4. Clicks "Submit Application"

Backend:
POST /api/v1/jobs/job-uuid-123/apply
{
  proposed_rate: 18000,
  cover_letter: "I have 10 years of experience...",
  availability: "Can start immediately",
  timeline: "6 weeks"
}

Database:
✅ New row in job_applications table
{
  id: "app-uuid-456",
  job_id: "job-uuid-123",
  contractor_id: "gc-uuid-789",
  proposed_rate: 18000,
  cover_letter: "I have 10 years...",
  status: "pending"
}

✅ New notification for PM
{
  user_id: "pm-uuid-001",
  type: "new_application",
  message: "New application for Kitchen Renovation",
  job_id: "job-uuid-123"
}

Result:
✅ Application submitted
✅ PM receives notification
✅ GC can track application status
```

---

### **Step 5: PM Receives Notification**

```
👤 User: PM
📱 Screen: Dashboard / Notifications

Action:
1. PM sees notification badge
2. Opens notifications
3. Sees: "New application for Kitchen Renovation from John Smith (GC)"
4. Clicks notification

Backend:
GET /api/v1/notifications

Response:
{
  success: true,
  data: [
    {
      id: "notif-uuid-111",
      type: "new_application",
      message: "New application for Kitchen Renovation",
      job_id: "job-uuid-123",
      created_at: "2025-01-10T10:30:00Z",
      read: false
    }
  ]
}

Result:
✅ PM aware of new application
✅ Can review application
```

---

### **Step 6: PM Reviews Applications**

```
👤 User: PM
📱 Screen: Job Details → Applications Tab

Action:
1. PM opens "Kitchen Renovation" job
2. Clicks "Applications" tab
3. Sees list of applicants:
   - John Smith (GC) - $18,000
   - Maria Garcia (GC) - $16,500
   - David Lee (GC) - $19,000

4. PM reviews each application:
   - Contractor profile
   - Trust score
   - Past projects
   - Reviews
   - Proposed rate
   - Cover letter

Backend:
GET /api/v1/jobs/job-uuid-123/applications

Response:
{
  success: true,
  data: [
    {
      id: "app-uuid-456",
      contractor: {
        id: "gc-uuid-789",
        name: "John Smith",
        company: "Smith Construction",
        trust_score: 88,
        completed_projects: 45,
        rating: 4.7
      },
      proposed_rate: 18000,
      cover_letter: "I have 10 years...",
      status: "pending",
      applied_at: "2025-01-10T10:30:00Z"
    },
    // ... more applications
  ]
}

Result:
✅ PM sees all applications
✅ Can compare contractors
✅ Can make informed decision
```

---

### **Step 7: PM Accepts Application**

```
👤 User: PM
📱 Screen: Applications List

Action:
1. PM selects John Smith's application
2. Reviews details one more time
3. Clicks "Accept" button
4. Confirmation dialog appears
5. PM confirms acceptance

Backend:
PUT /api/v1/jobs/applications/app-uuid-456/status
{
  status: "accepted"
}

Database:
✅ Update job_applications table
{
  id: "app-uuid-456",
  status: "accepted",  // Changed from "pending"
  accepted_at: "2025-01-10T14:00:00Z"
}

✅ Update other applications to "rejected"
{
  status: "rejected",
  rejected_at: "2025-01-10T14:00:00Z"
}

✅ Auto-create project
INSERT INTO projects (
  id: "project-uuid-999",
  title: "Kitchen Renovation Project",
  description: "From job: Kitchen Renovation",
  owner_id: "pm-uuid-001",
  contractor_id: "gc-uuid-789",
  total_amount: 18000,
  status: "active",
  created_at: "2025-01-10T14:00:00Z"
)

✅ Create notifications
- For accepted contractor: "Congratulations! Your application was accepted"
- For rejected contractors: "Application not selected this time"

✅ Update job status
{
  status: "filled"  // Job is now filled
}

Result:
✅ Application accepted
✅ Project automatically created
✅ All parties notified
✅ Job marked as filled
```

---

### **Step 8: GC Receives Acceptance**

```
👤 User: GC (John Smith)
📱 Screen: Notifications

Action:
1. GC sees notification
2. Opens notification
3. Sees: "Congratulations! Your application for Kitchen Renovation was accepted"
4. Clicks "View Project"

Backend:
GET /api/v1/projects/project-uuid-999

Response:
{
  success: true,
  data: {
    id: "project-uuid-999",
    title: "Kitchen Renovation Project",
    description: "Complete kitchen remodel with new cabinets",
    owner: {
      name: "John Doe",
      company: "ABC Properties"
    },
    contractor: {
      name: "John Smith",
      company: "Smith Construction"
    },
    total_amount: 18000,
    status: "active",
    start_date: "2025-01-15",
    end_date: "2025-02-28"
  }
}

Result:
✅ GC can access project
✅ Project is active
✅ Work can begin
```

---

### **Step 9: Project Work Begins**

```
👤 Users: Both PM and GC
📱 Screen: Project Details

What happens now:

PM can:
✅ View project progress
✅ Communicate with GC
✅ Track milestones
✅ Approve work
✅ Release payments

GC can:
✅ Update project status
✅ Upload progress photos
✅ Communicate with PM
✅ Submit invoices
✅ Request payments

Backend APIs used:
GET    /api/v1/projects/project-uuid-999
PUT    /api/v1/projects/project-uuid-999
POST   /api/v1/projects/project-uuid-999/messages
POST   /api/v1/projects/project-uuid-999/milestones
POST   /api/v1/payments

Result:
✅ Project progresses
✅ Communication flows
✅ Payments processed
✅ Work completed
```

---

## **WORKFLOW 2: PM INVITES GC TO BID → GC SUBMITS BID → PM AWARDS**

### **Step 1: PM Creates Bid Invitation**

```
👤 User: PM
📱 Screen: Bids Tab → "Create Bid Invitation"

Action:
1. PM clicks "Create Bid Invitation"
2. Fills form:
   - Select Contractor: John Smith (GC)
   - Title: "Bathroom Remodel Bid"
   - Description: "Please submit your bid for complete bathroom renovation"
   - Scope: "Remove old fixtures, install new tub, vanity, toilet, tiles"
   - Due Date: 2025-01-20

3. Clicks "Send Invitation"

Backend:
POST /api/v1/bids
{
  contractor_id: "gc-uuid-789",
  title: "Bathroom Remodel Bid",
  descriptions: "Please submit your bid for complete bathroom renovation",
  scope: "Remove old fixtures...",
  due_date: "2025-01-20"
}

Database:
✅ New row in bids table
{
  id: "bid-uuid-222",
  project_manager_id: "pm-uuid-001",
  contractor_id: "gc-uuid-789",
  title: "Bathroom Remodel Bid",
  descriptions: "Please submit your bid...",
  due_date: "2025-01-20",
  status: "draft"
}

✅ Notification for GC
{
  user_id: "gc-uuid-789",
  type: "bid_invitation",
  message: "You have a new bid invitation"
}

Result:
✅ Bid invitation sent
✅ GC notified
```

---

### **Step 2: GC Receives Invitation**

```
👤 User: GC
📱 Screen: Bids Tab → "Received Invitations"

Action:
1. GC sees notification
2. Opens Bids tab
3. Sees "Bathroom Remodel Bid" invitation
4. Clicks to view details

Backend:
GET /api/v1/bids

Response:
{
  success: true,
  data: [
    {
      id: "bid-uuid-222",
      title: "Bathroom Remodel Bid",
      descriptions: "Please submit your bid...",
      from: {
        name: "John Doe",
        company: "ABC Properties"
      },
      due_date: "2025-01-20",
      status: "draft"
    }
  ]
}

Result:
✅ GC sees invitation
✅ Can review details
✅ "Submit Bid" button visible
```

---

### **Step 3: GC Submits Bid**

```
👤 User: GC
📱 Screen: Bid Details → "Submit Bid"

Action:
1. GC clicks "Submit Bid"
2. Fills bid form:
   - Total Amount: $12,000
   - Breakdown:
     * Labor: $6,000
     * Materials: $5,000
     * Permits: $1,000
   - Timeline: 4 weeks
   - Proposal: "I can complete this project in 4 weeks with high-quality materials..."
   - Start Date: 2025-01-25

3. Clicks "Submit Bid"

Backend:
POST /api/v1/bids/bid-uuid-222/submit
{
  amount: 12000,
  breakdown: {
    labor: 6000,
    materials: 5000,
    permits: 1000
  },
  timeline_days: 28,
  proposal_text: "I can complete this project...",
  start_date: "2025-01-25"
}

Database:
✅ New row in bid_submissions table
{
  id: "submission-uuid-333",
  bid_id: "bid-uuid-222",
  contractor_id: "gc-uuid-789",
  amount: 12000,
  proposal_text: "I can complete...",
  timeline_days: 28,
  status: "submitted"
}

✅ Update bid status
{
  status: "submitted"  // Changed from "draft"
}

✅ Notification for PM
{
  type: "bid_submitted",
  message: "John Smith submitted a bid"
}

Result:
✅ Bid submitted
✅ PM notified
✅ GC can track bid status
```

---

### **Step 4: PM Reviews Bid**

```
👤 User: PM
📱 Screen: Bids Tab → Select Bid → "Submissions"

Action:
1. PM opens "Bathroom Remodel Bid"
2. Clicks "Submissions" tab
3. Sees John Smith's bid:
   - Amount: $12,000
   - Timeline: 4 weeks
   - Breakdown
   - Proposal

4. Reviews details
5. Compares with budget
6. Checks contractor profile

Backend:
GET /api/v1/bids/bid-uuid-222/submissions

Response:
{
  success: true,
  data: [
    {
      id: "submission-uuid-333",
      contractor: {
        name: "John Smith",
        company: "Smith Construction",
        trust_score: 88,
        rating: 4.7
      },
      amount: 12000,
      breakdown: {
        labor: 6000,
        materials: 5000,
        permits: 1000
      },
      timeline_days: 28,
      proposal_text: "I can complete...",
      submitted_at: "2025-01-12T09:00:00Z"
    }
  ]
}

Result:
✅ PM sees bid details
✅ Can make decision
```

---

### **Step 5: PM Awards Bid**

```
👤 User: PM
📱 Screen: Bid Submissions

Action:
1. PM satisfied with bid
2. Clicks "Award Bid" button
3. Confirms award

Backend:
PUT /api/v1/bids/bid-uuid-222/status
{
  status: "accepted",
  winning_submission_id: "submission-uuid-333"
}

Database:
✅ Update bid
{
  status: "accepted",
  awarded_at: "2025-01-12T15:00:00Z"
}

✅ Update submission
{
  status: "accepted"
}

✅ Create or update project
{
  id: "project-uuid-888",
  title: "Bathroom Remodel Project",
  owner_id: "pm-uuid-001",
  contractor_id: "gc-uuid-789",
  total_amount: 12000,
  status: "active"
}

✅ Notification for GC
{
  type: "bid_awarded",
  message: "Congratulations! Your bid was awarded"
}

Result:
✅ Bid awarded
✅ Project created/updated
✅ GC notified
✅ Work can begin
```

---

## **WORKFLOW 3: GC HIRES SUBCONTRACTOR**

### **Step 1: GC Has Active Project**

```
👤 User: GC
📱 Screen: Projects Tab

Current situation:
✅ GC has "Kitchen Renovation Project"
✅ Total amount: $18,000
✅ GC needs electrical work done
✅ Wants to hire a Subcontractor

Action:
1. GC opens project
2. Clicks "Hire Subcontractor"
3. Selects trade: "Electrical"
```

---

### **Step 2: GC Creates Bid Invitation for SUB**

```
👤 User: GC
📱 Screen: Create Bid Invitation

Action:
1. GC fills form:
   - Select Subcontractor: Mike Johnson (SUB - Electrician)
   - Title: "Electrical Work - Kitchen Renovation"
   - Description: "Install new electrical panel, outlets, lighting"
   - Budget: $3,000 - $4,000
   - Due Date: 2025-01-18

2. Clicks "Send Invitation"

Backend:
POST /api/v1/bids
{
  contractor_id: "sub-uuid-555",
  title: "Electrical Work - Kitchen Renovation",
  descriptions: "Install new electrical panel...",
  due_date: "2025-01-18"
}

Database:
✅ New bid invitation
{
  id: "bid-uuid-444",
  project_manager_id: "gc-uuid-789",  // GC is inviting
  contractor_id: "sub-uuid-555",       // SUB receiving
  title: "Electrical Work...",
  status: "draft"
}

Result:
✅ SUB receives invitation
✅ Can submit bid
```

---

### **Step 3: SUB Submits Bid**

```
👤 User: SUB (Mike Johnson)
📱 Screen: Bids Tab

Action:
1. SUB sees invitation
2. Reviews scope
3. Submits bid:
   - Amount: $3,500
   - Timeline: 1 week
   - Proposal: "I can complete all electrical work in 1 week"

Backend:
POST /api/v1/bids/bid-uuid-444/submit
{
  amount: 3500,
  timeline_days: 7,
  proposal_text: "I can complete all electrical work..."
}

Result:
✅ Bid submitted
✅ GC receives notification
```

---

### **Step 4: GC Awards Bid to SUB**

```
👤 User: GC
📱 Screen: Bid Submissions

Action:
1. GC reviews SUB's bid
2. Awards bid

Backend:
PUT /api/v1/bids/bid-uuid-444/status
{
  status: "accepted"
}

Result:
✅ SUB gets the work
✅ SUB works under GC
✅ GC manages SUB's work
✅ PM pays GC, GC pays SUB
```

---

## **WORKFLOW 4: ADMIN MANAGES PLATFORM**

### **Step 1: Admin Login**

```
👤 User: ADMIN
📱 Screen: Admin Panel Login

Action:
1. Admin opens admin panel
2. Enters credentials:
   - Email: admin@bidroom.com
   - Password: ********

3. Clicks "Login"

Backend:
POST /api/v1/auth/login
{
  email: "admin@bidroom.com",
  password: "********"
}

Response:
{
  success: true,
  data: {
    user: {
      id: "admin-uuid-001",
      email: "admin@bidroom.com",
      role: "admin"
    },
    token: "jwt-token-here"
  }
}

Result:
✅ Admin logged in
✅ Redirected to dashboard
```

---

### **Step 2: Admin Views Dashboard**

```
👤 User: ADMIN
📱 Screen: Admin Dashboard

What Admin sees:
✅ Total Users: 1,234
✅ Total Jobs: 456
✅ Total Projects: 234
✅ Total Revenue: $1,234,567
✅ Active Disputes: 5
✅ Pending Verifications: 12
✅ Recent Activity

Backend:
GET /api/v1/admin/stats

Response:
{
  success: true,
  data: {
    users: {
      total: 1234,
      pm: 345,
      gc: 567,
      sub: 234,
      ts: 88
    },
    jobs: {
      total: 456,
      open: 123,
      filled: 333
    },
    projects: {
      total: 234,
      active: 89,
      completed: 145
    },
    revenue: 1234567
  }
}

Result:
✅ Admin sees platform overview
✅ Can identify issues
✅ Can take actions
```

---

### **Step 3: Admin Manages Users**

```
👤 User: ADMIN
📱 Screen: Users Management

Action:
1. Admin clicks "Users" in sidebar
2. Sees list of all users
3. Can search, filter by role
4. Selects a user to manage

Backend:
GET /api/v1/admin/users?page=1&limit=50

Response:
{
  success: true,
  data: {
    users: [
      {
        id: "user-uuid-123",
        name: "John Smith",
        email: "john@example.com",
        role: "general_contractor",
        trust_score: 88,
        is_active: true,
        created_at: "2024-06-15"
      },
      // ... more users
    ],
    total: 1234,
    page: 1,
    pages: 25
  }
}

Admin can:
✅ View user details
✅ Edit user profile
✅ Verify user
✅ Suspend user
✅ View user's jobs/projects
✅ View user's transactions
```

---

### **Step 4: Admin Resolves Dispute**

```
👤 User: ADMIN
📱 Screen: Disputes Section

Action:
1. Admin sees active dispute
2. Reviews details:
   - PM claims work not completed
   - GC claims work is done
   - Payment held in escrow: $5,000

3. Admin investigates:
   - Reviews project photos
   - Reads messages
   - Checks milestones
   - Reviews contract

4. Makes decision:
   - Sides with GC
   - Releases payment

Backend:
PUT /api/v1/admin/disputes/dispute-uuid-777/resolve
{
  resolution: "Release payment to contractor",
  winner: "contractor",
  action: "release_payment"
}

Database:
✅ Update dispute
{
  status: "resolved",
  resolution: "Release payment to contractor",
  resolved_by: "admin-uuid-001",
  resolved_at: "2025-01-15T16:00:00Z"
}

✅ Release payment
{
  status: "released",
  released_to: "gc-uuid-789"
}

✅ Notifications
- PM: "Dispute resolved - Payment released to contractor"
- GC: "Dispute resolved in your favor - Payment released"

Result:
✅ Dispute resolved
✅ Payment released
✅ Both parties notified
```

---

<a name="database-schema"></a>
# 🗄️ DATABASE SCHEMA

## **Users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  -- Roles: project_manager, general_contractor, 
  --        subcontractor, trade_specialist, viewer, admin, super_admin
  
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  trust_score NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## **Jobs Table**
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  projects_manager_id UUID REFERENCES users(id),
  
  title TEXT NOT NULL,
  descriptions TEXT NOT NULL,        -- ⚠️ PLURAL
  locations TEXT NOT NULL,           -- ⚠️ PLURAL
  trade_type TEXT,
  
  budget_min NUMERIC,
  budget_max NUMERIC,
  
  requirements JSONB,
  images JSONB,
  
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  
  status TEXT DEFAULT 'open',        -- open, closed, filled
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## **Job Applications Table**
```sql
CREATE TABLE job_applications (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  contractor_id UUID REFERENCES users(id),
  
  proposed_rate NUMERIC,
  cover_letter TEXT,
  availability TEXT,
  timeline TEXT,
  
  status TEXT DEFAULT 'pending',     -- pending, accepted, rejected
  
  applied_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP
);
```

## **Projects Table**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  
  owner_id UUID REFERENCES users(id),
  contractor_id UUID REFERENCES users(id),
  
  total_amount NUMERIC NOT NULL,
  
  status TEXT DEFAULT 'active',      -- active, completed, cancelled
  
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## **Bids Table**
```sql
CREATE TABLE bids (
  id UUID PRIMARY KEY,
  project_manager_id UUID REFERENCES users(id),
  contractor_id UUID REFERENCES users(id),
  
  title TEXT,
  descriptions TEXT,
  
  due_date TIMESTAMP,
  
  status TEXT DEFAULT 'draft',
  -- draft, submitted, accepted, rejected, withdrawn
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
  
  -- ⚠️ NO project_id or job_id columns!
);
```

## **Bid Submissions Table**
```sql
CREATE TABLE bid_submissions (
  id UUID PRIMARY KEY,
  bid_id UUID REFERENCES bids(id),
  contractor_id UUID REFERENCES users(id),
  
  amount NUMERIC,
  proposal_text TEXT,
  timeline_days INTEGER,
  breakdown JSONB,
  attachments JSONB,
  
  status TEXT DEFAULT 'submitted',   -- submitted, accepted, rejected
  
  submitted_at TIMESTAMP DEFAULT NOW()
);
```

---

<a name="api-endpoints"></a>
# 🌐 API ENDPOINTS

## **Authentication**
```
POST   /api/v1/auth/register          - Register new user
POST   /api/v1/auth/login             - Login
POST   /api/v1/auth/logout            - Logout
GET    /api/v1/auth/me                - Get current user
POST   /api/v1/auth/refresh-token     - Refresh JWT token
```

## **Jobs**
```
GET    /api/v1/jobs                   - List all jobs
POST   /api/v1/jobs                   - Create job (PM only)
GET    /api/v1/jobs/:id               - Get job details
PUT    /api/v1/jobs/:id               - Update job (Owner/Admin)
DELETE /api/v1/jobs/:id               - Delete job (Owner/Admin)
GET    /api/v1/jobs/search            - Search jobs
```

## **Applications**
```
POST   /api/v1/jobs/:id/apply                   - Apply to job
GET    /api/v1/jobs/:id/applications            - Get applications (PM)
GET    /api/v1/applications/my-applications     - Get my applications
PUT    /api/v1/jobs/applications/:id/status     - Update status (PM)
PUT    /api/v1/applications/:id/withdraw        - Withdraw application
```

## **Projects**
```
GET    /api/v1/projects               - List projects
POST   /api/v1/projects               - Create project
GET    /api/v1/projects/:id           - Get project details
PUT    /api/v1/projects/:id           - Update project
DELETE /api/v1/projects/:id           - Delete project
```

## **Bids**
```
GET    /api/v1/bids                   - Get bids
POST   /api/v1/bids                   - Create bid invitation
GET    /api/v1/bids/my-bids           - Get my bids
POST   /api/v1/bids/:id/submit        - Submit bid response
GET    /api/v1/bids/:id/submissions   - Get submissions
PUT    /api/v1/bids/:id/status        - Update bid status
```

## **Admin**
```
GET    /api/v1/admin/users            - List all users
GET    /api/v1/admin/users/:id        - Get user details
PUT    /api/v1/admin/users/:id        - Update user
DELETE /api/v1/admin/users/:id        - Delete user (SUPER)
PUT    /api/v1/admin/users/:id/verify - Verify user
PUT    /api/v1/admin/users/:id/suspend - Suspend user

GET    /api/v1/admin/jobs             - List all jobs
GET    /api/v1/admin/projects         - List all projects
GET    /api/v1/admin/transactions     - List transactions
GET    /api/v1/admin/payouts          - List payouts
PUT    /api/v1/admin/payouts/:id/approve - Approve payout
GET    /api/v1/admin/disputes         - List disputes
PUT    /api/v1/admin/disputes/:id/resolve - Resolve dispute
GET    /api/v1/admin/stats            - Platform statistics
```

---

# 🎯 SUMMARY

## **7 User Roles:**
1. ✅ PM - Creates jobs, manages projects
2. ✅ GC - Applies to jobs, can hire subs
3. ✅ SUB - Works under GCs
4. ✅ TS - Trade specialists
5. ✅ VIEWER - Read-only access
6. ✅ ADMIN - Platform management
7. ✅ SUPER - Full control

## **3 Main Workflows:**
1. ✅ Job Posting → Application → Project (9 steps)
2. ✅ Bid Invitation → Submission → Award (5 steps)
3. ✅ GC → Subcontractor Hiring (4 steps)

## **Complete Permission Matrix:**
✅ All roles defined
✅ All permissions mapped
✅ RBAC fully implemented

---

**Document Created:** 2025-12-22 01:28 PKT  
**Status:** ✅ COMPLETE  
**All Roles:** ✅ Documented  
**All Workflows:** ✅ Step-by-step explained  
**Ready:** ✅ YES
