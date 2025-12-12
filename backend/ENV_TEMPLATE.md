# Backend Environment Variables Template

Copy these variables to your `.env` file in the `backend` directory.

```env
# ============================================
# BidRoom Backend - Environment Variables
# ============================================

# ============================================
# Server Configuration
# ============================================
NODE_ENV=development
PORT=5000

# ============================================
# Supabase Configuration
# ============================================
# Get these from your Supabase project settings
# Dashboard: https://app.supabase.com/project/YOUR_PROJECT/settings/api
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ============================================
# JWT Configuration
# ============================================
# Generate a secure random string (at least 32 characters)
# You can generate one using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# ============================================
# CORS Configuration
# ============================================
# Comma-separated list of allowed origins
# Example: http://localhost:3000,http://localhost:3001,https://yourdomain.com
# Leave empty in development to allow all localhost origins
CORS_ORIGIN=

# ============================================
# Frontend URL
# ============================================
# Used for email verification and password reset links
FRONTEND_URL=http://localhost:3000

# ============================================
# Logging Configuration
# ============================================
# Options: error, warn, info, debug, verbose
LOG_LEVEL=info

# ============================================
# Rate Limiting (Optional)
# ============================================
# Rate limit window in milliseconds (default: 15 minutes = 900000)
RATE_LIMIT_WINDOW_MS=900000
# Max requests per window (default: 100 in production, 1000 in development)
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# Email Configuration (Optional)
# ============================================
# If using custom email service (currently using Supabase Auth emails)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM=noreply@bidroom.com
# SMTP_SECURE=false

# ============================================
# Vercel Configuration (Optional)
# ============================================
# Only needed if deploying to Vercel
# VERCEL=1
# VERCEL_ENV=production

# ============================================
# Required Variables (Must be set)
# ============================================
# 1. NODE_ENV - development or production
# 2. PORT - Server port (default: 5000)
# 3. SUPABASE_URL - Your Supabase project URL
# 4. SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key
# 5. JWT_SECRET - At least 32 characters long

# ============================================
# Optional Variables
# ============================================
# - CORS_ORIGIN - Comma-separated allowed origins
# - FRONTEND_URL - Frontend URL for email links
# - LOG_LEVEL - Logging level
# - RATE_LIMIT_WINDOW_MS - Rate limit window
# - RATE_LIMIT_MAX_REQUESTS - Max requests per window
# - SMTP_* - Email configuration (if using custom SMTP)

# ============================================
# Notes
# ============================================
# 1. Never commit .env file to git
# 2. Keep JWT_SECRET secure and never share it
# 3. SUPABASE_SERVICE_ROLE_KEY has admin access - keep it secret
# 4. In production, set NODE_ENV=production
# 5. Update CORS_ORIGIN with your production frontend URL
# 6. Generate JWT_SECRET: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

```

## Quick Setup

1. Create `.env` file in `backend` directory:
   ```bash
   cd backend
   touch .env
   ```

2. Copy the template above and fill in your values

3. Get Supabase credentials:
   - Go to https://app.supabase.com
   - Select your project
   - Go to Settings → API
   - Copy `Project URL` → `SUPABASE_URL`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

4. Generate JWT_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. Save and restart your server

