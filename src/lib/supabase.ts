import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://egppwttrulhhuyqgouuw.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVncHB3dHRydWxoaHV5cWdvdXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4OTQzNjYsImV4cCI6MjEwODQ3MDM2Nn0.uMA6KbYRJvBDEsxiikdKhz1ZPJIIQcL-PoTbFibNj2Q';

let supabaseClient: SupabaseClient | null = null;

try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch {
  // Graceful fallback
}

export const supabase = supabaseClient;

