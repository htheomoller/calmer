import { useState, useEffect } from "react";
import { HeaderNav } from "@/components/layout/header-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Account {
  id: string;
  default_link: string | null;
  reply_to_comments: boolean;
  comment_limit: number;
  dm_template: string;
  default_trigger_mode: string;
  default_trigger_list: string[];
  default_typo_tolerance: boolean;
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
          dm_template: 'Thanks! Here\'s the link: {link}',
          default_trigger_mode: 'exact_phrase',
          default_trigger_list: ['LINK'],
          default_typo_tolerance: false
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
          dm_template: account.dm_template,
          default_trigger_mode: account.default_trigger_mode,
          default_trigger_list: account.default_trigger_list,
          default_typo_tolerance: account.default_typo_tolerance
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

  const updateDefaultTriggerList = (value: string) => {
    const triggers = value.split(',').map(t => t.trim()).filter(t => t.length >= 2).slice(0, 10);
    setAccount({ ...account, default_trigger_list: triggers });
  };

  const getTriggerModeTooltip = (mode: string) => {
    switch (mode) {
      case 'exact_phrase':
        return 'Match exact phrases with word boundaries. Example: "LINK" matches "please LINK me" but not "linking"';
      case 'any_keywords': 
        return 'Match if ANY of the keywords are present. Example: ["link", "guide"] matches "send link" or "need guide"';
      case 'all_words':
        return 'Match only if ALL words are present (any order). Example: ["give", "link"] matches "give me link" and "link please give"';
      default:
        return '';
    }
  };

  return (
    <>
      <HeaderNav />
      <div className="pt-24 px-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        
        <div className="space-y-6">
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

        {/* Default Trigger Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Default Trigger Settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              These settings apply to new posts automatically. Existing posts keep their current settings.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="default_trigger_mode">Default Trigger Mode</Label>
              <Select 
                value={account.default_trigger_mode || 'exact_phrase'} 
                onValueChange={(value) => setAccount({...account, default_trigger_mode: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact_phrase">
                    <div className="flex items-center gap-2">
                      <span>Exact phrase</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{getTriggerModeTooltip('exact_phrase')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </SelectItem>
                  <SelectItem value="any_keywords">
                    <div className="flex items-center gap-2">
                      <span>Any of these keywords</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{getTriggerModeTooltip('any_keywords')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </SelectItem>
                  <SelectItem value="all_words">
                    <div className="flex items-center gap-2">
                      <span>All of these words (any order)</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{getTriggerModeTooltip('all_words')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="default_trigger_list">Default Trigger Words/Phrases</Label>
              <Input
                id="default_trigger_list"
                value={(account.default_trigger_list || ['LINK']).join(', ')}
                onChange={(e) => updateDefaultTriggerList(e.target.value)}
                placeholder="LINK, GUIDE, DOWNLOAD"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Comma-separated list. Min 2 chars each, max 10 entries.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="default_typo_tolerance"
                checked={account.default_typo_tolerance || false}
                onCheckedChange={(checked) => setAccount({...account, default_typo_tolerance: !!checked})}
              />
              <Label htmlFor="default_typo_tolerance">Allow 1 typo by default (Levenshtein distance ≤ 1)</Label>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}