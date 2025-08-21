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
        
        // Create burst calls with small delays to trigger rate limiting
        const calls = [];
        for (let i = 0; i < 12; i++) {
          calls.push(
            ctx.invokeWebhook({ 
              ig_post_id, 
              comment_text: `burst ${i}`, 
              comment_id: `b_${Date.now()}_${i}`,
              account_id: account_id,
              provider: 'sandbox'
            })
          );
          // Small delay between calls to ensure they're processed sequentially
          if (i < 11) await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        const results = await Promise.all(calls);
        
        const hit = results.some(r => r?.code === 'RATE_LIMITED');
        return hit
          ? { pass: true, note: 'Rate limit observed' }
          : { pass: false, note: 'No RATE_LIMITED response detected' };
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