import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface MockUser {
  name: string;
  email: string;
  provider: 'email' | 'google';
  bio: string;
}

interface AuthContextValue {
  user: MockUser | null;
  login: (input: { name: string; email: string }) => void;
  loginWithGoogle: () => void;
  logout: () => void;
  updateProfile: (input: { name: string; bio: string }) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'kfitjudge-mock-user';

function readStoredUser(): MockUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MockUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(readStoredUser);

  useEffect(() => {
    if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: ({ name, email }) => setUser({ name: name || email.split('@')[0], email, provider: 'email', bio: '' }),
      loginWithGoogle: () =>
        setUser({ name: 'Google 사용자', email: 'google.user@gmail.com', provider: 'google', bio: '' }),
      logout: () => setUser(null),
      updateProfile: ({ name, bio }) =>
        setUser((prev) => (prev ? { ...prev, name, bio } : prev)),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
