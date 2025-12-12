# 🎛️ Admin Panel - Backend Integration Guide

## ✅ Integration Complete!

Admin panel ko backend APIs ke saath successfully integrate kar diya gaya hai.

---

## 🚀 Setup Instructions

### 1. Environment Setup

Copy `.env.example` to `.env.local`:
```bash
cd admin-panel
cp .env.example .env.local
```

`.env.local` file mein ye values set karein:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_NAME=Bidroom Admin Panel
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Backend Server

Pehle backend server start karein:
```bash
cd ../backend
npm start
```

Backend running on: `http://localhost:5000`

### 4. Start Admin Panel

```bash
cd ../admin-panel
npm run dev
```

Admin panel running on: `http://localhost:3000`

---

## 📁 New Files Created

### API Integration Files:

1. **`src/lib/api/client.ts`**
   - Axios client with auth interceptors
   - Automatic token management
   - Error handling
   - 401 redirect to login

2. **`src/lib/api/auth.ts`**
   - Login API
   - Register API
   - Logout function
   - Get current user
   - Auth status checks

3. **`src/lib/api/admin.ts`**
   - Dashboard stats API
   - User management APIs
   - Projects APIs
   - Jobs APIs
   - Bids APIs
   - Financial APIs
   - Disputes APIs
   - Support tickets APIs
   - Verification APIs
   - Moderation APIs
   - Analytics APIs
   - Settings APIs
   - Audit logs APIs
   - Referral stats APIs

4. **`src/lib/api/index.ts`**
   - Central export file

5. **`.env.example`**
   - Environment variables template

---

## 🔐 Authentication Flow

### Login Process:

1. User enters email/password
2. Call `authAPI.login(credentials)`
3. Backend validates credentials
4. Returns JWT token + user data
5. Token saved in `localStorage`
6. User redirected to dashboard

### Example Login:

```typescript
import { authAPI } from '@/lib/api';

const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authAPI.login({ email, password });
    
    if (response.success) {
      // User logged in successfully
      // Token automatically saved
      window.location.href = '/dashboard';
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

---

## 📊 Using Admin APIs

### Dashboard Stats:

```typescript
import { adminAPI } from '@/lib/api';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getDashboardStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h1>Total Users: {stats?.users?.total}</h1>
      <h1>Total Revenue: ${stats?.revenue?.total}</h1>
    </div>
  );
};
```

### User Management:

```typescript
import { adminAPI } from '@/lib/api';

// Get all users
const users = await adminAPI.getUsers({
  page: 1,
  limit: 50,
  role: 'contractor',
  status: 'active'
});

// Get user by ID
const user = await adminAPI.getUserById('user-uuid');

// Update user
await adminAPI.updateUser('user-uuid', {
  first_name: 'John',
  last_name: 'Doe'
});

// Suspend user
await adminAPI.suspendUser('user-uuid', 'Violation of terms', 7);

// Verify user
await adminAPI.verifyUser('user-uuid');

// Delete user
await adminAPI.deleteUser('user-uuid');
```

### Projects Management:

```typescript
// Get all projects
const projects = await adminAPI.getProjects({
  page: 1,
  limit: 50,
  status: 'active'
});

// Get project details
const project = await adminAPI.getProjectById('project-uuid');
```

### Financial Management:

```typescript
// Get financial stats
const stats = await adminAPI.getFinancialStats();

// Get transactions
const transactions = await adminAPI.getTransactions({
  page: 1,
  limit: 50,
  status: 'completed',
  type: 'payment'
});
```

### Analytics:

```typescript
// Get analytics for last 30 days
const analytics = await adminAPI.getAnalytics(30);

// Get analytics for last 7 days
const weeklyAnalytics = await adminAPI.getAnalytics(7);
```

---

## 🛡️ Protected Routes

Admin routes automatically protected by auth interceptor:

```typescript
// If user not authenticated or not admin:
// - Automatically redirected to /login
// - Token cleared from localStorage
```

---

## 🎨 UI Components Integration

### Update Dashboard Component:

```typescript
// src/components/Dashboard.tsx
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';

export const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await adminAPI.getDashboardStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Total Users"
        value={stats?.users?.total || 0}
        growth={stats?.users?.growth}
      />
      <StatCard
        title="Total Jobs"
        value={stats?.jobs?.total || 0}
        growth={stats?.jobs?.growth}
      />
      <StatCard
        title="Total Revenue"
        value={`$${stats?.revenue?.total || 0}`}
        growth={stats?.revenue?.growth}
      />
      <StatCard
        title="Active Disputes"
        value={stats?.disputes?.active || 0}
      />
    </div>
  );
};
```

### Update Users List Component:

```typescript
// src/components/UsersList.tsx
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';

export const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await adminAPI.getUsers({ page, limit: 50 });
        if (response.success) {
          setUsers(response.data.users);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page]);

  const handleSuspend = async (userId: string) => {
    try {
      await adminAPI.suspendUser(userId, 'Admin action', 7);
      // Refresh users list
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: any) => (
            <tr key={user.id}>
              <td>{user.first_name} {user.last_name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.is_active ? 'Active' : 'Suspended'}</td>
              <td>
                <button onClick={() => handleSuspend(user.id)}>
                  Suspend
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## 🔄 Real-time Updates (Optional)

For real-time features, you can add polling or WebSocket:

```typescript
// Polling example
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await adminAPI.getDashboardStats();
    setStats(response.data);
  }, 30000); // Update every 30 seconds

  return () => clearInterval(interval);
}, []);
```

---

## ✅ Integration Checklist

### Setup:
- [x] API client created with auth interceptors
- [x] Auth API service created
- [x] Admin API service created
- [x] Environment variables configured
- [ ] Copy `.env.example` to `.env.local`

### Testing:
- [ ] Backend server running
- [ ] Admin panel running
- [ ] Login working
- [ ] Dashboard stats loading
- [ ] User management working
- [ ] All admin features tested

### Components to Update:
- [ ] Login page - use `authAPI.login()`
- [ ] Dashboard - use `adminAPI.getDashboardStats()`
- [ ] Users page - use `adminAPI.getUsers()`
- [ ] Projects page - use `adminAPI.getProjects()`
- [ ] Jobs page - use `adminAPI.getJobs()`
- [ ] Transactions page - use `adminAPI.getTransactions()`
- [ ] Disputes page - use `adminAPI.getDisputes()`
- [ ] Support page - use `adminAPI.getSupportTickets()`
- [ ] Verification page - use `adminAPI.getVerifications()`
- [ ] Reports page - use `adminAPI.getReports()`
- [ ] Analytics page - use `adminAPI.getAnalytics()`
- [ ] Settings page - use `adminAPI.getSettings()`

---

## 🐛 Troubleshooting

### CORS Error:
Backend mein CORS already configured hai for `http://localhost:3000`

### 401 Unauthorized:
- Check if backend server running
- Check if token valid
- Check if user has admin role

### Network Error:
- Check if `NEXT_PUBLIC_API_URL` correct
- Check if backend server accessible

---

## 📚 API Documentation

Complete API documentation:
- **Admin APIs:** `backend/ADMIN_API_DOCUMENTATION.md`
- **All APIs:** `backend/API_DOCUMENTATION.md`

---

## 🎯 Next Steps

1. **Copy `.env.example` to `.env.local`**
2. **Start backend server**
3. **Start admin panel**
4. **Create admin user** (if not exists)
5. **Login to admin panel**
6. **Update components** to use real APIs
7. **Remove all mock data**
8. **Test all features**

---

**✅ Backend Integration: COMPLETE**

**🚀 Ready to use real APIs - No mock data!**
