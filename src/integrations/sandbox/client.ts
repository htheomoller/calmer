// Sandbox messaging client for development/testing
import { supabase } from "@/integrations/supabase/client";

/**
 * Send Instagram DM via sandbox mode (logging only)
 */
export const sendInstagramDM = async (toUserId: string, message: string): Promise<boolean> => {
  console.info("📱 Sandbox DM →", toUserId, message);
  
  try {
    // Insert into events table for tracking
    const { error } = await supabase
      .from('events')
      .insert({
        type: 'sandbox_dm',
        ig_user: toUserId,
        comment_text: message,
        matched: true,
        sent_dm: true
      });

    if (error) {
      console.error('Error logging sandbox DM:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to log sandbox DM:', error);
    return false;
  }
};