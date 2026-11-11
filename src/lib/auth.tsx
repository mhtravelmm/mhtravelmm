import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';

export type AuthRole = 'traveler' | 'super_admin' | 'owner_admin';
export type OAuthProvider = 'google' | 'facebook';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: AuthRole;
  createdAt: string;
}

type StoredUser = AuthUser & { password: string };
type AuthResult = { ok: boolean; message?: string; role?: AuthRole };

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isShopOwner: boolean;
  login: (identifier: string, password: string) => Promise<AuthResult>;
  loginAdmin: (identifier: string, password: string) => Promise<AuthResult>;
  createShopOwner: (input: { owner: string; shop: string; email: string; phone: string; username: string; password: string; city: string; category: string }) => Promise<AuthResult>;
  loginWithProvider: (provider: OAuthProvider) => Promise<{ ok: boolean; message?: string }>;
  signup: (input: { username: string; name: string; email: string; password: string }) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
}

const USERS_KEY = 'mh-travel-auth-users';
const SESSION_KEY = 'mh-travel-auth-session';
const AUTH_EVENT = 'mh-travel-auth-changed';
const DEMO_ADMIN: StoredUser = {
  id: 'super-admin-001',
  name: 'MH Travel Super Admin',
  username: 'superadmin',
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

function saveUsers(users: StoredUser[]) { window.localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function publicUser(user: StoredUser): AuthUser { const safeUser = { ...user }; Reflect.deleteProperty(safeUser, 'password'); return safeUser; }
function readSession(): AuthUser | null { if (typeof window === 'undefined') return null; try { const stored = window.localStorage.getItem(SESSION_KEY); return stored ? (JSON.parse(stored) as AuthUser) : null; } catch { return null; } }
function emitAuthChange() { window.dispatchEvent(new Event(AUTH_EVENT)); }
function clearLocalSession() { window.localStorage.removeItem(SESSION_KEY); window.localStorage.removeItem('mh-travel-authenticated'); }
function mapRole(value: unknown): AuthRole { return value === 'super_admin' || value === 'owner_admin' ? value : 'traveler'; }
function setLocalSession(user: StoredUser, setUser: (user: AuthUser) => void) { const safeUser = publicUser(user); window.localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser)); window.localStorage.setItem('mh-travel-authenticated', 'true'); setUser(safeUser); emitAuthChange(); }

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readSession);

  useEffect(() => {
    const syncLocal = () => setUser(readSession());
    window.addEventListener(AUTH_EVENT, syncLocal);
    window.addEventListener('storage', syncLocal);
    if (!isSupabaseConfigured || !supabase) return () => { window.removeEventListener(AUTH_EVENT, syncLocal); window.removeEventListener('storage', syncLocal); };

    let active = true;
    async function hydrate(session: Session | null) {
      if (!session?.user || !active || !supabase) return;
      const authUser: SupabaseUser = session.user;
      const { data: profile } = await supabase.from('profiles').select('username, display_name, role, created_at').eq('id', authUser.id).maybeSingle();
      if (!active) return;
      const hydrated: AuthUser = {
        id: authUser.id,
        name: profile?.display_name || authUser.user_metadata?.display_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Traveler',
        username: profile?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || `traveler_${authUser.id.slice(0, 8)}`,
        email: authUser.email || '',
        role: mapRole(profile?.role),
        createdAt: profile?.created_at || authUser.created_at,
      };
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(hydrated));
      window.localStorage.setItem('mh-travel-authenticated', 'true');
      setUser(hydrated);
    }

    void supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { clearLocalSession(); setUser(null); return; }
      void hydrate(session);
    });
    return () => { active = false; listener.subscription.unsubscribe(); window.removeEventListener(AUTH_EVENT, syncLocal); window.removeEventListener('storage', syncLocal); };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isSuperAdmin: user?.role === 'super_admin',
    isShopOwner: user?.role === 'owner_admin',
    async login(identifier, password) {
      const normalizedIdentifier = identifier.trim().toLowerCase();
      if (isSupabaseConfigured && supabase && normalizedIdentifier.includes('@')) {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedIdentifier, password });
        return error ? { ok: false, message: 'auth_invalid_credentials' } : { ok: true };
      }
      const match = readUsers().find((candidate) => (candidate.email === normalizedIdentifier || candidate.username === normalizedIdentifier) && candidate.password === password && candidate.role === 'traveler');
      if (!match) return { ok: false, message: 'auth_invalid_credentials' };
      const safeUser = publicUser(match); window.localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser)); window.localStorage.setItem('mh-travel-authenticated', 'true'); setUser(safeUser); emitAuthChange(); return { ok: true };
    },
    async loginAdmin(identifier, password) {
      const normalizedIdentifier = identifier.trim().toLowerCase();
      if (isSupabaseConfigured && supabase && normalizedIdentifier.includes('@')) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedIdentifier, password });
        if (!error && data.user) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
          if (profile?.role === 'super_admin' || profile?.role === 'owner_admin') return { ok: true, role: profile.role };
          await supabase.auth.signOut();
          return { ok: false, message: 'auth_admin_required' };
        }
        return { ok: false, message: 'auth_admin_invalid_credentials' };
      }
      const match = readUsers().find((candidate) => (candidate.email === normalizedIdentifier || candidate.username === normalizedIdentifier) && candidate.password === password && (candidate.role === 'super_admin' || candidate.role === 'owner_admin'));
      if (!match) return { ok: false, message: 'auth_admin_invalid_credentials' };
      setLocalSession(match, setUser); return { ok: true, role: match.role };
    },
    async createShopOwner(input) {
      const username = input.username.trim().toLowerCase();
      const email = input.email.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,32}$/.test(username)) return { ok: false, message: 'auth_username_invalid' };
      if (input.password.length < 8) return { ok: false, message: 'auth_password_short' };
      const users = readUsers();
      if (users.some((candidate) => candidate.username === username)) return { ok: false, message: 'auth_username_exists' };
      if (users.some((candidate) => candidate.email === email)) return { ok: false, message: 'auth_email_exists' };
      const created: StoredUser = { id: `owner-${Date.now()}`, name: input.owner, username, email, password: input.password, role: 'owner_admin', createdAt: new Date().toISOString() };
      users.push(created);
      saveUsers(users);
      return { ok: true, role: 'owner_admin' };
    },
    async loginWithProvider(provider) {
      if (!isSupabaseConfigured || !supabase) return { ok: false, message: 'auth_social_setup_pending' };
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/login` } });
      return error ? { ok: false, message: 'auth_social_setup_pending' } : { ok: true };
    },
    async signup(input) {
      const name = input.name.trim(); const username = input.username.trim().toLowerCase(); const email = input.email.trim().toLowerCase();
      if (name.length < 2) return { ok: false, message: 'auth_name_required' };
      if (!/^[a-z0-9_]{3,24}$/.test(username)) return { ok: false, message: 'auth_username_invalid' };
      if (!email.includes('@')) return { ok: false, message: 'auth_email_invalid' };
      if (input.password.length < 8) return { ok: false, message: 'auth_password_short' };
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signUp({ email, password: input.password, options: { data: { username, display_name: name } } });
        return error ? { ok: false, message: error.message.toLowerCase().includes('already') ? 'auth_email_exists' : 'auth_generic_error' } : { ok: true };
      }
      const users = readUsers();
      if (users.some((candidate) => candidate.email === email)) return { ok: false, message: 'auth_email_exists' };
      if (users.some((candidate) => candidate.username === username)) return { ok: false, message: 'auth_username_exists' };
      const created: StoredUser = { id: `traveler-${Date.now()}`, name, username, email, password: input.password, role: 'traveler', createdAt: new Date().toISOString() };
      users.push(created); saveUsers(users); const safeUser = publicUser(created); window.localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser)); window.localStorage.setItem('mh-travel-authenticated', 'true'); setUser(safeUser); emitAuthChange(); return { ok: true };
    },
    logout() { if (supabase) void supabase.auth.signOut(); clearLocalSession(); setUser(null); emitAuthChange(); },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context; }
