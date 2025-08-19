// SANDBOX_START: waitlist basic test script
import type { TestScript } from "../types";
import { PUBLIC_CONFIG } from "@/config/public";

const script: TestScript = {
  id: 'waitlist-basic',
  title: 'Waitlist Basic Flow',
  steps: [
    {
      name: 'Ensure email',
      run: async (ctx) => {
        ctx.log('Generating unique test email...');
        
        const testEmail = `selftest+${Date.now()}@example.com`;
        ctx['email'] = testEmail;
        
        ctx.log('Test email generated:', testEmail);
        return { 
          pass: true, 
          note: `Email: ${testEmail}` 
        };
      }
    },
    {
      name: 'Invoke add-to-waitlist',
      run: async (ctx) => {
        ctx.log('Testing add-to-waitlist edge function...');
        
        const testEmail = ctx['email'];
        if (!testEmail) {
          return { 
            pass: false, 
            note: 'No test email found in context' 
          };
        }
        
        const resp = await ctx.invokeEdge('add-to-waitlist', { 
          email: testEmail, 
          listId: PUBLIC_CONFIG.BREVO_WAITLIST_LIST_ID 
        });
        
        ctx.log('add-to-waitlist response:', resp);
        
        // Accept both success (created) and already subscribed as pass
        if (resp.ok === true) {
          ctx.log('Waitlist successful', resp);
          return { 
            pass: true, 
            note: 'SUBSCRIBED' 
          };
        } else if (resp.code === 'ALREADY_SUBSCRIBED') {
          ctx.log('Already subscribed', resp);
          return { 
            pass: true, 
            note: 'ALREADY_SUBSCRIBED' 
          };
        } else {
          return { 
            pass: false, 
            note: `${resp.code || 'UNKNOWN'} — ${resp.message || 'no message'}` 
          };
        }
      }
    },
    {
      name: 'Health-check waitlist',
      run: async (ctx) => {
        ctx.log('Testing health-check for waitlist status...');
        
        const resp = await ctx.invokeEdge('health-check', { listId: PUBLIC_CONFIG.BREVO_WAITLIST_LIST_ID });
        
        if (!resp.ok) {
          return { 
            pass: false, 
            note: `Health-check failed: ${resp.code || 'UNKNOWN'} — ${resp.message || 'no message'}` 
          };
        }
        
        // Check if waitlist section exists and has proper configuration
        const wl = resp.details?.waitlist;
        if (!wl) {
          return { 
            pass: false, 
            note: 'No waitlist status in health-check response' 
          };
        }
        
        // Verify list ID based on source
        const configuredListId = Number(PUBLIC_CONFIG.BREVO_WAITLIST_LIST_ID);
        
        if (wl.listIdSource === 'env') {
          // Accept any positive number, because env overrides body
          if (!(wl.effectiveListId > 0)) {
            return { 
              pass: false, 
              note: `List ID mismatch: source=${wl.listIdSource}, effective=${wl.effectiveListId}, expected=positive number` 
            };
          }
        } else {
          // Expect it equals PUBLIC_CONFIG.BREVO_WAITLIST_LIST_ID
          if (wl.listIdSource !== 'body' || wl.effectiveListId !== configuredListId) {
            return { 
              pass: false, 
              note: `List ID mismatch: source=${wl.listIdSource}, effective=${wl.effectiveListId}, expected=${configuredListId}` 
            };
          }
        }
        
        ctx.log('Health-check successful', resp.details);
        return { 
          pass: true, 
          note: `Waitlist ready (list ID: ${wl.effectiveListId})` 
        };
      }
    },
    {
      name: 'Log success (optional)',
      run: async (ctx) => {
        ctx.log('All tests passed!');
        
        // Optional: Log success to breadcrumbs
        try {
          const { logDevNote } = await import('@/dev/breadcrumbs');
          await logDevNote({
            scope: 'sandbox',
            summary: 'Self-Test: Waitlist Basic Flow passes',
            details: `All green on ${new Date().toLocaleString()}. Email: ${ctx['email']}`
          });
          ctx.log('Success logged to breadcrumbs');
        } catch (e) {
          // Ignore breadcrumb errors
          ctx.log('Breadcrumb logging skipped (not critical)');
        }
        
        return { 
          pass: true, 
          note: 'All waitlist functionality verified' 
        };
      }
    }
  ]
};

export default script;
// SANDBOX_END