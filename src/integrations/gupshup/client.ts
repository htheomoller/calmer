// Gupshup WhatsApp Business API client
import { supabase } from "@/integrations/supabase/client";

type ProviderMode = 'sandbox' | 'gupshup';

/**
 * Determine which provider mode to use based on available secrets
 */
export const getProviderMode = (): ProviderMode => {
  // In production builds, we need to check if secrets are available via the backend
  // For now, we'll default to sandbox mode and let the backend handle the provider logic
  return 'sandbox';
};

/**
 * Send Instagram DM via Gupshup API or sandbox mode
 */
export const sendInstagramDM = async (toUserId: string, message: string): Promise<boolean> => {
  console.log('📱 Sending Instagram DM:', {
    toUserId,
    message,
    provider: getProviderMode(),
    timestamp: new Date().toISOString()
  });

  try {
    // Call our backend webhook that handles the provider logic
    const { data, error } = await supabase.functions.invoke('webhook-comments', {
      body: {
        ig_post_id: 'test-post-id',
        ig_user: toUserId,
        comment_text: 'test comment for DM trigger',
        dm_override: {
          message,
          direct: true
        }
      }
    });

    if (error) {
      console.error('Error sending DM:', error);
      return false;
    }

    console.log('DM sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to send DM:', error);
    return false;
  }
};

/**
 * Get current provider status for display
 */
export const getProviderStatus = async (): Promise<{
  provider: ProviderMode;
  gupshupApiKey: boolean;
  gupshupAppName: boolean;
}> => {
  try {
    // Check provider status via health endpoint
    const { data } = await supabase.functions.invoke('health-check', {});
    
    return {
      provider: data?.provider || 'sandbox',
      gupshupApiKey: data?.secrets?.GUPSHUP_API_KEY || false,
      gupshupAppName: data?.secrets?.GUPSHUP_APP_NAME || false
    };
  } catch (error) {
    console.error('Failed to get provider status:', error);
    return {
      provider: 'sandbox',
      gupshupApiKey: false,
      gupshupAppName: false
    };
  }
};