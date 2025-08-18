// Gupshup WhatsApp Business API client for edge functions

export interface GupshupResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send Instagram DM via Gupshup API
 */
export async function sendInstagramDM(
  toUserId: string, 
  message: string,
  apiKey: string,
  appName: string
): Promise<GupshupResponse> {
  console.log('🚀 [Gupshup] Sending Instagram DM:', {
    toUserId,
    message: message.substring(0, 50) + '...',
    appName,
    timestamp: new Date().toISOString()
  });

  try {
    const response = await fetch('https://api.gupshup.io/wa/api/v1/msg', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: 'whatsapp',
        source: appName,
        destination: toUserId,
        message: {
          type: 'text',
          text: message
        }
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ [Gupshup] API Error:', result);
      return {
        success: false,
        error: result.message || `HTTP ${response.status}`
      };
    }

    console.log('✅ [Gupshup] DM sent successfully:', result);
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error: any) {
    console.error('❌ [Gupshup] Network Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send Instagram DM in sandbox mode (just logging)
 */
export function sendInstagramDMSandbox(toUserId: string, message: string): Promise<GupshupResponse> {
  console.log('📱 [SANDBOX] Sending Instagram DM:', {
    toUserId,
    message,
    timestamp: new Date().toISOString()
  });
  
  // Simulate API delay
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        messageId: `sandbox-${Date.now()}`
      });
    }, 100);
  });
}