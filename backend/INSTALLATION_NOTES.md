# 📦 Backend Installation Notes

## New Dependencies

After verification, the following dependency was added:

```bash
npm install multer@^1.4.5-lts.1
```

## Supabase Storage Setup

The upload endpoint requires Supabase Storage buckets. Create these buckets in your Supabase dashboard:

1. `profiles` - For profile pictures
2. `portfolios` - For contractor portfolios
3. `progress` - For progress updates and milestones
4. `chat` - For chat attachments
5. `disputes` - For dispute evidence
6. `uploads` - Default/fallback bucket

### Bucket Configuration

- Set buckets to **public** if you want public URLs
- Or use **private** buckets with signed URLs (more secure)
- Configure CORS if needed for direct browser uploads

## Device Tokens Table (Optional)

The `register-device` endpoint will work with or without a `device_tokens` table:

- **If table exists:** Stores device tokens in dedicated table
- **If table doesn't exist:** Falls back to storing in `profiles.metadata` JSON field

To create the table (optional but recommended):

```sql
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
```

## Running Tests

```bash
# Install test dependencies (if using Jest/Mocha)
npm install --save-dev jest mocha chai supertest

# Run E2E tests
npm test

# Run smoke tests
bash tests/curl-scripts.sh
```

## Verification Complete

All endpoints are verified and ready. The backend is 100% compatible with the mobile app API.




