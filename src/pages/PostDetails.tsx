import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HeaderNav } from "@/components/layout/header-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ExternalLink } from "lucide-react";
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
}

interface Account {
  default_link: string | null;
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
        .select('default_link')
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
          automation_enabled: post.automation_enabled
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

              <div>
                <Label htmlFor="code">Comment Code</Label>
                <Input
                  id="code"
                  value={post.code || ''}
                  onChange={(e) => setPost({...post, code: e.target.value || null})}
                  placeholder="e.g., LINK, GUIDE, DOWNLOAD"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  When someone comments with this word, they'll get a DM
                </p>
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