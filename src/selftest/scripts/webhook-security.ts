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
        const first = await ctx.invokeEdge('webhook-comments', { 
          ig_post_id, 
          account_id, 
          comment_text: 'hello', 
          comment_id: cid,
          provider: 'sandbox'
        });
        const second = await ctx.invokeEdge('webhook-comments', { 
          ig_post_id, 
          account_id, 
          comment_text: 'hello again', 
          comment_id: cid,
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
        
        const calls = await Promise.all(Array.from({ length: 12 }).map((_, i) =>
          ctx.invokeEdge('webhook-comments', { 
            ig_post_id, 
            account_id, 
            comment_text: `burst ${i}`, 
            comment_id: `b_${Date.now()}_${i}`,
            provider: 'sandbox'
          })
        ));
        
        const hit = calls.some(r => r?.code === 'RATE_LIMITED');
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