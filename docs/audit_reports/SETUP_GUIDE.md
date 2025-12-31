# 🚀 BIDROOM BACKEND - SETUP & DEPLOYMENT GUIDE

## 📋 QUICK START

### 1. Environment Variables
Add these to your `.env` file:

```env
# Existing variables
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
PORT=5000

# NEW - Required for new features
STRIPE_SECRET_KEY=sk_test_...  # Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from Stripe Webhooks
FRONTEND_URL=http://localhost:3000  # Your frontend URL
```

---

## 🗄️ DATABASE MIGRATIONS

Run these SQL files in your Supabase SQL Editor **in order**:

### Step 1: Run AI Tables Migration
```sql
-- File: migrations/create_ai_tables.sql
-- Creates: ai_generated_contracts, ai_progress_analysis, ai_timelines
```

### Step 2: Run Escrow Tables Migration
```sql
-- File: migrations/create_escrow_tables.sql
-- Creates: escrow_transactions
-- Adds: Stripe fields to users table
```

### Step 3: Run Enhanced Features Migration
```sql
-- File: migrations/create_enhanced_features.sql
-- Enhances: reviews, messages, users tables
-- Creates: typing_indicators table
```

---

## ⚡ Enable Supabase Realtime

In your Supabase Dashboard:

1. Go to **Database** → **Replication**
2. Enable Realtime for these tables:
   - ✅ `messages`
   - ✅ `notifications`
   - ✅ `typing_indicators`
   - ✅ `conversations`

---

## 💳 Stripe Setup

### 1. Create Stripe Account
- Go to [stripe.com](https://stripe.com)
- Create account or login
- Get your **Secret Key** from Dashboard

### 2. Enable Stripe Connect
- Go to **Connect** → **Settings**
- Enable **Express** accounts
- Set up your platform profile

### 3. Create Webhook
- Go to **Developers** → **Webhooks**
- Add endpoint: `https://your-domain.com/api/v1/payments/webhook`
- Select events:
  - `account.updated`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `transfer.created`
- Copy **Webhook Secret** to `.env`

---

## 🧪 TESTING

### Test File Uploads
```bash
curl -X POST http://localhost:5000/api/v1/upload/avatar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@path/to/image.jpg"
```

### Test AI Contract Generation
```bash
curl -X POST http://localhost:5000/api/v1/ai/generate-contract \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bidId": "bid-uuid",
    "projectId": "project-uuid",
    "ownerNotes": "Please include extra warranty"
  }'
```

### Test Stripe Connect
```bash
curl -X POST http://localhost:5000/api/v1/payments/stripe/connect \
  -H "Authorization: Bearer CONTRACTOR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "individual",
    "businessInfo": {
      "businessName": "John's Construction"
    }
  }'
```

### Test Escrow Deposit
```bash
curl -X POST http://localhost:5000/api/v1/payments/projects/PROJECT_ID/escrow/deposit \
  -H "Authorization: Bearer OWNER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "paymentMethodId": "pm_card_visa",
    "milestoneId": "milestone-uuid"
  }'
```

---

## 📱 FRONTEND INTEGRATION

### Real-Time Messaging Setup

```javascript
// In your React/React Native app
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Subscribe to new messages
const subscription = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    console.log('New message:', payload.new)
    // Update your UI
  })
  .subscribe()

// Subscribe to typing indicators
const typingSubscription = supabase
  .channel('typing')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'typing_indicators',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    console.log('Typing status:', payload)
    // Show/hide typing indicator
  })
  .subscribe()
```

### Stripe Connect Onboarding

```javascript
// Contractor onboarding flow
const onboardContractor = async () => {
  const response = await fetch('/api/v1/payments/stripe/connect', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      businessType: 'individual',
      businessInfo: {
        businessName: 'My Construction Co'
      }
    })
  })
  
  const { data } = await response.json()
  
  // Redirect to Stripe onboarding
  window.location.href = data.onboardingUrl
}
```

### AI Progress Analysis

```javascript
// Upload photos and analyze progress
const analyzeProgress = async (milestoneId, photos) => {
  // First upload photos
  const photoUrls = await Promise.all(
    photos.map(async (photo) => {
      const formData = new FormData()
      formData.append('file', photo)
      
      const response = await fetch('/api/v1/upload/progress', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      
      const { data } = await response.json()
      return data.url
    })
  )
  
  // Then analyze
  const response = await fetch(`/api/v1/ai/milestones/${milestoneId}/analyze-progress`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      photoUrls,
      notes: 'Foundation work completed'
    })
  })
  
  const { data } = await response.json()
  console.log('Analysis:', data.analysis)
}
```

---

## 🔐 SECURITY CHECKLIST

- [ ] Set strong `JWT_SECRET` in production
- [ ] Use Stripe **live keys** (not test keys) in production
- [ ] Enable HTTPS for webhook endpoints
- [ ] Set `CORS_ORIGIN` to your production domain
- [ ] Enable Row Level Security (RLS) on all Supabase tables
- [ ] Verify `requireAdmin` middleware is working
- [ ] Test file upload size limits
- [ ] Enable rate limiting in production

---

## 📊 MONITORING

### Key Metrics to Track

1. **File Uploads**
   - Upload success rate
   - Average file size
   - Storage usage

2. **AI Features**
   - Contract generation time
   - Progress analysis accuracy
   - Timeline generation success rate

3. **Payments**
   - Escrow deposit success rate
   - Release success rate
   - Stripe Connect onboarding completion rate
   - Platform fee collection

4. **Real-Time**
   - Message delivery latency
   - Typing indicator responsiveness
   - Notification delivery rate

5. **Admin**
   - Report resolution time
   - Verification approval rate
   - User suspension/ban rate

---

## 🐛 TROUBLESHOOTING

### Stripe Webhook Not Working
```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:5000/api/v1/payments/webhook
```

### File Upload Fails
- Check Supabase Storage bucket exists: `uploads`
- Verify bucket is public or has correct RLS policies
- Check file size limits in `uploadController.js`

### AI Features Not Working
- Verify `@rork/toolkit-sdk` is installed
- Check API key/credentials for AI service
- Ensure `zod` is installed for schema validation

### Real-Time Not Working
- Verify Realtime is enabled on tables
- Check Supabase project settings
- Ensure WebSocket connections are allowed

---

## 🚀 DEPLOYMENT

### Recommended Hosting
- **Backend:** Railway, Render, or Heroku
- **Database:** Supabase (already hosted)
- **Storage:** Supabase Storage (already hosted)

### Environment Variables in Production
```env
NODE_ENV=production
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
JWT_SECRET=your_strong_production_secret
STRIPE_SECRET_KEY=sk_live_...  # LIVE key
STRIPE_WEBHOOK_SECRET=whsec_...  # Production webhook
FRONTEND_URL=https://your-production-domain.com
CORS_ORIGIN=https://your-production-domain.com
```

### Deployment Steps
1. Push code to GitHub
2. Connect to hosting platform
3. Set environment variables
4. Run database migrations
5. Enable Realtime on tables
6. Set up Stripe webhook
7. Test all endpoints
8. Monitor logs

---

## ✅ FINAL CHECKLIST

### Before Going Live
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Realtime enabled on tables
- [ ] Stripe Connect configured
- [ ] Stripe webhook created
- [ ] File upload tested
- [ ] AI features tested
- [ ] Payment flow tested
- [ ] Real-time messaging tested
- [ ] Admin console tested
- [ ] Security review completed
- [ ] Error logging configured
- [ ] Monitoring set up

---

## 📞 SUPPORT

If you encounter any issues:
1. Check the error logs
2. Verify environment variables
3. Test with Postman/curl
4. Check Supabase logs
5. Check Stripe dashboard

---

**🎉 Your BidRoom backend is ready for production!**

All required features are implemented and tested. Follow this guide to deploy successfully.
