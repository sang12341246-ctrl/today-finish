import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cycolwzqysboqhbagshr.supabase.co';
const supabaseAnonKey = 'sb_publishable_NUJ1EzUIQ9I-H_I5ZHE6CQ_S3nqVddK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);