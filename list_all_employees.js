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
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*');

  if (projectsError) {
    console.error("Error fetching projects:", projectsError);
  } else {
    console.log(`Found ${projects.length} projects:`);
    console.log(projects);
  }

  const { data: resources, error: resourcesError } = await supabase
    .from('project_resources')
    .select('*');

  if (resourcesError) {
    console.error("Error fetching project resources:", resourcesError);
  } else {
    console.log(`Found ${resources.length} project resources:`);
    console.log(resources);
  }
}

run();
