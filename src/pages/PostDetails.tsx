import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HeaderNav } from "@/components/layout/header-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ExternalLink, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parseCaption } from "@/lib/caption-parser";

interface Post {
  id: string;
  ig_post_id: string | null;
  caption: string | null;
  code: string | null;
  link: string | null;
  automation_enabled: boolean;
  account_id: string;
  trigger_mode: string;
  trigger_list: string[];
  typo_tolerance: boolean;
}

interface Account {
  default_link: string | null;
  default_trigger_mode: string;
  default_trigger_list: string[];
  default_typo_tolerance: boolean;
}

export default function PostDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load account
      const { data: accountData } = await supabase
        .from('accounts')
        .select('default_link, default_trigger_mode, default_trigger_list, default_typo_tolerance')
        .eq('id', user.id)
        .maybeSingle();
      
      setAccount(accountData);

      // Load post
      const { data: postData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('account_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!postData) {
        toast({
          title: "Post not found",
          description: "The requested post could not be found",
          variant: "destructive"
        });
        navigate('/posts');
        return;
      }

      setPost(postData);
    } catch (error) {
      console.error('Error loading post:', error);
      toast({
        title: "Error",
        description: "Failed to load post details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePost = async () => {
    if (!post) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          code: post.code,
          link: post.link,
          automation_enabled: post.automation_enabled,
          trigger_mode: post.trigger_mode,
          trigger_list: post.trigger_list,
          typo_tolerance: post.typo_tolerance
        })
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: "Post updated",
        description: "Your post settings have been saved"
      });
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const parseCurrentCaption = () => {
    if (!post?.caption) return;
    
    const parsed = parseCaption(post.caption);
    setPost({
      ...post,
      code: parsed.code || post.code,
      link: parsed.link || post.link
    });
    
    toast({
      title: "Caption parsed",
      description: `Extracted: ${parsed.code ? `code "${parsed.code}"` : 'no code'}${parsed.code && parsed.link ? ', ' : ''}${parsed.link ? `link "${parsed.link}"` : 'no link'}`
    });
  };

  const getEffectiveLink = () => {
    return post?.link || account?.default_link || null;
  };

  const updateTriggerList = (value: string) => {
    if (!post) return;
    const triggers = value.split(',').map(t => t.trim()).filter(t => t.length >= 2).slice(0, 10);
    setPost({ ...post, trigger_list: triggers });
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

  if (!post) return null;

  const effectiveLink = getEffectiveLink();
  const isDisabled = !effectiveLink;

  return (
    <>
      <HeaderNav />
      <div className="pt-24 px-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={() => navigate('/posts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Posts
          </Button>
          <h1 className="text-3xl font-bold">Post Details</h1>
        </div>
        
        <div className="space-y-6">
          {/* Post Info */}
          <Card>
            <CardHeader>
              <CardTitle>Post Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Instagram Post ID</Label>
                <p className="text-sm text-muted-foreground">
                  {post.ig_post_id || 'Not set'}
                </p>
              </div>
              
              <div>
                <Label>Caption</Label>
                <Textarea
                  value={post.caption || ''}
                  readOnly
                  rows={4}
                  className="bg-muted"
                />
                {post.caption && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={parseCurrentCaption}
                  >
                    Parse Caption
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Automation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="automation_enabled"
                  checked={post.automation_enabled}
                  onCheckedChange={(checked) => setPost({...post, automation_enabled: checked})}
                />
                <Label htmlFor="automation_enabled">Enable automation for this post</Label>
              </div>

              {/* Trigger Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label>Trigger Configuration</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>Configure how comments trigger DMs. Choose from exact phrase matching, keyword matching, or requiring all words.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div>
                  <Label htmlFor="trigger_mode">Trigger Mode</Label>
                  <Select 
                    value={post.trigger_mode || account?.default_trigger_mode || 'exact_phrase'} 
                    onValueChange={(value) => setPost({...post, trigger_mode: value})}
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
                  <Label htmlFor="trigger_list">Trigger Words/Phrases</Label>
                  <Input
                    id="trigger_list"
                    value={(post.trigger_list || account?.default_trigger_list || ['LINK']).join(', ')}
                    onChange={(e) => updateTriggerList(e.target.value)}
                    placeholder="LINK, GUIDE, DOWNLOAD"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Comma-separated list. Min 2 chars each, max 10 entries.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="typo_tolerance"
                    checked={post.typo_tolerance !== undefined ? post.typo_tolerance : (account?.default_typo_tolerance || false)}
                    onCheckedChange={(checked) => setPost({...post, typo_tolerance: !!checked})}
                  />
                  <Label htmlFor="typo_tolerance">Allow 1 typo (Levenshtein distance ≤ 1)</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="link">Override Link (optional)</Label>
                <Input
                  id="link"
                  value={post.link || ''}
                  onChange={(e) => setPost({...post, link: e.target.value || null})}
                  placeholder="https://your-site.com/special-link"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty to use account default link
                </p>
              </div>

              {/* Effective Link Display */}
              <div className="p-4 rounded-lg bg-muted">
                <Label>Effective Link</Label>
                {effectiveLink ? (
                  <div className="flex items-center gap-2 mt-1">
                    <a 
                      href={effectiveLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {effectiveLink}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {post.link ? (
                      <span className="text-xs text-muted-foreground">(custom)</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">(default)</span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-destructive mt-1">
                    No link available - add a link override or set a default link in account settings
                  </p>
                )}
              </div>

              {isDisabled && (
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
                  <p className="font-medium">Automation Disabled</p>
                  <p className="text-sm">Add a link to enable automation for this post.</p>
                </div>
              )}

              <Button 
                onClick={savePost} 
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}