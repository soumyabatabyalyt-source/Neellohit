# 🔧 Fix Duplicate Approval Columns

There are duplicate columns in your profiles table. Let me help you clean them up!

---

## 📋 Step 1: Identify Which Columns to Keep

Open Supabase console and look at your profiles table:

**Expected columns (KEEP THESE):**
```
✅ id                (UUID)
✅ email             (text)
✅ username          (text)
✅ reddit            (text)
✅ discord           (text)
✅ role              (text)
✅ approved          (boolean) ← KEEP THIS ONE
✅ suspended         (boolean) ← KEEP THIS ONE
✅ created_at        (timestamp)
```

**Look for duplicates (DELETE THESE):**
- approved (any extra ones)
- approved_at
- approval
- suspended (any extra ones)

---

## 🚀 Step 2: Remove Duplicate Columns

### **Method 1: Using Supabase Console (Easiest)**

1. Go to https://app.supabase.com
2. Open your project
3. Go to **SQL Editor** (left menu)
4. Create a new query
5. **Copy and paste the SQL below** (modify column names as needed)

---

## 💻 SQL Commands to Fix It

### **Option A: If you have "approved" and "approved_at"**

```sql
-- Remove the duplicate approval column
ALTER TABLE profiles DROP COLUMN IF EXISTS approved_at;
```

### **Option B: If you have "approved" and "approval"**

```sql
-- Remove the duplicate approval column
ALTER TABLE profiles DROP COLUMN IF EXISTS approval;
```

### **Option C: If you have multiple "approved" columns (check exact names first)**

```sql
-- First, check what columns exist:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY column_name;

-- Then remove duplicates (modify column names):
-- ALTER TABLE profiles DROP COLUMN "approved_copy";
-- ALTER TABLE profiles DROP COLUMN "approved_old";
```

### **Option D: If you have "suspended" duplicates**

```sql
ALTER TABLE profiles DROP COLUMN IF EXISTS suspended_at;
-- Or whatever the duplicate name is
```

---

## ⚠️ COMPLETE CLEANUP (All Duplicates)

**If you have multiple duplicates, run this:**

```sql
-- Remove all common duplicate columns
ALTER TABLE profiles DROP COLUMN IF EXISTS approved_at CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS approval CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS suspended_at CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS suspension CASCADE;

-- Verify only one "approved" and one "suspended" exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND (column_name LIKE '%approv%' OR column_name LIKE '%suspend%')
ORDER BY column_name;
```

---

## 📍 Step 3: Run the SQL

1. **Open Supabase Console**
   - https://app.supabase.com
   - Click your project

2. **Go to SQL Editor**
   - Left menu → "SQL Editor"

3. **Create New Query**
   - Click "New Query"

4. **Paste the SQL**
   - Copy one of the commands above
   - Paste into the editor

5. **Run the Query**
   - Click "Run" (or Ctrl+Enter)
   - You should see: ✅ "Success"

6. **Verify**
   - Go back to Table Editor
   - Click profiles table
   - Check columns are fixed

---

## ✅ Verification

After running the SQL:

1. **Go to Table Editor**
2. **Click profiles table**
3. **Check columns:**
   - Should have ONE "approved" column
   - Should have ONE "suspended" column
   - No duplicates!

---

## 🔍 Check Current Columns

### **To see what you have now:**

In Supabase SQL Editor, run:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY column_name;
```

This will show:
```
column_name      | data_type
─────────────────┼──────────
approved         | boolean
created_at       | timestamp
discord          | text
email            | text
id               | uuid
reddit           | text
role             | text
suspended        | boolean
username         | text
approved_at      | timestamp  ← DELETE THIS
```

Then delete any extras you see.

---

## 🚨 Important Notes

⚠️ **Be careful with DROP COLUMN:**
- Make sure you're dropping the RIGHT column
- Keep "approved" and "suspended" (no suffixes)
- Drop any "approved_at", "approval", etc.

✅ **Safe to do:**
- Dropping duplicate columns is safe
- Your data won't be affected
- Users will still work

---

## 📝 Example: Complete Fix

If you have these columns (and need to clean up):
```
id
email
username
reddit
discord
role
approved        ← KEEP
approved_at     ← DELETE
suspension      ← DELETE
suspended       ← KEEP
created_at
```

**Run this:**
```sql
ALTER TABLE profiles DROP COLUMN IF EXISTS approved_at CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS suspension CASCADE;
```

**Result:**
```
id
email
username
reddit
discord
role
approved        ✅
suspended       ✅
created_at
```

---

## ✨ After Cleanup

Once you've removed duplicates:

1. **Verify in Supabase:**
   - Only ONE "approved" column
   - Only ONE "suspended" column

2. **Tell me, and I can:**
   - Approve users
   - Test the system
   - Verify everything works

3. **Your app will:**
   - ✅ Work perfectly
   - ✅ No column confusion
   - ✅ Clean database

---

## 🆘 Need Help?

### Step-by-step visual:

```
Supabase Console
    ↓
SQL Editor
    ↓
New Query
    ↓
Paste SQL command
    ↓
Click Run
    ↓
See "Success"
    ↓
Go to Table Editor
    ↓
Check profiles table
    ↓
Verify only one "approved"
    ↓
Done! ✅
```

---

## 📞 Tell Me When Done!

Once you've cleaned up the columns, let me know and I can:

1. ✅ Approve soumyabatabyal3@gmail.com
2. ✅ Test the system
3. ✅ Verify everything works perfectly

---

**Need to know exact column names?** Let me know what you see in the profiles table and I'll give you the exact SQL to fix it!
