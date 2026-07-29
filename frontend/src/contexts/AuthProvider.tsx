import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api } from "../services/api";
import {
  AUTH_SESSION_EXPIRED_EVENT,
} from "../services/authEvents";
import {
  clearAuthTokens,
  hasAuthSession,
  setAuthTokens,
} from "../services/authStorage";
import type {
  LoginCredentials,
  TokenPair,
  User,
} from "../types/auth";
import { AuthContext } from "./auth-context";


interface AuthProviderProps {
  children: ReactNode;
}


export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);


  const clearSession = useCallback(() => {
    clearAuthTokens();
    setUser(null);
  }, []);


  useEffect(() => {
    function handleSessionExpired() {
      clearSession();
      setLoading(false);
    }

    window.addEventListener(
      AUTH_SESSION_EXPIRED_EVENT,
      handleSessionExpired,
    );

    return () => {
      window.removeEventListener(
        AUTH_SESSION_EXPIRED_EVENT,
        handleSessionExpired,
      );
    };
  }, [clearSession]);


  useEffect(() => {
    async function loadCurrentUser() {
      if (!hasAuthSession()) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get<User>(
          "/auth/me/",
        );

        setUser(response.data);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    }

    void loadCurrentUser();
  }, [clearSession]);


  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        const tokenResponse =
          await api.post<TokenPair>(
            "/auth/login/",
            credentials,
          );

        setAuthTokens(tokenResponse.data);

        const userResponse = await api.get<User>(
          "/auth/me/",
        );

        setUser(userResponse.data);
      } catch (error) {
        clearSession();
        throw error;
      }
    },
    [clearSession],
  );


  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);


  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  );


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
