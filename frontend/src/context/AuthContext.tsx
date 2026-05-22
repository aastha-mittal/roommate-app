import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { auth as authApi } from "../api/client";

interface User {
  id: string;
  email: string;
  onboardingComplete: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  setTokenFromSso: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function safeStorage() {
  return {
    get: (k: string) => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set: (k: string, v: string) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* private mode */
      }
    },
    remove: (k: string) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const storage = safeStorage();

  const refreshUser = useCallback(async () => {
    const token = storage.get("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const t = window.setTimeout(() => controller.abort(), 12_000);
    try {
      const me = await authApi.me(controller.signal);
      setUser(me);
    } catch {
      storage.remove("token");
      setUser(null);
    } finally {
      window.clearTimeout(t);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { user: u, token } = await authApi.login(email, password);
    storage.set("token", token);
    setUser(u);
  };

  const register = async (email: string, password: string) => {
    const { user: u, token } = await authApi.register(email, password);
    storage.set("token", token);
    setUser(u);
  };

  const setTokenFromSso = async (token: string) => {
    storage.set("token", token);
    const me = await authApi.me();
    setUser(me);
  };

  const logout = () => {
    storage.remove("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, setUser, login, register, setTokenFromSso, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
