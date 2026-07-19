import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const NOT_CONFIGURED_ERROR =
  'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  provider: string;
  bio: string;
}

interface AuthResult {
  error?: string;
  needsConfirmation?: boolean;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<AuthResult>;
  signup: (input: { name: string; email: string; password: string }) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (input: { name: string; bio: string }) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAppUser(user: User | null | undefined): AppUser | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? '',
    name: meta.name || user.email?.split('@')[0] || 'User',
    bio: meta.bio ?? '',
    provider: user.app_metadata?.provider ?? 'email',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: toAppUser(session?.user),
      loading,
      login: async ({ email, password }) => {
        if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR };
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          return error ? { error: error.message } : {};
        } catch (err) {
          return { error: err instanceof Error ? err.message : String(err) };
        }
      },
      signup: async ({ name, email, password }) => {
        if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR };
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
          });
          if (error) return { error: error.message };
          // 이메일 확인이 켜져 있으면 세션 없이 가입만 완료된다.
          return { needsConfirmation: !data.session };
        } catch (err) {
          return { error: err instanceof Error ? err.message : String(err) };
        }
      },
      loginWithGoogle: async () => {
        if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR };
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/mypage` },
          });
          return error ? { error: error.message } : {};
        } catch (err) {
          return { error: err instanceof Error ? err.message : String(err) };
        }
      },
      logout: async () => {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
      },
      updateProfile: async ({ name, bio }) => {
        if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR };
        try {
          const { error } = await supabase.auth.updateUser({ data: { name, bio } });
          return error ? { error: error.message } : {};
        } catch (err) {
          return { error: err instanceof Error ? err.message : String(err) };
        }
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
