import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl) {
  throw new Error('Falta configurar la variable VITE_SUPABASE_URL.');
}

if (!supabaseAnonKey) {
  throw new Error('Falta configurar la variable VITE_SUPABASE_ANON_KEY.');
}

if (supabaseAnonKey.startsWith('sb_secret_')) {
  throw new Error('VITE_SUPABASE_ANON_KEY debe contener una clave pública, nunca una clave secreta.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
  },
});
