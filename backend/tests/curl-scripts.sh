#!/bin/bash

# BidRoom API Smoke Tests - cURL Scripts
# Usage: ./curl-scripts.sh

BASE_URL="${API_URL:-http://localhost:5000/api/v1}"
TOKEN=""

echo "🧪 BidRoom API Smoke Tests"
echo "=========================="
echo ""

# Test 1: Register
echo "1. Testing POST /auth/signup"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "Test123!@#",
    "full_name": "Test User",
    "role_code": "VIEWER"
  }')
echo "$RESPONSE" | jq '.'
TOKEN=$(echo "$RESPONSE" | jq -r '.data.access_token // .data.token // empty')
echo ""

# Test 2: Login
echo "2. Testing POST /auth/login"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password"
  }')
echo "$RESPONSE" | jq '.'
TOKEN=$(echo "$RESPONSE" | jq -r '.data.access_token // .data.token // empty')
echo ""

if [ -z "$TOKEN" ]; then
  echo "⚠️  No token obtained. Skipping authenticated tests."
  exit 0
fi

# Test 3: Get Profile
echo "3. Testing GET /auth/me"
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 4: Get Jobs
echo "4. Testing GET /jobs"
curl -s -X GET "$BASE_URL/jobs?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
echo ""

# Test 5: Get Contractors
echo "5. Testing GET /contractors"
curl -s -X GET "$BASE_URL/contractors?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
echo ""

# Test 6: Get Notifications
echo "6. Testing GET /notifications"
curl -s -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
echo ""

# Test 7: Register Device
echo "7. Testing POST /notifications/register-device"
curl -s -X POST "$BASE_URL/notifications/register-device" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_token": "test-fcm-token",
    "platform": "android"
  }' | jq '.'
echo ""

# Test 8: Get Conversations
echo "8. Testing GET /conversations"
curl -s -X GET "$BASE_URL/conversations" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
echo ""

echo "✅ Smoke tests complete!"




