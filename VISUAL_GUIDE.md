# 🎨 Visual Guide - What You'll See

This guide shows you exactly what your app looks like at each step.

---

## 📂 Your Project Folder Structure

```
📁 C:\Users\SOUMYA\nillohit\
│
├─ 📁 app/                      ← Where all pages are
│  ├─ 📁 login/
│  │  └─ 📄 page.tsx           ← Login page code
│  │
│  ├─ 📁 signup/
│  │  └─ 📄 page.tsx           ← Sign up page code
│  │
│  ├─ 📁 pending-approval/      ← NEW!
│  │  └─ 📄 page.tsx           ← "Waiting for approval" page
│  │
│  ├─ 📁 dashboard/
│  │  └─ (Your main app)
│  │
│  ├─ 📁 api/
│  │  ├─ 📁 signup/
│  │  │  └─ 📄 route.ts        ← Backend: creates accounts
│  │  │
│  │  └─ 📁 admin/delete-user/
│  │     └─ 📄 route.ts        ← Backend: rejects users
│  │
│  └─ 📄 layout.tsx             ← Overall app structure
│  └─ 📄 globals.css            ← App styling
│
├─ 📁 components/
│  └─ 📄 PendingApprovalsList.tsx  ← Manager's approval list
│
├─ 📁 lib/
│  └─ 📄 supabaseClient.ts      ← Talks to database
│
├─ 📄 .env                        ← Secret passwords (⚠️ never share!)
├─ 📄 .env.local                  ← More secrets
├─ 📄 package.json                ← App info & dependencies
│
├─ 📄 BEGINNERS_GUIDE.md          ← You should read this!
├─ 📄 QUICK_START.md              ← Fast 5-minute guide
└─ 📄 VERIFICATION_GUIDE.md       ← How to test everything
```

---

## 🌍 What You'll See in Browser

### Page 1: Homepage
```
http://localhost:3000/

┌─────────────────────────────────────┐
│  🌐 Nillohit - Reddit Tasking App   │
│                                     │
│  Welcome to the platform!           │
│                                     │
│  [Login]  [Sign Up]                │
└─────────────────────────────────────┘
```

---

### Page 2: Sign Up Page
```
http://localhost:3000/signup

┌─────────────────────────────────────┐
│                                     │
│   🎆 Join the Elite                │
│   Create your account to earn       │
│                                     │
│   [Username box]                    │
│   [Email box]                       │
│   [Password box]                    │
│   [Reddit URL box]                  │
│   [Discord username box]            │
│                                     │
│   [Sign Up Button]                  │
│                                     │
│   Already have account? Login       │
│                                     │
└─────────────────────────────────────┘
```

---

### Page 3: Pending Approval Page ✨ NEW!
```
http://localhost:3000/pending-approval?email=test@example.com

┌─────────────────────────────────────┐
│                                     │
│   ⏰ Account Pending Approval       │
│                                     │
│   Welcome! Your account has been    │
│   created. A manager will review    │
│   and approve soon.                 │
│                                     │
│   Email: test@example.com           │
│                                     │
│   Timeline:                         │
│   ✅ Account Created                │
│   ⏰ Awaiting Review                │
│   ⏳ Account Approved               │
│                                     │
│   💡 Our team will verify your      │
│      Reddit account. You'll be      │
│      able to login once approved.   │
│                                     │
│   [Back to Login]  [Go Home]       │
│                                     │
└─────────────────────────────────────┘
```

---

### Page 4: Login Page
```
http://localhost:3000/login

┌─────────────────────────────────────┐
│                                     │
│   N                                 │
│   Welcome Back                      │
│   Login to continue                 │
│                                     │
│   [Email box]                       │
│   [Password box]                    │
│                                     │
│   [Login Button]                    │
│                                     │
│   New here? Create account          │
│                                     │
└─────────────────────────────────────┘
```

---

### Page 5: Dashboard (After Login)
```
http://localhost:3000/dashboard/tasks

┌─────────────────────────────────────┐
│  [Nav] Username  [Logout]           │
├─────────────────────────────────────┤
│                                     │
│  Your Tasks                         │
│                                     │
│  [Task 1] [Task 2] [Task 3]        │
│                                     │
│  (Your main app area)               │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

---

## 📊 Supabase Database View

### What You See in Supabase Console

When you go to **Table Editor** → **profiles**, you see:

```
┌──────────────────────────────────────────────────────────┐
│ PROFILES TABLE                                           │
├──────────────────────────────────────────────────────────┤
│ id | email | username | reddit | discord | approved | suspended │
├──────────────────────────────────────────────────────────┤
│ u1 | john@ | john_d   | ...    | ...     | ✅ true | false     │
│ u2 | test@ | testuser | ...    | ...     | ⏳ false| false     │
│ u3 | jane@ | jane_d   | ...    | ...     | ✅ true | false     │
│ u4 | bad@  | baduser  | ...    | ...     | ✅ true | 🚫 true   │
└──────────────────────────────────────────────────────────┘

Legend:
✅ true = approved/not suspended
⏳ false = not approved/waiting
🚫 true = suspended/banned
```

---

## 🔄 Complete User Flow (Visual)

### Scenario 1: Normal User Approval

```
        START: User visits site
              ↓
    ┌─────────────────────────┐
    │   http://signup         │
    │                         │
    │   Username: test        │
    │   Email: test@test.com  │
    │   Password: ****        │
    │                         │
    │   [Sign Up]             │
    └─────────────────────────┘
              ↓
    ┌─────────────────────────┐
    │   Backend processes:    │
    │   ✅ Create auth user   │
    │   ✅ Create profile     │
    │   ✅ Set approved=false │
    └─────────────────────────┘
              ↓
    ┌─────────────────────────┐
    │ Redirect to:            │
    │ /pending-approval       │
    │                         │
    │ ⏰ Account Pending...    │
    │                         │
    │ [Back] [Home]           │
    └─────────────────────────┘
              ↓
         Manager approves:
    ├─ Login to Supabase
    ├─ Find user in table
    ├─ Change approved=false→true
    └─ Saved!
              ↓
    ┌─────────────────────────┐
    │   User tries login      │
    │                         │
    │   Email: test@test.com  │
    │   Password: ****        │
    │                         │
    │   [Login]               │
    └─────────────────────────┘
              ↓
    ┌─────────────────────────┐
    │   Backend checks:       │
    │   ✅ Password correct   │
    │   ✅ approved = true    │
    │   ✅ suspended = false  │
    │   ✅ Fetch role: user   │
    └─────────────────────────┘
              ↓
    ┌─────────────────────────┐
    │  SUCCESS! Welcome to    │
    │  /dashboard/tasks       │
    │                         │
    │  User can now use app   │
    └─────────────────────────┘
```

---

### Scenario 2: Unapproved User Login

```
User tries to login
        ↓
Backend checks: approved = false
        ↓
┌─────────────────────────────────┐
│ Redirect to:                    │
│ /pending-approval               │
│                                 │
│ ⏰ Account Pending Approval      │
│                                 │
│ Your account is waiting for      │
│ manager approval. Please wait... │
│                                 │
│ [Back to Login]  [Go Home]      │
└─────────────────────────────────┘
        ↓
User waits for manager approval
```

---

### Scenario 3: Suspended User

```
User tries to login
        ↓
Backend checks: suspended = true
        ↓
┌─────────────────────────────────┐
│ ❌ Error Alert                  │
│                                 │
│ "Your account has been          │
│  suspended. Please contact       │
│  support."                      │
│                                 │
│ [OK]                            │
└─────────────────────────────────┘
        ↓
User cannot login
```

---

## 🖥️ Manager Approval Dashboard

### What Manager Sees

```
                Admin Panel
┌─────────────────────────────────────┐
│                                     │
│ Pending Approvals              [3]  │
│                                     │
├─────────────────────────────────────┤
│ testuser (test@example.com)         │
│ Reddit: /u/test                     │
│ Discord: testuser#0000              │
│ [✅ Approve]  [❌ Reject]           │
├─────────────────────────────────────┤
│ janedoe (jane@example.com)          │
│ Reddit: /u/janedoe                  │
│ Discord: jane#1234                  │
│ [✅ Approve]  [❌ Reject]           │
├─────────────────────────────────────┤
│ john_smith (john@example.com)       │
│ Reddit: /u/jsmith                   │
│ Discord: john#5678                  │
│ [✅ Approve]  [❌ Reject]           │
└─────────────────────────────────────┘

Click "Approve" → User gets approved
Click "Reject" → User gets deleted
```

---

## 💻 Code Structure (Simplified)

### Frontend Files (What User Sees)

```
signup/page.tsx
├─ Shows form
├─ Collects: email, password, username, reddit, discord
└─ Sends to: /api/signup

login/page.tsx
├─ Shows login form
├─ Collects: email, password
├─ Checks: approved? suspended?
└─ Redirects: /pending-approval or /dashboard

pending-approval/page.tsx
├─ Shows: "Your account is waiting"
├─ Shows: email, timeline
└─ Buttons: Back, Home
```

### Backend Files (Hidden Logic)

```
/api/signup/route.ts
├─ Gets form data
├─ Creates auth user
├─ Creates profile with approved=false
└─ Returns success/error

/api/admin/delete-user/route.ts
├─ Gets user ID
├─ Deletes auth user (cascades to profile)
└─ Returns success
```

### Database Files

```
/lib/supabaseClient.ts
├─ Connects to database
├─ Uses keys from .env
└─ Used by all pages/apis
```

---

## 📱 User Roles & What They See

```
Role: "user"
└─ Approved: ✅
└─ After login → /dashboard/tasks
└─ Can: View tasks, submit work

Role: "manager"
└─ Approved: ✅
└─ After login → /manager/tasks
└─ Can: Review submissions, approve tasks

Role: "admin"
└─ Approved: ✅
└─ After login → /admin
└─ Can: Manage everything
```

---

## 🎯 Summary: What Happens Where

| Action | Page | Backend | Database |
|--------|------|---------|----------|
| User signs up | `/signup` | `/api/signup` | Creates profile (approved=false) |
| User tries login | `/login` | Checks approval | Reads profile |
| User unapproved | Redirect to `/pending-approval` | - | - |
| Manager approves | Manager dashboard | `/api/...` | Updates approved=true |
| User logs in again | `/login` | Checks approval ✅ | Reads profile |
| User sees dashboard | `/dashboard` | Fetch tasks | Reads tasks |

---

## 🎉 You Now Understand!

You can visualize:
- ✅ Where files are located
- ✅ What the user sees
- ✅ What the database looks like
- ✅ How approval system works
- ✅ Who sees what

**Next:** Read BEGINNERS_GUIDE.md for detailed explanations!
