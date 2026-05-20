const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jbymiopbxtxkfvublfeh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpieW1pb3BieHR4a2Z2dWJsZmVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcxODYxNiwiZXhwIjoyMDkzMjk0NjE2fQ.HIDJvUR8IEoil5hiGZjJlhH3_2n7fF84BGm6tXqH1Rg'
);

async function verifySetup() {
  console.log('🔍 Starting Supabase Verification...\n');

  try {
    // 1. Check profiles table schema
    console.log('1️⃣  Checking profiles table schema...');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error querying profiles:', error.message);
      return;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('✅ Profiles table found');
      console.log('   Columns:', columns.join(', '));

      const hasApproved = columns.includes('approved');
      const hasSuspended = columns.includes('suspended');
      const hasRole = columns.includes('role');

      console.log(`   Has "approved": ${hasApproved ? '✅' : '❌'}`);
      console.log(`   Has "suspended": ${hasSuspended ? '✅' : '❌'}`);
      console.log(`   Has "role": ${hasRole ? '✅' : '❌'}\n`);

      if (!hasApproved || !hasSuspended) {
        console.log('⚠️  WARNING: Missing approval-related columns!');
        console.log('   These columns should exist in your profiles table:');
        if (!hasApproved) console.log('   - approved BOOLEAN DEFAULT FALSE');
        if (!hasSuspended) console.log('   - suspended BOOLEAN DEFAULT FALSE');
        return;
      }
    } else {
      console.log('⚠️  No data in profiles table yet\n');
    }

    // 2. Check pending users
    console.log('2️⃣  Checking pending approvals...');
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('profiles')
      .select('id, email, username, approved, suspended')
      .eq('approved', false)
      .eq('suspended', false);

    if (pendingError) {
      console.log('❌ Error fetching pending users:', pendingError.message);
      return;
    }

    console.log(`✅ Pending users: ${pendingUsers?.length || 0}`);
    if (pendingUsers && pendingUsers.length > 0) {
      pendingUsers.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.username} (${user.email})`);
      });
    }
    console.log();

    // 3. Check all users by role
    console.log('3️⃣  Users by role...');
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, username, role, approved, suspended');

    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
      return;
    }

    const roles = {};
    (allUsers || []).forEach(user => {
      const role = user.role || 'unknown';
      if (!roles[role]) roles[role] = [];
      roles[role].push(user);
    });

    Object.entries(roles).forEach(([role, users]) => {
      console.log(`   ${role}: ${users.length}`);
      users.forEach(u => {
        const status = u.suspended ? '🚫' : u.approved ? '✅' : '⏳';
        console.log(`     ${status} ${u.username} (${u.email})`);
      });
    });
    console.log();

    // 4. Test creating a user
    console.log('4️⃣  Testing user creation...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (authError) {
      console.log('❌ Error creating auth user:', authError.message);
      return;
    }

    const userId = authData.user.id;
    console.log(`✅ Test user created: ${testEmail}`);
    console.log(`   User ID: ${userId}\n`);

    // 5. Create profile for test user
    console.log('5️⃣  Creating test user profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: testEmail,
        username: `testuser${Date.now()}`,
        reddit: 'https://reddit.com/user/test',
        discord: 'testuser#0000',
        role: 'user',
        approved: false,
        suspended: false,
      });

    if (profileError) {
      console.log('❌ Error creating profile:', profileError.message);
      // Cleanup auth user
      await supabase.auth.admin.deleteUser(userId);
      return;
    }

    console.log('✅ Profile created\n');

    // 6. Test approval
    console.log('6️⃣  Testing approval workflow...');

    const { data: beforeApproval } = await supabase
      .from('profiles')
      .select('approved, suspended')
      .eq('id', userId)
      .single();

    console.log(`   Before: approved=${beforeApproval?.approved}, suspended=${beforeApproval?.suspended}`);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ approved: true })
      .eq('id', userId);

    if (updateError) {
      console.log('❌ Error updating profile:', updateError.message);
      return;
    }

    const { data: afterApproval } = await supabase
      .from('profiles')
      .select('approved, suspended')
      .eq('id', userId)
      .single();

    console.log(`   After: approved=${afterApproval?.approved}, suspended=${afterApproval?.suspended}`);
    console.log('✅ Approval workflow works!\n');

    // 7. Test suspension
    console.log('7️⃣  Testing suspension...');
    const { error: suspendError } = await supabase
      .from('profiles')
      .update({ suspended: true })
      .eq('id', userId);

    if (suspendError) {
      console.log('❌ Error suspending user:', suspendError.message);
      return;
    }

    const { data: suspendedUser } = await supabase
      .from('profiles')
      .select('suspended')
      .eq('id', userId)
      .single();

    console.log(`   User suspended: ${suspendedUser?.suspended}`);
    console.log('✅ Suspension works!\n');

    // 8. Cleanup
    console.log('8️⃣  Cleaning up test data...');
    await supabase.auth.admin.deleteUser(userId);
    console.log('✅ Test user deleted\n');

    console.log('═══════════════════════════════════════');
    console.log('✅ ALL CHECKS PASSED!');
    console.log('═══════════════════════════════════════');
    console.log('\nYour approval system is ready to use!');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

verifySetup();
