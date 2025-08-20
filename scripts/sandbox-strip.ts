import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

(async () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('❌ Refusing to run: set NODE_ENV=production to strip sandbox blocks.');
    process.exit(1);
  }

  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    cwd: PROJECT_ROOT,
    ignore: ['node_modules/**', 'dist/**', 'build/**', 'supabase/.temp/**']
  });

  let changed = 0;

  for (const rel of files) {
    const full = path.join(PROJECT_ROOT, rel);
    const src = await fs.readFile(full, 'utf8');
    const out = src.replace(/\/\/\s*SANDBOX_START[\s\S]*?\/\/\s*SANDBOX_END\s*/g, '');
    if (out !== src) {
      await fs.writeFile(full, out);
      changed++;
      console.log('🧹 Stripped:', rel);
    }
  }

  console.log(`✅ Sandbox strip complete. Files changed: ${changed}`);
})();