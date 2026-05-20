# 👤 How to Approve Users - Step by Step Guide

**For Managers:** Approving pending user accounts

---

## 🔄 Two Ways to Approve Users

### **Method 1: Supabase Console (Easiest)** ⭐

#### Step 1: Open Supabase
1. Go to: https://app.supabase.com
2. Login with your account
3. Click your project name

#### Step 2: Navigate to profiles table
1. Left menu → **"Table Editor"**
2. Select **"profiles"** table
3. You'll see all users

#### Step 3: Find the user to approve
**Option A - Scroll:**
- Look through the rows for the email

**Option B - Search:**
- Use browser Ctrl+F (Windows) or Cmd+F (Mac)
- Search for part of their email
- Find the row

#### Step 4: Approve the user
1. Find the row with their email
2. Look at the **"approved"** column
3. It should show `FALSE` (red X)
4. Click on it to edit
5. Change to `TRUE` (green checkmark)
6. It saves automatically ✅

**Done! They're approved.**

---

### **Method 2: Using Manager Dashboard Component**

If you've set up the manager dashboard in your admin panel:

1. Go to: `/admin/approvals` (or wherever you added the component)
2. See list of pending users
3. Click **"Approve"** button
4. User is instantly approved ✅

**Advantage:** Faster, no need to go to Supabase console

---

## 📝 What to Look For

### User Information Visible

```
id        | email                    | username    | approved | suspended
━━━━━━━━━|━━━━━━━━━━━━━━━━━━━━━━━━|━━━━━━━━━━━|━━━━━━━━━|━━━━━━━━━
abc123    | soumyabatabyal3@...     | soumya      | FALSE    | FALSE
def456    | john@example.com        | john_doe    | TRUE     | FALSE
ghi789    | jane@example.com        | jane_smith  | FALSE    | FALSE
```

---

## ✅ Approval Checklist

Before approving, check:

- [ ] Email looks correct
- [ ] Username looks reasonable
- [ ] suspended = FALSE (they're not blocked)
- [ ] approved = FALSE (they're not already approved)

---

## 🚀 After Approval

### What happens:
1. approved changes from FALSE to TRUE
2. User can now login
3. They'll be redirected to their dashboard

### Tell them:
> "Your account is approved! You can now login."

### They can now:
- Visit: http://localhost:3000/login
- Enter their email and password
- Access their dashboard ✅

---

## ⏸️ Rejecting Users (Deleting Accounts)

### Option 1: Via Manager Dashboard
1. Click **"Reject"** button
2. User is deleted from system
3. They have to sign up again

### Option 2: Via Supabase
1. Find user in profiles table
2. Click **delete** button (trash icon)
3. User deleted ✅

---

## 🔒 Suspending Users (Banning)

If a user should be banned:

1. Find them in profiles table
2. Set **"suspended"** = TRUE
3. They can login but will get error: "Account suspended"
4. This is reversible (unlike deletion)

---

## 📊 User Status Reference

| Approved | Suspended | Can Login? |
|----------|-----------|-----------|
| FALSE | FALSE | ❌ NO (waiting) |
| TRUE | FALSE | ✅ YES |
| TRUE | TRUE | ❌ NO (banned) |
| FALSE | TRUE | ❌ NO (waiting + banned) |

---

## 🎯 Quick Reference

### Approve a user:
1. Supabase → profiles table
2. Find row with their email
3. Set approved = TRUE
4. Done! ✅

### Reject a user:
1. Supabase → profiles table
2. Find row with their email
3. Click delete
4. Done! ✅

### Suspend a user:
1. Supabase → profiles table
2. Find row with their email
3. Set suspended = TRUE
4. Done! ✅

---

## 🆘 Troubleshooting

### User not found?
- They might not have signed up yet
- Ask them to sign up at `/signup`
- Check exact email spelling

### Approved but can't login?
1. Check suspended = FALSE
2. Check database saved the change
3. Try refreshing page
4. Clear browser cache
5. Try again

### See wrong user?
- Double-check email address
- Use Ctrl+F to search
- Make sure you're in right table

---

## 📋 Bulk Approval (Multiple Users)

If you need to approve many users:

**Via Supabase SQL:**
```sql
UPDATE profiles 
SET approved = true 
WHERE email LIKE '%@example.com%' 
AND approved = false;
```

This approves all users from example.com domain.

---

## 📞 Example: Approving soumyabatabyal3@gmail.com

### Step by step:

1. **Open Supabase**
   - https://app.supabase.com
   - Login

2. **Go to profiles table**
   - Table Editor
   - Click profiles

3. **Find the user**
   - Search for "soumyabatabyal3"
   - Or find row with that email

4. **Approve them**
   - Click approved column
   - Change FALSE → TRUE

5. **Confirm**
   - It saves automatically
   - They can now login ✅

---

## ✨ Summary

**To approve a user:**
```
Supabase Console
  ↓
profiles table
  ↓
Find user by email
  ↓
Set approved = TRUE
  ↓
User approved! ✅
```

**Time taken:** ~30 seconds per user

---

## 🎓 For Developers

If you want to automate this:

```javascript
// Approve user by email
const { error } = await supabase
  .from('profiles')
  .update({ approved: true })
  .eq('email', 'soumyabatabyal3@gmail.com');

if (!error) console.log('✅ User approved!');
```

---

**Need help?** Check the BEGINNERS_GUIDE.md or ask for guidance!
