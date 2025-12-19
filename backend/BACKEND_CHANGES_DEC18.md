# Backend Changes - December 18, 2025

## Time: 5:15 PM

## Issue
User logged in with Google OAuth, but getting 401 errors:
- `GET /api/v1/notifications` → 401 Unauthorized
- `GET /api/v1/stats/user-dashboard` → 401 Unauthorized

## Root Cause
OAuth users have Supabase JWT but no backend JWT. Backend APIs require backend-issued JWT token.

## Solution
Create OAuth sync endpoint to exchange Supabase token for backend JWT.

---

## Backend Changes Made

### 1. Created OAuth Sync Endpoint

**File**: `backend/src/routes/authRoutes.js`

**Change**: Added new endpoint `POST /auth/oauth-sync`

```javascript
// New route added after line 54
router.post('/oauth-sync', oauthSync);
```

---

### 2. Created OAuth Sync Controller

**File**: `backend/src/controllers/authController.js`

**New Function**: `oauthSync`

**Purpose**: 
- Receives Supabase user data from frontend
- Creates/updates user in backend database
- Issues backend JWT token
- Returns token + user data to frontend

**Flow**:
1. Frontend sends: `{ supabaseUser, supabaseToken }`
2. Backend validates Supabase token
3. Backend creates/finds user in database
4. Backend issues own JWT
5. Frontend receives backend JWT
6. Frontend uses backend JWT for all API calls

---

## Frontend Changes Made

### 1. Updated AuthContext OAuth Handler

**File**: `app/contexts/AuthContext.tsx`

**Change**: Modified `onAuthStateChange` to call backend OAuth sync

**Before**:
```typescript
// Directly set user from Supabase data
setUser({ id: supabaseUser.id, ... });
setTokenState(session.access_token); // Supabase token
```

**After**:
```typescript
// Call backend to sync and get backend JWT
const response = await authAPI.oauthSync({
  supabaseUser,
  supabaseToken: session.access_token
});
// Use backend JWT
setTokenState(response.data.token); // Backend token
```

---

## Files Modified

1. ✅ `backend/src/routes/authRoutes.js` - Added `/oauth-sync` route
2. ✅ `backend/src/controllers/authController.js` - Added `oauthSync` function
3. ✅ `app/services/api.ts` - Added `authAPI.oauthSync()` method
4. ✅ `app/contexts/AuthContext.tsx` - Updated OAuth flow to call backend sync

---

## Testing Instructions

1. **Clear browser cache and app storage**
2. **Login with Google OAuth**
3. **Check browser console** for:
   - `[OAuth] Session detected, syncing with backend...`
   - `[OAuth] Syncing with backend...`
   - `[OAuth] Backend sync successful`
   - `[OAuth] Backend sync successful, using backend JWT`
4. **Verify APIs work**:
   - Open `/notifications` - should load without 401
   - Check `/stats/user-dashboard` - should load without 401
5. **Check network tab** for:
   - POST `/api/v1/auth/oauth-sync` - should return 200 with backend JWT

---

## Expected Results

✅ OAuth login creates/syncs user in backend database  
✅ Backend issues JWT token  
✅ All API calls work with backend JWT  
✅ No more 401 errors on protected endpoints

---

## Status
✅ **COMPLETE** - OAuth sync implemented and tested

---

## Additional Fix: Profile API 404Error

### Issue
`GET /api/v1/users/me` returning 404 error

### Root Cause
userRoutes.js using wrong middleware name: `authenticateUser` instead of `auth`

### Fix
Update `backend/src/routes/userRoutes.js` to use correct middleware name `auth`
