import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pelxrgeznzsjhtbrxqbp.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbHhyZ2V6bnpzamh0YnJ4cWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNjI3OTYsImV4cCI6MjA3ODgzODc5Nn0.WLBmEGZpJwnxVMmsqjDUgok0y444_YgX3oQvnzKUV3E";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);