/**
 * Real-time presence service — public site side.
 *
 * Connects to the SignalR /hubs/presence hub after the visitor fingerprint is
 * resolved. Calls SendHeartbeat on load and every 30 seconds so the admin
 * dashboard shows active visitors in real time.
 *
 * Only connects when the user has given GDPR consent (i.e. `identify()` resolved
 * successfully). Disconnects automatically on page unload.
 *
 * JS cost: @microsoft/signalr (~42 KB gzipped). This file is imported from
 * WelcomeBack.tsx which is already hydrated; no additional bundle cost.
 */

import * as signalR from "@microsoft/signalr";

const HUB_URL = `${import.meta.env.PUBLIC_API_URL ?? "http://localhost:5000"}/hubs/presence`;

let connection: signalR.HubConnection | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start the presence connection.
 * Called by WelcomeBack after fingerprint identification succeeds.
 */
export async function startPresence(fingerprint: string): Promise<void> {
  if (connection) return; // already started

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL)
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  try {
    await connection.start();
    await sendHeartbeat(fingerprint);

    heartbeatTimer = setInterval(() => sendHeartbeat(fingerprint), 30_000);

    window.addEventListener("beforeunload", stop);
  } catch {
    // Presence is non-critical; swallow errors silently.
    connection = null;
  }
}

async function sendHeartbeat(fingerprint: string): Promise<void> {
  if (connection?.state !== signalR.HubConnectionState.Connected) return;
  try {
    await connection.invoke("SendHeartbeat", fingerprint, window.location.pathname);
  } catch {
    // Ignore transient failures.
  }
}

/** Disconnect and clean up (called on page unload). */
export function stop(): void {
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  connection?.stop();
  connection = null;
}
