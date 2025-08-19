# Self-Test Scripts

This directory contains test scripts for the Self-Test Robot system.

## Adding a New Script

1. Create a new file: `my-test.ts`
2. Follow this template:

```typescript
import type { TestScript } from "../types";

const script: TestScript = {
  id: 'my-test', // Unique identifier
  title: 'My Test Description', // Human-readable title
  steps: [
    {
      name: 'Step 1',
      run: async (ctx) => {
        ctx.log('Starting step 1...');
        
        // Your test logic here
        // Use ctx.supabase, ctx.ensureSandbox(), etc.
        
        return {
          pass: true, // or false
          note: 'Optional status message'
        };
      },
      stopOnFail: true // Optional, defaults to true
    }
    // Add more steps...
  ]
};

export default script;
```

3. Add your script to `../registry.ts`:

```typescript
import myTest from './scripts/my-test';
// ... other imports

export const SCRIPTS = [basic, template, myTest];
```

## Available Context Methods

- `ctx.supabase` - Supabase client
- `ctx.now` - Current timestamp
- `ctx.log(message, extra?)` - Console logging
- `ctx.ensureSandbox()` - Force sandbox provider mode
- `ctx.ensureSandboxPost()` - Create/find sandbox post
- `ctx.getRecentActivity(minutes, types?)` - Query recent events
- `ctx.invokeWebhook({ig_post_id, comment_text})` - Call webhook function

## Error Handling

- Always wrap risky operations in try/catch
- Return `{ pass: false, note: error.message }` on failure
- The runner will catch any uncaught exceptions and convert them to failures
