import axios from "axios";
import type {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

import type {
  RefreshTokenResponse,
} from "../types/auth";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "./authStorage";
import {
  notifyAuthSessionExpired,
} from "./authEvents";


const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000/api";


interface RetryableRequestConfig
  extends InternalAxiosRequestConfig {
  _retry?: boolean;
}


export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});


const refreshApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});


let refreshPromise: Promise<string> | null = null;


function isAuthenticationRequest(
  url?: string,
) {
  if (!url) {
    return false;
  }

  return (
    url.includes("/auth/login/") ||
    url.includes("/auth/refresh/")
  );
}


function expireSession() {
  clearAuthTokens();
  notifyAuthSessionExpired();
}


async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error(
      "Refresh token não encontrado.",
    );
  }

  const response =
    await refreshApi.post<RefreshTokenResponse>(
      "/auth/refresh/",
      {
        refresh: refreshToken,
      },
    );

  setAuthTokens(response.data);

  return response.data.access;
}


function getFreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken()
      .catch((error: unknown) => {
        expireSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}


api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.set(
      "Authorization",
      `Bearer ${accessToken}`,
    );
  }

  return config;
});


api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as
        | RetryableRequestConfig
        | undefined;

    const shouldTryRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthenticationRequest(
        originalRequest.url,
      );

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    if (!getRefreshToken()) {
      expireSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken =
        await getFreshAccessToken();

      originalRequest.headers.set(
        "Authorization",
        `Bearer ${accessToken}`,
      );

      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
