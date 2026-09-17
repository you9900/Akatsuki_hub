import { createClient } from '@supabase/supabase-js';

// Renseigne ces deux valeurs avec celles de ton projet Supabase
// (Project Settings -> API). Idéalement via des variables d'env Vite :
// VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans un fichier .env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://TON-PROJET.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'TON_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
