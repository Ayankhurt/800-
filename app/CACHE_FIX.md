# URGENT FIX - Clear Cache & Reload

**BHAI YE KARO ABHI:**

## Step 1: Browser mein (http://localhost:8082)
Press: **Ctrl + Shift + R** (hard refresh)

OR

Press: **Ctrl + F5** 

## Step 2: If still not working
Metro bundler terminal mein press **'r'** (reload)

## Why?
- Code sahi hai ✅
- Mapping correct hai (trade → trade_type) ✅  
- But browser mein purana cached code chal raha hai ❌

## After Hard Refresh:
1. Login: pm@test.com / Test123!
2. Create job
3. Should work! ✅

---

**Additional Check:** Make sure these 2 SQL fixes are applied in Supabase:
1. RLS policy for users
2. application_count column in jobs table
