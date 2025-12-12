# 🧪 Admin Panel - Complete Testing Guide

## ✅ Prerequisites

1. ✅ Backend running on `http://localhost:5000`
2. ✅ Admin panel running on `http://localhost:3001`
3. ✅ Database tables created
4. 🔶 Admin user created (follow steps below)

---

## 📋 Step-by-Step Testing

### STEP 1: Create Admin User (5 minutes)

#### Option A: Using SQL Script (Recommended)

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste this file: `backend/migrations/create_admin_user.sql`
4. Click "Run"
5. Check output - should see "✅ Admin user created successfully!"

**Credentials:**
- Email: `admin@bidroom.com`
- Password: `Admin@123`

#### Option B: Using Backend API

```bash
# Using curl or Postman
POST http://localhost:5000/api/v1/auth/signup
Content-Type: application/json

{
  "email": "admin@bidroom.com",
  "password": "Admin@123",
  "first_name": "Admin",
  "last_name": "User",
  "role": "admin"
}

# Then update to admin role in Supabase
UPDATE users SET role = 'admin' WHERE email = 'admin@bidroom.com';
```

---

### STEP 2: Test Login (2 minutes)

1. **Open Admin Panel**
   - Go to: `http://localhost:3001`
   - Should see login page

2. **Enter Credentials**
   - Email: `admin@bidroom.com`
   - Password: `Admin@123`

3. **Click "Sign In"**
   - Should redirect to `/dashboard`
   - Should see dashboard with stats

4. **Check Browser Console**
   ```javascript
   // Should see no errors
   // Check localStorage
   console.log(localStorage.getItem('admin_token')); // Should have JWT
   console.log(localStorage.getItem('admin_user')); // Should have user object
   ```

---

### STEP 3: Test Dashboard (5 minutes)

#### Dashboard Stats
- [ ] Total Users count displayed
- [ ] Active Projects count displayed
- [ ] Total Revenue displayed
- [ ] Open Disputes count displayed

#### Charts
- [ ] Weekly Activity chart loads
- [ ] User Distribution pie chart loads

#### Recent Activity
- [ ] Recent activity list displays
- [ ] Shows user actions
- [ ] Shows timestamps

---

### STEP 4: Test User Management (10 minutes)

1. **Navigate to Users**
   - Click "Users" in sidebar
   - Should see users list

2. **Test Filters**
   - [ ] Filter by role (admin, contractor, owner)
   - [ ] Filter by status (active, inactive)
   - [ ] Search by name/email

3. **Test User Actions**
   - [ ] View user details
   - [ ] Suspend user
   - [ ] Unsuspend user
   - [ ] Change user role
   - [ ] Verify user

---

### STEP 5: Test Projects Management (10 minutes)

1. **Navigate to Projects**
   - Click "Projects" in sidebar
   - Should see projects list

2. **Test Filters**
   - [ ] Filter by status
   - [ ] Search by title

3. **Test Project Details**
   - [ ] Click on project
   - [ ] View project details
   - [ ] View milestones
   - [ ] View timeline

---

### STEP 6: Test Jobs Management (5 minutes)

1. **Navigate to Jobs**
   - Click "Jobs" in sidebar
   - Should see jobs list

2. **Test Features**
   - [ ] View all jobs
   - [ ] Filter by status
   - [ ] Filter by trade type
   - [ ] View job details

---

### STEP 7: Test Financial Management (10 minutes)

1. **Navigate to Transactions**
   - Click "Payments" → "Transactions"
   - Should see transactions list

2. **Test Features**
   - [ ] View all transactions
   - [ ] Filter by status
   - [ ] Filter by type
   - [ ] View transaction details

3. **Test Financial Stats**
   - [ ] Total revenue displayed
   - [ ] Monthly revenue displayed
   - [ ] Transaction counts correct

---

### STEP 8: Test Disputes (5 minutes)

1. **Navigate to Disputes**
   - Click "Disputes" in sidebar
   - Should see disputes list

2. **Test Features**
   - [ ] View all disputes
   - [ ] Filter by status
   - [ ] Filter by type
   - [ ] View dispute details

---

### STEP 9: Test Support (5 minutes)

1. **Navigate to Support**
   - Click "Support" → "Tickets"
   - Should see tickets list

2. **Test Features**
   - [ ] View all tickets
   - [ ] Filter by status
   - [ ] Filter by priority
   - [ ] View ticket details

---

### STEP 10: Test Verification (5 minutes)

1. **Navigate to Verification**
   - Click "Verification" in sidebar
   - Should see verification requests

2. **Test Features**
   - [ ] View all requests
   - [ ] Filter by type
   - [ ] Filter by status
   - [ ] Approve/reject requests

---

### STEP 11: Test Analytics (5 minutes)

1. **Navigate to Analytics**
   - Click "Analytics" in sidebar
   - Should see analytics dashboard

2. **Test Features**
   - [ ] View analytics data
   - [ ] Change time period
   - [ ] View charts
   - [ ] Export reports

---

### STEP 12: Test Settings (5 minutes)

1. **Navigate to Settings**
   - Click "Settings" in sidebar
   - Should see system settings

2. **Test Features**
   - [ ] View all settings
   - [ ] Update setting
   - [ ] Save changes

---

## 🐛 Troubleshooting

### Login Issues

**Problem:** Can't login
**Solutions:**
1. Check backend is running
2. Check admin user exists
3. Check credentials correct
4. Check browser console for errors
5. Check network tab for API response

**Problem:** 401 Unauthorized
**Solutions:**
1. Clear localStorage
2. Create new admin user
3. Check JWT_SECRET in backend .env

**Problem:** Redirect loop
**Solutions:**
1. Clear browser cache
2. Clear localStorage
3. Restart admin panel

### Dashboard Issues

**Problem:** No data showing
**Solutions:**
1. Check backend APIs responding
2. Check browser console
3. Check network tab
4. Verify database has data

**Problem:** Loading forever
**Solutions:**
1. Check backend server running
2. Check API endpoints
3. Check CORS settings
4. Check network connectivity

### API Issues

**Problem:** 404 Not Found
**Solutions:**
1. Check API_URL in .env
2. Check backend routes
3. Check endpoint spelling

**Problem:** CORS Error
**Solutions:**
1. Check backend CORS config
2. Check FRONTEND_URL in backend .env
3. Restart backend server

---

## ✅ Success Criteria

### Login ✅
- [ ] Can login with admin credentials
- [ ] Token saved in localStorage
- [ ] User data saved in localStorage
- [ ] Redirects to dashboard

### Dashboard ✅
- [ ] Stats load from real APIs
- [ ] Charts display data
- [ ] Recent activity shows
- [ ] No console errors

### Navigation ✅
- [ ] All sidebar links work
- [ ] Can navigate between pages
- [ ] Breadcrumbs work
- [ ] Back button works

### Data Loading ✅
- [ ] All lists load data
- [ ] Filters work
- [ ] Search works
- [ ] Pagination works

### Actions ✅
- [ ] Can perform CRUD operations
- [ ] Success messages show
- [ ] Error messages show
- [ ] Data refreshes after actions

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

✅ PASSED | ❌ FAILED | 🔶 PARTIAL

[ ] Step 1: Create Admin User
[ ] Step 2: Test Login
[ ] Step 3: Test Dashboard
[ ] Step 4: Test User Management
[ ] Step 5: Test Projects
[ ] Step 6: Test Jobs
[ ] Step 7: Test Financial
[ ] Step 8: Test Disputes
[ ] Step 9: Test Support
[ ] Step 10: Test Verification
[ ] Step 11: Test Analytics
[ ] Step 12: Test Settings

Notes:
_________________________________
_________________________________
_________________________________
```

---

## 🚀 Quick Test Commands

### Test Backend API
```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bidroom.com","password":"Admin@123"}'

# Test dashboard stats (need token)
curl http://localhost:5000/api/v1/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Frontend
```javascript
// In browser console
// Test API client
import { adminAPI } from '@/lib/api';

// Test dashboard stats
adminAPI.getDashboardStats().then(console.log);

// Test users
adminAPI.getUsers({ page: 1, limit: 10 }).then(console.log);
```

---

## 📝 Reporting Issues

If you find issues, report with:
1. **What you did** - Steps to reproduce
2. **What happened** - Actual result
3. **What you expected** - Expected result
4. **Screenshots** - If applicable
5. **Console logs** - Browser console errors
6. **Network logs** - API request/response

---

**Happy Testing! 🎉**

**Last Updated:** January 5, 2025
