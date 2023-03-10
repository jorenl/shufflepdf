import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/shufflepdf/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",

      includeAssets: ["icon.svg"],
      manifest: {
        name: "shufflepdf",
        short_name: "shufflepdf",
        description: "Merge and rearrange pdfs on the fly",
        theme_color: "#ffffff",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
