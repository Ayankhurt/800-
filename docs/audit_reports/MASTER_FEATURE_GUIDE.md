# Bidroom Platform - Deep Dive Core Feature Specification

**Date:** December 19, 2025  
**Version:** 3.0 (Detailed Core Specification)

This document provides a granular, in-depth breakdown of the **Core MVP Features** for the Bidroom platform. It serves as a blueprint for development, QA testing, and user guide creation.

---

## 📱 1. User Application (Client & Contractor)

The User App is a unified React Native application with role-specific interfaces.

### A. Authentication & Account Security
*Secure access control and identity management.*

1.  **Registration Flow**
    *   **Inputs:** Email, Password (8+ chars, 1 special, 1 number), Full Name.
    *   **Role Selection:** User must choose **Client** (Homeowner) or **Contractor** (Service Provider) at signup.
    *   **Social Auth:** One-tap signup via Google/Apple OAuth2.
    *   **Email Verification:** 6-digit OTP sent to email to activate account immediately after signup.

2.  **Login System**
    *   **Credentials:** Email/Password or Social Login.
    *   **Session Management:** JWT Access Token (short-lived) + Refresh Token (long-lived) mechanism for "Remember Me" functionality.
    *   **Forgot Password:** "Forgot Password" link triggers an email with a secure, one-time reset link.

3.  **Profile Management**
    *   **Avatar:** Image cropper and uploader (JPEG/PNG) for profile photos.
    *   **Personal Details:** Edit Name, Phone Number, Address (with auto-complete).
    *   **Verification (Contractor Only):**
        *   **ID Upload:** User uploads Front/Back of Driver's License.
        *   **License Upload:** User enters Contractor License # and uploads Certificate.
        *   **Insurance:** User uploads General Liability Insurance PDF.
    *   **Security:** Update Password (requires old password), Enable 2FA (Two-Factor Authentication) using Authenticator App.

### B. Client Workflow (Homeowners)
*The workflow for getting work done.*

1.  **Job Management**
    *   **Post a Job:**
        *   **Title:** e.g., "Fix Leaking Roof".
        *   **Description:** Rich text field for detailed problem explanation.
        *   **Trade:** Dropdown selection (Plumbing, Electrical, HVAC, Carpentry, etc.).
        *   **Budget:** Range selection (e.g., $500 - $1,000) or Fixed Price.
        *   **Location:** GPS-based location or manual address entry.
        *   **Media:** Gallery picker to upload up to 10 photos/videos of the issue.
    *   **My Jobs Dashboard:**
        *   **Active:** View jobs currently open for bidding.
        *   **In Progress:** View jobs currently being worked on.
        *   **Completed:** History of past projects.
    *   **Job Actions:** Edit Job (if no bids), Cancel Job, View Applicants.

2.  **Hiring Process**
    *   **Applicant List:** View cards for each contractor who applied.
    *   **Bid Comparison:** Side-by-side view of Proposal Price vs. Estimated Timeline vs. Contractor Rating.
    *   **Contractor Detail View:** Click a bidder to see their full profile, past reviews, and portfolio images.
    *   **Award:** "Hire" button triggers the Project Setup phase.

### C. Contractor Workflow (Service Providers)
*The workflow for finding and managing work.*

1.  **Job Discovery**
    *   **Job Feed:** Infinite scroll list of available jobs.
    *   **Smart Filters:** Filter by Distance (e.g., "Within 20 miles"), Trade Category, Job Budget, and Date Posted.
    *   **Job Details:** View full description, client location (fuzzy radius), and attached photos.

2.  **Bidding System**
    *   **Submit Proposal:**
        *   **Price:** Enter fixed quote amount.
        *   **Duration:** Estimated time to complete (e.g., "3 Days").
        *   **Cover Letter:** Personalized message to the client explaining why they are the best fit.
        *   **Attachments:** Option to attach a formal quote PDF or sketch.
    *   **Bid Management:** "My Bids" tab to track Active Bids, Won Bids, and Lost Bids.

3.  **Professional Profile**
    *   **Portfolio Gallery:** Grid view of past projects. Click to view high-res Before/After photos and descriptions.
    *   **Endorsements:** Skill tags endorsed by other users (e.g., "Punctual", "Clean").
    *   **Stats:** Display "Jobs Completed", "On-Time Rate", and "Trust Score".

### D. Project Execution & Management
*Shared tools used *after* a job is awarded.*

1.  **Project Dashboard**
    *   **Timeline View:** Visual progress bar showing Project Start -> Milestones -> Completion.
    *   **Daily Logs:** Contractor submits daily updates:
        *   **Text:** "Finished framing today."
        *   **Media:** Photo proof of work done.
        *   **Weather:** Auto-tagged weather data.
    *   **Change Orders:** Formal request system to increase budget/scope (requires Client approval).

2.  **Messaging System**
    *   **Contextual Chat:** Chat rooms linked to specific Projects.
    *   **Features:** Read receipts (double checks), Typing indicators ("..."), Online status.
    *   **Rich Media:** Send Photos from Camera, Documents from Files.
    *   **System Messages:** Auto-injected messages for events like "Bid Accepted", "Payment Released".

### E. Financial System (Stripe & Escrow)
*Secure, milestone-based payment processing.*

1.  **Escrow Logic**
    *   **Milestone Setup:** Project is broken into chunks (e.g., 50% Deposit, 50% Completion).
    *   **Funding (Client):** Client pays via Credit Card/ACH. Funds sit in a secure **Escrow Vault**, NOT sent to Contractor yet.
    *   **Work Verification:** Contractor marks milestone as "Complete".
    *   **Release (Client):** Client inspects work and clicks "Release Funds". Money moves from Vault -> Contractor Wallet.

2.  **Wallet & Payouts**
    *   **Contractor Wallet:** Shows "Pending Funds" (in escrow) and "Available Balance" (released).
    *   **Stripe Connect:** Contractor goes through Stripe KYC (Social Security #, Bank Info) to enable payouts.
    *   **Withdrawal:** Manual or Automatic daily payout to linked Bank Account.

---

## 💻 2. Admin Panel Features (Deep Dive)

A robust Next.js Dashboard for platform operators.

### A. Dashboard Overview
*   **KPI Cards:** Total Revenue (Net/Gross), Active Jobs, Active Disputes, User Growth (Week-over-Week).
*   **Activity Feed:** Live log of "User X signed up", "Job Y posted".
*   **Financial Chart:** Line graph showing Daily Transaction Volume.

### B. User Management Module
*   **Data Grid:** Table with columns: Avatar, Name, Email, Role, Status, Trust Score, Amount Spent/Earned, Join Date.
*   **Filtering:** Filter by "Pending Verification", "Banned", "High Value Users".
*   **User Detail Page:**
    *   **Verification:** View uploaded ID documents side-by-side with user info. Buttons: [Approve] / [Reject with Reason].
    *   **Activity Log:** History of every login, job post, and message sent by that user.
    *   **Admin Actions:** "Reset Password", "Impersonate User" (Log in as them), "Suspected Fraud" flag.

### C. Content Moderation Module
*   **Report Queue:** List of content flagged by users ("Inappropriate", "Spam", "Scam").
    *   **Job Review:** See reported job description. Action: [Delete Job] or [Clear Report].
    *   **Message Review:** Read reported chat log context. Action: [Warn User] or [Ban User].
*   **Auto-Flagging:** System highlights keywords (e.g., swear words, off-platform payments) for manual review.

### D. Dispute Resolution Center
*   **Case View:** Dashboard for open disputes.
*   **Evidence Locker:** Central place to see the Contract, Chat Logs, Work Photos, and both parties' statements.
*   **Arbitration Controls:**
    *   **Full Refund:** Return 100% of Escrow to Client.
    *   **Force Release:** Send 100% of Escrow to Contractor.
    *   **Split Settlement:** Slider to allocate funds (e.g., 60% to Contractor, 40% to Client).

---

## ⚙️ 3. Backend API Specification

Architecture: Node.js (Express) + PostgreSQL (Supabase).

### Core Data Models (Postgres Tables)
1.  **`users`**: `id`, `email`, `password_hash`, `role`, `trust_score`, `verified_badges`.
2.  **`jobs`**: `id`, `owner_id`, `title`, `description`, `budget_min`, `budget_max`, `location_lat`, `location_lng`, `status` (open, in_progress, completed, cancelled).
3.  **`bids`**: `id`, `job_id`, `contractor_id`, `amount`, `duration_days`, `proposal_text`, `status` (pending, accepted, rejected).
4.  **`projects`**: `id`, `job_id`, `owner_id`, `contractor_id`, `status`.
5.  **`milestones`**: `id`, `project_id`, `amount`, `status` (pending_funding, funded, completed, released).
6.  **`messages`**: `id`, `project_id`, `sender_id`, `content_text`, `attachment_url`, `read_at`.

### API Endpoint Highlights
All endpoints secured via JWT Bearer Auth.

*   `POST /auth/register` - Validates inputs, creates DB record, sends email.
*   `POST /jobs` - Accepts multipart form data (text + images), creates job record.
*   `GET /jobs` - Accepts query params (`?lat=...&lng=...&radius=20`) for geospatial search.
*   `POST /bids` - Creates bid record, triggers notification to Job Owner.
*   `POST /payments/deposit` - Creates Stripe PaymentIntent, updates Milestone status to `funded`.
*   `POST /payments/release` - Triggers Stripe Transfer to Contractor Connect Account.
*   `GET /admin/stats` - Aggregates counts for dashboard widgets (requires Admin Role).
