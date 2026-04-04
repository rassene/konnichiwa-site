// /src/site/src/content/interfaces/index.ts
// CAL TypeScript interfaces — canonical contract between frontend and any CMS.
// Defined from data-model.md Part 1. DO NOT import Strapi SDK directly in components.

export interface IMedia {
  url: string;        // CDN URL (Azure Blob + Microsoft CDN)
  alt: string;
  width?: number;
  height?: number;
  blurHash?: string;  // low-res placeholder for progressive loading
}

export interface IMilestone {
  id: string;
  date: string;       // ISO 8601 (YYYY-MM-DD)
  title: string;
  description: string;
  category: 'academic' | 'personal' | 'professional' | 'social' | 'creative' | 'future';
  media?: IMedia[];
  featured: boolean;
}

export interface IFamilyMember {
  id: string;
  name: string;
  relation: string;    // e.g. "Mum", "Big Brother", "Little Sister"
  tagline: string;     // one-sentence description, max 120 chars
  photo: IMedia;
  funFacts: string[];  // 2–4 items, each max 100 chars
  emoji?: string;      // optional signature emoji
  order: number;       // display order in family scene
}

export interface IProject {
  id: string;
  slug: string;
  title: string;
  status: 'idea' | 'in-progress' | 'completed' | 'paused';
  description: string;  // short, max 200 chars
  body?: string;        // rich text for project detail page
  tags: string[];
  links?: { label: string; url: string }[];
  startDate?: string;   // ISO 8601
  endDate?: string;     // ISO 8601
  media?: IMedia[];
  featured: boolean;
}

export interface IReading {
  id: string;
  title: string;
  author: string;
  type: 'book' | 'article' | 'paper' | 'podcast' | 'video';
  status: 'reading' | 'completed' | 'want-to-read';
  rating?: 1 | 2 | 3 | 4 | 5;
  note?: string;          // owner's take — may be T1-gated
  noteIsGated: boolean;   // true = T1 subscribers only see full note
  clusters: string[];     // interest cluster slugs
  dateAdded: string;      // ISO 8601
  coverUrl?: string;      // optional cover image URL
}

export interface IMusingPost {
  id: string;
  slug: string;
  title: string;
  body: string;           // rich text / markdown
  excerpt: string;        // max 200 chars, shown to T0 users on gated posts
  format: 'essay' | 'note' | 'thread' | 'quote';
  clusters: string[];
  tier: 'public' | 'subscriber';
  publishedAt: string;    // ISO 8601
  updatedAt?: string;     // ISO 8601
  coverImage?: IMedia;
}

export interface IInterestCluster {
  id: string;
  slug: string;
  label: string;          // display name, e.g. "Tech & Code"
  description: string;    // max 160 chars
  color: string;          // hex color, e.g. "#4A90D9"
}

export interface IEducationEntry {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;      // null if ongoing
  description?: string;
}

export interface IExperienceEntry {
  company: string;
  role: string;
  startDate: string;     // ISO 8601 (YYYY-MM)
  endDate?: string;      // ISO 8601 or null if current
  description: string;
  highlights?: string[];
}

export interface ISkillGroup {
  category: string;      // e.g. "Programming", "Frameworks", "Tools"
  items: string[];
}

export interface ILanguage {
  name: string;
  proficiency: 'native' | 'fluent' | 'professional' | 'conversational' | 'basic';
}

export interface ICertification {
  name: string;
  issuer: string;
  issuedAt: string;      // ISO 8601 (YYYY-MM)
  url?: string;
}

export interface IResumeData {
  downloadUrl: string;           // PDF in Azure Blob Storage
  education: IEducationEntry[];
  experience: IExperienceEntry[];
  skills: ISkillGroup[];
  languages: ILanguage[];
  certifications?: ICertification[];
}
