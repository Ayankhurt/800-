# Official Core Features List (Based on Project Documentation)

**Date:** December 19, 2025
**Source:** `FUNCTIONAL_REQUIREMENTS.md` (Section 3) & `DEVELOPER_ROADMAP.md`

After analyzing the 4 master documentation files, here is the **Definitive Core Feature Set**. These are the features explicitly listed as "Core" or "Phase 1" requirements.

---

## 1. 🔐 Authentication (Section 3.1)
*   **Login/Register:** Email & Password.
*   **Social Auth:** Google, Apple.
*   **Role Selection:** Project Manager (Client) vs Contractor.
*   **Session:** JWT Tokens.

## 2. 📢 Jobs & Gigs (Section 3.2)
*   **Post Job:** Title, Trade, Budget, Urgency, Photos.
*   **Discovery:** Contractors browse/search jobs by filters.
*   **Applications:** Contractors apply with Cover Letter & Rate.

## 3. 📒 Contractor Directory (Section 3.3)
*   **Search:** Clients find Contractors by Trade/Location.
*   **Profile Page:** Bio, License Info, Insurance, **Portfolio**, **Reviews**.

## 4. 📝 Bids Management (Section 3.4)
*   **RFP:** Client requests specific bids.
*   **Submissions:** Contractors submit formal proposals (Amount + Timeline).
*   **Award:** Client accepts a bid to start a Project.

## 5. 📅 Appointments & Scheduling (Section 3.5)
*   **Request Estimate:** Client requests a site visit.
*   **Schedule:** Set Date/Time for the visit.
*   **Status:** Confirmed, Completed, Cancelled.
*   **Calendar:** View upcoming appointments.

## 6. 💬 Messaging (Section 3.6)
*   **Chat:** 1-on-1 text messaging.
*   **Context:** Linked to specific Jobs/Applications.
*   **Read Receipts:** Sent/Delivered/Read status.

## 7. 🔔 Notifications (Section 3.7)
*   **Triggers:** New Job, New Bid, Message Received, Appointment Scheduled.
*   **Views:** In-app notification list (Read/Unread).

## 8. ⭐ Reviews & Ratings (Section 3.9)
*   **Rate:** 1-5 Stars.
*   **Categories:** Quality, Communication, Timeline.
*   **Display:** Shown on User Profile.

---

## 🏗️ Construction Management (Section 6 & Phase 1)
*While separated in requirements, these are essential for the "Work" phase.*

## 9. 🚧 Projects
*   **Dashboard:** Track active work.
*   **Milestones:** Agreed payment steps.
*   **Updates:** Daily logs/photos.

## 10. 💰 Financials (Phase 1)
*   **Escrow:** Deposit funds -> Hold -> Release.
*   **Stripe Connect:** Contractor payouts.

---

## ❌ CONFIRMED OPTIONAL (NOT CORE)
*   **AI Contract Generation:** Listed in Section 6 (Advanced), Phase 4 (Roadmap).
*   **Video Consultations:** Phase 0 (Frontend) but Phase 1 Backend (Partially Core? Treat as Optional for MVP).
*   **Referral Program:** Listings exist but marked "Disabled for MVP" in routes.
*   **Gamification:** Badges (except Verification) are optional.

**Action:** Development must focus strictly on items 1-10.
