/**
 * Visitor fingerprinting service.
 *
 * Initializes FingerprintJS OSS on page load, hashes the visitor ID with SHA-256,
 * and POSTs to /api/visitor/identify. Returns { returning, visitCount } from the API.
 *
 * Must only run after the user has given consent (GDPR).
 * Call `identify()` explicitly — this module does NOT auto-run on import.
 *
 * JS cost: ~14 KB gzipped (FingerprintJS OSS). Justified: enables personalization
 * (Welcome Back message) and real-time admin dashboard presence.
 */

import FingerprintJS from "@fingerprintjs/fingerprintjs";

export interface VisitorResult {
  returning: boolean;
  visitCount: number;
}

const API_BASE = import.meta.env.PUBLIC_API_URL ?? "http://localhost:5000";

/** SHA-256 hash of a string, returned as a lowercase hex string (64 chars). */
async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Identify the current visitor.
 * Returns the API result, or null on any error (network, consent, etc.).
 */
export async function identify(): Promise<VisitorResult | null> {
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    const fingerprint = await sha256Hex(result.visitorId);
    const pageUrl = window.location.pathname;

    const response = await fetch(`${API_BASE}/api/visitor/identify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint, pageUrl }),
    });

    if (!response.ok) return null;

    return (await response.json()) as VisitorResult;
  } catch {
    // Never throw — fingerprinting is non-critical; site must not break on failure.
    return null;
  }
}
