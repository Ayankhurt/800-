# Role System Mapping - Complete Reference

## Current Role Architecture

### **Backend Database Roles** (snake_case - stored in `users.role` column)
```
super_admin
admin
moderator
support_agent
finance_manager
general_contractor
project_manager
subcontractor
trade_specialist
viewer
client          // Legacy - for backward compatibility
contractor      // Legacy - for backward compatibility
```

### **Frontend App Roles** (UPPERCASE - used in UI/AuthContext)
```typescript
export type AppRole = "PM" | "GC" | "SUB" | "TS" | "VIEWER" | "ADMIN";
```

### **Admin Panel Roles** (snake_case - matches backend)
```typescript
const ALL_ROLES = [
  { code: "admin", label: "Admin" },
  { code: "super_admin", label: "Super Admin" },
  { code: "finance_manager", label: "Finance" },
  { code: "moderator", label: "Moderator" },
  { code: "support_agent", label: "Support" },
  { code: "project_manager", label: "Project Manager" },
  { code: "general_contractor", label: "General Contractor" },
  { code: "subcontractor", label: "Subcontractor" },
  { code: "trade_specialist", label: "Trade Specialist" },
  { code: "viewer", label: "Viewer" },
];
```

---

## Role Mapping (Frontend ↔ Backend)

### **Signup Flow** (`app/services/api.ts`)
```typescript
const roleMapping: Record<string, string> = {
  'PM': 'project_manager',
  'GC': 'general_contractor',
  'SUB': 'subcontractor',
  'TS': 'trade_specialist',
  'VIEWER': 'viewer',
  'ADMIN': 'admin'
};
```

### **Display Mapping** (Backend → Frontend Labels)
```
admin               → "ADMIN"
super_admin         → "SUPER ADMIN"
finance_manager     → "FINANCE" / "FIN"
moderator           → "MODERATOR" / "MOD"
support_agent       → "SUPPORT"
project_manager     → "PM"
general_contractor  → "GC"
subcontractor       → "SUB"
trade_specialist    → "TS"
viewer              → "VIEWER"
```

---

## Role Validation

### **Backend Valid Roles** (`adminController.js`)
```javascript
const validRoles = [
  'super_admin', 
  'admin', 
  'moderator', 
  'support_agent', 
  'finance_manager',
  'general_contractor', 
  'project_manager', 
  'subcontractor', 
  'trade_specialist', 
  'viewer',
  'client',      // Legacy
  'contractor'   // Legacy
];
```

### **Frontend Signup Roles** (AuthContext)
```typescript
// Only these roles can be selected during signup:
"PM" | "GC" | "SUB" | "TS" | "VIEWER"

// ADMIN role is login-only, not available for signup
```

---

## Current Database State

### **Verified Users in Database** (9 users)
| Email                  | Role                | Display Name |
|------------------------|---------------------|--------------|
| admin@bidroom.com      | admin               | Admin User   |
| super@bidroom.com      | super_admin         | Super Admin  |
| mod@bidroom.com        | moderator           | Moderator    |
| support@bidroom.com    | support_agent       | Support      |
| ts@test.com            | trade_specialist    | Trade Spec   |
| pm@test.com            | project_manager     | Test PM      |
| cont@bidroom.com       | general_contractor  | contractor   |
| sub@bidroom.com        | subcontractor       | Ayan sub     |
| finance@bidroom.com    | finance_manager     | Finance Mgr  |

---

## Issues Identified

### ⚠️ **CRITICAL: Role Mismatch**

**Problem:** Frontend `AuthContext` uses UPPERCASE role codes (`PM`, `GC`, `SUB`, `TS`, `VIEWER`, `ADMIN`) but backend expects snake_case (`project_manager`, `general_contractor`, etc.)

**Impact:**
1. ✅ **Signup works** - `api.ts` has `roleMapping` that converts uppercase to snake_case
2. ❌ **Login may fail** - User object from backend has snake_case role, but AuthContext expects uppercase
3. ❌ **Role checks fail** - `user.role === "ADMIN"` won't match `"admin"` from database
4. ❌ **Navigation breaks** - `navigateByRole()` expects uppercase roles

**Current Workaround:**
- `api.ts` signup flow converts roles correctly
- Admin Panel now uses snake_case roles (recently fixed)

**Recommended Fix:**
Update `AuthContext.tsx` to:
1. Accept snake_case roles from backend
2. Convert to uppercase for internal use, OR
3. Use snake_case throughout the app

---

## Role Permission Hierarchy

### **Admin Roles** (Can access Admin Panel)
```
super_admin     → Full access, can manage admins
admin           → Full access, cannot manage super_admins
finance_manager → Finance section only
moderator       → Content moderation
support_agent   → Support tickets
```

### **User Roles** (Regular app users)
```
project_manager     → Create projects, manage teams
general_contractor  → Bid on projects, manage subs
subcontractor       → Work on projects
trade_specialist    → Specialized trades
viewer              → Read-only access
```

---

## Files Requiring Role Consistency

### **Frontend Files:**
- ✅ `app/contexts/AuthContext.tsx` - Defines AppRole type (UPPERCASE)
- ✅ `app/services/api.ts` - Has roleMapping for signup (converts to snake_case)
- ✅ `app/admin/user-management/index.tsx` - Uses snake_case (recently fixed)
- ✅ `app/admin/user-management/user-details.tsx` - Uses snake_case (recently fixed)

### **Backend Files:**
- ✅ `backend/src/controllers/adminController.js` - validRoles array (snake_case)
- ✅ `backend/src/controllers/authController.js` - Accepts snake_case roles
- ✅ Database schema - `users.role` column stores snake_case

---

## Recommended Actions

1. **Update AuthContext.tsx:**
   - Change `AppRole` type to accept snake_case OR
   - Add role normalization in login response handler

2. **Add Role Utility Functions:**
   ```typescript
   // Convert backend role to display format
   export const roleToDisplay = (role: string): string => {
     const mapping = {
       'admin': 'ADMIN',
       'super_admin': 'SUPER ADMIN',
       'project_manager': 'PM',
       // ... etc
     };
     return mapping[role] || role.toUpperCase();
   };
   
   // Convert display format to backend role
   export const displayToRole = (display: string): string => {
     const mapping = {
       'PM': 'project_manager',
       'GC': 'general_contractor',
       // ... etc
     };
     return mapping[display] || display.toLowerCase();
   };
   ```

3. **Standardize Role Checks:**
   - Use lowercase comparison: `user.role.toLowerCase() === 'admin'`
   - Or normalize roles in AuthContext

4. **Update Documentation:**
   - Document the role mapping clearly
   - Add JSDoc comments to role-related functions
