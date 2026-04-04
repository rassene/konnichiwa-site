import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
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
