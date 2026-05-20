# NILLOHIT SYSTEM AUDIT REPORT
**Date:** 2026-05-20

## CRITICAL ISSUES FOUND

### 1. 🔴 TASKS PAGE ERROR: "column tasks.draft does not exist"
**Location:** `/app/dashboard/tasks/page.tsx` line 198
**Issue:** 
```typescript
.eq("draft", false)  // ❌ This column doesn't exist in tasks table
```
**Impact:** Task pool page crashes on load
**Root Cause:** The `draft` column is referenced but doesn't exist in the database schema

---

### 2. 🔴 MY TASKS PAGE ERROR: "Could not find a relationship between 'task_claims' and 'tasks'"
**Location:** `/app/dashboard/my-tasks/page.tsx` lines 89-92
**Issue:**
```typescript
.select(`
  *,
  tasks (*)  // ❌ Incorrect relationship syntax
`)
```
**Impact:** My Tasks page fails to load
**Root Cause:** Supabase relationship syntax issue - should use proper foreign key reference

---

### 3. 🟡 ACCOUNT APPROVAL SYSTEM MISMATCH
**Location:** `/app/api/manager/accounts/action/route.ts` line 33
**Issue:** 
- Route updates `approval_status` field
- Login page checks `approved` field (line 69 in login/page.tsx)
- These are different columns!

**Affected Code:**
- Updates: `approval_status`
- Reads: `approved`

**Impact:** Accounts approved via manager panel won't be marked as approved, blocking user login

---

### 4. 🟡 WALLET AUTO-CREATION NOT IMPLEMENTED
**Location:** `/app/api/signup/route.ts` - wallet creation missing
**Location:** `/app/api/manager/accounts/action/route.ts` - no wallet creation on approval

**Issue:** 
- Wallet is never created for new users
- No wallet created when account is approved
- Wallet deduction logic exists but won't work if wallet doesn't exist

**Impact:** 
- Users cannot receive rewards (no wallet to credit)
- Withdrawal system fails (wallet doesn't exist)

---

## FEATURES VERIFICATION NEEDED

### Task Claiming System
- ✅ Task pool displays available tasks (if draft error fixed)
- ✅ Task claim creates entry in task_claims table
- ⚠️ Need to verify: One task per user, no duplicates

### Task Timer & Submission
- ✅ Expires_at calculation logic exists
- ✅ Submit task creates submission entry
- ⚠️ Need to verify: Task expiry and return to pool logic

### Approval & Reward
- ✅ Manager review route exists
- ⚠️ Need to verify: Wallet credit logic when approved

### Cooldown System
- ✅ Cooldown columns exist in profiles table
- ✅ Cooldown check in tasks page
- ⚠️ Need to verify: Automatic reset after time passes

### Withdrawal System
- ✅ Withdrawal routes exist
- ⚠️ Need to verify: One withdrawal per user, crypto/UPI methods

---

## DATABASE SCHEMA ISSUES TO CHECK

1. Does `tasks` table have a `draft` column?
2. Is the foreign key relationship between `task_claims` and `tasks` properly defined?
3. What columns exist in `profiles` table?
   - `approved` vs `approval_status` confusion
   - Duplicate columns?
4. Does `wallets` table exist with proper structure?
5. Do withdrawals have method field (crypto/UPI)?

---

## RECOMMENDATIONS (BEFORE FIXING)

Please confirm:
1. Should the draft column be removed entirely or is it needed?
2. Should we use `approved` or `approval_status` for the approval field?
3. Should wallet be created at signup or on first approval?
4. What is the complete current database schema?

