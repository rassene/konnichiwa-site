// /src/site/src/content/adapters/IContentAdapter.ts
// Single CMS-agnostic interface. Swap the adapter in content/index.ts to change CMS.
import type {
  IFamilyMember,
  IInterestCluster,
  IMilestone,
  IMusingPost,
  IProject,
  IReading,
  IResumeData,
} from '../interfaces/index.js';

export interface IContentAdapter {
  getMilestones(): Promise<IMilestone[]>;
  getFamilyMembers(): Promise<IFamilyMember[]>;
  getProjects(options?: { featured?: boolean }): Promise<IProject[]>;
  getProject(slug: string): Promise<IProject | null>;
  getReadings(options?: { cluster?: string; status?: IReading['status'] }): Promise<IReading[]>;
  getMusings(options?: { cluster?: string; tier?: IMusingPost['tier'] }): Promise<IMusingPost[]>;
  getMusing(slug: string): Promise<IMusingPost | null>;
  getClusters(): Promise<IInterestCluster[]>;
  getResumeData(): Promise<IResumeData>;
}
