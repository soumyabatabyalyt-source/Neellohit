#!/usr/bin/env node

/**
 * Approve User Script
 * Approves a user by email
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jbymiopbxtxkfvublfeh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpieW1pb3BieHR4a2Z2dWJsZmVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcxODYxNiwiZXhwIjoyMDkzMjk0NjE2fQ.HIDJvUR8IEoil5hiGZjJlhH3_2n7fF84BGm6tXqH1Rg'
);

const emailToApprove = process.argv[2] || 'soumyabatabyal3@gmail.com';

console.log(`\n🔍 Approving user: ${emailToApprove}\n`);

async function approveUser() {
  try {
    // Step 1: Find user
    console.log('1️⃣  Finding user in database...');
    const { data: user, error: findError } = await supabase
      .from('profiles')
      .select('id, email, username, approved, suspended')
      .eq('email', emailToApprove)
      .single();

    if (findError) {
      console.log(`❌ User not found: ${findError.message}`);
      return;
    }

    if (!user) {
      console.log(`❌ No user found with email: ${emailToApprove}`);
      return;
    }

    console.log(`✅ Found user: ${user.username} (${user.email})\n`);

    // Step 2: Check current status
    console.log('2️⃣  Checking current status...');
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Approved: ${user.approved ? '✅ YES' : '⏳ NO'}`);
    console.log(`   Suspended: ${user.suspended ? '🚫 YES' : '✅ NO'}\n`);

    if (user.approved) {
      console.log('⚠️  User is already approved!');
      return;
    }

    if (user.suspended) {
      console.log('❌ User is suspended! Cannot approve.');
      return;
    }

    // Step 3: Approve user
    console.log('3️⃣  Approving user...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ approved: true })
      .eq('id', user.id);

    if (updateError) {
      console.log(`❌ Error approving user: ${updateError.message}`);
      return;
    }

    console.log('✅ User approved!\n');

    // Step 4: Verify approval
    console.log('4️⃣  Verifying approval...');
    const { data: updatedUser, error: verifyError } = await supabase
      .from('profiles')
      .select('approved, suspended')
      .eq('id', user.id)
      .single();

    if (verifyError) {
      console.log(`❌ Error verifying: ${verifyError.message}`);
      return;
    }

    console.log(`✅ Verified: approved = ${updatedUser.approved}\n`);

    // Success message
    console.log('═══════════════════════════════════════════');
    console.log('🎉 USER APPROVED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════\n');

    console.log(`User: ${user.username} (${user.email})`);
    console.log(`Status: ✅ APPROVED`);
    console.log(`\nThey can now login at:`);
    console.log(`http://localhost:3000/login\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

approveUser();
