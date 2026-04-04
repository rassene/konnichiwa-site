// /src/site/src/content/adapters/strapi/index.ts
// Strapi v4 REST adapter implementing IContentAdapter.
// All methods return empty arrays / null initially.
// IMPORTANT: fetch errors are never swallowed — build fails if Strapi is unreachable.
import type { IContentAdapter } from '../IContentAdapter.js';
import type {
  IFamilyMember,
  IInterestCluster,
  IMilestone,
  IMusingPost,
  IProject,
  IReading,
  IResumeData,
} from '../../interfaces/index.js';

const STRAPI_URL = import.meta.env.STRAPI_URL ?? 'http://localhost:1337';
const CDN_BASE   = import.meta.env.CDN_BASE_URL ?? '';

/** Prefix a Strapi media URL with the CDN base URL. */
function cdnUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  return `${CDN_BASE}${path}`;
}

/** Perform a Strapi REST fetch. Throws on non-2xx — never swallowed. */
async function strapiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Strapi fetch failed: ${res.status} ${res.statusText} (${path})`);
  }
  return res.json() as Promise<T>;
}

export const strapiAdapter: IContentAdapter = {
  async getMilestones(): Promise<IMilestone[]> {
    // TODO (T056+): implement when milestone Strapi type is created
    return [];
  },

  async getFamilyMembers(): Promise<IFamilyMember[]> {
    // TODO (Phase 4): implement when family-member Strapi type is created
    return [];
  },

  async getProjects(options?: { featured?: boolean }): Promise<IProject[]> {
    // TODO (T036): implement when project Strapi type is created
    void options;
    return [];
  },

  async getProject(_slug: string): Promise<IProject | null> {
    // TODO (T036): implement when project Strapi type is created
    return null;
  },

  async getReadings(options?: { cluster?: string; status?: IReading['status'] }): Promise<IReading[]> {
    // TODO (T037): implement when reading Strapi type is created
    void options;
    return [];
  },

  async getMusings(options?: { cluster?: string; tier?: IMusingPost['tier'] }): Promise<IMusingPost[]> {
    // TODO (T056): implement when musing-post Strapi type is created
    void options;
    return [];
  },

  async getMusing(_slug: string): Promise<IMusingPost | null> {
    // TODO (T056): implement when musing-post Strapi type is created
    return null;
  },

  async getClusters(): Promise<IInterestCluster[]> {
    // TODO (T037): implement when interest-cluster Strapi type is created
    return [];
  },

  async getResumeData(): Promise<IResumeData> {
    // TODO (T038): implement when resume-data Strapi type is created
    return {
      downloadUrl: '',
      education: [],
      experience: [],
      skills: [],
      languages: [],
      certifications: [],
    };
  },
};

// Export cdnUrl and strapiGet for use in future method implementations
export { cdnUrl, strapiGet };
