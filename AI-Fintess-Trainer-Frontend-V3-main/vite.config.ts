import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::", // IPv6 + IPv4
    port: 8080,
    strictPort: true,
    // Match production nginx paths (see nginx.conf) — same-origin /api/* in dev
    proxy: {
      "/api/exercises": {
        target: "http://127.0.0.1:11003",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/exercises/, ""),
      },
      "/api/workout": {
        target: "http://127.0.0.1:11002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/workout/, ""),
      },
      "/api/assistant": {
        target: "http://127.0.0.1:11001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/assistant/, ""),
      },
    },
  },
  preview: {
    host: "0.0.0.0", // Required for Render
    port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
    strictPort: true,
    allowedHosts: "all",
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["@supabase/supabase-js"],
  },
}));
