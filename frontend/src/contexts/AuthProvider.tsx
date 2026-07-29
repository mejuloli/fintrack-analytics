import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api } from "../services/api";
import type {
  LoginCredentials,
  TokenPair,
  User,
} from "../types/auth";
import { AuthContext } from "./auth-context";


const ACCESS_TOKEN_KEY = "fintrack.accessToken";
const REFRESH_TOKEN_KEY = "fintrack.refreshToken";


interface AuthProviderProps {
  children: ReactNode;
}


export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);


  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
  }, []);


  useEffect(() => {
    async function loadCurrentUser() {
      const accessToken = localStorage.getItem(
        ACCESS_TOKEN_KEY,
      );

      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get<User>("/auth/me/");
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
        const tokenResponse = await api.post<TokenPair>(
          "/auth/login/",
          credentials,
        );

        localStorage.setItem(
          ACCESS_TOKEN_KEY,
          tokenResponse.data.access,
        );

        localStorage.setItem(
          REFRESH_TOKEN_KEY,
          tokenResponse.data.refresh,
        );

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
