# Data Model: Konnichiwa — Personal Website

**Branch**: `main` | **Date**: 2026-04-04 | **Plan**: [plan.md](plan.md)

Two distinct data layers exist:

1. **CMS Layer** (Strapi) — content entities authored by the owner (milestones, family
   members, projects, readings, musings, resume). Accessed exclusively through the CAL.
2. **API Layer** (.NET / Azure SQL) — operational data managed by the .NET API
   (subscribers, contacts, visitors, push subscriptions, Hangfire jobs).

---

## Part 1: Content Abstraction Layer (CAL) — TypeScript Interfaces

These interfaces are the canonical contract between the frontend and any CMS.
Defined at `/src/site/src/content/interfaces/index.ts`.

### IMedia

```ts
export interface IMedia {
  url: string       // CDN URL (Azure Blob + Microsoft CDN)
  alt: string
  width?: number
  height?: number
  blurHash?: string // low-res placeholder for progressive loading
}
```

### IMilestone

```ts
export interface IMilestone {
  id: string
  date: string      // ISO 8601 (YYYY-MM-DD)
  title: string
  description: string
  category: 'academic' | 'personal' | 'professional' | 'social' | 'creative' | 'future'
  media?: IMedia[]
  featured: boolean
}
```

Validation rules:
- `date` must be a valid ISO 8601 date string.
- `title` max 120 chars.
- `description` max 500 chars.
- `featured` milestones displayed at larger scale on the Life Map.
- `category: 'future'` renders with a distinct visual indicator on the timeline.

### IFamilyMember

```ts
export interface IFamilyMember {
  id: string
  name: string
  relation: string    // e.g. "Mum", "Big Brother", "Little Sister"
  tagline: string     // one-sentence description, max 120 chars
  photo: IMedia
  funFacts: string[]  // 2–4 items, each max 100 chars
  emoji?: string      // optional signature emoji
  order: number       // display order in family scene
}
```

### IProject

```ts
export interface IProject {
  id: string
  slug: string
  title: string
  status: 'idea' | 'in-progress' | 'completed' | 'paused'
  description: string   // short, max 200 chars
  body?: string         // rich text for project detail page
  tags: string[]
  links?: { label: string; url: string }[]
  startDate?: string    // ISO 8601
  endDate?: string      // ISO 8601
  media?: IMedia[]
  featured: boolean
}
```

Validation rules:
- `slug` must be URL-safe (lowercase, hyphens only).
- `featured` projects render as hero cards in the grid.
- Featured projects get their own URL route at `/projects/[slug]`.

### IReading

```ts
export interface IReading {
  id: string
  title: string
  author: string
  type: 'book' | 'article' | 'paper' | 'podcast' | 'video'
  status: 'reading' | 'completed' | 'want-to-read'
  rating?: 1 | 2 | 3 | 4 | 5
  note?: string          // owner's take — may be T1-gated
  noteIsGated: boolean   // true = T1 subscribers only see full note
  clusters: string[]     // interest cluster slugs
  dateAdded: string      // ISO 8601
  coverUrl?: string      // optional cover image URL
}
```

### IMusingPost

```ts
export interface IMusingPost {
  id: string
  slug: string
  title: string
  body: string            // rich text / markdown
  excerpt: string         // max 200 chars, shown to T0 users on gated posts
  format: 'essay' | 'note' | 'thread' | 'quote'
  clusters: string[]
  tier: 'public' | 'subscriber'
  publishedAt: string     // ISO 8601
  updatedAt?: string      // ISO 8601
  coverImage?: IMedia
}
```

### IInterestCluster

```ts
export interface IInterestCluster {
  id: string
  slug: string
  label: string         // display name, e.g. "Tech & Code"
  description: string   // max 160 chars
  color: string         // hex color, e.g. "#4A90D9"
}
```

### IResumeData (composite)

```ts
export interface IResumeData {
  downloadUrl: string          // PDF in Azure Blob Storage
  education: IEducationEntry[]
  experience: IExperienceEntry[]
  skills: ISkillGroup[]
  languages: ILanguage[]
  certifications?: ICertification[]
}

export interface IEducationEntry {
  institution: string
  degree: string
  field: string
  startYear: number
  endYear?: number      // null if ongoing
  description?: string
}

export interface IExperienceEntry {
  company: string
  role: string
  startDate: string     // ISO 8601 (YYYY-MM)
  endDate?: string      // ISO 8601 or null if current
  description: string
  highlights?: string[]
}

export interface ISkillGroup {
  category: string      // e.g. "Programming", "Frameworks", "Tools"
  items: string[]
}

export interface ILanguage {
  name: string
  proficiency: 'native' | 'fluent' | 'professional' | 'conversational' | 'basic'
}

export interface ICertification {
  name: string
  issuer: string
  issuedAt: string      // ISO 8601 (YYYY-MM)
  url?: string
}
```

### IContentAdapter

```ts
// /src/site/src/content/adapters/IContentAdapter.ts
export interface IContentAdapter {
  getMilestones(): Promise<IMilestone[]>
  getFamilyMembers(): Promise<IFamilyMember[]>
  getProjects(options?: { featured?: boolean }): Promise<IProject[]>
  getProject(slug: string): Promise<IProject | null>
  getReadings(options?: { cluster?: string; status?: IReading['status'] }): Promise<IReading[]>
  getMusings(options?: { cluster?: string; tier?: IMusingPost['tier'] }): Promise<IMusingPost[]>
  getMusing(slug: string): Promise<IMusingPost | null>
  getClusters(): Promise<IInterestCluster[]>
  getResumeData(): Promise<IResumeData>
}
```

---

## Part 2: .NET API — Domain Entities (Azure SQL / EF Core)

Defined in `PersonalSite.Domain/` and mapped via EF Core in
`PersonalSite.Infrastructure/`.

### Visitor

```
Visitor {
  Id            Guid         PK
  Fingerprint   string(64)   UNIQUE NOT NULL  -- SHA-256 hash
  FirstSeenAt   DateTime     NOT NULL
  LastSeenAt    DateTime     NOT NULL
  VisitCount    int          NOT NULL DEFAULT 1
  CountryCode   string(2)    NULL             -- ISO 3166-1 alpha-2, from IP geo
  ConsentGiven  bool         NOT NULL DEFAULT false
  DataPurgeAt   DateTime     NOT NULL         -- FirstSeenAt + 12 months
}
```

Indexes: `Fingerprint` (unique), `DataPurgeAt` (for purge job).

### ContactSubmission

```
ContactSubmission {
  Id            Guid         PK
  Name          string(100)  NOT NULL
  Email         string(254)  NOT NULL
  Subject       string(20)   NOT NULL  -- enum: general/collaboration/academic/work/other
  Message       string(1000) NOT NULL
  SubmittedAt   DateTime     NOT NULL
  IpHash        string(64)   NOT NULL  -- hashed IP for rate limiting
  IsRead        bool         NOT NULL DEFAULT false
  ReadAt        DateTime?    NULL
}
```

Rate limiting check: count ContactSubmission by IpHash in last 1 hour, reject if ≥3.

### Subscriber

```
Subscriber {
  Id            Guid         PK
  Email         string(254)  UNIQUE NOT NULL
  ConfirmedAt   DateTime?    NULL  -- null = pending double opt-in
  LastAccessAt  DateTime?    NULL
  TokenHash     string(64)   NULL  -- SHA-256 of current access JWT
  TokenExpiry   DateTime?    NULL
  Active        bool         NOT NULL DEFAULT true
  CreatedAt     DateTime     NOT NULL
}
```

### SubscriberCluster (join table)

```
SubscriberCluster {
  SubscriberId  Guid  FK → Subscriber.Id
  ClusterSlug   string(50)
  PK: (SubscriberId, ClusterSlug)
}
```

### PendingSubscription (double opt-in)

```
PendingSubscription {
  Id              Guid        PK
  Email           string(254) NOT NULL
  ConfirmToken    string(64)  UNIQUE NOT NULL  -- random, URL-safe
  ClusterSlugs    string      NOT NULL         -- JSON array
  CreatedAt       DateTime    NOT NULL
  ExpiresAt       DateTime    NOT NULL         -- CreatedAt + 24 hours
}
```

### OwnerPushSubscription

```
OwnerPushSubscription {
  Id              Guid        PK
  Endpoint        string(500) UNIQUE NOT NULL
  P256dhKey       string(200) NOT NULL  -- Base64url
  AuthKey         string(100) NOT NULL  -- Base64url
  RegisteredAt    DateTime    NOT NULL
  LastUsedAt      DateTime?   NULL
  Active          bool        NOT NULL DEFAULT true
}
```

### OwnerSession (Admin PWA auth)

```
OwnerSession {
  Id              Guid        PK
  RefreshTokenHash string(64) UNIQUE NOT NULL
  IssuedAt        DateTime    NOT NULL
  ExpiresAt       DateTime    NOT NULL  -- 30 days
  RevokedAt       DateTime?   NULL
  UserAgent       string(300) NULL
}
```

---

## Part 3: EF Core Migrations Strategy

- All migrations live in `PersonalSite.Infrastructure/Migrations/`.
- `dotnet ef migrations add <Name>` from `PersonalSite.Infrastructure/`.
- Initial migration: `InitialCreate` — creates all tables above.
- Hangfire tables created automatically by `UseSqlServerStorage()` on first run.
- Schema: default (`dbo`). No multi-schema setup needed at this scale.

---

## Part 4: Strapi Content Type Summary

The following Strapi collection types map to the CAL interfaces above.
Each type uses Strapi's REST + GraphQL API, accessed by the Strapi adapter.

| Strapi Collection Type | CAL Interface | Key Fields |
|------------------------|---------------|------------|
| `milestone` | IMilestone | date, title, description, category, media (relation), featured |
| `family-member` | IFamilyMember | name, relation, tagline, photo (media), funFacts (JSON), emoji, order |
| `project` | IProject | slug, title, status, description, body (rich text), tags (JSON), links (JSON), featured |
| `reading` | IReading | title, author, type, status, rating, note, noteIsGated, clusters (relation), dateAdded |
| `musing-post` | IMusingPost | slug, title, body (rich text), excerpt, format, clusters (relation), tier, publishedAt |
| `interest-cluster` | IInterestCluster | slug, label, description, color |
| `resume-data` | IResumeData | downloadUrl, education (JSON), experience (JSON), skills (JSON), languages (JSON), certifications (JSON) |

**Single types** (one instance):
- `resume-data` — rendered resume content (owner updates in-place)

**Media handling**: All image/file uploads go via `@strapi/provider-upload-azure-storage`
to Azure Blob Storage. URLs are CDN-prefixed before being returned by the CAL adapter.
