import type {
  RefreshTokenResponse,
  TokenPair,
} from "../types/auth";


const ACCESS_TOKEN_KEY = "fintrack.accessToken";
const REFRESH_TOKEN_KEY = "fintrack.refreshToken";


export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}


export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}


export function setAuthTokens(
  tokens: TokenPair | RefreshTokenResponse,
) {
  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    tokens.access,
  );

  if (tokens.refresh) {
    localStorage.setItem(
      REFRESH_TOKEN_KEY,
      tokens.refresh,
    );
  }
}


export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}


export function hasAuthSession() {
  return Boolean(
    getAccessToken() || getRefreshToken(),
  );
}
