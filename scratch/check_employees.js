const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('*');

  if (empError) {
    console.error("Error fetching employees:", empError);
  } else {
    console.log(`Found ${employees.length} employees:`);
    console.log(JSON.stringify(employees, null, 2));
  }
}

run();
