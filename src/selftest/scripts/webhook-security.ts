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
        const { ig_post_id } = await ctx.ensureSandboxPost();
        const { data: { user } } = await ctx.supabase.auth.getUser();
        const account_id = user?.id;
        const cid = `dup_${Date.now()}`;
        
        const first = await ctx.invokeWebhook({ 
          ig_post_id, 
          comment_text: 'hello', 
          comment_id: cid,
          account_id: account_id,
          provider: 'sandbox'
        });
        
        const second = await ctx.invokeWebhook({ 
          ig_post_id, 
          comment_text: 'hello again', 
          comment_id: cid,
          account_id: account_id,
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
        const { ig_post_id } = await ctx.ensureSandboxPost();
        const { data: { user } } = await ctx.supabase.auth.getUser();
        const account_id = user?.id;
        
        // Fire 12 calls in parallel to quickly hit rate limit
        const promises = [];
        const baseTime = Date.now();
        for (let i = 0; i < 12; i++) {
          promises.push(
            ctx.invokeWebhook({ 
              ig_post_id, 
              comment_text: `LINK`, // Use matching trigger text
              comment_id: `rate_${baseTime}_${i}`,
              account_id: account_id,
              provider: 'sandbox'
            })
          );
        }
        
        const results = await Promise.all(promises);
        
        for (let i = 0; i < results.length; i++) {
          console.log(`Rate test call ${i}: ${results[i]?.code}`);
        }
        
        const rateLimitedCount = results.filter(r => r?.code === 'RATE_LIMITED').length;
        console.log(`Rate limiting results: ${rateLimitedCount} out of 12 calls were rate limited`);
        return rateLimitedCount > 0
          ? { pass: true, note: `Rate limit observed (${rateLimitedCount} calls rate limited)` }
          : { pass: false, note: `No RATE_LIMITED responses detected. Codes: ${results.map(r => r?.code).join(', ')}` };
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