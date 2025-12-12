# BidRoom API Integration

Complete API integration for the BidRoom mobile app with automatic token refresh, error handling, and type safety.

## 📁 Structure

```
/src/api/
   ├── client.ts         → axios instance + interceptors with token refresh
   ├── auth.ts           → login, register, verify OTP, me, profile, logout
   ├── jobs.ts           → jobs, applications
   ├── bids.ts           → bidding system
   ├── contractors.ts    → contractor profiles + directory
   ├── projects.ts        → project lifecycle
   ├── milestones.ts     → milestone submissions
   ├── payments.ts        → escrow + payouts
   ├── disputes.ts       → dispute filing + responses
   ├── reviews.ts        → reviews flow
   ├── messages.ts        → conversations + chat
   ├── notifications.ts  → FCM/APNs + in-app notifications
   ├── uploads.ts        → media uploads (images/videos/docs)
   ├── types.ts          → shared API types & interfaces
   └── index.ts          → exports all APIs
```

## 🔐 Authentication

### Token Handling

- **Access Token**: Stored securely (SecureStore/Keychain for native, localStorage for web)
- **Refresh Token**: Stored securely, used automatically on 401
- **Auto-refresh**: On 401 Unauthorized, automatically tries `/auth/refresh-token`
- **Auto-logout**: If refresh fails, tokens are cleared and user is logged out

### Usage

```typescript
import { authAPI } from '@/src/api';

// Register
const registerResult = await authAPI.register({
  email: 'user@example.com',
  password: 'password123',
  full_name: 'John Doe',
  role_code: 'CONTRACTOR',
});

// Login
const loginResult = await authAPI.login({
  email: 'user@example.com',
  password: 'password123',
});

// If MFA is enabled, login returns mfa_required
if (loginResult.data?.mfa_required) {
  // Show OTP input screen
  const verifyResult = await authAPI.verifyOtp({
    temp_token: loginResult.data.temp_token!,
    otp: '123456',
  });
}

// Get current user
const user = await authAPI.me();

// Update profile
await authAPI.updateProfile({
  first_name: 'Jane',
  phone: '+1234567890',
});

// Logout
await authAPI.logout();
```

## 📦 API Modules

### Jobs API

```typescript
import { jobsAPI } from '@/src/api';

// Get all jobs with filters
const jobs = await jobsAPI.getAll({
  category: 'plumbing',
  budget_min: 1000,
  budget_max: 5000,
  location: 'New York',
  experience_level: 'intermediate',
  limit: 20,
  offset: 0,
});

// Get job details
const job = await jobsAPI.getById('job-id');

// Create job
const newJob = await jobsAPI.create({
  title: 'Kitchen Renovation',
  description: 'Full kitchen remodel',
  budget: 15000,
  category: 'renovation',
});

// Apply to job
await jobsAPI.apply('job-id', {
  cover_letter: 'I have 10 years experience...',
  proposed_rate: 12000,
});
```

### Bids API

```typescript
import { bidsAPI } from '@/src/api';

// Submit bid
const bid = await bidsAPI.create({
  job_id: 'job-id',
  amount: 12000,
  description: 'I can complete this in 2 weeks',
});

// Get all bids for a job
const jobBids = await bidsAPI.getByJob('job-id');

// Edit bid
await bidsAPI.update('bid-id', {
  amount: 11000,
  description: 'Updated proposal',
});
```

### Contractors API

```typescript
import { contractorsAPI } from '@/src/api';

// Get contractor directory
const contractors = await contractorsAPI.getAll({
  trade: 'plumbing',
  rating_min: 4.0,
  verified: true,
  licensed: true,
  limit: 20,
});

// Get contractor details
const contractor = await contractorsAPI.getById('contractor-id');

// Get reviews
const reviews = await contractorsAPI.getReviews('contractor-id');

// Get portfolio
const portfolio = await contractorsAPI.getPortfolio('contractor-id');

// Search
const results = await contractorsAPI.search({
  query: 'plumber',
  filters: { verified: true },
});
```

### Projects API

```typescript
import { projectsAPI } from '@/src/api';

// Get all projects
const projects = await projectsAPI.getAll({
  status: 'active',
  limit: 20,
});

// Create project
const project = await projectsAPI.create({
  title: 'Bathroom Remodel',
  description: 'Complete bathroom renovation',
  budget: 8000,
  contractor_id: 'contractor-id',
});

// Update project
await projectsAPI.update('project-id', {
  status: 'in_progress',
});
```

### Milestones API

```typescript
import { milestonesAPI } from '@/src/api';

// Get project milestones
const milestones = await milestonesAPI.getByProject('project-id');

// Submit milestone
await milestonesAPI.submit('milestone-id', {
  images: ['url1', 'url2'],
  description: 'Completed foundation work',
  progress_percentage: 25,
});

// Submit progress update
await milestonesAPI.submitProgressUpdate({
  project_id: 'project-id',
  description: 'Progress update',
  images: ['url1'],
  progress_percentage: 50,
});
```

### Payments API

```typescript
import { paymentsAPI } from '@/src/api';

// Create payment intent (Stripe)
const intent = await paymentsAPI.createIntent({
  amount: 5000,
  project_id: 'project-id',
});

// Deposit funds
await paymentsAPI.deposit('project-id', {
  amount: 5000,
  stripe_payment_intent_id: 'pi_xxx',
});

// Release funds
await paymentsAPI.release('project-id', 'payment-id', {
  amount: 2500,
  milestone_id: 'milestone-id',
});
```

### Disputes API

```typescript
import { disputesAPI } from '@/src/api';

// File dispute
const dispute = await disputesAPI.create({
  project_id: 'project-id',
  title: 'Quality Issue',
  description: 'Work does not meet standards',
  images: ['evidence1.jpg'],
});

// Respond to dispute
await disputesAPI.respond('dispute-id', {
  message: 'I will fix the issue',
  images: ['fix1.jpg'],
});
```

### Reviews API

```typescript
import { reviewsAPI } from '@/src/api';

// Post review
await reviewsAPI.create({
  contractor_id: 'contractor-id',
  rating: 5,
  comment: 'Excellent work!',
});

// Get contractor reviews
const reviews = await reviewsAPI.getByContractor('contractor-id');
```

### Messages API

```typescript
import { messagesAPI } from '@/src/api';

// Get conversations
const conversations = await messagesAPI.getConversations();

// Get messages
const messages = await messagesAPI.getMessages('conversation-id', {
  limit: 50,
  offset: 0,
});

// Send message
await messagesAPI.send({
  conversation_id: 'conversation-id',
  content: 'Hello!',
  images: ['photo.jpg'],
});
```

### Notifications API

```typescript
import { notificationsAPI } from '@/src/api';

// Get notifications
const notifications = await notificationsAPI.getAll({
  read: false,
  limit: 20,
});

// Register device for push
await notificationsAPI.registerDevice({
  device_token: 'fcm-token',
  platform: 'android',
});

// Get unread count
const { count } = await notificationsAPI.getUnreadCount();
```

### Uploads API

```typescript
import { uploadsAPI } from '@/src/api';

// Upload file (React Native)
const result = await uploadsAPI.upload({
  file: {
    uri: 'file:///path/to/image.jpg',
    type: 'image/jpeg',
    name: 'image.jpg',
  },
  type: 'portfolio',
  project_id: 'project-id',
});

// Upload multiple files
await uploadsAPI.uploadMultiple([
  { file: file1, type: 'progress' },
  { file: file2, type: 'progress' },
]);
```

## 🔄 React Query Integration

### Setup

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { jobsAPI } from '@/src/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      keepPreviousData: true,
    },
  },
});
```

### Usage with React Query

```typescript
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { jobsAPI } from '@/src/api';

// Get jobs with pagination
function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobsAPI.getAll(filters),
    keepPreviousData: true,
  });
}

// Infinite scroll
function useJobsInfinite() {
  return useInfiniteQuery({
    queryKey: ['jobs', 'infinite'],
    queryFn: ({ pageParam = 0 }) => 
      jobsAPI.getAll({ limit: 20, offset: pageParam }),
    getNextPageParam: (lastPage, pages) => {
      const total = lastPage.data?.total || 0;
      const loaded = pages.reduce((sum, page) => 
        sum + (page.data?.data?.length || 0), 0
      );
      return loaded < total ? loaded : undefined;
    },
  });
}

// Create job mutation
function useCreateJob() {
  return useMutation({
    mutationFn: jobsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
    },
  });
}
```

## 🛡️ Error Handling

All APIs handle errors consistently:

- **400**: Invalid input - show validation errors
- **401**: Unauthorized - automatically tries token refresh, logs out if fails
- **403**: Forbidden - show "No Access" message
- **404**: Not Found - show "Not Found" message
- **500**: Server error - show generic error message

```typescript
try {
  const result = await jobsAPI.getAll();
} catch (error: any) {
  if (error.response?.status === 400) {
    // Handle validation errors
    const errors = error.response.data?.errors;
  } else if (error.response?.status === 403) {
    // Show access denied
  } else if (error.response?.status === 404) {
    // Show not found
  } else {
    // Generic error
    console.error('API Error:', error.message);
  }
}
```

## 🔑 Token Management

Tokens are automatically managed by the client:

- Access token is attached to every request
- Refresh token is used automatically on 401
- Tokens are cleared on logout
- Tokens are stored securely (SecureStore/Keychain)

To manually manage tokens:

```typescript
import { setAccessToken, setRefreshToken, clearTokens } from '@/src/api';

// Set tokens (usually done automatically after login)
await setAccessToken('access-token');
await setRefreshToken('refresh-token');

// Clear tokens (logout)
await clearTokens();
```

## 📝 TypeScript Types

All APIs are fully typed:

```typescript
import { User, Job, Bid, Project, ApiResponse } from '@/src/api/types';

const user: User = {
  id: 'user-id',
  email: 'user@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role_code: 'CONTRACTOR',
  account_type: 'APP_USER',
};
```

## 🚀 Migration from Old API

The old `services/api.ts` is still available for backward compatibility. To migrate:

1. Replace imports:
   ```typescript
   // Old
   import { jobsAPI } from '@/services/api';
   
   // New
   import { jobsAPI } from '@/src/api';
   ```

2. Update function calls (most are the same, but some may have changed)

3. Use new types:
   ```typescript
   import { User, Job } from '@/src/api/types';
   ```




