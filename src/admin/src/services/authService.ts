/**
 * Admin auth service — login, token refresh, logout.
 *
 * Access token is stored in memory only (short 15-minute expiry).
 * Refresh token is managed as an HttpOnly cookie by the API.
 * Axios interceptor automatically retries failed requests after refreshing.
 */

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send HttpOnly refresh_token cookie on every request
});

// In-memory access token (never persisted to localStorage).
let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

function setAccessToken(token: string | null): void {
  _accessToken = token;
}

// Inject Bearer token on every request.
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// On 401 — try a silent refresh once, then redirect to /login.
let _refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      // Deduplicate concurrent 401s — only one refresh in flight at a time.
      _refreshing ??= refresh().finally(() => { _refreshing = null; });
      const token = await _refreshing;

      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }

      // Refresh failed — clear state and bounce to login.
      setAccessToken(null);
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Public API ────────────────────────────────────────────────────────────────

export interface LoginResult {
  accessToken: string;
  expiresAt: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const { data } = await api.post<LoginResult>("/api/admin/auth/login", {
    email,
    password,
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function refresh(): Promise<string | null> {
  try {
    const { data } = await api.post<LoginResult>("/api/admin/auth/refresh");
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post("/api/admin/auth/logout");
  } finally {
    setAccessToken(null);
  }
}
