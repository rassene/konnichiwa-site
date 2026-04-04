# API Contract: .NET REST API

**Branch**: `main` | **Date**: 2026-04-04 | **Plan**: [../plan.md](../plan.md)

Base URL (production): `https://api.[firstname].com`
Base URL (local dev): `http://localhost:5000`

All endpoints return `application/json`. Error responses follow the shape:

```json
{
  "error": "string",
  "detail": "string (optional)"
}
```

Rate limiting: applied per IP unless otherwise noted.

---

## Public Endpoints (No Auth)

### POST /api/visitor/identify

Record a visitor fingerprint. Must be called with user consent (GDPR).

**Request**:
```json
{
  "fingerprint": "string (SHA-256 hash, 64 chars)",
  "pageUrl": "string (current page path)"
}
```

**Response 200**:
```json
{
  "returning": true,
  "visitCount": 5
}
```

**Response 400**: Malformed fingerprint.
**Response 451**: Consent not given (GDPR — EU IP without consent header).

Headers: `X-Consent-Given: true` required for EU IPs.

---

### POST /api/contact

Submit a contact form message.

**Request**:
```json
{
  "name": "string (max 100)",
  "email": "string (valid email, max 254)",
  "subject": "general | collaboration | academic | work | other",
  "message": "string (max 1000)",
  "honeypot": "string (must be empty — bot detection)"
}
```

**Response 200**:
```json
{ "received": true }
```

**Response 400**: Validation error.
**Response 429**: Rate limit exceeded (3 per IP per hour).

---

### POST /api/newsletter/subscribe

Initiate subscription. Triggers double opt-in email.

**Request**:
```json
{
  "email": "string (valid email)",
  "clusters": ["string (cluster slugs, at least 1)"]
}
```

**Response 200**:
```json
{ "pending": true, "message": "Check your email to confirm your subscription." }
```

**Response 400**: Validation error.
**Response 409**: Email already has an active subscription.

---

### GET /api/newsletter/confirm?token={token}

Confirm double opt-in. Issued subscriber access JWT.

**Query params**: `token` (string, URL-safe random token)

**Response 200**:
```json
{
  "confirmed": true,
  "accessToken": "string (JWT, 30-day expiry)",
  "clusters": ["string"]
}
```

**Response 400**: Invalid or expired token (24-hour TTL).
**Response 409**: Email already confirmed.

---

### POST /api/subscriber/verify

Validate a subscriber's access token. Used by frontend to gate T1 content.

**Request**:
```json
{ "token": "string (JWT)" }
```

**Response 200**:
```json
{
  "valid": true,
  "clusters": ["string"],
  "expiresAt": "ISO 8601"
}
```

**Response 401**: Invalid or expired token.

---

### DELETE /api/newsletter/unsubscribe

Unsubscribe. Requires valid subscriber JWT.

**Headers**: `Authorization: Bearer {subscriberJwt}`

**Response 200**:
```json
{ "unsubscribed": true }
```

**Response 401**: Missing or invalid token.

---

## Admin Endpoints (Owner Auth Required)

All admin endpoints require `Authorization: Bearer {ownerJwt}` where the JWT contains
`role: owner`. The owner JWT is issued by the Admin PWA login endpoint.

### POST /api/admin/auth/login

Issue owner access token.

**Request**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200**:
```json
{
  "accessToken": "string (JWT, 15-min expiry)",
  "expiresAt": "ISO 8601"
}
```
Sets `HttpOnly` cookie: `refresh_token` (30-day expiry).

**Response 401**: Invalid credentials.

---

### POST /api/admin/auth/refresh

Exchange refresh token cookie for new access token.

**Request**: No body — reads `refresh_token` HttpOnly cookie.

**Response 200**: Same as login response above.
**Response 401**: Missing, invalid, or expired refresh token.

---

### POST /api/admin/auth/logout

Revoke refresh token.

**Response 200**: `{ "loggedOut": true }`. Clears `refresh_token` cookie.

---

### GET /api/admin/visitors

Active visitor list (last heartbeat within 2 minutes).

**Response 200**:
```json
[
  {
    "fingerprint": "string (truncated — first 8 chars only)",
    "currentPage": "string",
    "visitCount": 5,
    "countryCode": "FR",
    "lastSeenAt": "ISO 8601"
  }
]
```

---

### GET /api/admin/contacts

Contact form submissions.

**Query params**: `page` (int, default 1), `pageSize` (int, default 20), `unreadOnly`
(bool, default false)

**Response 200**:
```json
{
  "total": 42,
  "items": [
    {
      "id": "guid",
      "name": "string",
      "email": "string",
      "subject": "string",
      "message": "string",
      "submittedAt": "ISO 8601",
      "isRead": false
    }
  ]
}
```

---

### PATCH /api/admin/contacts/{id}/read

Mark a contact submission as read.

**Response 200**: `{ "marked": true }`
**Response 404**: Contact not found.

---

### GET /api/admin/subscribers

Subscriber list.

**Query params**: `cluster` (string, filter by slug), `page`, `pageSize`

**Response 200**:
```json
{
  "total": 150,
  "items": [
    {
      "id": "guid",
      "email": "string",
      "clusters": ["string"],
      "confirmedAt": "ISO 8601",
      "lastAccessAt": "ISO 8601 | null",
      "active": true
    }
  ]
}
```

---

### PATCH /api/admin/subscribers/{id}/deactivate

Deactivate a subscriber (does not delete record).

**Response 200**: `{ "deactivated": true }`
**Response 404**: Subscriber not found.

---

### POST /api/admin/newsletter/dispatch

Trigger a newsletter dispatch for a specific CMS post to the relevant clusters.

**Request**:
```json
{
  "postSlug": "string (musing-post slug from CMS)",
  "clusters": ["string"],
  "subject": "string (email subject line)"
}
```

**Response 202**: Accepted — job enqueued.
```json
{ "jobId": "string (Hangfire job ID)", "status": "queued" }
```

**Response 400**: Validation error.

---

### PUT /api/admin/push/register

Register or update the owner's Web Push subscription.

**Request**:
```json
{
  "endpoint": "string",
  "keys": {
    "p256dh": "string (Base64url)",
    "auth": "string (Base64url)"
  }
}
```

**Response 200**: `{ "registered": true }`

---

### DELETE /api/admin/push/unregister

Remove the owner's push subscription (e.g. before switching devices).

**Response 200**: `{ "unregistered": true }`
