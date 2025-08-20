import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { execFile } from "node:child_process";
import fs from "node:fs";
import type { Plugin } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    host: "::",
    port: 4173,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    {
      name: 'dev-audit-plugin',
      apply: 'serve' as const,
      configureServer(server: any) {
        server.middlewares.use("/__dev/audit-run", (req: any, res: any) => {
          const tsxPath = path.resolve(__dirname, "node_modules/tsx/dist/cli.js");
          const scriptPath = path.resolve(__dirname, "scripts/audit/scan.ts");
          if (!fs.existsSync(tsxPath)) { res.writeHead(500,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:"tsx not found"})); return; }
          execFile("node", [tsxPath, scriptPath], (err,stdout,stderr) => {
            if (err) { res.writeHead(500,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:stderr||err.message})); return; }
            res.writeHead(200,{"Content-Type":"application/json"}); res.end(JSON.stringify({success:true,output:stdout}));
          });
        });
        server.middlewares.use("/__dev/read-file", (req: any, res: any) => {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const filePath = url.searchParams.get("path");
          if (!filePath) { res.writeHead(400,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:"Missing path"})); return; }
          const allowedDirs = [path.resolve(__dirname,"tmp/audit"), path.resolve(__dirname,"docs/cleanup")];
          const requestedPath = path.resolve(__dirname,filePath);
          if (!allowedDirs.some(dir => requestedPath.startsWith(dir))) { res.writeHead(403,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:"Access forbidden"})); return; }
          fs.readFile(requestedPath,"utf8",(err,data) => {
            if (err) { res.writeHead(404,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:"File not found"})); return; }
            res.writeHead(200,{"Content-Type":"text/plain"}); res.end(data);
          });
        });
      },
      configurePreviewServer(server: any) {
        server.middlewares.use("/__dev/audit-run", (req: any, res: any) => {
          const tsxPath = path.resolve(__dirname, "node_modules/tsx/dist/cli.js");
          const scriptPath = path.resolve(__dirname, "scripts/audit/scan.ts");
          if (!fs.existsSync(tsxPath)) { res.writeHead(500,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:"tsx not found"})); return; }
          execFile("node", [tsxPath, scriptPath], (err,stdout,stderr) => {
            if (err) { res.writeHead(500,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:stderr||err.message})); return; }
            res.writeHead(200,{"Content-Type":"application/json"}); res.end(JSON.stringify({success:true,output:stdout}));
          });
        });
        server.middlewares.use("/__dev/read-file", (req: any, res: any) => {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const filePath = url.searchParams.get("path");
          if (!filePath) { res.writeHead(400,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:"Missing path"})); return; }
          const allowedDirs = [path.resolve(__dirname,"tmp/audit"), path.resolve(__dirname,"docs/cleanup")];
          const requestedPath = path.resolve(__dirname,filePath);
          if (!allowedDirs.some(dir => requestedPath.startsWith(dir))) { res.writeHead(403,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:"Access forbidden"})); return; }
          fs.readFile(requestedPath,"utf8",(err,data) => {
            if (err) { res.writeHead(404,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:"File not found"})); return; }
            res.writeHead(200,{"Content-Type":"text/plain"}); res.end(data);
          });
        });
      }
    } as Plugin
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
}));