# Test Admin User Creation via API

# Method 1: Using curl (Windows PowerShell)
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/signup" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"admin@bidroom.com","password":"Admin@123","first_name":"Admin","last_name":"User","role":"admin"}'

# Method 2: Using curl (if available)
# curl -X POST http://localhost:5000/api/v1/auth/signup \
#   -H "Content-Type: application/json" \
#   -d "{\"email\":\"admin@bidroom.com\",\"password\":\"Admin@123\",\"first_name\":\"Admin\",\"last_name\":\"User\",\"role\":\"admin\"}"
