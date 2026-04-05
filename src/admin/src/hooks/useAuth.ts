/**
 * Auth context + hook for the Admin PWA.
 *
 * On app boot, attempts a silent token refresh (reads the HttpOnly cookie).
 * If refresh succeeds, the session is restored transparently.
 * If it fails, the user is sent to /login.
 *
 * Access token lives in memory via authService — never in localStorage.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { login as apiLogin, logout as apiLogout, refresh } from "../services/authService";

interface AuthState {
  authenticated: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ authenticated: false, loading: true });

  // Attempt silent refresh on mount to restore session from HttpOnly cookie.
  useEffect(() => {
    refresh().then((token) => {
      setState({ authenticated: token !== null, loading: false });
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await apiLogin(email, password);
    setState({ authenticated: true, loading: false });
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setState({ authenticated: false, loading: false });
  }, []);

  return (
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
