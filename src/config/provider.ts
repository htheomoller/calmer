// Messaging provider configuration
import { supabase } from "@/integrations/supabase/client";

export type MessagingProvider = 'sandbox' | 'gupshup';

/**
 * Get the messaging provider based on available secrets
 */
export const getMessagingProvider = async (): Promise<MessagingProvider> => {
  try {
    // Check if Gupshup secrets are available via health check
    const { data } = await supabase.functions.invoke('health-check');
    
    const hasGupshupSecrets = data?.secrets?.GUPSHUP_API_KEY && data?.secrets?.GUPSHUP_APP_NAME;
    return hasGupshupSecrets ? 'gupshup' : 'sandbox';
  } catch (error) {
    console.error('Failed to check provider status:', error);
    return 'sandbox';
  }
};

/**
 * In-memory provider override for testing
 */
let providerOverride: MessagingProvider | null = null;

export const setProviderOverride = (provider: MessagingProvider | null) => {
  providerOverride = provider;
};

export const getProviderOverride = (): MessagingProvider | null => {
  return providerOverride;
};

/**
 * Get the current active provider (with override support)
 */
export const getCurrentProvider = async (): Promise<MessagingProvider> => {
  if (providerOverride) {
    return providerOverride;
  }
  return await getMessagingProvider();
};