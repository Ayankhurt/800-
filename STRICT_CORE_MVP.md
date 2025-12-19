# Bidroom - STRICT CORE MVP REQUIREMENTS

**Date:** December 19, 2025
**Priority:** ABSOLUTE CORE ONLY. NO OPTIONAL FEATURES.

This document represents the bare minimum required to launch the platform. Any feature not listed here is **out of scope** for the MVP.

---

## 1. 🚶 User Accounts (Auth)
**Goal:** Users must be able to sign up, log in, and differentiate between Client and Contractor.

*   **Register:** Email, Password, Name, Role Selection (Client OR Contractor).
*   **Login:** Email & Password.
*   **Profile:**
    *   **Edit:** Name, Phone, Profile Picture.
    *   **View:** See own profile.
    *   **(Contractor Only):** Upload License Number & Indentity Document.

---

## 2. 🔨 Job Marketplace (Discovery)
**Goal:** Clients post work, Contractors find work.

*   **Post Job (Client):** Input Title, Description, Budget, Location, and Photos.
*   **View Jobs (Contractor):** List view of open jobs sorted by date.
*   **Job Details:** View full description and photos of a specific job.

---

## 3. 🤝 Bidding & Hiring (Transaction Start)
**Goal:** Connect a Client with a Contractor for a price.

*   **Place Bid (Contractor):** Submit Price ($) and Proposal Text.
*   **View Bids (Client):** See list of all bids on their job.
*   **Hire (Client):** Click "Accept" on a single bid. This creates a **Project**.

---

## 4. 🚧 Project Execution (Management)
**Goal:** Track the work being done.

*   **Project Dashboard:** Shared view for Client and Contractor.
*   **Status:** Track simple states: `Pending` -> `In Progress` -> `Completed`.
*   **Updates:** Contractor can post a text update (e.g., "Started work").

---

## 5. 💰 Payments (Escrow)
**Goal:** Securely move money.

*   **Deposit (Client):** Pay the agreed Bid Amount into Escrow (via Stripe).
*   **Release (Client):** Click "Release Funds" when job is done.
*   **Payout (Contractor):** Money moves to Contractor's connected account.

---

## 6. 💬 Messaging (Communication)
**Goal:** Basic coordination.

*   **Chat:** Simple text messaging between the two parties of a Project.

---

## 7. 👮 Admin (Safety)
**Goal:** Basic oversight.

*   **User List:** See who is on the platform.
*   **Ban User:** Remove bad actors.
*   **Disputes:** If a Client/Contractor fight, Admin can hit a button to **Refund Client** or **Pay Contractor**.

---

## ❌ EXCLUDED (OPTIONAL - DO NOT BUILD YET)
*   No AI Contract Generation.
*   No AI Photo Analysis.
*   No Video Calling.
*   No Advanced Analytics/Graphs.
*   No Referral System.
*   No Marketing Badges.
*   No Complex Milestones (Single payment per job for now).
*   No Change Orders.

**FOCUS ONLY ON THE 7 CORE ITEMS ABOVE.**
