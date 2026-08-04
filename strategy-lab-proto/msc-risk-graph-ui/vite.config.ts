import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const publicDir = path.resolve(__dirname, "public");
const dragFile = path.join(publicDir, "live-drag.json");
const chartFile = path.join(publicDir, "live-chart.json");

function labsBridgePlugin() {
  return {
    name: "labs-rg-bridge",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/api/drag") && req.method === "POST") {
          const chunks: Buffer[] = [];
          req.on("data", (c) => chunks.push(c));
          req.on("end", () => {
            try {
              fs.mkdirSync(publicDir, { recursive: true });
              fs.writeFileSync(dragFile, Buffer.concat(chunks).toString("utf8"));
              res.statusCode = 204;
              res.end();
            } catch (e) {
              res.statusCode = 500;
              res.end(String(e));
            }
          });
          return;
        }
        next();
      });
    },
    configurePreviewServer(server: import("vite").PreviewServer) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/api/drag") && req.method === "POST") {
          const chunks: Buffer[] = [];
          req.on("data", (c) => chunks.push(c));
          req.on("end", () => {
            try {
              fs.mkdirSync(publicDir, { recursive: true });
              fs.writeFileSync(dragFile, Buffer.concat(chunks).toString("utf8"));
              res.statusCode = 204;
              res.end();
            } catch (e) {
              res.statusCode = 500;
              res.end(String(e));
            }
          });
          return;
        }
        // Ensure live-chart.json is readable if missing
        if (req.url?.startsWith("/live-chart.json") && !fs.existsSync(chartFile)) {
          res.statusCode = 404;
          res.end("{}");
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), labsBridgePlugin()],
  publicDir: "public",
  server: {
    port: 5174,
    strictPort: true,
    host: "127.0.0.1",
    cors: true,
  },
  preview: {
    port: 5174,
    strictPort: true,
    host: "127.0.0.1",
    cors: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
