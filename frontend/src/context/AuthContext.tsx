import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { apiLogin, apiImpersonate } from "../api/authService";
import type { AuthUser } from "../api/authService";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isImpersonating: boolean;
  impersonate: (userId: number) => Promise<void>;
  stopImpersonating: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "devolea_token";
const USER_KEY  = "devolea_user";
const SUPERADMIN_SESSION_KEY = "devolea_superadmin_session";

function loadFromStorage(): { token: string | null; user: AuthUser | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw   = localStorage.getItem(USER_KEY);
    const user  = raw ? (JSON.parse(raw) as AuthUser) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

function loadSuperadminSession(): { token: string; user: AuthUser } | null {
  try {
    const raw = localStorage.getItem(SUPERADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadFromStorage();
  const [token, setToken] = useState<string | null>(stored.token);
  const [user,  setUser]  = useState<AuthUser | null>(stored.user);
  const [superadminSession, setSuperadminSession] = useState<{ token: string; user: AuthUser } | null>(
    loadSuperadminSession
  );

  const persist = useCallback((t: string, u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiLogin(username, password);
    persist(res.token, res.user);
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SUPERADMIN_SESSION_KEY);
    setToken(null);
    setUser(null);
    setSuperadminSession(null);
  }, []);

  const impersonate = useCallback(async (userId: number) => {
    const res = await apiImpersonate(token!, userId);
    const session = { token: token!, user: user! };
    localStorage.setItem(SUPERADMIN_SESSION_KEY, JSON.stringify(session));
    setSuperadminSession(session);
    persist(res.token, res.user);
  }, [token, user, persist]);

  const stopImpersonating = useCallback(() => {
    if (!superadminSession) return;
    localStorage.removeItem(SUPERADMIN_SESSION_KEY);
    setSuperadminSession(null);
    persist(superadminSession.token, superadminSession.user);
  }, [superadminSession, persist]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!token,
      isImpersonating: superadminSession !== null,
      impersonate,
      stopImpersonating,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
