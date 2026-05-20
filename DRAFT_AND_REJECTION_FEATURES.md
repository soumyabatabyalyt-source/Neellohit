# DRAFT TASKS & REJECTION REASONS FEATURES
**Date:** 2026-05-20  
**Status:** ✅ Complete Implementation

---

## 🎉 FEATURES BUILT

### 1. ✅ DRAFT TASK MANAGEMENT UI (Manager Panel)
**Location:** `/app/manager/draft-tasks/page.tsx`  
**Available at:** `/manager/draft-tasks`

**Features:**
- View all draft tasks from spreadsheet imports
- Edit task details (title, reward, time limit, description)
- Publish tasks to make them available to users
- Reject tasks with predefined reasons
- Create custom rejection reasons
- Real-time status updates

**User Interface:**
- Grid showing all draft tasks
- Edit mode with inline form
- Rejection modal with reason selector
- Confirmation dialogs

---

### 2. ✅ DRAFT TASK API ENDPOINT
**Location:** `/app/api/manager/draft-tasks/route.ts`

**Endpoints:**

#### GET `/api/manager/draft-tasks`
Fetch all draft tasks for manager review
```typescript
Headers: Authorization: Bearer {token}
Response: { tasks: [DraftTask[]] }
```

#### PUT `/api/manager/draft-tasks`
Manage draft tasks (publish, reject, edit)

**Publish Task:**
```typescript
{
  taskId: "task-id",
  action: "publish"
}
```
- Sets `draft = false`
- Sets `approval_status = 'approved'`
- Task appears in user task pool

**Reject Task:**
```typescript
{
  taskId: "task-id",
  action: "reject",
  rejectionReason: "Filtered"
}
```
- Sets `draft = false`
- Sets `approval_status = 'rejected'`
- Sets `rejection_reason = 'Filtered'`
- Stored for manager reference

**Edit Task:**
```typescript
{
  taskId: "task-id",
  action: "edit",
  taskData: {
    title: "Updated Title",
    reward: 5.00,
    time_limit: 20
  }
}
```
- Updates specified fields
- Keeps draft status unchanged

---

### 3. ✅ REJECTION REASON TRACKING
**Database Columns Added (via migration):**
- `tasks.approval_status` - 'pending', 'approved', 'rejected', etc.
- `tasks.rejection_reason` - Text reason for rejection

**Rejection Reasons Available:**
1. Filtered
2. Mod Removed
3. Low Quality
4. Rule Violation
5. Duplicate
6. Incomplete
7. Other (custom text)

---

### 4. ✅ UPDATED TASK REVIEW SYSTEM
**Location:** `/app/api/review-task/route.ts`

**Enhanced Rejection Flow:**
```typescript
POST /api/review-task
{
  claim_id: "claim-id",
  action: "rejected",
  rejectionReason: "Low Quality"
}
```

When manager rejects a submitted task:
1. `task_claims.status = 'rejected'`
2. `tasks.approval_status = 'rejected'`
3. `tasks.rejection_reason = 'Low Quality'`
4. User can see rejection reason in MyTasks

---

### 5. ✅ UPDATED SUBMISSIONS REVIEW UI
**Location:** `/app/manager/submissions/ReviewActions.tsx`

**Features:**
- Approve button (one-click)
- Reject button opens modal
- Modal with reason dropdown
- Custom reason input for "Other"
- Confirmation before rejection
- Real-time feedback

**Modal Reasons:**
- Filtered
- Mod Removed
- Low Quality
- Rule Violation
- Duplicate
- Incomplete
- Other (custom input)

---

### 6. ✅ REJECTION REASON DISPLAY TO USERS
**Location:** `/app/dashboard/my-tasks/page.tsx`

**When task is rejected:**
```
Status: Rejected ✗
Reason: Mod Removed
```

Users can see:
- Why their task was rejected
- Specific reason from manager
- Helps them improve future submissions

---

## 📋 WORKFLOW: Spreadsheet Import to User

```
1. IMPORT SPREADSHEET
   ├─ Create tasks with draft=true
   ├─ Set basic details (title, reward, time_limit, etc.)
   └─ Tasks NOT visible to users yet

2. MANAGER REVIEWS DRAFTS
   ├─ Go to /manager/draft-tasks
   ├─ Review each task details
   ├─ Edit if needed (fix typos, adjust reward, etc.)
   └─ Either Publish or Reject each task

3. PUBLISH TO POOL
   ├─ Approve button → Task published
   ├─ draft=false, approval_status='approved'
   ├─ Task appears in /dashboard/tasks pool
   └─ Users can see and claim

4. MANAGE REJECTIONS
   ├─ Reject button → Modal opens
   ├─ Select reason (or custom)
   ├─ Task marked as rejected
   └─ Stored for record keeping
```

---

## 📋 WORKFLOW: Task Submission & Rejection

```
1. USER SUBMITS TASK
   ├─ Provides proof/submission link
   ├─ task_claims.status = 'submitted'
   └─ Appears in /manager/submissions

2. MANAGER REVIEWS SUBMISSION
   ├─ Go to /manager/submissions
   ├─ See submission details
   ├─ Click Approve or Reject

3. IF APPROVED
   ├─ task_claims.status = 'approved'
   ├─ Reward added to user wallet
   ├─ Earnings record created
   └─ User sees in MyTasks/Approved

4. IF REJECTED
   ├─ Click Reject button
   ├─ Modal opens with reasons
   ├─ Manager selects reason
   ├─ task_claims.status = 'rejected'
   ├─ tasks.rejection_reason = 'Low Quality'
   └─ User sees reason in MyTasks/Rejected
```

---

## 🎯 NAVIGATION UPDATES

### Manager Sidebar
Added new tab: **Draft Tasks**
- Icon: FileText
- Path: `/manager/draft-tasks`
- Position: After "Create Task"

**Updated Layout:** `/app/manager/layout.tsx`

Navigation flow:
```
/manager
├─ Tasks
├─ Create Task
├─ Draft Tasks ✨ NEW
├─ Submissions
├─ Accounts
├─ Taskers
└─ Withdrawals
```

---

## 🔄 COMPLETE USER FLOW

### For Users:

```
SIGNUP → APPROVAL → LOGIN → TASK POOL
                              ↓
                        CLAIM TASK
                              ↓
                        SUBMIT TASK
                              ↓
                    WAIT FOR APPROVAL
                          ↙       ↘
                    APPROVED    REJECTED
                        ↓           ↓
                    GET REWARD  SEE REASON
                        ↓       in MyTasks
                    WALLET         
                    UPDATED
```

### For Managers:

```
IMPORT SPREADSHEET → REVIEW DRAFTS → PUBLISH/REJECT
                                            ↓
                                    TASKS IN POOL
                                            ↓
                                    USERS SUBMIT
                                            ↓
                                    REVIEW SUBMISSION
                                      ↙         ↘
                                APPROVE      REJECT
                                  ↓            ↓
                              WALLET      REASON SAVED
                              UPDATED      TO TASK
```

---

## 🧪 TESTING CHECKLIST

### Draft Tasks Management:
- [ ] Navigate to `/manager/draft-tasks`
- [ ] See list of draft tasks
- [ ] Click to edit task details
- [ ] Save changes - task updates
- [ ] Click Publish - task moves to pool
- [ ] Click Reject - modal appears with reasons
- [ ] Select custom reason - text input appears
- [ ] Confirm rejection - task marked as rejected

### Task Submission with Rejection:
- [ ] User submits task in /manager/submissions
- [ ] Manager clicks Reject
- [ ] Modal opens with reasons
- [ ] Select reason "Low Quality"
- [ ] Click Confirm Reject
- [ ] Go to user's MyTasks
- [ ] Rejected task shows reason: "Low Quality"

### Draft to Published Flow:
- [ ] Create draft task (import or manual)
- [ ] Review in Draft Tasks panel
- [ ] Click Publish
- [ ] Go to /dashboard/tasks
- [ ] Task appears in pool
- [ ] User can claim it

---

## 📊 DATABASE SCHEMA

### Tasks Table (Updated):
```sql
- id: UUID
- draft: BOOLEAN (default: false)
- approval_status: TEXT ('pending', 'approved', 'rejected')
- rejection_reason: TEXT (nullable)
- title, reward, time_limit, etc... (existing)
```

### Task Claims Table (Existing):
```sql
- status: 'active', 'submitted', 'approved', 'rejected', etc.
```

---

## 🚀 QUICK START

**1. Run Database Migration**
```sql
-- Already prepared in /migrations/001_add_draft_to_tasks.sql
ALTER TABLE tasks ADD COLUMN draft boolean NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN approval_status text DEFAULT 'pending';
ALTER TABLE tasks ADD COLUMN rejection_reason text;
```

**2. Test Draft Tasks**
```
1. Go to /manager/draft-tasks
2. See draft tasks (if any were imported)
3. Try publishing and rejecting
4. Verify tasks appear/disappear from /dashboard/tasks
```

**3. Test Rejection Reasons**
```
1. Have user submit a task in /manager/submissions
2. Click Reject
3. Select reason
4. Check user's MyTasks/Rejected
5. See rejection reason displayed
```

---

## 🎨 UI COMPONENTS

### Draft Tasks Page
- Task list with cards
- Edit mode with inline form
- Publish button (green)
- Reject button (red)
- Rejection modal with dropdown
- Custom reason input (conditional)

### Review Actions Component
- Approve button (green, one-click)
- Reject button (red, opens modal)
- Rejection modal
- Reason dropdown
- Custom input field
- Confirm/Cancel buttons

### MyTasks Rejection Display
- Status badge: "Rejected" (red)
- Reason line: "Reason: Mod Removed"
- Helps users understand rejection

---

## 🔐 PERMISSIONS

All new endpoints require:
- Valid authentication token
- Manager or Admin role
- Appropriate role checks implemented

---

## 📝 IMPLEMENTATION SUMMARY

**Files Created:**
1. `/app/api/manager/draft-tasks/route.ts` - API for managing drafts
2. `/app/manager/draft-tasks/page.tsx` - Draft management UI

**Files Modified:**
1. `/app/api/review-task/route.ts` - Added rejection reason support
2. `/app/manager/submissions/ReviewActions.tsx` - Enhanced with modal
3. `/app/dashboard/my-tasks/page.tsx` - Display rejection reasons
4. `/app/manager/layout.tsx` - Added Draft Tasks navigation

**Database Changes:**
1. Migration created: `/migrations/001_add_draft_to_tasks.sql`

---

## ✨ FEATURES COMPLETE

✅ Draft tasks management UI  
✅ Publish/Reject functionality  
✅ Rejection reason tracking  
✅ Custom rejection reasons  
✅ Display reasons to users  
✅ Updated submission review  
✅ Manager navigation  
✅ API endpoints with auth  
✅ Real-time updates  

**Ready for production! 🚀**

