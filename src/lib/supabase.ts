// src/lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kpkbanrnhkznnzgnrhde.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwa2JhbnJuaGt6bm56Z25yaGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDkyNDksImV4cCI6MjA3MDQ4NTI0OX0.o7G1r6Hmi41V8GdIqdw_FRFvUKgK6grYjQqXfbzcXeA'; // Replace with your anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
