# 🔧 SUBCONTRACTOR ROLE - COMPLETE DETAILS

## 📅 Date: 2025-12-22 01:23 PKT

---

# ✅ **SUBCONTRACTOR ROLE STATUS**

```
Role Name:        Subcontractor
Role Code:        subcontractor
Alternative:      SUB, SUBCONTRACTOR
Status:           ✅ FULLY IMPLEMENTED
RBAC:             ✅ Configured
Permissions:      ✅ Defined
```

---

## 👤 **SUBCONTRACTOR ROLE DETAILS**

### **What is a Subcontractor?**
A **Subcontractor** is a specialized contractor who works under a General Contractor (GC) on specific tasks or trades within a larger construction project.

**Example:**
- GC gets a full house renovation project
- GC hires Subcontractors for:
  - Electrical work
  - Plumbing
  - HVAC
  - Painting
  - Flooring

---

## 🔐 **SUBCONTRACTOR PERMISSIONS**

### **From RBAC File** (`backend/src/middlewares/rbac.js`)

```javascript
subcontractor: [
    'jobs.view',           // Can view all jobs
    'jobs.apply',          // Can apply to jobs
    'bids.create',         // Can create bids
    'bids.view',           // Can view bids
    'projects.view',       // Can view projects
    'messages.send',       // Can send messages
    'messages.view',       // Can view messages
    'profile.edit'         // Can edit own profile
]
```

---

## ✅ **WHAT SUBCONTRACTOR CAN DO**

### **1. Job Applications**
```
✅ Browse all available jobs
✅ Filter jobs by trade type
✅ View job details
✅ Apply to jobs
✅ Submit cover letter and proposed rate
✅ View own application status
✅ Withdraw applications
```

### **2. Bid Management**
```
✅ Receive bid invitations from GCs
✅ View bid details
✅ Submit bid responses
✅ Provide pricing and timeline
✅ Upload supporting documents
✅ Track bid status
```

### **3. Project Work**
```
✅ View assigned projects
✅ See project details
✅ Track project progress
✅ View milestones
✅ Communicate with PM/GC
```

### **4. Profile Management**
```
✅ Edit profile information
✅ Upload credentials
✅ Add certifications
✅ Update trade specialties
✅ Manage portfolio
```

### **5. Communication**
```
✅ Send messages to PM
✅ Send messages to GC
✅ Receive notifications
✅ Chat in project threads
```

---

## ❌ **WHAT SUBCONTRACTOR CANNOT DO**

### **Restrictions:**
```
❌ Cannot create jobs
❌ Cannot edit jobs
❌ Cannot delete jobs
❌ Cannot create bid invitations (only respond)
❌ Cannot edit bids (only create responses)
❌ Cannot manage projects (only view)
❌ Cannot access admin features
❌ Cannot approve payments
❌ Cannot resolve disputes
```

---

## 🔄 **SUBCONTRACTOR WORKFLOWS**

### **Workflow 1: Job Application**

```
Step 1: Subcontractor logs in
  ↓
Step 2: Browse jobs filtered by trade
  ↓
Step 3: View job details
  ↓
Step 4: Click "Apply"
  ↓
Step 5: Submit application with:
  - Proposed rate
  - Cover letter
  - Availability
  ↓
Step 6: Wait for PM/GC response
  ↓
Step 7: If accepted → Project created
  ↓
Step 8: Start work on project
```

---

### **Workflow 2: Bid Response (via GC)**

```
Step 1: GC creates project
  ↓
Step 2: GC invites Subcontractor to bid
  ↓
Step 3: Subcontractor receives notification
  ↓
Step 4: Subcontractor views bid invitation
  ↓
Step 5: Subcontractor submits bid:
  - Pricing breakdown
  - Timeline estimate
  - Materials needed
  - Labor costs
  ↓
Step 6: GC reviews bids
  ↓
Step 7: GC awards bid to Subcontractor
  ↓
Step 8: Subcontractor starts work
```

---

## 📊 **COMPARISON WITH OTHER ROLES**

### **Subcontractor vs General Contractor (GC)**

| Feature | Subcontractor | General Contractor |
|---------|---------------|-------------------|
| Apply to Jobs | ✅ Yes | ✅ Yes |
| Create Jobs | ❌ No | ❌ No |
| Receive Bid Invitations | ✅ Yes | ✅ Yes |
| Send Bid Invitations | ❌ No | ✅ Yes (to subs) |
| Edit Bids | ❌ No | ✅ Yes (own bids) |
| Manage Projects | ❌ View only | ✅ Yes |
| Hire Subcontractors | ❌ No | ✅ Yes |

### **Subcontractor vs Trade Specialist (TS)**

| Feature | Subcontractor | Trade Specialist |
|---------|---------------|------------------|
| Permissions | Same | Same |
| Scope | Broader | Specific trade |
| Typical Work | Multiple trades | Single trade |
| Example | Can do electrical + plumbing | Only electrical |

**Note:** Technically, Subcontractor and Trade Specialist have the **same permissions** in the system. The difference is conceptual:
- **Subcontractor** = Works under GC, multiple skills
- **Trade Specialist** = Specialized in one trade

---

## 🗄️ **DATABASE SCHEMA**

### **Users Table - Subcontractor Entry**
```sql
{
  id: "uuid",
  email: "sub@example.com",
  role: "subcontractor",        -- ⚠️ Role value
  first_name: "John",
  last_name: "Smith",
  company_name: "Smith Electrical",
  trade_specialties: ["Electrical", "HVAC"],
  certifications: [...],
  trust_score: 85,
  is_active: true
}
```

---

## 🌐 **API ENDPOINTS FOR SUBCONTRACTOR**

### **Jobs**
```
GET    /api/v1/jobs                    - Browse jobs
GET    /api/v1/jobs/:id                - View job details
POST   /api/v1/jobs/:id/apply          - Apply to job
```

### **Applications**
```
GET    /api/v1/applications/my-applications  - View own applications
PUT    /api/v1/applications/:id/withdraw     - Withdraw application
```

### **Bids**
```
GET    /api/v1/bids                    - View bid invitations
POST   /api/v1/bids/:id/submit         - Submit bid response
GET    /api/v1/bids/my-bids            - View own bids
```

### **Projects**
```
GET    /api/v1/projects                - View assigned projects
GET    /api/v1/projects/:id            - View project details
```

### **Profile**
```
GET    /api/v1/profile                 - View own profile
PUT    /api/v1/profile                 - Edit profile
POST   /api/v1/profile/credentials     - Upload credentials
```

---

## 🔧 **BACKEND IMPLEMENTATION**

### **Role Check Examples:**

```javascript
// From projectController.js (line 31)
if (['general_contractor', 'subcontractor', 'trade_specialist'].includes(role)) {
    // Contractor can view projects
}

// From paymentController.js (line 25)
if (!['contractor', 'general_contractor', 'subcontractor', 'trade_specialist'].includes(user.role)) {
    return res.status(403).json({ error: "Access denied" });
}

// From authController.js (line 96)
if (['general_contractor', 'subcontractor', 'trade_specialist', 'contractor'].includes(role)) {
    // Contractor-specific logic
}
```

---

## 📱 **FRONTEND IMPLEMENTATION**

### **Mobile App - Subcontractor View**

```typescript
// Role-based UI rendering
{user.role === 'subcontractor' && (
  <>
    <JobsTab />           // Browse & apply to jobs
    <BidsTab />           // View invitations & submit bids
    <ProjectsTab />       // View assigned projects
    <ProfileTab />        // Manage profile
  </>
)}
```

---

## 🎯 **USE CASES**

### **Use Case 1: Electrical Subcontractor**
```
Name: John Smith
Company: Smith Electrical LLC
Role: Subcontractor
Specialty: Electrical work

Workflow:
1. Receives bid invitation from GC for electrical work
2. Reviews project scope
3. Submits bid: $15,000 for electrical installation
4. Gets awarded the bid
5. Completes electrical work
6. Gets paid via platform
```

### **Use Case 2: Plumbing Subcontractor**
```
Name: Maria Garcia
Company: Garcia Plumbing
Role: Subcontractor
Specialty: Plumbing

Workflow:
1. Browses jobs for plumbing work
2. Finds "Kitchen Renovation" job
3. Applies with proposed rate: $8,000
4. PM accepts application
5. Project created
6. Completes plumbing work
7. Receives payment
```

---

## 📊 **STATISTICS & METRICS**

### **Subcontractor Dashboard Shows:**
```
✅ Total Jobs Applied: 15
✅ Applications Pending: 3
✅ Applications Accepted: 8
✅ Applications Rejected: 4
✅ Active Projects: 2
✅ Completed Projects: 6
✅ Total Earnings: $45,000
✅ Average Rating: 4.7/5
✅ Trust Score: 85
```

---

## 🔐 **SECURITY & PERMISSIONS**

### **Authentication:**
```javascript
// Middleware checks
authenticateUser()  // Validates JWT token
                   // Attaches user to req.user
                   // Includes role: 'subcontractor'
```

### **Authorization:**
```javascript
// RBAC checks
requirePermission('jobs.apply')      // ✅ Allowed
requirePermission('jobs.create')     // ❌ Denied
requirePermission('bids.create')     // ✅ Allowed
requirePermission('bids.edit')       // ❌ Denied
```

---

## 📝 **SUMMARY**

### **Subcontractor Role:**
```
✅ Fully implemented in backend
✅ RBAC permissions configured
✅ Can apply to jobs
✅ Can respond to bid invitations
✅ Can view assigned projects
✅ Can manage own profile
✅ Same permissions as Trade Specialist
✅ Different from General Contractor (cannot hire others)
✅ Different from PM (cannot create jobs)
```

---

## 🎯 **CLIENT REQUIREMENTS**

### **From FUNCTIONAL_REQUIREMENTS.md:**
```
✅ "Subcontractor - Can apply to jobs, receive invites, submit bids"
✅ "Subcontractors: Task-specific access"
✅ "Subcontractors: Submit bids, upload credentials"
✅ "Subcontractor management tools"
```

**Status:** ✅ ALL REQUIREMENTS MET

---

## 🚀 **DEPLOYMENT STATUS**

```
Backend:      ✅ Implemented
Frontend:     ✅ Implemented
RBAC:         ✅ Configured
Database:     ✅ Schema ready
API:          ✅ Endpoints working
Testing:      ✅ Included in tests
Documentation: ✅ Complete
```

---

**Document Created:** 2025-12-22 01:23 PKT  
**Status:** ✅ SUBCONTRACTOR ROLE FULLY IMPLEMENTED  
**Location:** Backend + Frontend + RBAC  
**Ready:** ✅ YES
