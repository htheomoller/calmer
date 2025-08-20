import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { execFile } from "child_process";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import fs from "fs";

// ESM helpers
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: safe JSON response
function sendJson(res: any, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

// Helper: file whitelist check
function isAllowedPath(p: string) {
  const allowed = [
    path.resolve(__dirname, 'tmp/audit'),
    path.resolve(__dirname, 'docs/cleanup'),
  ];
  const resolved = path.resolve(__dirname, p);
  return allowed.some(dir => resolved.startsWith(dir));
}

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
    // Dev/Preview only
    ...(mode !== 'production' ? [{
      name: 'dev-audit-plugin',
      configureServer(server: any) {
        // SAFETY: This dev middleware is never active in production builds.
        // We only register /__dev/* when mode !== 'production'.
        // Run audit
        server.middlewares.use('/__dev/audit-run', (req: any, res: any) => {
          if (req.method !== 'GET') {
            return sendJson(res, 405, { error: 'Method not allowed' });
          }
          // Optional ping: /__dev/audit-run?ping=1
          try {
            const url = new URL(req.url!, 'http://localhost');
            if (url.searchParams.get('ping') === '1') {
              return sendJson(res, 200, { ok: true, ping: true });
            }
          } catch {}

          let tsxPath;
          try {
            tsxPath = require.resolve('tsx/cli');
          } catch (e) {
            return sendJson(res, 500, { error: 'tsx not found. Install devDependencies.' });
          }

          const scriptPath = path.resolve(__dirname, 'scripts/audit/scan.ts');

          const child = execFile(
            process.execPath, // node binary
            [tsxPath, scriptPath],
            { cwd: process.cwd(), env: { ...process.env, NODE_ENV: 'development' } },
            (error, stdout, stderr) => {
              if (error) {
                return sendJson(res, 500, {
                  error: 'Audit script failed to run.',
                  details: (stderr || stdout || String(error)).slice(0, 4000),
                });
              }
              sendJson(res, 200, {
                success: true,
                message: 'Audit completed.',
                output_head: (stdout || '').slice(0, 4000),
                artifacts: {
                  report: 'tmp/audit/report.md',
                  plan: 'docs/cleanup/plan.md'
                }
              });
            }
          );
        });

        // Read artifact file (strict whitelist)
        server.middlewares.use('/__dev/read-file', (req: any, res: any) => {
          if (req.method !== 'GET') {
            return sendJson(res, 405, { error: 'Method not allowed' });
          }
          try {
            const url = new URL(req.url!, 'http://localhost');
            const p = url.searchParams.get('path') || '';
            if (!p) return sendJson(res, 400, { error: 'Missing path parameter' });
            if (!isAllowedPath(p)) return sendJson(res, 403, { error: 'Access forbidden' });

            const full = path.resolve(__dirname, p);
            if (!fs.existsSync(full)) return sendJson(res, 404, { error: 'File not found' });

            const content = fs.readFileSync(full, 'utf8');
            sendJson(res, 200, { content, path: p, timestamp: new Date().toISOString() });
          } catch (e) {
            sendJson(res, 500, { error: 'Read error', details: String(e).slice(0, 4000) });
          }
        });
      },
      configurePreviewServer(server: any) {
        // Run audit
        server.middlewares.use('/__dev/audit-run', (req: any, res: any) => {
          if (req.method !== 'GET') {
            return sendJson(res, 405, { error: 'Method not allowed' });
          }
          // Optional ping: /__dev/audit-run?ping=1
          try {
            const url = new URL(req.url!, 'http://localhost');
            if (url.searchParams.get('ping') === '1') {
              return sendJson(res, 200, { ok: true, ping: true });
            }
          } catch {}

          let tsxPath;
          try {
            tsxPath = require.resolve('tsx/cli');
          } catch (e) {
            return sendJson(res, 500, { error: 'tsx not found. Install devDependencies.' });
          }

          const scriptPath = path.resolve(__dirname, 'scripts/audit/scan.ts');

          const child = execFile(
            process.execPath, // node binary
            [tsxPath, scriptPath],
            { cwd: process.cwd(), env: { ...process.env, NODE_ENV: 'development' } },
            (error, stdout, stderr) => {
              if (error) {
                return sendJson(res, 500, {
                  error: 'Audit script failed to run.',
                  details: (stderr || stdout || String(error)).slice(0, 4000),
                });
              }
              sendJson(res, 200, {
                success: true,
                message: 'Audit completed.',
                output_head: (stdout || '').slice(0, 4000),
                artifacts: {
                  report: 'tmp/audit/report.md',
                  plan: 'docs/cleanup/plan.md'
                }
              });
            }
          );
        });

        // Read artifact file (strict whitelist)
        server.middlewares.use('/__dev/read-file', (req: any, res: any) => {
          if (req.method !== 'GET') {
            return sendJson(res, 405, { error: 'Method not allowed' });
          }
          try {
            const url = new URL(req.url!, 'http://localhost');
            const p = url.searchParams.get('path') || '';
            if (!p) return sendJson(res, 400, { error: 'Missing path parameter' });
            if (!isAllowedPath(p)) return sendJson(res, 403, { error: 'Access forbidden' });

            const full = path.resolve(__dirname, p);
            if (!fs.existsSync(full)) return sendJson(res, 404, { error: 'File not found' });

            const content = fs.readFileSync(full, 'utf8');
            sendJson(res, 200, { content, path: p, timestamp: new Date().toISOString() });
          } catch (e) {
            sendJson(res, 500, { error: 'Read error', details: String(e).slice(0, 4000) });
          }
        });
      }
    }] : [])
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