import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log to ensure environment variables are being picked up
console.log("Supabase URL:", supabaseUrl ? "Loaded" : "NOT LOADED");
console.log("Supabase Anon Key:", supabaseAnonKey ? "Loaded" : "NOT LOADED");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);