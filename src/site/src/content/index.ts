// /src/site/src/content/index.ts
// Content Abstraction Layer (CAL) entry point.
// Single CMS switch point — swap the adapter here to change CMS.
// Components must NEVER import from Strapi SDK directly.
import { strapiAdapter } from './adapters/strapi/index.js';

export const content = strapiAdapter;
