import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_ORIGIN = "http://127.0.0.1:3001";

/** Stops 404s when a leftover service worker or extension requests vite-plugin-pwa dev URLs we don't use. */
function silenceGhostPwaRequests(): Plugin {
  return {
    name: "silence-ghost-pwa-requests",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/@vite-plugin-pwa/")) {
          res.statusCode = 204;
          res.end();
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), silenceGhostPwaRequests()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: API_ORIGIN, changeOrigin: true },
      "/ws": { target: API_ORIGIN, ws: true, changeOrigin: true },
    },
  },
});
