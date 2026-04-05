/**
 * Client-side subscriber service (T084).
 * Reads `sub_token` from localStorage, verifies via POST /api/subscriber/verify,
 * caches the result in sessionStorage to avoid repeated API calls within a session.
 *
 * JS cost: included in pages that import this module. Only import where gating is needed.
 */

const TOKEN_KEY   = 'sub_token';
const CACHE_KEY   = 'sub_verify_cache';
const API_URL     = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:5000';

export interface SubscriberInfo {
  valid:    boolean;
  clusters: string[];
  expiresAt: string; // ISO 8601
}

const INVALID_RESULT: SubscriberInfo = { valid: false, clusters: [], expiresAt: '' };

/**
 * Get the stored subscriber JWT from localStorage, or null if absent.
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Store the subscriber JWT in localStorage.
 * Called after a successful confirmation flow.
 */
export function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    // Clear any stale session cache so next verify call uses the fresh token.
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // Storage may be unavailable (private browsing, quota exceeded).
  }
}

/**
 * Remove the subscriber JWT from localStorage.
 * Called on unsubscribe.
 */
export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Verify the stored subscriber token against the API.
 * Results are cached per-session to avoid redundant requests.
 *
 * If the API returns a `newToken` (sliding-window renewal), it is automatically
 * persisted to localStorage and the cache is updated.
 *
 * Returns `{ valid: false }` if no token is stored or verification fails.
 */
export async function verifySubscriber(): Promise<SubscriberInfo> {
  const token = getStoredToken();
  if (!token) return INVALID_RESULT;

  // Check session cache first.
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as SubscriberInfo;
      if (parsed.valid) return parsed;
    }
  } catch {
    // Ignore cache parse errors.
  }

  try {
    const response = await fetch(`${API_URL}/api/subscriber/verify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    });

    if (!response.ok) {
      clearToken();
      return INVALID_RESULT;
    }

    const data = await response.json() as {
      valid:     boolean;
      clusters:  string[];
      expiresAt: string;
      newToken?: string;
    };

    if (data.newToken) {
      storeToken(data.newToken);
    }

    const result: SubscriberInfo = {
      valid:     data.valid,
      clusters:  data.clusters,
      expiresAt: data.expiresAt,
    };

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch {
      // ignore
    }

    return result;
  } catch {
    return INVALID_RESULT;
  }
}

/**
 * Check if the subscriber has access to a specific cluster.
 */
export async function hasClusterAccess(clusterSlug: string): Promise<boolean> {
  const info = await verifySubscriber();
  return info.valid && info.clusters.includes(clusterSlug);
}

/**
 * Export a pre-built service object for convenient import.
 */
export const subscriberService = {
  getStoredToken,
  storeToken,
  clearToken,
  verifySubscriber,
  hasClusterAccess,
};
