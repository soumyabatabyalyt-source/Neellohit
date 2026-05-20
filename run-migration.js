#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://jbymiopbxtxkfvublfeh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpieW1pb3BieHR4a2Z2dWJsZmVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcxODYxNiwiZXhwIjoyMDkzMjk0NjE2fQ.HIDJvUR8IEoil5hiGZjJlhH3_2n7fF84BGm6tXqH1Rg'
);

async function runMigration() {
  try {
    const sql = fs.readFileSync('./migrations/003_add_reward_to_tasks.sql', 'utf8');

    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Migration error:', error);
    } else {
      console.log('✅ Migration applied successfully');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

runMigration();
