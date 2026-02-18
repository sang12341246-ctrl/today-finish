import { createClient } from '@supabase/supabase-js';

// TODO: Replace with environment variables in production
const supabaseUrl = 'https://cycolwzqysboqhbagshr.supabase.co';
const supabaseKey = 'sb_publishable_NUJ1EzUIQ9I-H_I5ZHE6CQ_S3nqVddK';

export const supabase = createClient(supabaseUrl, supabaseKey);
