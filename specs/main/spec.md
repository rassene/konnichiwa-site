# SPECIFICATION.md
> Personal Website — sarah.tn  
> Version 1.1 | Status: Draft  
> References: CONSTITUTION.md v1.1

---

## 0. How to Read This Document

Each section of the site is specified as an autonomous module. Each module spec contains:
- **Purpose** — why it exists
- **Audience tier** — who can access it
- **Content model** — CAL interface definition
- **UX & Interaction** — behavior, states, transitions
- **Components** — what needs to be built
- **API dependencies** — backend calls if any
- **Open questions** — unresolved design or content decisions

Cross-cutting concerns (auth, fingerprinting, newsletter, admin PWA) are specified separately at the end.

---

## Clarifications

### Session 2026-04-04

- Q: Is T1 musing post body server-protected or client-side soft-gated? → A: API-fetched body — musing post page (title, excerpt, metadata) is SSG; subscriber-only body is fetched from `GET /api/musings/{slug}/body` using `Authorization: Bearer {subscriberJwt}`; API validates token and cluster membership before returning body HTML (Option B).
- Q: What happens when a subscriber's 30-day access token expires? → A: Sliding-window renewal — if the subscriber visits while within 7 days of expiry (days 23–30), `POST /api/subscriber/verify` issues a fresh 30-day token transparently; subscribers inactive for 30+ days see gated content locked and must re-subscribe (Option B).
- Q: Which visual paradigm for Meet the Family `<FamilyScene>`? → A: Illustrated frames — each family member is represented by a custom illustration or illustrated avatar (not a photo); illustrations are uploaded as media assets in Strapi; the scene composition positions illustrated characters spatially (Option A).
- Q: EU GDPR IP detection mechanism for fingerprinting consent gate? → A: Remove EU visitor consent entirely — fingerprinting proceeds without consent gate or banner; no GDPR detection mechanism needed; ConsentBanner component removed from scope.
- Q: Should `astro build` tolerate Strapi unavailability (empty data) or hard-fail? → A: Hard-fail — CAL Strapi adapter MUST throw on connection failure; a successful build with empty content is worse than keeping the last working deployment live.

---

## 1. Design System

### 1.1 Global Tokens

```ts
// /src/design/tokens.ts
export const tokens = {
  color: {
    background:   '#FAFAF8',   // warm off-white
    surface:      '#FFFFFF',
    text:         '#1A1A18',   // near-black
    textMuted:    '#6B6B60',
    accent:       '#D4522A',   // terracotta — TBD with owner
    accentSoft:   '#F0E6DF',
    border:       '#E2E0DA',
    overlay:      'rgba(26,26,24,0.6)',
  },
  font: {
    display:  '"Playfair Display", Georgia, serif',     // headings, hero
    body:     '"DM Sans", system-ui, sans-serif',       // body copy
    mono:     '"JetBrains Mono", monospace',            // code, metadata
  },
  space: {
    xs: '4px', sm: '8px', md: '16px', lg: '24px',
    xl: '40px', '2xl': '64px', '3xl': '96px',
  },
  radius: {
    sm: '4px', md: '8px', lg: '16px', full: '9999px',
  },
  motion: {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '400ms ease',
    immersive: '600ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
  breakpoint: {
    sm: '375px', md: '768px', lg: '1024px', xl: '1280px',
  },
}
```

> ⚠️ Accent color is a placeholder. Final palette to be confirmed with the owner before development begins.

### 1.2 Typography Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `display-xl` | clamp(2.5rem, 6vw, 5rem) | 700 | Hero title |
| `display-lg` | clamp(1.75rem, 4vw, 3rem) | 600 | Section titles |
| `heading-md` | 1.5rem | 600 | Card/module titles |
| `heading-sm` | 1.125rem | 600 | Subsection labels |
| `body-lg` | 1.125rem | 400 | Lead paragraphs |
| `body-md` | 1rem | 400 | Body copy |
| `body-sm` | 0.875rem | 400 | Captions, metadata |
| `label` | 0.75rem | 500 | Tags, badges (uppercase) |

### 1.3 Shared Components

| Component | Description |
|-----------|-------------|
| `<NavBar>` | Sticky top nav, collapses to hamburger on mobile |
| `<Footer>` | Minimal: links, newsletter CTA, copyright |
| `<SectionWrapper>` | Padding, max-width, scroll-anchor for shell sections |
| `<Tag>` | Interest cluster badge |
| `<Button>` | Primary / ghost / icon variants |
| `<Modal>` | Accessible dialog used across modules |
| `<LoadingState>` | Skeleton screens for async content |
| `<ErrorBoundary>` | Graceful degradation per module |

---

## 2. Content Abstraction Layer (CAL)

### 2.1 Core Interfaces

```ts
// /src/content/interfaces/index.ts

export interface IMilestone {
  id: string
  date: string                    // ISO 8601
  title: string
  description: string
  category: 'academic' | 'personal' | 'professional' | 'social' | 'creative'
  media?: IMedia[]
  featured: boolean
}

export interface IFamilyMember {
  id: string
  name: string
  relation: string                // e.g. "Mum", "Big Brother"
  tagline: string                 // one-sentence fun description
  photo: IMedia
  funFacts: string[]
  emoji?: string
}

export interface IProject {
  id: string
  title: string
  status: 'idea' | 'in-progress' | 'completed' | 'paused'
  description: string
  tags: string[]
  links?: { label: string; url: string }[]
  startDate?: string
  endDate?: string
  media?: IMedia[]
  featured: boolean
}

export interface IReading {
  id: string
  title: string
  author: string
  type: 'book' | 'article' | 'paper' | 'podcast' | 'video'
  status: 'reading' | 'completed' | 'want-to-read'
  rating?: 1 | 2 | 3 | 4 | 5
  note?: string                   // owner's take — may be T1-gated
  clusters: string[]              // interest cluster slugs
  dateAdded: string
}

export interface IMusingPost {
  id: string
  slug: string
  title: string
  body: string                    // rich text / markdown
  format: 'essay' | 'note' | 'thread' | 'quote'
  clusters: string[]
  tier: 'public' | 'subscriber'
  publishedAt: string
  updatedAt?: string
  coverImage?: IMedia
}

export interface IInterestCluster {
  id: string
  slug: string
  label: string
  description: string
  color: string                   // hex
}

export interface IMedia {
  url: string
  alt: string
  width?: number
  height?: number
  blurHash?: string
}

export interface IResumeData {
  downloadUrl: string             // PDF in Blob Storage
  education: IEducationEntry[]
  experience: IExperienceEntry[]
  skills: ISkillGroup[]
  languages: ILanguage[]
  certifications?: ICertification[]
}
```

### 2.2 Adapter Interface

```ts
// /src/content/adapters/IContentAdapter.ts
export interface IContentAdapter {
  getMilestones(): Promise<IMilestone[]>
  getFamilyMembers(): Promise<IFamilyMember[]>
  getProjects(featured?: boolean): Promise<IProject[]>
  getProject(id: string): Promise<IProject | null>
  getReadings(cluster?: string): Promise<IReading[]>
  getMusings(cluster?: string, tier?: 'public' | 'subscriber'): Promise<IMusingPost[]>
  getMusing(slug: string): Promise<IMusingPost | null>
  getClusters(): Promise<IInterestCluster[]>
  getResumeData(): Promise<IResumeData>
}
```

### 2.3 Active Adapter

```ts
// /src/content/index.ts
export { strapiAdapter as content } from './adapters/strapi'
// To switch CMS: replace the above line only
```

### 2.4 Adapter Failure Policy

The Strapi adapter MUST throw (not return empty arrays) when Strapi is unreachable at
build time. This causes `astro build` to exit with a non-zero code, keeping the last
successful deployment live rather than publishing a blank site. All adapter methods
propagate network/HTTP errors without swallowing them.

---

## 3. Section Specifications

---

### 3.1 Home

**Purpose:** First impression. Communicates who she is within seconds. Invites exploration.  
**Tier:** T0 — Public  
**Layer:** Shell with hero animation

#### Layout
1. **Hero block** — Full viewport. Display name (large, animated in). Tagline (1–2 lines). Animated scroll cue.
2. **Identity strip** — 3–4 short phrases or words that define her (e.g. "Engineer. Reader. Sister. Dreamer.") Rendered as animated tokens.
3. **Section preview grid** — Card-based overview of all sections. Each card is a teaser into the section's visual language. Life Map card previews timeline aesthetic; Family card previews playful style.
4. **Newsletter CTA** — Inline, not a popup. Compact subscription form.

#### States
- First visit: full hero animation sequence (~1.5s)
- Return visit (fingerprint recognized): subtle personalized detail (e.g. "Welcome back")
- Reduced motion: static layout, no animation

#### Open Questions
- [ ] Does she want her full name or just first name in the hero?
- [ ] What tagline? (owner to provide)
- [ ] Personalization copy for returning visitors — tone?

---

### 3.2 Life Map

**Purpose:** A visual, emotional journey through her most important moments.  
**Tier:** T0 — Public  
**Layer:** Immersive

#### Interaction Model
- **Desktop:** Horizontal scroll timeline. Milestones are nodes on a continuous path. Clicking a node expands a detail card in place.
- **Mobile:** Vertical scroll timeline. Full-width cards with connecting line.
- Milestones are filterable by category (color-coded).
- Featured milestones are visually prominent (larger node, hero image).

#### Visual Language
- Dark or deeply saturated background (inverts the shell palette)
- Milestones rendered as illustrated or photo-backed cards
- Connecting path animates as user scrolls
- Date labels in `font.mono`

#### Content Model
Uses `IMilestone[]` from CAL.

#### Components
- `<LifeMapCanvas>` — orchestrator, owns scroll state
- `<TimelinePath>` — SVG or CSS animated connector
- `<MilestoneNode>` — dot/icon on the path, hover/tap to activate
- `<MilestoneCard>` — expanded detail: title, date, description, media
- `<CategoryFilter>` — pill group to filter by category

#### Open Questions
- [ ] Should future milestones be allowed? (aspirations / goals)
- [ ] Video support in milestone media?
- [ ] Is the dark background confirmed or should it adapt?

---

### 3.3 Meet the Family

**Purpose:** Introduce family members in a warm, playful, memorable way.  
**Tier:** T0 — Public  
**Layer:** Immersive

#### Interaction Model
- Landing view: an illustrated family scene — characters arranged spatially (e.g. around a
  table, in a garden, on a sofa) using custom illustrations uploaded as media assets
- Tapping/clicking a family member zooms in and slides in their profile card
- Profile card: illustrated avatar, name, relation, tagline, 2–3 fun facts, emoji
- Navigation between members via arrow or swipe

#### Visual Language
- Warm, playful — distinct from the shell and from Life Map
- **Illustrated frames** — each member is a custom illustrated character (not a photo);
  illustrations uploaded as SVG or PNG assets in Strapi per member
- Scene background is also an illustration (e.g. a living room, garden) — uploaded as a
  single background asset in Strapi
- Each family member has an optional signature color accent overlaid on their character spot
- `<FamilyMemberCard>` detail panel shows the illustration prominently alongside text

#### Content Model
Uses `IFamilyMember[]` from CAL. `IFamilyMember.photo` field holds the illustrated avatar
asset (renamed semantically to `avatar` in future CAL iteration; use `photo` for now per
existing interface). Scene background asset referenced via a `scene-config` Strapi single
type (background image URL, scene dimensions, member spot coordinates).

#### Components
- `<FamilyScene>` — interactive illustrated scene; positions `<FamilyMemberSpot>` elements
  at absolute coordinates read from Strapi `scene-config`
- `<FamilyMemberSpot>` — positioned illustrated character; tappable/clickable
- `<FamilyMemberCard>` — detail panel: illustration + name, relation, tagline, fun facts
- `<FamilyNav>` — prev/next between members

#### Open Questions
- [ ] How many family members? (affects scene composition complexity — target 4–8)
- [ ] Should pets be included? (content decision — no code impact)
- [ ] Privacy: any member shown with reduced detail? (content decision)

---

### 3.4 My Projects

**Purpose:** Showcase what she builds, explores, and cares about making.  
**Tier:** T0 — Public  
**Layer:** Shell

#### Layout
- Filterable grid by status and tag
- Featured projects: full-width or 2-col hero card
- Non-featured: compact card (title, status badge, tags, 1-line description)
- Clicking a card opens a detail modal or navigates to a project page (TBD)

#### Content Model
Uses `IProject[]` from CAL.

#### Components
- `<ProjectGrid>` — responsive grid with filter controls
- `<ProjectCard>` — compact and featured variants
- `<ProjectDetail>` — modal or page: full description, links, media gallery
- `<StatusBadge>` — color-coded: idea / in-progress / completed / paused

#### Open Questions
- [ ] Should projects have their own URL (`/projects/[slug]`)? Or modal only?
- [ ] GitHub integration: auto-pull repo stats (stars, last commit)?

---

### 3.5 Readings

**Purpose:** Share what she reads, discovers, and recommends.  
**Tier:** T0 (list) / T1 (personal notes on items)  
**Layer:** Shell

#### Layout
- List or card grid view toggle
- Filter by type (book, article, paper…) and status (reading, completed, want-to-read)
- Filter by interest cluster
- Each item: cover/icon, title, author, type badge, status, star rating (if set)
- Personal note: T0 users see a teaser + subscribe prompt; T1 users see full note

#### Content Model
Uses `IReading[]` from CAL.

#### Components
- `<ReadingList>` — filterable list/grid
- `<ReadingCard>` — item display with gated note handling
- `<GatedNoteTeaser>` — subscribe CTA for T0 users

---

### 3.6 Musings

**Purpose:** A semi-private publishing space. Long or short form. Distributed by interest.  
**Tier:** T1 — Subscriber (some posts may be T0 public)  
**Layer:** Shell

#### Layout
- Landing: clustered by interest. Each cluster shows latest 2–3 post teasers.
- T0 visitor: sees public posts + locked post teasers with subscribe prompt
- T1 subscriber: full access to posts in their subscribed clusters
- Post formats: Essay (long-form), Note (short, single thought), Thread (sequential), Quote (with attribution + reaction)

#### Access Flow
1. Visitor lands on `/musings`
2. Public posts visible immediately
3. Subscriber-only posts show title + excerpt + "Subscribe to [Cluster Name] to read"
4. Clicking subscribe CTA → newsletter/subscription flow (see §6.2)
5. Returning subscriber (token in localStorage) → `<MusingPostPage>` is SSG (title, excerpt,
   metadata rendered at build time); subscriber-only body is **not** in the HTML source —
   it is fetched client-side from `GET /api/musings/{slug}/body` with
   `Authorization: Bearer {subscriberJwt}`; API validates token + cluster membership;
   on success, body HTML is injected into the page; on failure (expired/invalid token),
   `<SubscriberGate>` is shown in place of the body

#### Content Model
Uses `IMusingPost[]` and `IInterestCluster[]` from CAL.

#### Components
- `<MusingsLanding>` — cluster-grouped layout
- `<MusingPostCard>` — teaser with tier-aware rendering
- `<MusingPostPage>` — full post at `/musings/[slug]`
- `<ClusterBadge>` — colored label matching cluster token
- `<SubscriberGate>` — lock overlay with subscribe CTA

#### Open Questions
- [ ] Can she write directly in the CMS, or does she want a dedicated writing UI?
- [ ] Comment/reaction system on musings (v2)?
- [ ] RSS feed for public musings?

---

### 3.7 Resume

**Purpose:** Professional reference. Clean, printable, downloadable.  
**Tier:** T0 — Public  
**Layer:** Shell

#### Layout
- Rendered in-page (not just a PDF link) in a clean, print-optimized layout
- Sections: Education, Experience, Skills, Languages, Certifications
- Download button: PDF from Azure Blob Storage (owner uploads via CMS/admin)
- Print stylesheet included

#### Content Model
Uses `IResumeData` from CAL.

#### Components
- `<ResumeView>` — full rendered resume
- `<DownloadResumeButton>` — triggers blob URL download

---

### 3.8 Reach Out

**Purpose:** Let visitors contact her without exposing her email.  
**Tier:** T0 — Public  
**Layer:** Shell

#### Form Fields
- Name (required)
- Email (required)
- Subject (dropdown: General / Collaboration / Academic / Work / Other)
- Message (required, max 1000 chars)
- Honeypot field (hidden, bot detection)

#### Behavior
- Submit → POST `/api/contact` on .NET API
- API validates, stores in DB, sends email notification to owner via Azure Communication Services
- Visitor receives confirmation message (no auto-reply email in v1)
- Rate limiting: 3 submissions per IP per hour

#### Open Questions
- [ ] Should there be a public-facing acknowledgment email to the visitor?

---

### 3.9 Links

**Purpose:** Connect to her external presence.  
**Tier:** T0 — Public  
**Layer:** Shell

#### Content
- GitHub profile URL
- LinkedIn profile URL
- Optional: other platforms (Instagram, ResearchGate, etc.)
- All links managed via CMS (no hardcoding)

#### Layout
- Inline in footer and/or dedicated `/links` page (TBD)
- Icon + label + URL for each

---

## 4. Cross-Cutting Features

---

### 4.1 Visitor Fingerprinting

**Purpose:** Recognize returning visitors without requiring login. Enables personalized greetings and return-visit analytics.

#### Implementation
- Client-side: `fingerprintjs/fingerprintjs` (open source) runs on page load automatically
- Generated fingerprint hash → POST `/api/visitor/identify`
- .NET API stores: fingerprint hash, first seen, last seen, visit count, approximate location
  (from IP geolocation, country only)
- No PII stored. Fingerprint is a hash, not linked to identity unless visitor subscribes.
- On return: API returns `{ returning: true, visitCount: N }`
- Frontend uses this to optionally render a subtle personalized element on Home

#### Privacy
- No consent gate or banner required. Fingerprint data TTL: 12 months, then purged by a
  scheduled background job.

#### API Endpoints
```
POST /api/visitor/identify
Body: { fingerprint: string, pageUrl: string }
Response: { returning: boolean, visitCount: number }
```

---

### 4.2 Newsletter & Subscription

**Purpose:** The primary mechanism for T1 access. Visitors subscribe to interest clusters and receive content updates.

#### Subscription Flow
1. Visitor enters email + selects interest clusters
2. POST `/api/newsletter/subscribe`
3. API sends double opt-in email via Azure Communication Services
4. On confirmation click → subscriber record created, access token (JWT, 30-day expiry) issued
5. Token stored in `localStorage` under key `sub_token`
6. On subsequent visits: frontend sends token in header to `/api/subscriber/verify`
7. Verified token → T1 content unlocks client-side
8. **Token renewal (sliding window):** if token has ≤ 7 days remaining, `/api/subscriber/verify`
   issues a fresh 30-day token in the response (`newToken` field); frontend replaces
   `sub_token` in localStorage transparently. Subscribers inactive for 30+ days must
   re-subscribe from scratch.

#### Subscriber Record (DB)
```
Subscriber {
  Id (guid)
  Email (unique)
  Clusters (many-to-many)
  ConfirmedAt
  LastAccessAt
  TokenHash
  TokenExpiry
  Active (bool)
}
```

#### API Endpoints
```
POST   /api/newsletter/subscribe       — initiate subscription
GET    /api/newsletter/confirm?token=  — double opt-in confirmation
POST   /api/subscriber/verify          — validate access token
DELETE /api/newsletter/unsubscribe     — remove subscriber
```

#### Owner Newsletter Dispatch
- Owner writes a post in CMS, tags it to clusters, marks it "notify subscribers"
- .NET background job (Hangfire) queries subscribers by cluster, batches emails
- Azure Communication Services handles delivery

---

### 4.3 Real-Time Visitor Presence (Admin PWA)

**Purpose:** Let the owner see who is currently on the site and interact in real time.

#### Architecture
- Public site sends a heartbeat via SignalR hub on page load and every 30s
- Heartbeat payload: `{ fingerprint, pageUrl, timestamp }`
- .NET API hosts the SignalR hub
- Admin PWA connects to the hub with owner auth token
- Hub pushes active visitor list to admin in real time

#### Admin PWA Real-Time Dashboard
- Live count of active visitors
- Per-visitor: current page, visit count, approximate location (country)
- Future v2: ability to trigger a "wave" or notification to a specific visitor

#### Push Notifications (Owner)
- Admin PWA registers service worker + push subscription on install
- .NET API stores owner push subscription endpoint
- On events (new contact form, new subscriber, visitor milestone), API dispatches Web Push notification to owner
- Uses Web Push protocol (VAPID keys stored in Azure Key Vault)

---

### 4.4 Admin PWA

**Purpose:** The owner's private control panel. Installable on her devices.

#### Features (v1)
- Real-time visitor presence dashboard (§4.3)
- Contact form inbox (read submitted messages)
- Subscriber list (view, filter by cluster, deactivate)
- Newsletter dispatch trigger (mark CMS post as "send now")
- Push notification settings

#### Authentication
- Owner-only. Single-user auth.
- Azure AD B2C or simple credential-based auth with refresh tokens (TBD — recommend B2C for future extensibility)
- Token stored in secure HttpOnly cookie

#### PWA Requirements
- `manifest.json`: name, icons, display: standalone, theme color
- Service worker: cache app shell for offline, background sync for notification registration
- Push notification permission requested on first install

#### Hosting
- Separate Astro or React SPA build
- Deployed to Azure Static Web Apps (separate slot from public site)
- Route: `admin.[firstname].com` (subdomain, not public-facing)

---

## 5. .NET API Specification

### 5.1 Architecture: Clean Architecture

The .NET API follows **Clean Architecture**. The dependency rule is strict: inner layers
MUST NOT reference outer layers.

```
Domain (innermost — no dependencies)
  ↑
Application (depends on Domain only — use cases, interfaces, DTOs)
  ↑
Infrastructure (depends on Application + Domain — EF Core, email, SignalR, push)
  ↑
Api (outermost — depends on all; ASP.NET Core 10 entry point, controllers, middleware)
```

**Layer responsibilities:**

| Layer | Project | Contains |
|-------|---------|----------|
| Domain | `PersonalSite.Domain` | Entities, value objects, domain events, enums — no framework dependencies |
| Application | `PersonalSite.Application` | Use cases (commands/queries), service interfaces (`IEmailService`, `ITokenService`, …), DTOs, validation |
| Infrastructure | `PersonalSite.Infrastructure` | EF Core `ApplicationDbContext`, repository implementations, `EmailService`, `PushNotificationService`, `TokenService`, Hangfire jobs, SignalR hub |
| API | `PersonalSite.Api` | ASP.NET Core 10 controllers (or minimal API endpoints), middleware, DI registration, `Program.cs` |

**Rules enforced at compile time via `.csproj` project references:**
- `PersonalSite.Domain` — no project references
- `PersonalSite.Application` → `PersonalSite.Domain` only
- `PersonalSite.Infrastructure` → `PersonalSite.Application` + `PersonalSite.Domain`
- `PersonalSite.Api` → all three layers

### 5.2 Project File Structure

```
src/api/
  PersonalSite.slnx
  PersonalSite.Domain/
    Entities/           ← Visitor, Subscriber, ContactSubmission, …
    Enums/
  PersonalSite.Application/
    UseCases/           ← one folder per feature (Contact/, Subscriber/, Visitor/, …)
    Interfaces/         ← IEmailService, ITokenService, ISubscriptionService, …
    DTOs/
  PersonalSite.Infrastructure/
    Persistence/        ← ApplicationDbContext, Migrations/
    Services/           ← EmailService, TokenService, PushNotificationService, …
    Jobs/               ← Hangfire background jobs
    Hubs/               ← SignalR PresenceHub
  PersonalSite.Api/
    Controllers/        ← Public endpoints
    Controllers/Admin/  ← Owner-only endpoints
    Middleware/         ← Rate limiting, auth, logging
    Program.cs
  PersonalSite.Tests/
    Domain.Tests/
    Application.Tests/
    Integration.Tests/
```

### 5.2 Full Endpoint Inventory

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/visitor/identify` | None | Fingerprint + record visit |
| POST | `/api/contact` | None | Submit contact form |
| POST | `/api/newsletter/subscribe` | None | Start subscription |
| GET | `/api/newsletter/confirm` | Token (query) | Confirm opt-in |
| POST | `/api/subscriber/verify` | Bearer | Validate subscriber token |
| GET | `/api/musings/{slug}/body` | Bearer (subscriber) | Fetch subscriber-gated post body |
| DELETE | `/api/newsletter/unsubscribe` | Bearer | Unsubscribe |
| GET | `/api/admin/visitors` | Owner | Active visitor list |
| GET | `/api/admin/contacts` | Owner | Contact form inbox |
| GET | `/api/admin/subscribers` | Owner | Subscriber list |
| POST | `/api/admin/newsletter/dispatch` | Owner | Trigger newsletter send |
| PUT | `/api/admin/push/register` | Owner | Register push subscription |

### 5.3 Infrastructure Dependencies

| Service | Purpose | Azure Resource |
|---------|---------|----------------|
| SQL Database | All persistent data | Azure SQL |
| Email | Opt-in, notifications, newsletter | Azure Communication Services |
| Push notifications | Owner PWA alerts | Web Push / VAPID (keys in Key Vault) |
| Real-time hub | Visitor presence | SignalR (self-hosted or Azure SignalR Service) |
| Background jobs | Newsletter dispatch | Hangfire (persisted to SQL) |
| Secrets | API keys, VAPID keys | Azure Key Vault |

---

## 6. Developer Environment & Tooling

### 6.1 Prerequisites (Windows)

All tools must be installed on Windows. Recommended installation via `winget`:

```powershell
# Runtime & SDK
winget install OpenJS.NodeJS.LTS        # Node.js LTS (Astro, Strapi)
winget install Microsoft.DotNet.SDK.10  # .NET 10 SDK
winget install Microsoft.AzureCLI       # Azure CLI

# Dev tools
winget install Git.Git
winget install Microsoft.VisualStudioCode
winget install Docker.DockerDesktop     # Local Strapi + SQL Server

# Optional but recommended
winget install GitHub.GitHubCLI
winget install Microsoft.AzureStorageExplorer
```

### 6.2 Repository Structure

```
/[firstname]-site/
  ├── .vscode/
  │   ├── extensions.json          ← recommended extensions
  │   ├── launch.json              ← debug configs for API + Astro
  │   └── settings.json            ← editor rules (CRLF, formatOnSave, etc.)
  ├── .github/
  │   └── workflows/
  │       ├── public-site.yml      ← build + deploy public Astro site
  │       ├── admin-pwa.yml        ← build + deploy admin PWA
  │       ├── api.yml              ← build + deploy .NET API
  │       └── ci.yml               ← PR validation (build + lint + lighthouse)
  ├── infra/
  │   ├── setup.ps1                ← main IaC script (idempotent)
  │   ├── parameters.example.ps1  ← all variable definitions with comments
  │   ├── parameters.ps1           ← gitignored — local values
  │   └── SETUP_GUIDE.md          ← manual steps documentation
  ├── src/
  │   ├── site/                    ← Astro public site
  │   ├── admin/                   ← Admin PWA (React SPA)
  │   └── api/                     ← .NET solution
  │       ├── PersonalSite.slnx
  │       ├── PersonalSite.Api/
  │       ├── PersonalSite.Application/
  │       ├── PersonalSite.Domain/
  │       ├── PersonalSite.Infrastructure/
  │       └── PersonalSite.Tests/
  ├── cms/                         ← Strapi project
  ├── docker-compose.yml           ← local dev: Strapi + SQL Server
  └── README.md
```

### 6.3 VS Code Workspace

**`.vscode/extensions.json`** — mandatory recommendations:
```json
{
  "recommendations": [
    "astro-build.astro-vscode",
    "ms-dotnettools.csdevkit",
    "ms-azuretools.vscode-azurestaticwebapps",
    "ms-azuretools.vscode-azureappservice",
    "ms-azuretools.vscode-docker",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.powershell",
    "github.vscode-github-actions",
    "eamodio.gitlens"
  ]
}
```

**`.vscode/settings.json`** — key settings:
```json
{
  "files.eol": "\r\n",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[csharp]": { "editor.defaultFormatter": "ms-dotnettools.csdevkit" },
  "dotnet.defaultSolution": "src/api/PersonalSite.slnx",
  "typescript.tsdk": "src/site/node_modules/typescript/lib"
}
```

### 6.4 Local Development

```powershell
# Start all local services
docker-compose up -d                    # SQL Server + Strapi on Docker

# Public site
cd src/site
npm install
npm run dev                             # http://localhost:4321

# Admin PWA
cd src/admin
npm install
npm run dev                             # http://localhost:5173

# .NET API
cd src/api
dotnet restore
dotnet run --project PersonalSite.Api  # http://localhost:5000
```

---

## 7. Infrastructure as Code

### 7.1 `setup.ps1` — Script Specification

The script is fully idempotent. Every block follows the pattern:

```powershell
# Pattern for every resource
$resource = az resource show --ids $resourceId 2>$null | ConvertFrom-Json
if ($null -eq $resource) {
    Write-Host "[CREATE] $resourceName" -ForegroundColor Green
    # az ... create command
} else {
    Write-Host "[EXISTS] $resourceName — skipping" -ForegroundColor DarkGray
}
```

**Resources created by the script:**

```powershell
# 1. Resource Group
az group create --name $ResourceGroup --location $Location

# 2. App Service Plan (shared: API + Strapi)
#    SKU: B1 — lowest tier with Always On + custom domain
az appservice plan create `
  --name "$AppName-plan" `
  --resource-group $ResourceGroup `
  --sku B1 --is-linux

# 3. .NET API — App Service
az webapp create `
  --name "$AppName-api" `
  --plan "$AppName-plan" `
  --resource-group $ResourceGroup `
  --runtime "DOTNETCORE:10.0"

# 4. Strapi CMS — App Service
az webapp create `
  --name "$AppName-cms" `
  --plan "$AppName-plan" `
  --resource-group $ResourceGroup `
  --runtime "NODE:20-lts"

# 5. Azure SQL Server + Database
az sql server create `
  --name "$AppName-sql" `
  --resource-group $ResourceGroup `
  --admin-user $SqlAdminUser `
  --admin-password $SqlAdminPassword   # written directly to Key Vault, never echoed
az sql db create `
  --name "$AppName-db" `
  --server "$AppName-sql" `
  --resource-group $ResourceGroup `
  --edition Basic --capacity 5         # 5 DTU — cost-optimized

# 6. Storage Account + Blob Container (media)
az storage account create `
  --name "${AppName}media" `
  --resource-group $ResourceGroup `
  --sku Standard_LRS --kind StorageV2 --access-tier Hot
az storage container create `
  --name "media" `
  --account-name "${AppName}media" `
  --public-access blob

# 7. Azure CDN (media only)
az cdn profile create `
  --name "$AppName-cdn" `
  --resource-group $ResourceGroup `
  --sku Standard_Microsoft
az cdn endpoint create `
  --name "$AppName-media" `
  --profile-name "$AppName-cdn" `
  --resource-group $ResourceGroup `
  --origin "${AppName}media.blob.core.windows.net"

# 8. Azure Static Web Apps — public site
az staticwebapp create `
  --name "$AppName-site" `
  --resource-group $ResourceGroup `
  --source "https://github.com/$GithubOrg/$GithubRepo" `
  --branch main `
  --app-location "src/site" `
  --output-location "dist"

# 9. Azure Static Web Apps — admin PWA
az staticwebapp create `
  --name "$AppName-admin" `
  --resource-group $ResourceGroup `
  --source "https://github.com/$GithubOrg/$GithubRepo" `
  --branch main `
  --app-location "src/admin" `
  --output-location "dist"

# 10. Azure Key Vault
az keyvault create `
  --name "$AppName-kv" `
  --resource-group $ResourceGroup `
  --sku standard

# 11. Azure Communication Services
az communication create `
  --name "$AppName-acs" `
  --resource-group $ResourceGroup `
  --data-location "Europe"

# 12. Azure SignalR Service (Free tier)
az signalr create `
  --name "$AppName-signalr" `
  --resource-group $ResourceGroup `
  --sku Free_F1 --unit-count 1 `
  --service-mode Default

# 13. App Settings (non-secret)
az webapp config appsettings set `
  --name "$AppName-api" `
  --resource-group $ResourceGroup `
  --settings `
    ASPNETCORE_ENVIRONMENT=Production `
    AzureSignalRConnectionString="@Microsoft.KeyVault(SecretUri=...)" `
    AzureAcs__ConnectionString="@Microsoft.KeyVault(SecretUri=...)"

# 14. Managed Identity for API → Key Vault access
az webapp identity assign `
  --name "$AppName-api" `
  --resource-group $ResourceGroup
# Then grant Key Vault access to the managed identity
```

**Script completion output:**
```
========================================
  SETUP COMPLETE — MANUAL STEPS REQUIRED
========================================
The following steps cannot be automated.
Refer to infra/SETUP_GUIDE.md for details.

[ ] 1. Configure custom domain DNS for [firstname].com → SWA hostname
[ ] 2. Configure custom domain DNS for admin.[firstname].com → admin SWA hostname
[ ] 3. Configure custom domain DNS for api.[firstname].com → API App Service
[ ] 4. Add GitHub repository secrets (see SETUP_GUIDE.md §3)
[ ] 5. Generate VAPID keys and store in Key Vault (see SETUP_GUIDE.md §4)
[ ] 6. Verify ACS email domain and sender address (see SETUP_GUIDE.md §5)
[ ] 7. Set SQL firewall rules for App Service outbound IPs
[ ] 8. Run database migrations: dotnet ef database update
[ ] 9. Verify Static Web Apps deployment tokens are set in GitHub secrets
========================================
```

### 7.2 `SETUP_GUIDE.md` — Sections

The manual guide covers:

1. **Prerequisites** — Azure subscription, GitHub repo, domain registrar access, tools installed
2. **Running `setup.ps1`** — step by step, including `az login`, parameter file setup
3. **GitHub Secrets** — table of every secret, its source, and the exact secret name to use:

| Secret Name | Source | Used By |
|-------------|--------|---------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN_SITE` | SWA deployment token (from Azure portal) | `public-site.yml` |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_ADMIN` | SWA deployment token | `admin-pwa.yml` |
| `AZURE_WEBAPP_PUBLISH_PROFILE_API` | Download from App Service → Publish profile | `api.yml` |
| `SQL_CONNECTION_STRING` | Azure SQL connection string | API app settings |
| `ACS_CONNECTION_STRING` | Azure Communication Services | Key Vault + API |
| `SIGNALR_CONNECTION_STRING` | Azure SignalR | Key Vault + API |
| `VAPID_PUBLIC_KEY` | Generated locally (see §4) | Frontend + API |
| `VAPID_PRIVATE_KEY` | Generated locally (see §4) | Key Vault + API |

4. **DNS Configuration** — CNAME and A record instructions for common registrars
5. **VAPID Key Generation** — `npx web-push generate-vapid-keys` + storage instructions
6. **ACS Domain Verification** — how to verify the sender domain in Azure Communication Services
7. **Post-Setup Verification Checklist** — curl commands and browser checks to confirm everything works

---

## 8. CI/CD Pipelines

### 8.1 PR Validation (`ci.yml`)

Triggered on every pull request to `main`:

```yaml
jobs:
  build-site:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
        working-directory: src/site
      - run: npm run build         # astro build — must succeed with zero errors
        working-directory: src/site
      - run: npm run lint          # eslint + astro check
        working-directory: src/site

  build-api:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: '10.0.x' }
      - run: dotnet restore src/api/PersonalSite.slnx
      - run: dotnet build src/api/PersonalSite.slnx --no-restore -c Release
      - run: dotnet test src/api/PersonalSite.slnx --no-build -c Release

  lighthouse:
    needs: build-site
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
        working-directory: src/site
      - uses: treosh/lighthouse-ci-action@v11
        with:
          configPath: src/site/.lighthouserc.json
          # Thresholds: performance ≥ 90, accessibility ≥ 95
```

### 8.2 Lighthouse CI Config (`.lighthouserc.json`)

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 200 }]
      }
    }
  }
}
```

### 8.3 Production Deploy Workflows

Each deploy workflow is triggered on push to `main` and runs only for its relevant path changes:

- `public-site.yml` — triggers on changes to `src/site/**`
- `admin-pwa.yml` — triggers on changes to `src/admin/**`
- `api.yml` — triggers on changes to `src/api/**`

All deploy workflows include a build step before deployment. Deployment never runs on a failed build.

---

## 9. Phase Plan & Build Gates

Development is organized into phases. Each phase has a defined scope, deliverables, and a **build gate** that must pass before the next phase begins.

### Phase 0 — Foundation
**Scope:** Repo structure, tooling, local dev environment, IaC script, empty deployable shells.  
**Deliverables:**
- Repository created with full folder structure per §6.2
- `.vscode/` workspace configured
- `docker-compose.yml` running Strapi + SQL Server locally
- Empty Astro site builds and deploys to Azure SWA
- Empty .NET API builds and deploys to Azure App Service
- `infra/setup.ps1` complete and tested end-to-end
- `infra/SETUP_GUIDE.md` complete

**Build Gate:**
- [ ] `astro build` passes on Windows (zero errors)
- [ ] `dotnet build` passes (zero errors, zero warnings)
- [ ] Public site is reachable at `[firstname].com` (even if blank)
- [ ] API is reachable at `api.[firstname].com/health` → 200 OK
- [ ] All GitHub Actions workflows pass on a test PR

---

### Phase 1 — Design System & Shell
**Scope:** Global tokens, typography, navigation, footer, shared components.  
**Deliverables:**
- Design token file implemented
- Fonts self-hosted and loading correctly
- `<NavBar>`, `<Footer>`, `<SectionWrapper>`, `<Button>`, `<Tag>` built
- Home page — static layout only (no data, no animation)
- Resume page — static layout with hardcoded placeholder data

**Build Gate:**
- [ ] `astro build` passes
- [ ] Lighthouse Performance ≥ 90 on Home (mobile)
- [ ] Lighthouse Accessibility ≥ 95 on Home
- [ ] No layout shift on Home or Resume (CLS ≤ 0.1)
- [ ] Mobile layout verified at 375px

---

### Phase 2 — Content Abstraction Layer + CMS
**Scope:** CAL interfaces, static JSON adapter, Strapi setup, Strapi adapter.  
**Deliverables:**
- All CAL interfaces defined (`IMilestone`, `IProject`, `IMusingPost`, etc.)
- Static JSON adapter implemented (all methods return fixture data)
- Strapi running locally with schemas matching CAL interfaces
- Strapi adapter implemented and passing all the same fixture data from CMS
- Projects and Readings sections wired to CAL (data-driven)

**Build Gate:**
- [ ] `astro build` passes with Strapi adapter active
- [ ] Switching `content/index.ts` to JSON adapter also builds cleanly
- [ ] Projects page renders real CMS data in production

---

### Phase 3 — Core Shell Sections
**Scope:** Home (animated), Projects, Readings, Resume (live data), Reach Out, Links.  
**Deliverables:**
- Home hero animation implemented (respects `prefers-reduced-motion`)
- All shell sections complete with live CMS data
- Contact form wired to .NET API
- Newsletter CTA component implemented (UI only — backend in Phase 5)

**Build Gate:**
- [ ] `astro build` passes
- [ ] Lighthouse thresholds met on Home, Projects, Resume
- [ ] Contact form submits successfully to API in production
- [ ] All shell sections pass manual mobile review (375px, 428px)

---

### Phase 4 — Immersive Modules
**Scope:** Life Map and Meet the Family — full implementation.  
**Deliverables:**
- `<LifeMapCanvas>` with horizontal (desktop) and vertical (mobile) scroll
- `<MilestoneCard>` with media support
- `<FamilyScene>` with interactive member reveal
- `<FamilyMemberCard>` with fun facts

**Build Gate:**
- [ ] `astro build` passes
- [ ] Life Map and Family pages pass Lighthouse accessibility ≥ 95 (informational content)
- [ ] Both immersive modules are fully functional on mobile (touch interactions)
- [ ] Immersive modules do not affect shell-layer Lighthouse scores

---

### Phase 5 — Backend Features
**Scope:** Fingerprinting, newsletter/subscription, subscriber gating, Musings section.  
**Deliverables:**
- Visitor fingerprinting live with GDPR consent gate
- Newsletter subscribe + double opt-in flow end-to-end
- Subscriber JWT token issuance and verification
- Musings section live with T0/T1 content gating

**Build Gate:**
- [ ] `dotnet build` and `dotnet test` pass
- [ ] Subscribe → confirm → access flow works end-to-end in production
- [ ] T1 content is not accessible without a valid token (verified manually)
- [ ] GDPR consent gate blocks fingerprinting until accepted

---

### Phase 6 — Admin PWA
**Scope:** Admin PWA — real-time visitor dashboard, contact inbox, subscriber list, push notifications.  
**Deliverables:**
- Admin PWA installable on owner's device
- Real-time visitor presence dashboard via SignalR
- Contact form inbox view
- Subscriber management view
- Push notifications on new contact / new subscriber

**Build Gate:**
- [ ] Admin PWA builds and deploys to `admin.[firstname].com`
- [ ] PWA installs correctly on Chrome (Windows) and Safari (iOS)
- [ ] Real-time visitor count updates without page refresh
- [ ] Push notification received on new contact form submission

---

### Phase 7 — Polish, Performance & Launch
**Scope:** Final performance pass, SEO, OG images, sitemap, accessibility audit, launch.  
**Deliverables:**
- All Core Web Vitals green in production
- `sitemap.xml` generated by Astro
- OG image meta tags for all public pages
- Full Lighthouse audit run and documented
- Owner content review complete (all real content in CMS)
- DNS propagation confirmed, SSL certificates valid

**Build Gate:**
- [ ] Lighthouse Performance ≥ 90 (mobile) on all shell pages
- [ ] Lighthouse Accessibility ≥ 95 on all pages
- [ ] All Core Web Vitals green in Google Search Console
- [ ] Zero console errors in production
- [ ] Owner sign-off on all content

---

## 10. Non-Goals & Deferral Log

| Feature | Status | Notes |
|---------|--------|-------|
| Visitor-to-owner live chat | Deferred v2 | SignalR hub is in place; UI not in v1 |
| Comment system on Musings | Deferred v2 | — |
| GitHub repo stats auto-pull | Deferred v2 | Can use GitHub public API |
| Multi-language / i18n | Out of scope | — |
| RSS feed | Deferred v2 | Easy Astro plugin when needed |
| Paid/gated content with Stripe | Out of scope | — |
| Native mobile app | Out of scope | PWA covers owner needs |

---

## 11. Open Questions Register

| # | Section | Question | Owner | Status |
|---|---------|----------|-------|--------|
| 1 | Home | Full name or first name in hero? | Content owner | Open |
| 2 | Home | Hero tagline copy | Content owner | Open |
| 3 | Home | Personalization copy for returning visitors | Dev + owner | Open |
| 4 | Life Map | Allow future/aspirational milestones? | Content owner | Open |
| 5 | Life Map | Dark background confirmed? | Design | Open |
| 6 | Family | Number of family members | Content owner | Open |
| 7 | Family | Real photos vs illustrated avatars | Content owner | Open |
| 8 | Family | Include pets? | Content owner | Open |
| 9 | Projects | Modal or dedicated page per project? | Dev | Open |
| 10 | Projects | GitHub stats integration? | Dev | Open |
| 11 | Musings | Writing workflow — CMS editor sufficient? | Content owner | Open |
| 12 | Reach Out | Auto-reply email to visitor? | Content owner | Open |
| 13 | Fingerprinting | GDPR consent banner copy and design | Dev + owner | Open |
| 14 | Admin Auth | Azure AD B2C vs simple credential auth | Dev | Open |
| 15 | Design | Final accent color / palette | Design + owner | Open |
| 17 | Infra | App Service Plan: share API + Strapi on same plan, or separate? | Dev | Open |
| 18 | CI/CD | Should Lighthouse CI run against a preview deployment or local serve? | Dev | Open |
| 19 | Dev env | Docker Desktop required, or should Strapi run bare on Windows? | Dev | Open |
