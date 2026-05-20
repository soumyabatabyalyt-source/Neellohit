# Approval System Verification Guide

## Quick Verification (3 Ways)

### Method 1: Python Script (Recommended) ⭐
**Easiest way - runs the full test suite**

```bash
# Install dependencies
pip install supabase

# Run verification
python3 verify-approval-system.py
```

**What it does:**
- ✅ Checks if profiles table has required columns
- ✅ Counts pending users
- ✅ Shows users by role
- ✅ Creates a test user
- ✅ Tests approval workflow
- ✅ Tests suspension workflow
- ✅ Cleans up test data

---

### Method 2: Supabase Dashboard (Manual)
**Check directly in your Supabase console**

1. Go to https://app.supabase.com/
2. Login to your project
3. Go to **Table Editor** → **profiles**
4. Check columns:
   - ✅ `id` (UUID)
   - ✅ `email` (text)
   - ✅ `username` (text)
   - ✅ `reddit` (text)
   - ✅ `discord` (text)
   - ✅ `role` (text) - should be 'admin', 'manager', or 'user'
   - ✅ `approved` (boolean) - DEFAULT false
   - ✅ `suspended` (boolean) - DEFAULT false
   - ✅ `created_at` (timestamp)

5. Check for any existing users:
   - Click on any row to see full data
   - Look at `approved` and `suspended` values

---

### Method 3: Manual cURL Commands
**For quick checks without Python**

```bash
# Check table schema (get 1 row)
curl -H "apikey: YOUR_ANON_KEY" \
  "https://jbymiopbxtxkfvublfeh.supabase.co/rest/v1/profiles?select=*&limit=1" | jq

# Count pending users
curl -H "apikey: YOUR_ANON_KEY" \
  "https://jbymiopbxtxkfvublfeh.supabase.co/rest/v1/profiles?approved=eq.false" | jq 'length'

# List all users
curl -H "apikey: YOUR_ANON_KEY" \
  "https://jbymiopbxtxkfvublfeh.supabase.co/rest/v1/profiles" | jq
```

---

## What Should Exist

### Database Schema ✅

```sql
-- profiles table must have these columns:
id              UUID (PRIMARY KEY)
email           VARCHAR
username        VARCHAR (UNIQUE)
reddit          VARCHAR
discord         VARCHAR
role            VARCHAR (DEFAULT 'user')
approved        BOOLEAN (DEFAULT FALSE) ← CRITICAL
suspended       BOOLEAN (DEFAULT FALSE) ← CRITICAL
created_at      TIMESTAMP (DEFAULT NOW())
```

**Missing columns?** You need to add them:

```sql
-- Add to existing profiles table:
ALTER TABLE profiles ADD COLUMN approved BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN suspended BOOLEAN DEFAULT FALSE;
```

---

### Code Files ✅

#### Frontend Changes:
- ✅ `/app/login/page.tsx` - Has approval checks
- ✅ `/app/signup/page.tsx` - Redirects to pending approval
- ✅ `/app/auth/page.tsx` - Has approval logic
- ✅ `/app/pending-approval/page.tsx` - Beautiful pending page
- ✅ `/app/globals.css` - Has pulse animation

#### Backend Changes:
- ✅ `/app/api/signup/route.ts` - Creates users with approved: false
- ✅ `/app/api/admin/delete-user/route.ts` - Rejects users
- ✅ `/components/PendingApprovalsList.tsx` - Manager dashboard

---

## Full Test Flow

### Test 1: Sign Up → Pending → Approve → Login

```
1. Open http://localhost:3000/signup
2. Fill in form:
   - Email: test@example.com
   - Password: TestPassword123
   - Username: testuser
   - Reddit: https://reddit.com/user/test
   - Discord: testuser#0000
3. Should see pending approval page
4. In Supabase console:
   - Find user in profiles table
   - Check approved = false
   - Update: approved = true
5. Try logging in with test@example.com
   - Should redirect to dashboard
```

### Test 2: Suspension Check

```
1. Create a user (see Test 1)
2. Approve them (set approved = true)
3. Try to login - should work
4. Suspend them (set suspended = true)
5. Try to login - should get alert "Account suspended"
```

### Test 3: Manager Approval Dashboard

```
1. Create 2-3 test users
2. Go to your manager admin page
3. Import PendingApprovalsList component
4. Should see list of pending users
5. Click Approve - user is approved
6. Click Reject - user is deleted
```

---

## Common Issues & Fixes

### Issue: Missing "approved" or "suspended" columns

**Fix:**
```sql
-- Run in Supabase SQL Editor
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT FALSE;
```

---

### Issue: Users can login without approval

**Check:** Is `profile.approved` being checked?
```bash
# Search your code for "approved"
grep -r "profile.approved" app/
# Should find in: login/page.tsx, auth/page.tsx
```

**Fix:** Update `/app/login/page.tsx` to include the approval check from our implementation.

---

### Issue: Pending approval page not showing

**Check:** Is the redirect working?
```tsx
// In /app/login/page.tsx should have:
if (!profile.approved) {
  router.push(`/pending-approval?email=${encodeURIComponent(email)}`)
  return
}
```

---

### Issue: Manager dashboard not loading users

**Check:** 
1. Do you have users with `approved: false`?
2. Is PendingApprovalsList component imported?
3. Check browser console for errors

---

## Testing Checklist

After verification, run through these tests:

- [ ] **Signup Flow**
  - [ ] Can create account at /signup
  - [ ] See pending approval page
  - [ ] User appears in profiles table
  - [ ] approved = false initially

- [ ] **Login Flow**
  - [ ] Unapproved user redirected to /pending-approval
  - [ ] Approved user can login
  - [ ] Suspended user gets error

- [ ] **Manager Flow**
  - [ ] Can see pending users in dashboard
  - [ ] Can approve users
  - [ ] Can reject users
  - [ ] Rejected users are deleted

- [ ] **Role-Based Access**
  - [ ] Admin redirects to /admin
  - [ ] Manager redirects to /manager/tasks
  - [ ] User redirects to /dashboard/tasks

- [ ] **Database**
  - [ ] Profiles have approved/suspended columns
  - [ ] Approvals update correctly
  - [ ] Rejections delete users

---

## Success Indicators ✅

You'll know everything works when:

1. ✅ Can sign up and see pending approval page
2. ✅ Unapproved users can't login
3. ✅ Approved users can login
4. ✅ Suspended users are blocked
5. ✅ Manager can approve/reject users
6. ✅ Role-based redirects work
7. ✅ No console errors

---

## Need Help?

**Check these files for reference:**
- `LOGIN_ANALYSIS.md` - System overview
- `APPROVAL_SYSTEM_IMPLEMENTATION.md` - Complete implementation details
- Code comments in `/app/login/page.tsx` and `/app/api/signup/route.ts`

**Run the verification script:**
```bash
python3 verify-approval-system.py
```

It will tell you exactly what's working and what needs fixing!

---

## Quick Setup

If you need to set everything up from scratch:

1. **Create profiles table** (if not exists)
2. **Add approval columns:**
   ```sql
   ALTER TABLE profiles ADD COLUMN approved BOOLEAN DEFAULT FALSE;
   ALTER TABLE profiles ADD COLUMN suspended BOOLEAN DEFAULT FALSE;
   ```
3. **Deploy the code** (all files already updated)
4. **Run verification script**
5. **Test the flow**

Done! ✨
