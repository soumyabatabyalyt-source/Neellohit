#!/usr/bin/env node

/**
 * Run SQL migration against Supabase
 * Usage: node apply-migration.js
 */

const https = require('https');

const SQL = `ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reward numeric(10,2) NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_tasks_reward ON public.tasks(reward);
COMMENT ON COLUMN public.tasks.reward IS 'Reward amount in USD for completing the task';`;

async function runMigration() {
  console.log('🔧 Applying reward column migration...\n');

  try {
    // Make request to Supabase
    const url = new URL('https://jbymiopbxtxkfvublfeh.supabase.co/rest/v1/rpc/exec_sql');

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpieW1pb3BieHR4a2Z2dWJsZmVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcxODYxNiwiZXhwIjoyMDkzMjk0NjE2fQ.HIDJvUR8IEoil5hiGZjJlhH3_2n7fF84BGm6tXqH1Rg'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          console.log('✅ Migration applied successfully!');
          console.log('\nThe reward column has been added to the tasks table.');
        } else {
          console.log(`Status: ${res.statusCode}`);
          console.log('Response:', data);
          console.log('\n⚠️  If migration failed, run this SQL directly in Supabase SQL Editor:');
          console.log('─'.repeat(60));
          console.log(SQL);
          console.log('─'.repeat(60));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Network error:', err.message);
      console.log('\n⚠️  Please run this SQL directly in your Supabase SQL Editor:');
      console.log('─'.repeat(60));
      console.log(SQL);
      console.log('─'.repeat(60));
    });

    req.write(JSON.stringify({ sql: SQL }));
    req.end();

  } catch (err) {
    console.error('Error:', err.message);
  }
}

runMigration();
