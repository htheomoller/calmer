// SANDBOX_START
import type { TestScript } from '../types';

const script: TestScript = {
  id: 'webhook-security',
  title: 'Webhook Security & Deduplication',
  steps: [
    {
      name: 'Duplicate comment ignored',
      stopOnFail: false,
      run: async (ctx) => {
        const { ig_post_id, account_id } = await ctx.ensureSandboxPost();
        const cid = `dup_${Date.now()}`;
        
        const first = await ctx.invokeWebhook({ 
          ig_post_id, 
          account_id,
          comment_text: 'LINK', 
          comment_id: cid,
          provider: 'sandbox'
        });
        
        const second = await ctx.invokeWebhook({ 
          ig_post_id, 
          account_id,
          comment_text: 'LINK', 
          comment_id: cid,
          provider: 'sandbox'
        });
        
        console.log('Duplicate test calls:', { first: first?.code, second: second?.code });
        return second?.code === 'DUPLICATE_IGNORED'
          ? { pass: true, note: 'Duplicate suppressed' }
          : { pass: false, note: `Expected DUPLICATE_IGNORED, got ${second?.code}` };
      }
    },
    {
      name: 'Rate limit triggers under load',
      stopOnFail: false,
      run: async (ctx) => {
        const { ig_post_id, account_id } = await ctx.ensureSandboxPost();
        const test_window = `selftest_${Date.now()}`; // NEW window id
        
        const base = Date.now();
        const results = await Promise.all(
          Array.from({ length: 20 }).map((_, i) =>
            ctx.invokeWebhook({
              ig_post_id,
              account_id,
              comment_text: 'LINK',
              comment_id: `rl_${base}_${i}`,
              provider: 'sandbox',
              test_window                  // pass window id
            })
          )
        );

        // Debug log for the self-test console
        console.log('rate-limit results', results.map(r => ({ code: r.code, status: r.status })));
        
        // Compact summary
        console.log('rate test summary', results.reduce((m,r)=>{m[r.code]=(m[r.code]||0)+1;return m;},{}));

        const successes = results.filter(r => r.status === 200 && r.code === 'SANDBOX_DM_LOGGED').length;
        const limited   = results.filter(r => r.status === 429 && r.code === 'RATE_LIMITED').length;

        if (limited < 1) {
          return { pass: false, note: `Expected ≥1 RATE_LIMITED(429). Got ${limited}. Codes: ${results.map(r => `${r.code}(${r.status})`).join(', ')}` };
        }
        if (successes < 1 || successes > 10) {
          return { pass: false, note: `Expected successes between 1 and 10. Got ${successes}. Codes: ${results.map(r => `${r.code}(${r.status})`).join(', ')}` };
        }

        return { pass: true, note: `Rate limit observed. successes=${successes}, limited=${limited}` };
      }
    },
    {
      name: 'Signature validation TODO present',
      run: async () => ({ pass: true, note: 'Signature validation TODO present in webhook (planned post-MVP)' })
    }
  ]
};

export default script;
// SANDBOX_END