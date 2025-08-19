import { useState, useEffect } from "react";
import { HeaderNav } from "@/components/layout/header-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Account {
  id: string;
  default_link: string | null;
  reply_to_comments: boolean;
  comment_limit: number;
  dm_template: string;
}

export default function AccountSettings() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAccount(data);
      } else {
        // Create default account
        const newAccount = {
          id: user.id,
          default_link: null,
          reply_to_comments: true,
          comment_limit: 200,
          dm_template: 'Thanks! Here\'s the link: {link}'
        };
        
        const { error: insertError } = await supabase
          .from('accounts')
          .insert(newAccount);
          
        if (insertError) throw insertError;
        setAccount(newAccount);
      }
    } catch (error) {
      console.error('Error loading account:', error);
      toast({
        title: "Error",
        description: "Failed to load account settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAccount = async () => {
    if (!account) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          default_link: account.default_link,
          reply_to_comments: account.reply_to_comments,
          comment_limit: account.comment_limit,
          dm_template: account.dm_template
        })
        .eq('id', account.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your account settings have been updated"
      });
    } catch (error) {
      console.error('Error saving account:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <HeaderNav />
        <div className="pt-24 px-6 max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </>
    );
  }

  if (!account) return null;

  return (
    <>
      <HeaderNav />
      <div className="pt-24 px-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Automation Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="default_link">Default Link</Label>
              <Input
                id="default_link"
                value={account.default_link || ''}
                onChange={(e) => setAccount({...account, default_link: e.target.value || null})}
                placeholder="https://your-site.com/link"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Used when posts don't have a specific link
              </p>
            </div>

            <div>
              <Label htmlFor="dm_template">DM Template</Label>
              <Textarea
                id="dm_template"
                value={account.dm_template}
                onChange={(e) => setAccount({...account, dm_template: e.target.value})}
                placeholder="Thanks! Here's the link: {link}"
                rows={3}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Use {'{link}'} where the link should appear
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="reply_to_comments"
                checked={account.reply_to_comments}
                onCheckedChange={(checked) => setAccount({...account, reply_to_comments: checked})}
              />
              <Label htmlFor="reply_to_comments">Reply with Direct Message</Label>
            </div>

            <Button 
              onClick={saveAccount} 
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}