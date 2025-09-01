// lib/supabase/browser.ts
'use client';

import { createClient } from '@supabase/supabase-js';

const RAW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const RAW_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// Garde-fous utiles en dev
if (!RAW_URL || !/^https?:\/\//.test(RAW_URL)) {
  throw new Error(
    'Supabase URL manquante ou invalide. Vérifie NEXT_PUBLIC_SUPABASE_URL (https://xxxx.supabase.co)'
  );
}
if (!RAW_KEY || RAW_KEY.length < 40) {
  throw new Error(
    'Supabase ANON KEY manquante ou invalide. Vérifie NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Normalise (retire éventuel slash final)
const SUPABASE_URL = RAW_URL.replace(/\/+$/, '');
const SUPABASE_ANON_KEY = RAW_KEY;

export const supabaseBrowser = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce',
    },
  }
);