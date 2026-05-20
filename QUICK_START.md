# ⚡ Quick Start (5 Minutes)

## Step 1: Open Terminal 🖥️

**Windows:**
- Press `Windows key + R`
- Type: `cmd`
- Press Enter

**Mac:**
- Press `Cmd + Space`
- Type: `terminal`
- Press Enter

---

## Step 2: Start Your App 🚀

Copy and paste this into terminal:

```bash
cd C:\Users\SOUMYA\nillohit
npm run dev
```

**Wait for:**
```
> ready - started server on 0.0.0.0:3000
```

---

## Step 3: Open in Browser 🌐

Click this link or copy to address bar:

**http://localhost:3000**

You should see your app homepage!

---

## Step 4: Test Signup ✍️

1. Click "Sign Up" or go to http://localhost:3000/signup
2. Fill in form:
   - **Username:** testuser123
   - **Email:** test@example.com
   - **Password:** TestPass123!
   - **Reddit:** https://reddit.com/user/test
   - **Discord:** testuser#0000
3. Click **"Sign Up"**
4. You should see: "Account Pending Approval" page ✅

---

## Step 5: Approve in Supabase 👤

1. Go to: **https://app.supabase.com**
2. Login with your account
3. Click your project name
4. Left menu → **"Table Editor"**
5. Click **"profiles"** table
6. Find the row with `test@example.com`
7. Click on the **"approved"** column
8. Change **FALSE** → **TRUE**
9. Click elsewhere to save

✅ Done! User is now approved.

---

## Step 6: Test Login 🔑

1. Go to: **http://localhost:3000/login**
2. Enter:
   - **Email:** test@example.com
   - **Password:** TestPass123!
3. Click **"Login"**
4. You should be logged in! ✅

---

## Troubleshooting

### App won't start?
```bash
# Close terminal with Ctrl+C
# Try again:
npm run dev
```

### Port 3000 in use?
```bash
npm run dev -- -p 3001
```
Then visit: http://localhost:3001

### Can't see pending approval page?
- Check Supabase → profiles table
- Make sure user has `approved: false`

### Login doesn't work?
- Make sure `approved: true` in Supabase
- Make sure `suspended: false`
- Try correct password again

---

## What You Just Did 🎉

```
Signup ✅
  ↓
Created account (approved: false)
  ↓
Saw pending page
  ↓
Approved in Supabase (approved: true)
  ↓
Login ✅
  ↓
Logged in successfully!
```

**Congratulations! The entire system works!**

---

## Next: Read Full Guide 📖

For detailed explanations, read:
```
BEGINNERS_GUIDE.md
```

It explains:
- What web development is
- How everything works
- How to make changes
- How to troubleshoot

---

## Quick Reference

| Want to... | Do this |
|-----------|---------|
| Start app | Terminal: `npm run dev` |
| Visit app | Browser: http://localhost:3000 |
| Approve user | Supabase: Set `approved: true` |
| Suspend user | Supabase: Set `suspended: true` |
| Stop app | Terminal: Press `Ctrl+C` |

---

## You're Ready! 🚀

You now have a working approval system for your Reddit tasking app!

Next steps:
1. Explore the app more
2. Read BEGINNERS_GUIDE.md for details
3. Make small changes to learn
4. Test different scenarios

**Questions? Check BEGINNERS_GUIDE.md - it has all the answers!**
