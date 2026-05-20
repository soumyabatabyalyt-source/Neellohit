#!/bin/bash

# Supabase Verification Script
# Run this on your local machine: bash verify-supabase-local.sh

SUPABASE_URL="https://jbymiopbxtxkfvublfeh.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpieW1pb3BieHR4a2Z2dWJsZmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTg2MTYsImV4cCI6MjA5MzI5NDYxNn0.H7h6kwQfFB-8nRHvxy753NohgzQY9OzHJgCo-mKI3Ts"

echo "🔍 Starting Supabase Verification..."
echo ""

# 1. Check profiles table
echo "1️⃣  Checking profiles table..."
PROFILES=$(curl -s -H "apikey: $ANON_KEY" \
  "$SUPABASE_URL/rest/v1/profiles?select=*&limit=1")

if echo "$PROFILES" | grep -q "approved"; then
  echo "✅ 'approved' column found"
else
  echo "❌ 'approved' column NOT found"
fi

if echo "$PROFILES" | grep -q "suspended"; then
  echo "✅ 'suspended' column found"
else
  echo "❌ 'suspended' column NOT found"
fi

echo ""

# 2. Check pending users count
echo "2️⃣  Counting pending users..."
PENDING=$(curl -s -H "apikey: $ANON_KEY" \
  "$SUPABASE_URL/rest/v1/profiles?approved=eq.false&suspended=eq.false&select=count" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')

echo "✅ Pending users: $PENDING"
echo ""

# 3. Check all users
echo "3️⃣  All users in system:"
curl -s -H "apikey: $ANON_KEY" \
  "$SUPABASE_URL/rest/v1/profiles?select=email,username,role,approved,suspended" | jq '.' 2>/dev/null || echo "❌ Could not fetch users"

echo ""
echo "═══════════════════════════════════════"
echo "Verification complete!"
echo "═══════════════════════════════════════"
