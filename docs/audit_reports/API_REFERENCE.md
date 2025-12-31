# 📚 BIDROOM API - QUICK REFERENCE

## Base URL
```
Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

---

## 🔐 Authentication
All endpoints (except webhooks) require JWT token in header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📁 FILE UPLOADS

### Upload Portfolio Image
```http
POST /upload/portfolio
Content-Type: multipart/form-data

file: <image_file>
```

### Upload Progress Photo
```http
POST /upload/progress
Content-Type: multipart/form-data

file: <image_file>
project_id: uuid
milestone_id: uuid (optional)
```

### Upload Document
```http
POST /upload/document
Content-Type: multipart/form-data

file: <pdf_file>
document_type: license|insurance|contract
```

### Upload Avatar
```http
POST /upload/avatar
Content-Type: multipart/form-data

file: <image_file>
```

### Upload Chat Attachment
```http
POST /upload/chat
Content-Type: multipart/form-data

file: <file>
conversation_id: uuid
```

---

## 🤖 AI FEATURES

### Generate Contract
```http
POST /ai/generate-contract
Content-Type: application/json

{
  "bidId": "uuid",
  "projectId": "uuid",
  "ownerNotes": "string (optional)"
}

Response:
{
  "success": true,
  "data": {
    "contractId": "uuid",
    "contract": { ... },
    "generationTimeMs": 1234
  }
}
```

### Get Contract
```http
GET /ai/contracts/:id

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "generated_contract": { ... },
    "owner_edits": { ... },
    "contractor_edits": { ... },
    "final_contract": { ... }
  }
}
```

### Update Contract
```http
PUT /ai/contracts/:id
Content-Type: application/json

{
  "edits": { ... },
  "role": "owner" | "contractor"
}
```

### Finalize Contract
```http
POST /ai/contracts/:id/finalize

Response:
{
  "success": true,
  "data": {
    "contract": { ... },
    "finalContract": { ... }
  }
}
```

### Analyze Progress
```http
POST /ai/milestones/:milestoneId/analyze-progress
Content-Type: application/json

{
  "photoUrls": ["url1", "url2"],
  "notes": "string (optional)",
  "progressUpdateId": "uuid (optional)"
}

Response:
{
  "success": true,
  "data": {
    "analysis": {
      "workQuality": "excellent|good|fair|poor|unacceptable",
      "completionPercentage": 75,
      "issuesDetected": [...],
      "recommendations": [...],
      "safetyCompliance": { ... },
      "qualityMetrics": {
        "workmanship": 8,
        "materialQuality": 9,
        "adherenceToPlans": 7,
        "cleanliness": 8
      }
    }
  }
}
```

### Generate Timeline
```http
POST /ai/projects/:projectId/generate-timeline
Content-Type: application/json

{
  "startDate": "2025-01-15",
  "constraints": { ... } (optional),
  "preferences": { ... } (optional)
}

Response:
{
  "success": true,
  "data": {
    "timeline": {
      "projectDuration": { ... },
      "milestones": [...],
      "phases": [...],
      "criticalPath": [...],
      "inspectionPoints": [...]
    },
    "milestonesCreated": 8
  }
}
```

---

## 💳 PAYMENTS

### Create Stripe Connect Account
```http
POST /payments/stripe/connect
Content-Type: application/json

{
  "businessType": "individual" | "company",
  "businessInfo": {
    "businessName": "string (optional)"
  }
}

Response:
{
  "success": true,
  "data": {
    "accountId": "acct_...",
    "onboardingUrl": "https://connect.stripe.com/..."
  }
}
```

### Get Connect Account Status
```http
GET /payments/stripe/connect/status

Response:
{
  "success": true,
  "data": {
    "accountId": "acct_...",
    "chargesEnabled": true,
    "payoutsEnabled": true,
    "detailsSubmitted": true,
    "status": "active"
  }
}
```

### Deposit to Escrow
```http
POST /payments/projects/:projectId/escrow/deposit
Content-Type: application/json

{
  "amount": 5000,
  "paymentMethodId": "pm_...",
  "milestoneId": "uuid (optional)"
}

Response:
{
  "success": true,
  "data": {
    "escrow": { ... },
    "paymentIntentId": "pi_...",
    "amount": 5000,
    "status": "held"
  }
}
```

### Release Escrow
```http
POST /payments/projects/:projectId/escrow/release
Content-Type: application/json

{
  "escrowId": "uuid",
  "milestoneId": "uuid (optional)"
}

Response:
{
  "success": true,
  "data": {
    "escrow": { ... },
    "transferId": "tr_...",
    "amount": 5000
  }
}
```

### Get Escrow Transactions
```http
GET /payments/projects/:projectId/escrow

Response:
{
  "success": true,
  "data": {
    "transactions": [...]
  }
}
```

---

## 💬 MESSAGING

### Send Message
```http
POST /communication/conversations/:conversation_id/messages
Content-Type: application/json

{
  "content": "Hello!",
  "attachment_url": "url (optional)"
}
```

### Get Conversations
```http
GET /communication/conversations

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "lastMessage": { ... },
      "unreadCount": 3,
      "otherParticipant": { ... }
    }
  ]
}
```

### Get Messages
```http
GET /communication/conversations/:conversation_id/messages

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "Hello!",
      "sender": { ... },
      "is_read": true,
      "created_at": "..."
    }
  ]
}
```

---

## ⭐ REVIEWS

### Create Review
```http
POST /reviews
Content-Type: application/json

{
  "project_id": "uuid",
  "reviewee_id": "uuid",
  "rating": 4.5,
  "comment": "Great work!",
  "category_ratings": {
    "quality": 5,
    "communication": 4,
    "timeline": 4,
    "professionalism": 5,
    "value": 4
  },
  "photo_urls": ["url1", "url2"] (optional)
}
```

### Get User Reviews
```http
GET /reviews/user/:user_id

Response:
{
  "success": true,
  "data": {
    "reviews": [...],
    "total": 15,
    "categoryAverages": {
      "quality": 4.7,
      "communication": 4.5,
      "timeline": 4.3,
      "professionalism": 4.8,
      "value": 4.6
    }
  }
}
```

### Respond to Review
```http
POST /reviews/:reviewId/respond
Content-Type: application/json

{
  "response": "Thank you for the feedback!"
}
```

---

## 👷 CONTRACTOR FEATURES

### Add Portfolio Item
```http
POST /contractors/portfolio
Content-Type: application/json

{
  "title": "Kitchen Remodel",
  "description": "...",
  "category": "remodeling",
  "images": ["url1", "url2"],
  "completion_date": "2024-12-01"
}
```

### Add Certification
```http
POST /contractors/certifications
Content-Type: application/json

{
  "name": "OSHA Safety Certified",
  "issuing_organization": "OSHA",
  "issue_date": "2024-01-15",
  "expiry_date": "2026-01-15",
  "credential_id": "ABC123",
  "document_url": "url"
}
```

### Give Endorsement
```http
POST /contractors/:id/endorse
Content-Type: application/json

{
  "skill": "Plumbing",
  "comment": "Excellent plumber!"
}
```

---

## 🛡️ ADMIN - MODERATION

### Get Moderation Queue
```http
GET /admin/moderation/queue?status=pending

Response:
{
  "success": true,
  "data": {
    "reports": [...],
    "total": 5
  }
}
```

### Approve Report
```http
PUT /admin/moderation/:reportId/approve
Content-Type: application/json

{
  "action": "warn" | "suspend" | "ban" | "remove_content",
  "notes": "Violated community guidelines"
}
```

### Reject Report
```http
PUT /admin/moderation/:reportId/reject
Content-Type: application/json

{
  "notes": "No violation found"
}
```

---

## ✅ ADMIN - VERIFICATION

### Get Verification Queue
```http
GET /admin/verification/queue?status=pending

Response:
{
  "success": true,
  "data": {
    "verifications": [...],
    "total": 3
  }
}
```

### Approve Verification
```http
PUT /admin/verification/:verificationId/approve
Content-Type: application/json

{
  "notes": "All documents verified"
}
```

### Reject Verification
```http
PUT /admin/verification/:verificationId/reject
Content-Type: application/json

{
  "reason": "Invalid license number",
  "notes": "License number doesn't match state records"
}
```

---

## 👥 ADMIN - USER MANAGEMENT

### Create Admin User
```http
POST /admin/moderation/users
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "secure_password",
  "first_name": "John",
  "last_name": "Doe",
  "role": "admin" | "super_admin" | "moderator"
}
```

### Update Admin User
```http
PUT /admin/moderation/users/:userId
Content-Type: application/json

{
  "role": "admin",
  "permissions": {
    "can_moderate": true,
    "can_verify": true,
    "can_manage_users": false
  }
}
```

---

## 🔔 NOTIFICATIONS

Notifications are automatically created for:
- New messages
- Milestone approvals
- Payment releases
- Verification status changes
- User warnings/suspensions
- Contract updates

---

## 📊 RESPONSE FORMAT

All endpoints return responses in this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "error": "Detailed error (development only)"
}
```

---

## 🚨 ERROR CODES

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔄 REAL-TIME SUBSCRIPTIONS

### Subscribe to Messages
```javascript
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, handleNewMessage)
  .subscribe()
```

### Subscribe to Typing Indicators
```javascript
supabase
  .channel('typing')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'typing_indicators',
    filter: `conversation_id=eq.${conversationId}`
  }, handleTyping)
  .subscribe()
```

### Subscribe to Notifications
```javascript
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, handleNotification)
  .subscribe()
```

---

**📖 For detailed setup instructions, see `SETUP_GUIDE.md`**
