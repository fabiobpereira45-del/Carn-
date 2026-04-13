import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vctmjgggsfwhovtodnnk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjdG1qZ2dnc2Z3aG92dG9kbm5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDI5NjMsImV4cCI6MjA5MTY3ODk2M30.JMCi1As7IuWrZG0SHhpTjZ3XPfod5dkJqo1OqzCExNc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
