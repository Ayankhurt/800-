# Bidroom - Core MVP Missing Items & Verification List

**Date:** December 19, 2025
**Purpose:** Action list to finalize the Core Backend & Schema.

---

## 🛑 1. Missing Database Schema

The following tables were not explicitly seen in the main `schema_complete.sql` dump or need verification to ensure they match the API requirements.

### A. Notifications Table
**Critical for:** In-app alerts for bids, messages, and payments.
```sql
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'bid_received', 'payment_released', 'message'
    title VARCHAR(255) NOT NULL,
    content TEXT,
    reference_id UUID, -- Links to job_id, project_id, etc.
    reference_type VARCHAR(50), -- 'job', 'project', 'bid'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = false;
```

---

## 🔌 2. API Route Gaps (Core)

These routes exist as files but often contain placeholder logic. Verify their controllers.

### A. AI Integration (`aiRoutes.js`)
*Current Status:* Defined but logic needs to be confirmed.
*   **`POST /api/v1/ai/generate-contract`**: Must utilize `@rork/toolkit-sdk` or OpenAI API to generate text based on Project Details.
*   **`POST /api/v1/ai/analyze-progress`**: Must accept an image URL and return an analysis string.

### B. Payment Webhooks (`paymentRoutes.js`)
*Current Status:* Manual endpoints exist.
*   **`POST /api/v1/payments/webhook`**: A public-facing endpoint for Stripe to call when a payment succeeds/fails. This is critical for updating `transactions` status automatically.

---

## 🛠️ 3. Admin Panel - Missing Integrations

The Admin Panel has UI for these, but backend support might be thin.

*   **System Settings**: The `system_settings` table exists, but ensure the endpoint `GET /api/v1/admin/settings` actually returns the Platform Fee percentage (e.g., 5% or 10%).
*   **referralRoutes.js**: Flagged as "Disabled for MVP" in `adminRoutes.js` but useful to keep in mind if you want growth loops.

---

## ✅ 4. Final Verification Checklist

Run these SQL queries or Checks to confirm readiness:

1.  **Check Notifications:**
    ```sql
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications');
    ```
2.  **Check RLS (Security):**
    Ensure `ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;` has been run so users can't see each other's money.
3.  **Check Storage Buckets:**
    Ensure Supabase Storage buckets named `avatars`, `job-photos`, and `chat-attachments` are created and have public read policies.

---

**Next Steps:**
1.  Run the **Notifications Table** SQL.
2.  Implement the **Stripe Webhook** handler.
3.  Test **AI Generation** with a real request.
