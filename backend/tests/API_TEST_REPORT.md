# 📊 API TEST REPORT

**Generated:** 12/11/2025, 6:38:25 PM
**Base URL:** http://localhost:5000
**API Base:** http://localhost:5000/api/v1

---

## 📈 SUMMARY

| Metric | Count |
|--------|-------|
| Total Tests | 22 |
| ✅ Passed | 1 |
| ❌ Failed | 6 |
| ⏭️ Skipped | 15 |
| Success Rate | 4.55% |

## 🗄️ TEST DATA CREATED

| Key | Value |
|-----|-------|

---

## 🧪 ALL TESTS

### 1. ❌ Login as Admin

**Status:** FAIL
**HTTP Status:** 401
**Message:** Expected 200 or 2xx, got 401

**Request Data:**
```json
{
  "email": "admin@bidroom.com",
  "password": "Test123!@#"
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "data": null
}
```

---

### 2. ❌ Login as GC

**Status:** FAIL
**HTTP Status:** 401
**Message:** Expected 200 or 2xx, got 401

**Request Data:**
```json
{
  "email": "gc@bidroom.com",
  "password": "Test123!@#"
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "data": null
}
```

---

### 3. ❌ Login as PM

**Status:** FAIL
**HTTP Status:** 401
**Message:** Expected 200 or 2xx, got 401

**Request Data:**
```json
{
  "email": "pm@bidroom.com",
  "password": "Test123!@#"
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "data": null
}
```

---

### 4. ❌ Login as SUB

**Status:** FAIL
**HTTP Status:** 401
**Message:** Expected 200 or 2xx, got 401

**Request Data:**
```json
{
  "email": "sub@bidroom.com",
  "password": "Test123!@#"
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "data": null
}
```

---

### 5. ❌ Signup New User

**Status:** FAIL
**HTTP Status:** 400
**Message:** Expected 200,201 or 2xx, got 400

**Request Data:**
```json
{
  "email": "test1765460310530@bidroom.com",
  "password": "Test123!@#",
  "full_name": "Test User",
  "role_code": "VIEWER"
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "Missing required fields",
  "data": null
}
```

---

### 6. ❌ Forgot Password

**Status:** FAIL
**HTTP Status:** 400
**Message:** Expected 200 or 2xx, got 400

**Request Data:**
```json
{
  "email": "admin@bidroom.com"
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "Email address \"admin@bidroom.com\" is invalid",
  "data": null
}
```

---

### 7. ✅ Health Check

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "status": "ok",
    "timestamp": "2025-12-11T13:38:32.399Z",
    "uptime": 45366.9830646,
    "environment": "development"
  }
}
```

---

### 8. ⏭️ Projects Tests

**Status:** SKIP
**Message:** Admin token not available

---

### 9. ⏭️ Milestones Tests

**Status:** SKIP
**Message:** Admin token or project_id not available

---

### 10. ⏭️ Bids Tests

**Status:** SKIP
**Message:** GC token or project_id not available

---

### 11. ⏭️ Jobs Tests

**Status:** SKIP
**Message:** PM token not available

---

### 12. ⏭️ Payments Tests

**Status:** SKIP
**Message:** Required data not available

---

### 13. ⏭️ Payouts Tests

**Status:** SKIP
**Message:** Required data not available

---

### 14. ⏭️ Contractors Tests

**Status:** SKIP
**Message:** Admin token not available

---

### 15. ⏭️ Conversations Tests

**Status:** SKIP
**Message:** Required data not available

---

### 16. ⏭️ Messages Tests

**Status:** SKIP
**Message:** Required data not available

---

### 17. ⏭️ Notifications Tests

**Status:** SKIP
**Message:** Required data not available

---

### 18. ⏭️ Progress Updates Tests

**Status:** SKIP
**Message:** Required data not available

---

### 19. ⏭️ Reviews Tests

**Status:** SKIP
**Message:** Required data not available

---

### 20. ⏭️ Disputes Tests

**Status:** SKIP
**Message:** Required data not available

---

### 21. ⏭️ Admin Tests

**Status:** SKIP
**Message:** Admin token not available

---

### 22. ⏭️ User Routes Tests

**Status:** SKIP
**Message:** Admin token not available

---

## ❌ FAILED TESTS SUMMARY

1. **Login as Admin** - Expected 200 or 2xx, got 401

2. **Login as GC** - Expected 200 or 2xx, got 401

3. **Login as PM** - Expected 200 or 2xx, got 401

4. **Login as SUB** - Expected 200 or 2xx, got 401

5. **Signup New User** - Expected 200,201 or 2xx, got 400

6. **Forgot Password** - Expected 200 or 2xx, got 400

## ⏭️ SKIPPED TESTS SUMMARY

1. **Projects Tests** - Admin token not available

2. **Milestones Tests** - Admin token or project_id not available

3. **Bids Tests** - GC token or project_id not available

4. **Jobs Tests** - PM token not available

5. **Payments Tests** - Required data not available

6. **Payouts Tests** - Required data not available

7. **Contractors Tests** - Admin token not available

8. **Conversations Tests** - Required data not available

9. **Messages Tests** - Required data not available

10. **Notifications Tests** - Required data not available

11. **Progress Updates Tests** - Required data not available

12. **Reviews Tests** - Required data not available

13. **Disputes Tests** - Required data not available

14. **Admin Tests** - Admin token not available

15. **User Routes Tests** - Admin token not available

