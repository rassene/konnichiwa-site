import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Use our custom service-worker.js (in public/) so push events are handled.
      // vite-plugin-pwa will inject the precache manifest into it.
      strategies: "injectManifest",
      srcDir: "public",
      filename: "service-worker.js",
      manifest: {
        name: "Sarah — Admin",
        short_name: "Admin",
        description: "Owner-only admin dashboard for the personal website.",
        start_url: "/",
        display: "standalone",
        background_color: "#1A1A18",
        theme_color: "#1A1A18",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
