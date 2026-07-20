import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const NOT_CONFIGURED_ERROR =
  'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.';

export type Plan = 'free' | 'pro';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  provider: string;
  bio: string;
  plan: Plan;
}

interface ProfileRow {
  name: string;
  bio: string;
  plan: Plan;
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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function fallbackName(email: string) {
  return email.split('@')[0] || 'User';
}

// profiles 테이블에 아직 행이 없는 경우(예: 트리거 도입 전 가입한 계정)를 대비해
// 없으면 auth 메타데이터 기반 기본값으로 대체한다. 실제 행은 최초 저장 시 upsert로 생성된다.
async function fetchProfile(userId: string, email: string, metaName?: string): Promise<ProfileRow> {
  const { data } = await supabase.from('profiles').select('name,bio,plan').eq('id', userId).maybeSingle();
  if (data) {
    return {
      name: data.name || fallbackName(email),
      bio: data.bio ?? '',
      plan: data.plan === 'pro' ? 'pro' : 'free',
    };
  }
  return { name: metaName || fallbackName(email), bio: '', plan: 'free' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setSessionLoading(false));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setSessionLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  const loadProfile = useCallback(async () => {
    if (!userId || !session?.user) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    try {
      const row = await fetchProfile(userId, session.user.email ?? '', session.user.user_metadata?.name);
      setProfile(row);
    } finally {
      setProfileLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(() => {
    const user: AppUser | null = session?.user
      ? {
          id: session.user.id,
          email: session.user.email ?? '',
          name: profile?.name ?? fallbackName(session.user.email ?? ''),
          bio: profile?.bio ?? '',
          plan: profile?.plan ?? 'free',
          provider: session.user.app_metadata?.provider ?? 'email',
        }
      : null;

    return {
      user,
      loading: sessionLoading || profileLoading,
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
        if (!session?.user) return { error: 'Not signed in.' };
        try {
          const { error } = await supabase
            .from('profiles')
            .upsert({ id: session.user.id, name, bio, updated_at: new Date().toISOString() });
          if (error) return { error: error.message };
          setProfile((prev) => ({ name, bio, plan: prev?.plan ?? 'free' }));
          return {};
        } catch (err) {
          return { error: err instanceof Error ? err.message : String(err) };
        }
      },
      refreshProfile: loadProfile,
    };
  }, [session, sessionLoading, profile, profileLoading, loadProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
