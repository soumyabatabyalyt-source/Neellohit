#!/usr/bin/env node

/**
 * Approval System Verification Script
 * Tests all aspects of the approval system
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 APPROVAL SYSTEM VERIFICATION\n');
console.log('═══════════════════════════════════════════\n');

// Test 1: Check if required files exist
console.log('1️⃣  Checking code files...\n');

const requiredFiles = [
  'app/login/page.tsx',
  'app/signup/page.tsx',
  'app/auth/page.tsx',
  'app/pending-approval/page.tsx',
  'components/PendingApprovalsList.tsx',
  'app/api/signup/route.ts',
  'app/api/admin/delete-user/route.ts',
  'lib/supabaseClient.ts',
];

let filesOk = true;
requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
    filesOk = false;
  }
});

console.log(filesOk ? '\n✅ All files present!\n' : '\n❌ Some files missing!\n');

// Test 2: Check approval logic in login
console.log('2️⃣  Checking login approval logic...\n');

const loginContent = fs.readFileSync(path.join(__dirname, 'app/login/page.tsx'), 'utf8');

const checks = [
  {
    name: 'Approved check',
    pattern: 'profile.approved',
    file: 'app/login/page.tsx'
  },
  {
    name: 'Suspended check',
    pattern: 'profile.suspended',
    file: 'app/login/page.tsx'
  },
  {
    name: 'Pending approval redirect',
    pattern: '/pending-approval',
    file: 'app/login/page.tsx'
  },
  {
    name: 'Role-based routing',
    pattern: 'router.push',
    file: 'app/login/page.tsx'
  }
];

checks.forEach(check => {
  if (loginContent.includes(check.pattern)) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name} - NOT FOUND!`);
  }
});

console.log();

// Test 3: Check signup creates profile with approved: false
console.log('3️⃣  Checking signup creates approved: false...\n');

const signupContent = fs.readFileSync(path.join(__dirname, 'app/api/signup/route.ts'), 'utf8');

const signupChecks = [
  {
    name: 'Creates auth user',
    pattern: 'createUser'
  },
  {
    name: 'Creates profile with approved: false',
    pattern: 'approved: false'
  },
  {
    name: 'Sets role to user',
    pattern: 'role: "user"'
  },
  {
    name: 'Rollback on error',
    pattern: 'deleteUser'
  }
];

signupChecks.forEach(check => {
  if (signupContent.includes(check.pattern)) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name} - NOT FOUND!`);
  }
});

console.log();

// Test 4: Check pending approval page
console.log('4️⃣  Checking pending approval page...\n');

const pendingContent = fs.readFileSync(path.join(__dirname, 'app/pending-approval/page.tsx'), 'utf8');

const pendingChecks = [
  {
    name: 'Shows pending message',
    pattern: 'Pending Approval'
  },
  {
    name: 'Shows email',
    pattern: 'email'
  },
  {
    name: 'Has timeline',
    pattern: 'timeline'
  },
  {
    name: 'Has action buttons',
    pattern: 'button'
  }
];

pendingChecks.forEach(check => {
  if (pendingContent.includes(check.pattern)) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name} - NOT FOUND!`);
  }
});

console.log();

// Test 5: Check manager approval component
console.log('5️⃣  Checking manager approval component...\n');

const managerContent = fs.readFileSync(path.join(__dirname, 'components/PendingApprovalsList.tsx'), 'utf8');

const managerChecks = [
  {
    name: 'Fetches pending users',
    pattern: 'approved: false'
  },
  {
    name: 'Has approve button',
    pattern: 'approveUser'
  },
  {
    name: 'Has reject button',
    pattern: 'rejectUser'
  },
  {
    name: 'Updates database',
    pattern: 'update'
  }
];

managerChecks.forEach(check => {
  if (managerContent.includes(check.pattern)) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name} - NOT FOUND!`);
  }
});

console.log();

// Test 6: Check environment variables
console.log('6️⃣  Checking environment setup...\n');

const envLocal = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');

const envChecks = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    file: '.env.local'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    file: '.env.local'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    file: '.env'
  }
];

envChecks.forEach(check => {
  if (envLocal.includes(check.name) || env.includes(check.name)) {
    console.log(`✅ ${check.name} - configured`);
  } else {
    console.log(`❌ ${check.name} - MISSING!`);
  }
});

console.log();

// Test 7: Check Supabase client
console.log('7️⃣  Checking Supabase configuration...\n');

const supabaseContent = fs.readFileSync(path.join(__dirname, 'lib/supabaseClient.ts'), 'utf8');

const supabaseChecks = [
  {
    name: 'Frontend client (anon key)',
    pattern: 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  },
  {
    name: 'Backend client (service role)',
    pattern: 'SUPABASE_SERVICE_ROLE_KEY'
  },
  {
    name: 'createServiceClient function',
    pattern: 'createServiceClient'
  }
];

supabaseChecks.forEach(check => {
  if (supabaseContent.includes(check.pattern)) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name} - NOT FOUND!`);
  }
});

console.log();

// Summary
console.log('═══════════════════════════════════════════\n');

console.log('✨ CODE VERIFICATION COMPLETE!\n');

console.log('Next steps:');
console.log('1. Start the app: npm run dev');
console.log('2. Sign up at http://localhost:3000/signup');
console.log('3. Check Supabase for the new user');
console.log('4. Approve the user (set approved: true)');
console.log('5. Try to login');
console.log();
console.log('For complete system test, run:');
console.log('   python3 verify-approval-system.py');
console.log();
