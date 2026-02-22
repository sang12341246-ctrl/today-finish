/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRows() {
    const { data, error } = await supabase.from('premium_homeworks').select('*').limit(3);
    if (error) console.error(error);
    else console.log('Recent homeworks:', JSON.stringify(data, null, 2));
}

checkRows();
