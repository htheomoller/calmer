import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// SANDBOX_START (audit)
import { spawn } from "child_process";
import { readFile } from "fs/promises";
import type { ViteDevServer } from "vite";
// SANDBOX_END

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // SANDBOX_START (audit)
    // Add dev middleware for audit functionality
    ...(mode === 'development' && {
      configureServer(server: ViteDevServer) {
        // GET /__dev/audit-run - run npm audit:report or ping check
        server.middlewares.use('/__dev/audit-run', async (req: any, res: any) => {
          if (req.method !== 'GET') {
            res.statusCode = 405;
            res.end('Method not allowed');
            return;
          }

          const url = new URL(req.url || '', `http://${req.headers.host}`);
          
          // Ping check
          if (url.searchParams.get('ping') === '1') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store');
            res.end(JSON.stringify({ ok: true, ping: true }));
            return;
          }

          // Run audit
          const child = spawn('npm', ['run', 'audit:report'], {
            cwd: process.cwd(),
            stdio: 'pipe'
          });

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });

          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            const response = {
              ok: code === 0,
              code,
              stdout,
              stderr,
              artifacts: {
                report: 'tmp/audit/report.md',
                plan: 'docs/cleanup/plan.md'
              }
            };

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store');
            res.end(JSON.stringify(response));
          });

          child.on('error', (error) => {
            const response = {
              ok: false,
              code: 1,
              stdout: '',
              stderr: error.message,
              artifacts: null
            };

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store');
            res.end(JSON.stringify(response));
          });
        });

        // GET /__dev/read-file?path=<path> - read audit files
        server.middlewares.use('/__dev/read-file', async (req: any, res: any) => {
          if (req.method !== 'GET') {
            res.statusCode = 405;
            res.end('Method not allowed');
            return;
          }

          const url = new URL(req.url || '', `http://${req.headers.host}`);
          const filePath = url.searchParams.get('path');

          if (!filePath) {
            res.statusCode = 400;
            res.end('Missing path parameter');
            return;
          }

          // Security: only allow specific paths
          if (!filePath.startsWith('tmp/audit/') && !filePath.startsWith('docs/cleanup/')) {
            res.statusCode = 403;
            res.end('Access denied');
            return;
          }

          try {
            const content = await readFile(filePath, 'utf-8');
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Cache-Control', 'no-store');
            res.end(content);
          } catch (error) {
            res.statusCode = 404;
            res.end('File not found');
          }
        });
      }
    })
    // SANDBOX_END
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
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