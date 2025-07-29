import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'crown'
    }
  }
});

// Helper function to clear all Supabase-related data from storage
const clearSupabaseData = () => {
  try {
    // Clear session storage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        sessionStorage.removeItem(key);
      }
    });

    // Clear local storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

export const signOut = async () => {
  try {
    // Clear storage first to ensure local state is cleaned up
    clearSupabaseData();
    
    // Attempt to sign out from Supabase, but don't throw if it fails
    await supabase.auth.signOut().catch(console.error);
  } catch (error) {
    console.error('Error during sign out:', error);
    // Ensure storage is cleared even if sign out fails
    clearSupabaseData();
  }
};