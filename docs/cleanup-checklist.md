# Cleanup Checklist for Production

This document contains an actionable checklist for removing development/sandbox code before production deployment. Use the dev breadcrumbs system (`/dev/breadcrumbs`) to track changes during development, then use this checklist for the final sweep before launch.

## How to Use Dev Breadcrumbs

During development, log important changes using the breadcrumbs system:
- Visit `/dev/breadcrumbs` (dev-only page)
- Add notes about sandbox features, temporary code, or dev-only routes
- Use scopes like `sandbox`, `waitlist`, `routing`, `auth`, etc.
- Before production, review all breadcrumbs to ensure nothing is missed

This checklist is your "final sweep" before launch - use it after reviewing your dev breadcrumbs.

---

## Sandbox / Self-Test Cleanup

- [ ] Remove route `/self-test` (src/pages/SelfTest.tsx, App.tsx route)
- [ ] Remove Self-Test framework (src/selftest/**)
- [ ] Remove /health links to self-test (src/pages/Health.tsx)
- [ ] Remove provider override dev buttons (if any remain)
- [ ] Remove sandbox-only activity types from UI filters (e.g., 'sandbox_dm','sandbox_no_match')
- [ ] Remove "SANDBOX_START/END" code blocks (search in repo)
- [ ] Drop dev-only edge functions:
  - supabase/functions/dev-breadcrumbs
  - (optional) nightly-selftest if created
- [ ] Drop DB objects if desired:
  - table dev_breadcrumbs
- [ ] Re-run /self-test (should 404 in prod) and /health (dev-only) to verify removal

## Waitlist Cleanup

- [ ] Confirm health-check reports effective list id from ENV in prod
- [ ] Ensure add-to-waitlist only accepts origin=production domain (CORS tightened)
- [ ] Remove test emails from Brevo list if needed
- [ ] Verify waitlist form redirects to production success page

## Routing/Auth Cleanup

- [ ] Turn off SITE_LOCKDOWN in prod and keep "/comingsoon" static build if needed
- [ ] Verify AuthGate whitelist does NOT include dev routes in prod
- [ ] Remove dev-only routes from routing configuration
- [ ] Update any hardcoded development URLs to production URLs

## Dev Pages & Tools

- [ ] Remove `/dev/breadcrumbs` route (src/pages/DevBreadcrumbs.tsx, App.tsx route)
- [ ] Remove dev breadcrumbs utility (src/dev/breadcrumbs.ts)
- [ ] Remove dev-only UI elements from Health page
- [ ] Remove any "dev mode only" conditional rendering

## Environment & Configuration

- [ ] Set production environment variables
- [ ] Update CORS origins to production domains only
- [ ] Verify all secrets are set in production Supabase
- [ ] Update any development-specific configuration

## Final Verification

- [ ] Search codebase for "SANDBOX_START" and "SANDBOX_END" comments
- [ ] Search for "import.meta.env.PROD" guards and verify they work correctly
- [ ] Test all main user flows in production environment
- [ ] Verify no dev-only routes are accessible in production
- [ ] Check that all database tables have proper RLS policies for production use

---

**Note:** This checklist should be updated as new dev/sandbox features are added. Always review your dev breadcrumbs before using this checklist to ensure nothing is missed.