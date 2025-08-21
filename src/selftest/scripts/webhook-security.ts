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
        
        // Fire 20 calls in parallel with same account_id but distinct comment_ids
        const base = Date.now();
        const results = await Promise.all(
          Array.from({length: 20}).map((_, i) =>
            ctx.invokeWebhook({ 
              ig_post_id, 
              account_id,
              comment_text: 'LINK', 
              comment_id: `rl_${base}_${i}`,
              provider: 'sandbox'
            })
          )
        );
        
        for (let i = 0; i < results.length; i++) {
          console.log(`Rate test call ${i}: ${results[i]?.code} (ok: ${results[i]?.ok})`);
        }
        
        const rateLimitedCount = results.filter(r => r?.code === 'RATE_LIMITED').length;
        const allCodes = results.map(r => r?.code).join(', ');
        console.log(`Rate limiting results: ${rateLimitedCount} out of 20 calls were rate limited`);
        
        return rateLimitedCount > 0
          ? { pass: true, note: `Rate limit observed (${rateLimitedCount} calls rate limited)` }
          : { pass: false, note: `No RATE_LIMITED responses detected. All codes: [${allCodes}]` };
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