import type { Plugin, ViteDevServer, PreviewServerHook } from 'vite';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

function createHandlers() {
  const auditRunHandler = async (req: any, res: any) => {
    try {
      const url = new URL(req.url, 'http://local');
      if (url.searchParams.get('ping') === '1') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ ok: true, ping: true }));
        return;
      }
      console.log('[__dev] audit-run exec npm run audit:report');
      const child = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'audit:report'], { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = ''; let stderr = '';
      child.stdout.on('data', (d) => { stdout += String(d); });
      child.stderr.on('data', (d) => { stderr += String(d); });
      child.on('close', (code) => {
        const payload = {
          ok: code === 0,
          code,
          stdout,
          stderr,
          artifacts: { report: 'tmp/audit/report.md', plan: 'docs/cleanup/plan.md' }
        };
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(payload));
      });
    } catch (e: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: e?.message || String(e) }));
    }
  };

  const readFileHandler = async (req: any, res: any) => {
    try {
      const url = new URL(req.url, 'http://local');
      const p = url.searchParams.get('path') || '';
      // Security whitelist
      if (!p.startsWith('tmp/audit/') && !p.startsWith('docs/cleanup/')) {
        res.statusCode = 403;
        res.end('Access denied');
        return;
      }
      const abs = path.resolve(process.cwd(), p);
      const content = await readFile(abs, 'utf8');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(content);
    } catch (e: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(`Could not read file: ${e?.message || String(e)}`);
    }
  };

  // First-pass guard to ensure our routes win before SPA fallback
  const guard = (req: any, _res: any, next: any) => {
    const u = req.url || '';
    if (!u.startsWith('/__dev/')) return next();
    // fall through to our specific handlers registered next
    next();
  };

  return { auditRunHandler, readFileHandler, guard };
}

export default function devAuditPlugin(): Plugin {
  return {
    name: 'dev-audit-plugin',
    apply: 'serve', // dev & preview
    configureServer(server: ViteDevServer) {
      const { auditRunHandler, readFileHandler, guard } = createHandlers();
      // Guard first → then endpoints
      server.middlewares.use(guard);
      server.middlewares.use('/__dev/audit-run', (req, res) => { console.log('[__dev] audit-run', req.url); auditRunHandler(req, res); });
      server.middlewares.use('/__dev/read-file', (req, res) => { console.log('[__dev] read-file', req.url); readFileHandler(req, res); });
    },
    configurePreviewServer(server: Parameters<PreviewServerHook>[0]) {
      const { auditRunHandler, readFileHandler, guard } = createHandlers();
      // @ts-ignore (preview server has the same .middlewares)
      server.middlewares.use(guard);
      // @ts-ignore
      server.middlewares.use('/__dev/audit-run', (req, res) => { console.log('[__dev] audit-run', req.url); auditRunHandler(req, res); });
      // @ts-ignore
      server.middlewares.use('/__dev/read-file', (req, res) => { console.log('[__dev] read-file', req.url); readFileHandler(req, res); });
    }
  };
}