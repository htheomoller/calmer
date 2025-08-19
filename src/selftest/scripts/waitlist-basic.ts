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
        
        const { data, error } = await ctx.supabase.functions.invoke('health-check');
        
        if (error) {
          return { 
            pass: false, 
            note: `Health-check failed: ${error.message}` 
          };
        }
        
        if (!data?.ok) {
          return { 
            pass: false, 
            note: `Health-check returned: ${JSON.stringify(data)}` 
          };
        }
        
        // Check if waitlist section exists and has proper configuration
        const waitlistStatus = data?.waitlist;
        if (!waitlistStatus) {
          return { 
            pass: false, 
            note: 'No waitlist status in health-check response' 
          };
        }
        
        // Verify list ID matches configuration
        const configuredListId = PUBLIC_CONFIG.BREVO_WAITLIST_LIST_ID;
        if (waitlistStatus.listId !== configuredListId) {
          return { 
            pass: false, 
            note: `List ID mismatch: expected ${configuredListId}, got ${waitlistStatus.listId}` 
          };
        }
        
        ctx.log('Health-check successful', data);
        return { 
          pass: true, 
          note: `Waitlist ready (list ID: ${waitlistStatus.listId})` 
        };
      }
    }
  ]
};

export default script;
// SANDBOX_END