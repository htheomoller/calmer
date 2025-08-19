// SANDBOX_START: sample basic test script
import type { TestScript } from "../types";

const script: TestScript = {
  id: 'basic',
  title: 'Sandbox Basic Flow',
  steps: [
    {
      name: 'Ping edge',
      run: async (ctx) => {
        ctx.log('Testing ping edge function...');
        
        const { data, error } = await ctx.supabase.functions.invoke('ping', { 
          body: { hello: 'world' } 
        });
        
        if (error) {
          return { 
            pass: false, 
            note: `Ping failed: ${error.message}` 
          };
        }
        
        if (!data?.ok) {
          return { 
            pass: false, 
            note: `Ping returned: ${JSON.stringify(data)}` 
          };
        }
        
        ctx.log('Ping successful', data);
        return { 
          pass: true, 
          note: `OK (${new Date(data.time).toISOString()})` 
        };
      }
    },
    {
      name: 'Ensure sandbox provider',
      run: async (ctx) => {
        ctx.log('Setting sandbox provider...');
        
        await ctx.ensureSandbox();
        
        const override = localStorage.getItem('providerOverride');
        if (override !== 'sandbox') {
          return { 
            pass: false, 
            note: `Expected sandbox, got: ${override}` 
          };
        }
        
        ctx.log('Sandbox provider confirmed');
        return { 
          pass: true, 
          note: 'Provider override set to sandbox' 
        };
      }
    },
    {
      name: 'Ensure sandbox post',
      run: async (ctx) => {
        ctx.log('Creating/finding sandbox post...');
        
        const result = await ctx.ensureSandboxPost();
        
        if (!result.ig_post_id) {
          return { 
            pass: false, 
            note: 'No ig_post_id returned' 
          };
        }
        
        ctx.log('Sandbox post ready', result);
        return { 
          pass: true, 
          note: `Post ID: ${result.ig_post_id}` 
        };
      }
    },
    {
      name: 'No match',
      run: async (ctx) => {
        ctx.log('Testing no-match case...');
        
        // Get sandbox post
        const postResult = await ctx.ensureSandboxPost();
        
        // Test webhook with non-matching comment
        const webhookResult = await ctx.invokeWebhook({
          ig_post_id: postResult.ig_post_id,
          comment_text: 'hello'
        });
        
        console.log('no-match:resp', webhookResult);
        
        if (webhookResult.ok !== false || webhookResult.code !== 'NO_MATCH') {
          return { 
            pass: false, 
            note: `Expected NO_MATCH, got ${webhookResult.code || 'unknown'}: ${webhookResult.message || ''}` 
          };
        }
        
        // Check for recent activity
        const recentActivity = await ctx.getRecentActivity(2, ['sandbox_no_match']);
        if (recentActivity.length === 0) {
          return { 
            pass: false, 
            note: 'No sandbox_no_match activity found in last 2 minutes' 
          };
        }
        
        ctx.log('No-match test successful', { webhookResult, recentActivity: recentActivity.length });
        return { 
          pass: true, 
          note: `NO_MATCH response with ${recentActivity.length} activity entry` 
        };
      }
    },
    {
      name: 'Match',
      run: async (ctx) => {
        ctx.log('Testing match case...');
        
        // Get sandbox post
        const postResult = await ctx.ensureSandboxPost();
        
        // Test webhook with matching comment
        const webhookResult = await ctx.invokeWebhook({
          ig_post_id: postResult.ig_post_id,
          comment_text: 'please LINK'
        });
        
        console.log('match:resp', webhookResult);
        
        if (webhookResult.ok !== true || webhookResult.code !== 'SANDBOX_DM_LOGGED') {
          return { 
            pass: false, 
            note: `Expected SANDBOX_DM_LOGGED, got ${webhookResult.code || 'unknown'}: ${webhookResult.message || ''}` 
          };
        }
        
        // Check for recent activity
        const recentActivity = await ctx.getRecentActivity(2, ['sandbox_dm']);
        if (recentActivity.length === 0) {
          return { 
            pass: false, 
            note: 'No sandbox_dm activity found in last 2 minutes' 
          };
        }
        
        ctx.log('Match test successful', { webhookResult, recentActivity: recentActivity.length });
        return { 
          pass: true, 
          note: `SANDBOX_DM_LOGGED response with ${recentActivity.length} activity entry` 
        };
      }
    }
  ]
};

export default script;
// SANDBOX_END