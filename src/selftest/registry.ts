// SANDBOX_START: self-test script registry
import basic from './scripts/sample-basic';
import template from './scripts/template-empty';
import waitlistBasic from './scripts/waitlist-basic';
import webhookSecurity from './scripts/webhook-security';

export const SCRIPTS = [basic, waitlistBasic, webhookSecurity, template];
// SANDBOX_END