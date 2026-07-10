import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = readFileSync('./supabase/migrations/008_add_priority_and_progress.sql', 'utf-8');

// Split by semicolons and run each statement
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

async function run() {
  for (const stmt of statements) {
    const { error } = await sb.rpc('exec_sql', { sql: stmt + ';' });
    if (error) {
      console.log('Statement failed (trying direct):', stmt.substring(0, 60), '...', error.message);
    } else {
      console.log('OK:', stmt.substring(0, 60));
    }
  }
}

run().catch(console.error);
