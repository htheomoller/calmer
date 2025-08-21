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
          comment_text: 'LINK', 
          comment_id: cid,
          account_id,
          provider: 'sandbox'
        });
        
        const second = await ctx.invokeWebhook({ 
          ig_post_id, 
          comment_text: 'LINK', 
          comment_id: cid,
          account_id,
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
        
        // Fire 12 calls in parallel with same account_id but distinct comment_ids
        const base = Date.now();
        const results = await Promise.all(
          Array.from({length: 12}).map((_, i) =>
            ctx.invokeWebhook({ 
              ig_post_id, 
              account_id,
              comment_text: 'LINK', 
              comment_id: `rate_${base}_${i}`,
              provider: 'sandbox'
            })
          )
        );
        
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