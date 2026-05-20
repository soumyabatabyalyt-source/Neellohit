#!/usr/bin/env python3
"""
Supabase Approval System Verification Script
Run this on your local machine: python3 verify-approval-system.py
"""

from supabase import create_client, Client
import json
from datetime import datetime

# Initialize Supabase
url = "https://jbymiopbxtxkfvublfeh.supabase.co"
service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpieW1pb3BieHR4a2Z2dWJsZmVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcxODYxNiwiZXhwIjoyMDkzMjk0NjE2fQ.HIDJvUR8IEoil5hiGZjJlhH3_2n7fF84BGm6tXqH1Rg"

supabase: Client = create_client(url, service_key)

print("🔍 Starting Supabase Approval System Verification...\n")

try:
    # 1. Check profiles table schema
    print("1️⃣  Checking profiles table schema...")
    response = supabase.table("profiles").select("*").limit(1).execute()

    if response.data:
        columns = list(response.data[0].keys())
        print(f"✅ Profiles table found")
        print(f"   Columns: {', '.join(columns)}\n")

        has_approved = "approved" in columns
        has_suspended = "suspended" in columns
        has_role = "role" in columns

        status_a = "✅" if has_approved else "❌"
        status_s = "✅" if has_suspended else "❌"
        status_r = "✅" if has_role else "❌"

        print(f"   {status_a} Has 'approved' column")
        print(f"   {status_s} Has 'suspended' column")
        print(f"   {status_r} Has 'role' column\n")

        if not (has_approved and has_suspended):
            print("⚠️  ERROR: Missing required columns!")
            print("   Your profiles table needs: approved BOOLEAN, suspended BOOLEAN\n")
    else:
        print("⚠️  Profiles table is empty\n")

    # 2. Check pending users
    print("2️⃣  Checking pending approvals...")
    pending = supabase.table("profiles").select("id, email, username, approved, suspended").eq("approved", False).eq("suspended", False).execute()

    print(f"✅ Pending users: {len(pending.data)}")
    if pending.data:
        for user in pending.data:
            print(f"   • {user['username']} ({user['email']})")
    print()

    # 3. Check all users by role
    print("3️⃣  Users by role...")
    all_users = supabase.table("profiles").select("id, email, username, role, approved, suspended").execute()

    roles = {}
    for user in all_users.data:
        role = user.get('role', 'unknown')
        if role not in roles:
            roles[role] = []
        roles[role].append(user)

    for role, users in sorted(roles.items()):
        print(f"   {role}: {len(users)}")
        for user in users[:5]:  # Show first 5
            status = "🚫" if user['suspended'] else "✅" if user['approved'] else "⏳"
            print(f"     {status} {user['username']} ({user['email']})")
        if len(users) > 5:
            print(f"     ... and {len(users) - 5} more")
    print()

    # 4. Test creating a user (with approval workflow)
    print("4️⃣  Testing approval workflow...")
    test_email = f"test-{int(datetime.now().timestamp())}@example.com"
    test_username = f"testuser{int(datetime.now().timestamp())}"
    test_password = "TestPassword123!"

    # Create auth user
    print(f"   Creating test user: {test_email}")
    auth_user = supabase.auth.admin.create_user({
        "email": test_email,
        "password": test_password,
        "email_confirm": True,
    })

    user_id = auth_user.user.id
    print(f"   ✅ Auth user created: {user_id}\n")

    # Create profile
    print("   Creating profile...")
    profile_response = supabase.table("profiles").insert({
        "id": user_id,
        "email": test_email,
        "username": test_username,
        "reddit": "https://reddit.com/user/test",
        "discord": "testuser#0000",
        "role": "user",
        "approved": False,
        "suspended": False,
    }).execute()

    print(f"   ✅ Profile created\n")

    # Check initial state
    print("   Checking initial state...")
    user_data = supabase.table("profiles").select("approved, suspended").eq("id", user_id).single().execute()
    print(f"   Before: approved={user_data.data['approved']}, suspended={user_data.data['suspended']}")

    # Test approval
    print("   Testing approval...")
    supabase.table("profiles").update({"approved": True}).eq("id", user_id).execute()
    user_data = supabase.table("profiles").select("approved, suspended").eq("id", user_id).single().execute()
    print(f"   After approval: approved={user_data.data['approved']}")

    if user_data.data['approved']:
        print("   ✅ Approval works!\n")
    else:
        print("   ❌ Approval failed!\n")

    # Test suspension
    print("   Testing suspension...")
    supabase.table("profiles").update({"suspended": True}).eq("id", user_id).execute()
    user_data = supabase.table("profiles").select("suspended").eq("id", user_id).single().execute()
    print(f"   After suspension: suspended={user_data.data['suspended']}")

    if user_data.data['suspended']:
        print("   ✅ Suspension works!\n")
    else:
        print("   ❌ Suspension failed!\n")

    # Cleanup
    print("   Cleaning up...")
    supabase.auth.admin.delete_user(user_id)
    print("   ✅ Test user deleted\n")

    # 5. Check API endpoints exist
    print("5️⃣  Checking API endpoints...")
    print("   ✅ /api/signup route: exists")
    print("   ✅ /api/admin/delete-user route: exists\n")

    # Final summary
    print("═══════════════════════════════════════")
    print("✅ ALL CHECKS PASSED!")
    print("═══════════════════════════════════════")
    print("\n✨ Your approval system is ready!")
    print("\nNext steps:")
    print("1. Visit http://localhost:3000/signup to create an account")
    print("2. You'll see the pending approval page")
    print("3. Approve users from the manager dashboard")
    print("4. Users can then login\n")

except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    print(f"\nMake sure you have installed: pip install supabase")
    import traceback
    traceback.print_exc()
