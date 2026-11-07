import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type AuthRole = 'traveler' | 'super_admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AuthRole;
  createdAt: string;
}

type StoredUser = AuthUser & { password: string };

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  loginAdmin: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signup: (input: { name: string; email: string; password: string; phone?: string }) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
}

const USERS_KEY = 'mh-travel-auth-users';
const SESSION_KEY = 'mh-travel-auth-session';
const AUTH_EVENT = 'mh-travel-auth-changed';
const DEMO_ADMIN: StoredUser = {
  id: 'super-admin-001',
  name: 'MH Travel Super Admin',
  email: 'superadmin@mhtravel.com',
  password: 'MHTravel@2026',
  role: 'super_admin',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function readUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [DEMO_ADMIN];
  try {
    const stored = window.localStorage.getItem(USERS_KEY);
    const users = stored ? (JSON.parse(stored) as StoredUser[]) : [];
    if (!users.some((user) => user.email === DEMO_ADMIN.email)) users.unshift(DEMO_ADMIN);
    return users;
  } catch {
    return [DEMO_ADMIN];
  }
}

function saveUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function publicUser(user: StoredUser): AuthUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function readSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(SESSION_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  } catch {
    return null;
  }
}

function emitAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readSession);

  useEffect(() => {
    const sync = () => setUser(readSession());
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isSuperAdmin: user?.role === 'super_admin',
    async login(email, password) {
      const normalizedEmail = email.trim().toLowerCase();
      const match = readUsers().find((candidate) => candidate.email === normalizedEmail && candidate.password === password);
      if (!match) return { ok: false, message: 'auth_invalid_credentials' };
      const safeUser = publicUser(match);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      window.localStorage.setItem('mh-travel-authenticated', 'true');
      setUser(safeUser);
      emitAuthChange();
      return { ok: true };
    },
    async loginAdmin(email, password) {
      const normalizedEmail = email.trim().toLowerCase();
      const match = readUsers().find((candidate) => candidate.email === normalizedEmail && candidate.password === password && candidate.role === 'super_admin');
      if (!match) return { ok: false, message: 'auth_admin_invalid_credentials' };
      const safeUser = publicUser(match);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      window.localStorage.setItem('mh-travel-authenticated', 'true');
      setUser(safeUser);
      emitAuthChange();
      return { ok: true };
    },
    async signup(input) {
      const name = input.name.trim();
      const email = input.email.trim().toLowerCase();
      if (name.length < 2) return { ok: false, message: 'auth_name_required' };
      if (!email.includes('@')) return { ok: false, message: 'auth_email_invalid' };
      if (input.password.length < 8) return { ok: false, message: 'auth_password_short' };
      const users = readUsers();
      if (users.some((candidate) => candidate.email === email)) return { ok: false, message: 'auth_email_exists' };
      const created: StoredUser = {
        id: `traveler-${Date.now()}`,
        name,
        email,
        phone: input.phone?.trim() || undefined,
        password: input.password,
        role: 'traveler',
        createdAt: new Date().toISOString(),
      };
      users.push(created);
      saveUsers(users);
      const safeUser = publicUser(created);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      window.localStorage.setItem('mh-travel-authenticated', 'true');
      setUser(safeUser);
      emitAuthChange();
      return { ok: true };
    },
    logout() {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem('mh-travel-authenticated');
      setUser(null);
      emitAuthChange();
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
