# SignalR Hub Contract

**Branch**: `main` | **Date**: 2026-04-04 | **Plan**: [../plan.md](../plan.md)

Hub URL: `/hubs/presence`
Transport: WebSocket preferred; fallback to Server-Sent Events, then Long Polling.

---

## Public Site → Hub (Client Methods — send)

### SendHeartbeat

Called by the public site on page load and every 30 seconds to signal active presence.
No authentication required. Fingerprint must have consent.

```ts
connection.invoke("SendHeartbeat", {
  fingerprint: string,  // SHA-256 hash (may be "anonymous" if no consent)
  pageUrl: string,      // current path, e.g. "/life-map"
  timestamp: string     // ISO 8601
})
```

**Response**: None (fire-and-forget from client perspective).

---

## Hub → Admin PWA (Server Methods — receive)

The Admin PWA MUST be connected with a valid owner JWT:

```
Authorization: Bearer {ownerJwt}
```

### ReceiveVisitorUpdate

Pushed to all connected admin clients when the active visitor list changes
(visitor joins, leaves, or changes page).

```ts
connection.on("ReceiveVisitorUpdate", (data: {
  activeVisitors: Array<{
    fingerprint: string,   // truncated (first 8 chars)
    currentPage: string,
    visitCount: number,
    countryCode: string | null,
    lastSeenAt: string     // ISO 8601
  }>
}) => { /* update dashboard */ })
```

### ReceiveNotification

Pushed to admin when a notable event occurs (new contact, new subscriber, etc.).

```ts
connection.on("ReceiveNotification", (data: {
  type: "new_contact" | "new_subscriber" | "visitor_milestone",
  title: string,
  body: string,
  timestamp: string
}) => { /* show notification */ })
```

---

## Connection Lifecycle

- Public site: connects on page load, disconnects on page unload. No auth.
- Admin PWA: connects on login, maintains persistent connection, reconnects on failure
  with exponential backoff (max 30-second interval).
- Visitor considered "inactive" if no heartbeat received in 2 minutes.
- Hub prunes inactive visitors from the active list every 60 seconds.
