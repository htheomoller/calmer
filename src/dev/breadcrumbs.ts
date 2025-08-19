// SANDBOX_START: Dev breadcrumbs utility
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface LogDevNoteParams {
  scope: string;
  summary: string;
  details?: string;
  tags?: string[];
}

export async function logDevNote({ scope, summary, details, tags }: LogDevNoteParams) {
  try {
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Login to log development notes",
        variant: "destructive",
      });
      return false;
    }

    const { data, error } = await supabase.functions.invoke('dev-breadcrumbs/add', {
      body: {
        scope,
        summary,
        details: details || null,
        tags: tags || []
      }
    });

    if (error) {
      throw error;
    }

    if (!data?.ok) {
      throw new Error(data?.message || 'Failed to log note');
    }

    toast({
      title: "Note Logged",
      description: `Logged: ${summary}`,
    });

    return true;
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || 'Failed to log note',
      variant: "destructive",
    });
    return false;
  }
}
// SANDBOX_END