# 📚 BidRoom API Documentation

## 🎯 Overview

Complete Swagger/OpenAPI 3.0 documentation for all BidRoom APIs.

---

## 🚀 Quick Start

### Access Swagger UI

Once the server is running, access the interactive API documentation at:

```
http://localhost:5000/api-docs
```

### Features

- ✅ **Interactive API Testing** - Test all endpoints directly from browser
- ✅ **Complete Documentation** - All 128+ endpoints documented
- ✅ **Request/Response Examples** - See sample data for all APIs
- ✅ **Authentication** - Built-in JWT token support
- ✅ **Schema Definitions** - Complete data models

---

## 📊 API Statistics

- **Total Endpoints:** 128+
- **Categories:** 20+
- **Pass Rate:** 87.5%
- **Authentication:** JWT Bearer Token

---

## 🔐 Authentication

Most endpoints require authentication. To use authenticated endpoints:

1. **Sign up** or **Login** to get JWT token
2. Click **"Authorize"** button in Swagger UI
3. Enter: `Bearer YOUR_JWT_TOKEN`
4. Click **"Authorize"**

Now you can test all protected endpoints!

---

## 📋 API Categories

### 1. **Authentication** (10 endpoints)
- User signup, login, logout
- Password management
- Session management
- Email verification

### 2. **Projects** (8 endpoints)
- Create, read, update, delete projects
- Milestone management
- Project status tracking

### 3. **Jobs** (6 endpoints)
- Job posting and management
- Job search and filtering
- Job applications

### 4. **Bids** (6 endpoints)
- Place and manage bids
- Bid status updates
- View job bids

### 5. **Contractors** (7 endpoints)
- Contractor profiles
- Portfolio management
- Certifications
- Search contractors

### 6. **Admin** (39 endpoints)
- User management
- Dashboard statistics
- Content moderation
- System settings
- Analytics

### 7. **Communication** (6 endpoints)
- Conversations
- Messaging
- Read receipts

### 8. **Notifications** (2 endpoints)
- Get notifications
- Mark as read

### 9. **Reviews** (2 endpoints)
- Create reviews
- View user reviews

### 10. **Disputes** (4 endpoints)
- Create disputes
- Manage dispute resolution
- Add responses

### 11. **Finance** (4 endpoints)
- Transactions
- Payouts
- Escrow management

### 12. **AI Features** (3 endpoints)
- AI contract generation
- AI timeline generation
- Progress analysis

### 13. **Settings** (7 endpoints)
- User preferences
- Notification settings
- Privacy settings

### 14. **Analytics** (3 endpoints)
- Profile views
- Performance tracking

### 15. **Verification** (4 endpoints)
- Request verification
- Admin approve/reject

---

## 🎨 Using Swagger UI

### Testing an Endpoint

1. **Select an endpoint** from the list
2. **Click "Try it out"**
3. **Fill in parameters** (if required)
4. **Click "Execute"**
5. **View response** below

### Example: Create a Project

```json
POST /api/v1/projects

Headers:
Authorization: Bearer YOUR_JWT_TOKEN

Body:
{
  "title": "New Construction Project",
  "description": "Building a new house",
  "budget": 500000,
  "location": "Los Angeles, CA",
  "category": "Residential",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31"
}
```

---

## 📖 Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

---

## 🔑 Authentication Flow

### 1. Sign Up
```
POST /api/v1/auth/signup
```

### 2. Login
```
POST /api/v1/auth/login
```
Response includes JWT token

### 3. Use Token
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Refresh Token (if needed)
```
POST /api/v1/auth/refresh-token
```

---

## 📊 API Status

### ✅ Fully Working (100%)
- Projects & Jobs
- Bids & Applications
- Communication
- Disputes
- Analytics
- Appointments
- Quotes
- Reviews
- Saved Contractors
- Stats
- Templates
- Verification

### ⚠️ Mostly Working (85%+)
- Admin APIs (94.9%)
- Contractors (85.7%)
- Settings (71.4%)

### 🔧 In Progress
- Some transaction routes
- User portfolio routes

---

## 🛠️ Development

### Update Swagger Documentation

Edit `swagger.json` file to add/modify endpoints:

```json
{
  "paths": {
    "/your-endpoint": {
      "get": {
        "tags": ["YourTag"],
        "summary": "Your description",
        ...
      }
    }
  }
}
```

### Validate Swagger File

```bash
npm install -g swagger-cli
swagger-cli validate swagger.json
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- Pagination uses `page` and `limit` query parameters
- Default limit is 20 items per page
- All IDs are UUIDs
- File uploads limited to 10MB

---

## 🆘 Support

For API issues or questions:
- Check Swagger UI for detailed endpoint documentation
- Review response error messages
- Check server logs for detailed errors

---

## 🎉 Success!

Your API documentation is now live at:
**http://localhost:5000/api-docs**

Happy coding! 🚀
