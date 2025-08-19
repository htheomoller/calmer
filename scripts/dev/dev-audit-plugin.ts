import type { Plugin, ViteDevServer, PreviewServerHook } from 'vite';
import { spawn } from 'node:child_process';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

function createHandlers() {
  const auditRunHandler = async (req: any, res: any) => {
    try {
      console.log('[__dev] audit-run', req.url);
      const url = new URL(req.url, 'http://local');
      
      // Ping check
      if (url.searchParams.get('ping') === '1') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ ok: true, ping: true }));
        return;
      }

      console.log('[__dev] audit-run exec scripts via npx ts-node');
      
      // Run audit scripts sequentially with npx ts-node ESM
      const scripts = [
        'scripts/audit/scan.ts',
        'scripts/audit/usage.ts', 
        'scripts/audit/plan.ts'
      ];
      
      let allStdout = '';
      let allStderr = '';
      let finalCode = 0;
      
      try {
        for (const script of scripts) {
          console.log('[__dev] CWD', process.cwd());
          console.log('[__dev] audit step', ['npx', '--yes', 'ts-node', '--esm', '--transpile-only', script].join(' '));
          
          const result = await new Promise<{code: number, stdout: string, stderr: string}>((resolve) => {
            const child = spawn('npx', ['--yes', 'ts-node', '--esm', '--transpile-only', script], {
              stdio: ['ignore', 'pipe', 'pipe'],
              cwd: process.cwd()
            });
            
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (d) => { stdout += String(d); });
            child.stderr.on('data', (d) => { stderr += String(d); });
            
            child.on('close', (code) => {
              resolve({ code: code || 0, stdout, stderr });
            });
            
            child.on('error', (error) => {
              resolve({ code: 1, stdout: '', stderr: error.message });
            });
          });
          
          allStdout += result.stdout;
          allStderr += result.stderr;
          
          if (result.code !== 0) {
            finalCode = result.code;
            console.log(`[__dev] audit script ${script} failed with code ${result.code}`);
            console.log(`[__dev] stderr preview:`, result.stderr.slice(0, 400));
            console.log(`[__dev] stdout preview:`, result.stdout.slice(0, 400));
            break;
          }
        }
        
        if (finalCode === 0) {
          // All scripts succeeded
          const payload = {
            ok: true,
            code: finalCode,
            stdout: allStdout,
            stderr: allStderr,
            artifacts: { report: 'tmp/audit/report.md', plan: 'docs/cleanup/plan.md' }
          };
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(payload));
        } else {
          // Some script failed, use safety fallback with diagnostics
          const diagnostics = {
            stdout_preview: allStdout.slice(0, 400),
            stderr_preview: allStderr.slice(0, 400),
            failed_script: scripts.find((script, index) => index < scripts.length && finalCode !== 0) || 'unknown'
          };
          
          await generateFallbackReport(allStdout, allStderr);
          const payload = {
            ok: true,
            code: -1,
            stdout: 'fallback',
            stderr: allStderr,
            diagnostics,
            artifacts: { report: 'tmp/audit/report.md', plan: 'docs/cleanup/plan.md' }
          };
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(payload));
        }
      } catch (spawnError: any) {
        // Spawn failed, use safety fallback
        console.log('[__dev] audit spawn failed, using fallback:', spawnError.message);
        await generateFallbackReport('', spawnError.message);
        const payload = {
          ok: true,
          code: -1,
          stdout: 'fallback',
          stderr: spawnError.message,
          artifacts: { report: 'tmp/audit/report.md', plan: 'docs/cleanup/plan.md' }
        };
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(payload));
      }
    } catch (e: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: e?.message || String(e) }));
    }
  };

  const readFileHandler = async (req: any, res: any) => {
    try {
      console.log('[__dev] read-file', req.url);
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