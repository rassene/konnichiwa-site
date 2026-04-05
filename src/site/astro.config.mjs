import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // Production domain — required for canonical URLs and sitemap absolute URLs.
  // Override via PUBLIC_SITE_URL env var in CI / production deployments.
  site: process.env.PUBLIC_SITE_URL ?? "https://localhost:4321",
  integrations: [
    react(),
    sitemap({
      // Exclude admin-adjacent and noindex routes from the public sitemap.
      filter: (page) =>
        !page.includes("/admin") &&
        !page.includes("/api/") &&
        !page.includes("/hangfire"),
    }),
  ],
  output: "static",
  // SSR mode activated per-page only where auth/personalization is required
  // (see spec §5.1 — musing post body fetched client-side via API)
  build: {
    // Fail build if Strapi is unreachable (spec §2.4 — Adapter Failure Policy)
    // The Strapi adapter throws on connection failure; Astro propagates this as a build error.
  },
  vite: {
    define: {
      // Expose env vars to client (PUBLIC_ prefix only)
    },
  },
});
