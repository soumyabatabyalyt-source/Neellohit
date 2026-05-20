#!/usr/bin/env node

/**
 * Check Profiles Table Schema
 * Identifies duplicate columns
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jbymiopbxtxkfvublfeh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpieW1pb3BieHR4a2Z2dWJsZmVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcxODYxNiwiZXhwIjoyMDkzMjk0NjE2fQ.HIDJvUR8IEoil5hiGZjJlhH3_2n7fF84BGm6tXqH1Rg'
);

console.log('\n🔍 Checking profiles table schema...\n');

async function checkSchema() {
  try {
    // Get one row to see all columns
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No data in profiles table');
      return;
    }

    const columns = Object.keys(data[0]);

    console.log('Columns in profiles table:');
    console.log('─────────────────────────────────\n');

    columns.forEach((col, i) => {
      console.log(`${i + 1}. ${col}`);
    });

    console.log('\n─────────────────────────────────\n');

    // Check for duplicates
    const approvalCols = columns.filter(col =>
      col.toLowerCase().includes('approv')
    );

    const suspendedCols = columns.filter(col =>
      col.toLowerCase().includes('suspend')
    );

    console.log('Summary:');
    console.log(`Total columns: ${columns.length}`);
    console.log(`Approval-related: ${approvalCols.length} ${approvalCols}`);
    console.log(`Suspension-related: ${suspendedCols.length} ${suspendedCols}\n`);

    if (approvalCols.length > 1) {
      console.log('⚠️  ISSUE FOUND: Multiple approval columns!');
      console.log(`Columns: ${approvalCols.join(', ')}`);
      console.log('\nTo fix, run in Supabase SQL Editor:');
      approvalCols.slice(1).forEach(col => {
        console.log(`  ALTER TABLE profiles DROP COLUMN "${col}";`);
      });
    } else if (approvalCols.length === 1) {
      console.log(`✅ Good: Single approval column: ${approvalCols[0]}`);
    } else {
      console.log('❌ ERROR: No approval column found!');
    }

    if (suspendedCols.length > 1) {
      console.log('\n⚠️  ISSUE FOUND: Multiple suspended columns!');
      console.log(`Columns: ${suspendedCols.join(', ')}`);
      console.log('\nTo fix, run in Supabase SQL Editor:');
      suspendedCols.slice(1).forEach(col => {
        console.log(`  ALTER TABLE profiles DROP COLUMN "${col}";`);
      });
    } else if (suspendedCols.length === 1) {
      console.log(`✅ Good: Single suspended column: ${suspendedCols[0]}`);
    }

    console.log();

  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSchema();
