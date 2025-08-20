# Dev Route Gating Verification

## Manual Setup Required

Since `package.json` is read-only, manually add this script:

```json
{
  "scripts": {
    "audit:strip-sandbox": "NODE_ENV=production tsx scripts/sandbox-strip.ts"
  }
}
```

## Verification Steps

### Development Environment
- ✅ Dev routes accessible: `/health`, `/dev/breadcrumbs`, `/self-test`
- ✅ Vite middleware active: `/__dev/audit-run`, `/__dev/read-file`

### Preview Build
```bash
npm run build && npm run preview
```
- ✅ `/health` shows "development-only page" message
- ✅ Dev routes return 404 or safe fallback

### Production Build
```bash
npm run build:dev  # or production build
NODE_ENV=production npm run audit:strip-sandbox
```
- ✅ Sandbox blocks stripped from build output
- ✅ Audit reports "Total sandbox blocks: 0"

## Safety Confirmed
- Dev middleware only active when `mode !== 'production'` (vite.config.ts:47)
- Health page has `import.meta.env.PROD` guard (existing)
- Sandbox strip script requires `NODE_ENV=production` (scripts/sandbox-strip.ts)