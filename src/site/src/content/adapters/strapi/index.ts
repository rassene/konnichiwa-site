// /src/site/src/content/adapters/strapi/index.ts
// Strapi v4 REST adapter implementing IContentAdapter.
// IMPORTANT: fetch errors are never swallowed — build fails if Strapi is unreachable.
import type { IContentAdapter } from '../IContentAdapter.js';
import type {
  IFamilyMember,
  IInterestCluster,
  IMedia,
  IMilestone,
  IMusingPost,
  IProject,
  IReading,
  IResumeData,
  ISiteLink,
} from '../../interfaces/index.js';

const STRAPI_URL = import.meta.env.STRAPI_URL ?? 'http://localhost:1337';
const CDN_BASE   = import.meta.env.CDN_BASE_URL ?? '';

/** Prefix a Strapi media URL with the CDN base URL. */
export function cdnUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  return `${CDN_BASE}${path}`;
}

/** Perform a Strapi REST fetch. Throws on non-2xx — never swallowed. */
export async function strapiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Strapi fetch failed: ${res.status} ${res.statusText} (${path})`);
  }
  return res.json() as Promise<T>;
}

/** Map a Strapi media object to IMedia. */
function mapMedia(raw: Record<string, unknown> | null | undefined): IMedia | undefined {
  if (!raw) return undefined;
  return {
    url:    cdnUrl(String(raw['url'] ?? '')),
    alt:    String(raw['alternativeText'] ?? raw['name'] ?? ''),
    width:  typeof raw['width'] === 'number' ? raw['width'] : undefined,
    height: typeof raw['height'] === 'number' ? raw['height'] : undefined,
  };
}

/** Map an array of Strapi media data items to IMedia[]. */
function mapMediaArray(raw: unknown): IMedia[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m: unknown) => mapMedia((m as Record<string, unknown>)['attributes'] as Record<string, unknown>))
    .filter(Boolean) as IMedia[];
}

// ─── Mapping Helpers ────────────────────────────────────────────────────────

function mapProject(item: Record<string, unknown>): IProject {
  const attrs = (item['attributes'] ?? item) as Record<string, unknown>;
  const mediaData = (attrs['media'] as Record<string, unknown> | undefined)?.['data'];
  return {
    id:          String(item['id'] ?? ''),
    slug:        String(attrs['slug'] ?? ''),
    title:       String(attrs['title'] ?? ''),
    status:      (attrs['status'] as IProject['status']) ?? 'idea',
    description: String(attrs['description'] ?? ''),
    body:        attrs['body'] ? String(attrs['body']) : undefined,
    tags:        Array.isArray(attrs['tags']) ? (attrs['tags'] as string[]) : [],
    links:       Array.isArray(attrs['links'])
      ? (attrs['links'] as { label: string; url: string }[])
      : [],
    startDate: attrs['startDate'] ? String(attrs['startDate']) : undefined,
    endDate:   attrs['endDate'] ? String(attrs['endDate']) : undefined,
    media:     mapMediaArray(mediaData),
    featured:  Boolean(attrs['featured']),
  };
}

function mapReading(item: Record<string, unknown>): IReading {
  const attrs = (item['attributes'] ?? item) as Record<string, unknown>;
  const clustersData = (attrs['clusters'] as Record<string, unknown> | undefined)?.['data'];
  const clusterSlugs = Array.isArray(clustersData)
    ? clustersData
        .map((c: unknown) => {
          const ca = (c as Record<string, unknown>)['attributes'] as Record<string, unknown>;
          return String(ca?.['slug'] ?? '');
        })
        .filter(Boolean)
    : [];
  return {
    id:          String(item['id'] ?? ''),
    title:       String(attrs['title'] ?? ''),
    author:      String(attrs['author'] ?? ''),
    type:        (attrs['type'] as IReading['type']) ?? 'book',
    status:      (attrs['status'] as IReading['status']) ?? 'want-to-read',
    rating:      attrs['rating'] != null ? (Number(attrs['rating']) as IReading['rating']) : undefined,
    note:        attrs['note'] ? String(attrs['note']) : undefined,
    noteIsGated: Boolean(attrs['noteIsGated']),
    clusters:    clusterSlugs,
    dateAdded:   String(attrs['dateAdded'] ?? ''),
    coverUrl:    attrs['coverUrl'] ? String(attrs['coverUrl']) : undefined,
  };
}

function mapCluster(item: Record<string, unknown>): IInterestCluster {
  const attrs = (item['attributes'] ?? item) as Record<string, unknown>;
  return {
    id:          String(item['id'] ?? ''),
    slug:        String(attrs['slug'] ?? ''),
    label:       String(attrs['label'] ?? ''),
    description: String(attrs['description'] ?? ''),
    color:       String(attrs['color'] ?? '#4A90D9'),
  };
}

function mapMusing(item: Record<string, unknown>): IMusingPost {
  const attrs = (item['attributes'] ?? item) as Record<string, unknown>;
  const clustersData = (attrs['clusters'] as Record<string, unknown> | undefined)?.['data'];
  const clusterSlugs = Array.isArray(clustersData)
    ? clustersData
        .map((c: unknown) => {
          const ca = (c as Record<string, unknown>)['attributes'] as Record<string, unknown>;
          return String(ca?.['slug'] ?? '');
        })
        .filter(Boolean)
    : [];
  const coverRaw = (attrs['coverImage'] as Record<string, unknown> | undefined)?.['data'] as
    | Record<string, unknown>
    | null;
  const coverAttrs = coverRaw?.['attributes'] as Record<string, unknown> | undefined;
  return {
    id:          String(item['id'] ?? ''),
    slug:        String(attrs['slug'] ?? ''),
    title:       String(attrs['title'] ?? ''),
    body:        String(attrs['body'] ?? ''),
    excerpt:     String(attrs['excerpt'] ?? ''),
    format:      (attrs['format'] as IMusingPost['format']) ?? 'note',
    clusters:    clusterSlugs,
    tier:        (attrs['tier'] as IMusingPost['tier']) ?? 'public',
    publishedAt: String(attrs['publishedAt'] ?? attrs['createdAt'] ?? ''),
    updatedAt:   attrs['updatedAt'] ? String(attrs['updatedAt']) : undefined,
    coverImage:  coverAttrs ? mapMedia(coverAttrs) : undefined,
  };
}

// ─── Adapter ────────────────────────────────────────────────────────────────

export const strapiAdapter: IContentAdapter = {
  // ─── Milestones (T094) ───────────────────────────────────────────────────
  async getMilestones(): Promise<IMilestone[]> {
    const data = await strapiGet<{ data: unknown[] }>(
      '/milestones?populate=media&sort=date:asc',
    );
    return (data.data ?? []).map((item) => {
      const raw = item as Record<string, unknown>;
      const attrs = (raw['attributes'] ?? raw) as Record<string, unknown>;
      const mediaData = (attrs['media'] as Record<string, unknown> | undefined)?.['data'];
      return {
        id:          String(raw['id'] ?? ''),
        date:        String(attrs['date'] ?? ''),
        title:       String(attrs['title'] ?? ''),
        description: String(attrs['description'] ?? ''),
        category:    (attrs['category'] as IMilestone['category']) ?? 'personal',
        media:       mapMediaArray(mediaData),
        featured:    Boolean(attrs['featured']),
      };
    });
  },

  // ─── Family Members (T095) ───────────────────────────────────────────────
  async getFamilyMembers(): Promise<IFamilyMember[]> {
    const data = await strapiGet<{ data: unknown[] }>(
      '/family-members?populate=photo&sort=order:asc',
    );
    return (data.data ?? []).map((item) => {
      const raw = item as Record<string, unknown>;
      const attrs = (raw['attributes'] ?? raw) as Record<string, unknown>;
      const photoData = (attrs['photo'] as Record<string, unknown> | undefined)?.['data'] as
        | Record<string, unknown>
        | null;
      const photoAttrs = photoData?.['attributes'] as Record<string, unknown> | undefined;
      return {
        id:       String(raw['id'] ?? ''),
        name:     String(attrs['name'] ?? ''),
        relation: String(attrs['relation'] ?? ''),
        tagline:  String(attrs['tagline'] ?? ''),
        photo:    photoAttrs
          ? (mapMedia(photoAttrs) ?? { url: '', alt: attrs['name'] ? String(attrs['name']) : '' })
          : { url: '', alt: attrs['name'] ? String(attrs['name']) : '' },
        funFacts: Array.isArray(attrs['funFacts']) ? (attrs['funFacts'] as string[]) : [],
        emoji:    attrs['emoji'] ? String(attrs['emoji']) : undefined,
        order:    typeof attrs['order'] === 'number' ? attrs['order'] : 0,
      };
    });
  },

  // ─── Projects (T036) ─────────────────────────────────────────────────────
  async getProjects(options?: { featured?: boolean }): Promise<IProject[]> {
    let qs = '?populate=media&sort=createdAt:desc';
    if (options?.featured === true) qs += '&filters[featured][$eq]=true';
    const data = await strapiGet<{ data: unknown[] }>(`/projects${qs}`);
    return (data.data ?? []).map((item) => mapProject(item as Record<string, unknown>));
  },

  async getProject(slug: string): Promise<IProject | null> {
    const data = await strapiGet<{ data: unknown[] }>(
      `/projects?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=media`,
    );
    if (!data.data?.length) return null;
    return mapProject(data.data[0] as Record<string, unknown>);
  },

  // ─── Readings + Clusters (T037) ──────────────────────────────────────────
  async getReadings(options?: { cluster?: string; status?: IReading['status'] }): Promise<IReading[]> {
    let qs = '?populate=clusters&sort=dateAdded:desc';
    if (options?.cluster) {
      qs += `&filters[clusters][slug][$eq]=${encodeURIComponent(options.cluster)}`;
    }
    if (options?.status) {
      qs += `&filters[status][$eq]=${encodeURIComponent(options.status)}`;
    }
    const data = await strapiGet<{ data: unknown[] }>(`/readings${qs}`);
    return (data.data ?? []).map((item) => mapReading(item as Record<string, unknown>));
  },

  async getClusters(): Promise<IInterestCluster[]> {
    const data = await strapiGet<{ data: unknown[] }>('/interest-clusters?sort=label:asc');
    return (data.data ?? []).map((item) => mapCluster(item as Record<string, unknown>));
  },

  // ─── Musings (T056) ──────────────────────────────────────────────────────
  async getMusings(options?: { cluster?: string; tier?: IMusingPost['tier'] }): Promise<IMusingPost[]> {
    let qs = '?populate=coverImage,clusters&sort=publishedAt:desc';
    if (options?.cluster) {
      qs += `&filters[clusters][slug][$eq]=${encodeURIComponent(options.cluster)}`;
    }
    if (options?.tier) {
      qs += `&filters[tier][$eq]=${encodeURIComponent(options.tier)}`;
    }
    const data = await strapiGet<{ data: unknown[] }>(`/musing-posts${qs}`);
    return (data.data ?? []).map((item) => mapMusing(item as Record<string, unknown>));
  },

  async getMusing(slug: string): Promise<IMusingPost | null> {
    const data = await strapiGet<{ data: unknown[] }>(
      `/musing-posts?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=coverImage,clusters`,
    );
    if (!data.data?.length) return null;
    return mapMusing(data.data[0] as Record<string, unknown>);
  },

  // ─── Resume (T038) ───────────────────────────────────────────────────────
  async getResumeData(): Promise<IResumeData> {
    const data = await strapiGet<{ data: Record<string, unknown> | null }>('/resume-data');
    const attrs = (data.data?.['attributes'] ?? data.data) as Record<string, unknown> | null;
    if (!attrs) {
      return { downloadUrl: '', education: [], experience: [], skills: [], languages: [], certifications: [] };
    }
    return {
      downloadUrl:    String(attrs['downloadUrl'] ?? ''),
      education:      Array.isArray(attrs['education']) ? (attrs['education'] as IResumeData['education']) : [],
      experience:     Array.isArray(attrs['experience']) ? (attrs['experience'] as IResumeData['experience']) : [],
      skills:         Array.isArray(attrs['skills']) ? (attrs['skills'] as IResumeData['skills']) : [],
      languages:      Array.isArray(attrs['languages']) ? (attrs['languages'] as IResumeData['languages']) : [],
      certifications: Array.isArray(attrs['certifications'])
        ? (attrs['certifications'] as IResumeData['certifications'])
        : [],
    };
  },

  // ─── Site Links (T066) ───────────────────────────────────────────────────
  async getSiteLinks(): Promise<ISiteLink[]> {
    const data = await strapiGet<{ data: Record<string, unknown> | null }>('/site-links');
    const attrs = (data.data?.['attributes'] ?? data.data) as Record<string, unknown> | null;
    if (!attrs || !Array.isArray(attrs['links'])) return [];
    return attrs['links'] as ISiteLink[];
  },
};
