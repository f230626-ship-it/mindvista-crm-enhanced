const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  // Query all tables in public schema
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_tables'); // Or query standard pg_catalog via SQL/RPC if exists, or check a simple select on known tables

  console.log("Checking known tables...");
  const knownTables = ['departments', 'employees', 'leaves', 'attendance', 'projects', 'project_resources'];
  for (const table of knownTables) {
    const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`Table "${table}": Error / Does not exist: ${error.message}`);
    } else {
      console.log(`Table "${table}": Exists (count: ${data ? data.length : 0})`);
    }
  }

  // Fetch employees details (only fields that exist)
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('*')
    .limit(5);

  if (empError) {
    console.error("Error fetching employees:", empError.message);
  } else {
    console.log("Employees columns:");
    if (employees && employees.length > 0) {
      console.log(Object.keys(employees[0]));
      console.log("Sample employee:", employees[0]);
    } else {
      console.log("No employees found in the table.");
    }
  }
}

run();
