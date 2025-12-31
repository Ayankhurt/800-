# 📚 Complete API List for Swagger Documentation

## All 128+ APIs to be added to swagger.json

### Auth APIs (10)
- POST /auth/signup
- POST /auth/login
- GET /auth/me
- PUT /auth/update-profile
- PATCH /auth/profile
- POST /auth/change-password
- POST /auth/forgot-password
- POST /auth/reset-password
- POST /auth/refresh-token
- POST /auth/logout
- GET /auth/sessions
- DELETE /auth/sessions/{id}
- POST /auth/resend-verification

### Admin APIs (39)
- GET /admin/dashboard/stats
- GET /admin/users
- GET /admin/users/{id}
- PATCH /admin/users/{id}
- DELETE /admin/users/{id}
- POST /admin/users/change-role
- POST /admin/users/{id}/suspend
- POST /admin/users/{id}/unsuspend
- GET /admin/users/{id}/sessions
- GET /admin/projects
- GET /admin/jobs
- GET /admin/bids
- GET /admin/financial/stats
- GET /admin/transactions
- GET /admin/disputes
- GET /admin/support/tickets
- GET /admin/verifications
- GET /admin/moderation/reports
- GET /admin/analytics
- GET /admin/settings
- POST /admin/settings
- GET /admin/audit-logs
- GET /admin/referrals/stats
- GET /admin/payouts
- POST /admin/payouts/{id}/process
- GET /admin/reviews
- DELETE /admin/reviews/{id}
- GET /admin/messages
- GET /admin/announcements
- POST /admin/announcements
- DELETE /admin/announcements/{id}
- GET /admin/badges
- POST /admin/badges
- GET /admin/appointments
- GET /admin/login/logs
- GET /admin/login/stats
- GET /admin/ai/contracts
- GET /admin/ai/analysis
- GET /admin/marketing/campaigns

### Projects & Jobs (14)
- GET /projects
- POST /projects
- GET /projects/{id}
- PUT /projects/{id}
- DELETE /projects/{id}
- POST /projects/{project_id}/milestones
- PUT /projects/milestones/{id}/status
- GET /jobs
- POST /jobs
- GET /jobs/{id}
- PUT /jobs/{id}
- DELETE /jobs/{id}

### Bids & Applications (10)
- POST /bids
- GET /bids/my-bids
- GET /bids/job/{job_id}
- PUT /bids/{id}/status
- POST /applications
- GET /applications/job/{job_id}
- GET /applications/my-applications
- PUT /applications/{id}/status

### Contractors (10)
- GET /contractors/search
- GET /contractors/{id}
- GET /contractors/{contractor_id}/portfolio
- GET /contractors/{contractor_id}/certifications
- PUT /contractors/profile
- POST /contractors/portfolio
- DELETE /contractors/portfolio/{id}
- POST /contractors/certifications
- DELETE /contractors/certifications/{id}

### Communication (6)
- GET /communication/conversations
- POST /communication/conversations
- GET /communication/conversations/{conversation_id}/messages
- POST /communication/conversations/{conversation_id}/messages
- PUT /communication/conversations/{conversation_id}/read
- GET /messages/conversations

### All Other APIs (50+)
- Notifications, Reviews, Disputes, Finance, Settings, Analytics, etc.

**Total: 128+ APIs**

## Next Steps:
Run the complete swagger generator script to create full swagger.json
