import type { Plugin, ViteDevServer, PreviewServerHook } from 'vite';
import { spawn } from 'node:child_process';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

function createHandlers() {
  const auditRunHandler = async (req: any, res: any) => {
    const url = new URL(req.url, 'http://localhost');
    
    // Handle ping requests (GET only)
    if (req.method === 'GET' && url.searchParams.has('ping')) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify({ ok: true, ping: true }));
      return;
    }

    // Only handle POST requests for audit runs
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    console.log('[__dev] CWD', process.cwd());
    console.log('[__dev] audit step', 'npm run audit:report');

    try {
      const result = await new Promise<{code: number, stdout: string, stderr: string}>((resolve) => {
        const child = spawn('npm', ['run', 'audit:report'], {
          shell: true,
          cwd: process.cwd(),
          env: { ...process.env, NODE_ENV: 'development' },
          stdio: ['ignore', 'pipe', 'pipe']
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
          resolve({ code: code || 0, stdout, stderr });
        });
      });

      const payload = {
        success: result.code === 0,
        code: result.code,
        stdout_head: result.stdout.slice(0, 4000),
        stderr_head: result.stderr.slice(0, 4000),
        artifacts: { 
          report: 'tmp/audit/report.md', 
          plan: 'docs/cleanup/plan.md' 
        },
        timestamp: new Date().toISOString(),
        cwd: process.cwd()
      };

      if (result.code !== 0) {
        await generateFallbackReport(result.stdout, result.stderr);
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(payload));
      
    } catch (error: any) {
      console.error('[__dev] Error in audit-run:', error);
      await generateFallbackReport('', error.message);
      
      const payload = {
        success: false,
        code: -1,
        stdout_head: '',
        stderr_head: error.message.slice(0, 4000),
        artifacts: { report: 'tmp/audit/report.md', plan: 'docs/cleanup/plan.md' },
        timestamp: new Date().toISOString(),
        cwd: process.cwd()
      };
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(payload));
    }
  };

  const readFileHandler = async (req: any, res: any) => {
    const url = new URL(req.url, 'http://localhost');
    const filePath = url.searchParams.get('path');
    
    if (!filePath) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing path parameter' }));
      return;
    }
    
    // Whitelist only these specific directories for security
    const allowedPrefixes = ['tmp/audit/', 'docs/cleanup/'];
    const isAllowed = allowedPrefixes.some(prefix => filePath.startsWith(prefix));
    
    if (!isAllowed) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Access denied' }));
      return;
    }
    
    try {
      const content = await readFile(filePath, 'utf-8');
      const payload = {
        content,
        path: filePath,
        timestamp: new Date().toISOString()
      };
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(payload));
    } catch (error) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'File not found' }));
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

async function generateFallbackReport(stdout: string, stderr: string) {
  // Ensure tmp/audit directory exists
  mkdirSync('tmp/audit', { recursive: true });
  
  const now = new Date().toISOString();
  let report = `# Audit Report (Fallback)\n\n`;
  report += `Generated: ${now}\n\n`;
  report += `⚠️ **Fallback Report**: The normal audit process failed, so this simplified report was generated.\n\n`;
  
  if (stderr) {
    report += `## Error Details\n\n`;
    report += `\`\`\`\n${stderr.slice(0, 800)}\n\`\`\`\n\n`;
  }
  
  if (stdout) {
    report += `## Partial Output\n\n`;
    report += `\`\`\`\n${stdout.slice(0, 800)}\n\`\`\`\n\n`;
  }
  
  // Simple file scan
  try {
    const srcFiles = await readdir('src', { recursive: true }).catch(() => []);
    const srcCount = srcFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).length;
    
    const funcDirs = existsSync('supabase/functions') 
      ? await readdir('supabase/functions').catch(() => [])
      : [];
    
    report += `## Quick Scan\n\n`;
    report += `- **Source files**: ${srcCount} TypeScript files\n`;
    report += `- **Edge functions**: ${funcDirs.length} directories\n\n`;
    
    if (srcCount > 0) {
      report += `### Source Files Sample\n`;
      srcFiles.slice(0, 10).forEach(f => {
        if (f.endsWith('.ts') || f.endsWith('.tsx')) {
          report += `- ${f}\n`;
        }
      });
      report += `\n`;
    }
    
    if (funcDirs.length > 0) {
      report += `### Edge Functions\n`;
      funcDirs.slice(0, 10).forEach(dir => {
        report += `- ${dir}\n`;
      });
      report += `\n`;
    }
  } catch (scanError) {
    report += `## Scan Error\n\nCould not scan project files: ${scanError}\n\n`;
  }
  
  report += `## Next Steps\n\n`;
  report += `1. Check the error details above\n`;
  report += `2. Fix any import or dependency issues\n`;
  report += `3. Run \`npm run audit:report\` manually to debug\n`;
  report += `4. Try again once issues are resolved\n`;
  
  await writeFile('tmp/audit/report.md', report, 'utf8');
}

export default function devAuditPlugin(): Plugin {
  return {
    name: 'dev-audit-plugin',
    apply: 'serve', // dev & preview
    configureServer(server: ViteDevServer) {
      const { auditRunHandler, readFileHandler, guard } = createHandlers();
      
      // Guard first to ensure our routes win before SPA fallback
      server.middlewares.use(guard);
      server.middlewares.use('/__dev/audit-run', auditRunHandler);
      server.middlewares.use('/__dev/read-file', readFileHandler);
    },
    configurePreviewServer(server: Parameters<PreviewServerHook>[0]) {
      const { auditRunHandler, readFileHandler, guard } = createHandlers();
      
      // @ts-ignore (preview server has the same .middlewares)
      server.middlewares.use(guard);
      // @ts-ignore
      server.middlewares.use('/__dev/audit-run', auditRunHandler);
      // @ts-ignore
      server.middlewares.use('/__dev/read-file', readFileHandler);
    }
  };
}