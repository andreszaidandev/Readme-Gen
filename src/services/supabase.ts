import { createClient, type AuthResponse, type Session, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const SUPABASE_CONFIG_ERROR =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? null
    : 'Supabase auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your env file.';

let supabaseClient: SupabaseClient | null = null;

if (!SUPABASE_CONFIG_ERROR) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(SUPABASE_CONFIG_ERROR ?? 'Supabase auth client is unavailable.');
  }
  return supabaseClient;
}

function getRedirectTo(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return `${window.location.origin}${window.location.pathname}`;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

export function onSupabaseAuthStateChange(listener: (session: Session | null) => void) {
  return getSupabaseClient().auth.onAuthStateChange((_event, session) => {
    listener(session);
  });
}

async function signInWithOAuth(provider: 'github'): Promise<void> {
  const { error } = await getSupabaseClient().auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getRedirectTo(),
    },
  });

  if (error) {
    throw error;
  }
}

export async function signInWithGithub(): Promise<void> {
  await signInWithOAuth('github');
}

export async function signInWithEmailPassword(email: string, password: string): Promise<AuthResponse> {
  const response = await getSupabaseClient().auth.signInWithPassword({
    email,
    password,
  });

  if (response.error) {
    throw response.error;
  }

  return response;
}

export async function signUpWithEmailPassword(email: string, password: string): Promise<AuthResponse> {
  const response = await getSupabaseClient().auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getRedirectTo(),
    },
  });

  if (response.error) {
    throw response.error;
  }

  return response;
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) {
    throw error;
  }
}
