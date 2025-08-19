import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HeaderNav } from "@/components/layout/header-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Settings, ExternalLink, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendInstagramDM } from "@/integrations/sandbox/client";
import { sendInstagramDM as sendGupshupDM } from "@/integrations/gupshup/client";
import { getCurrentProvider, setProviderOverride, getProviderOverride, type MessagingProvider } from "@/config/provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Post {
  id: string;
  ig_post_id: string | null;
  caption: string | null;
  code: string | null;
  link: string | null;
  automation_enabled: boolean;
  created_at: string;
}

interface Account {
  default_link: string | null;
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProvider, setCurrentProvider] = useState<MessagingProvider>('sandbox');
  const [availableProvider, setAvailableProvider] = useState<MessagingProvider>('sandbox');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    loadProviderConfig();
  }, []);

  const loadProviderConfig = async () => {
    const provider = await getCurrentProvider();
    const override = getProviderOverride();
    setAvailableProvider(provider);
    setCurrentProvider(override || provider);
  };

  const loadData = async () => {
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

      // Load posts
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('account_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getEffectiveLink = (post: Post) => {
    return post.link || account?.default_link || null;
  };

  const getLinkStatus = (post: Post) => {
    const effectiveLink = getEffectiveLink(post);
    if (!effectiveLink) return { status: 'disabled', text: 'Disabled (add link)' };
    if (post.link) return { status: 'override', text: 'Custom link' };
    return { status: 'default', text: 'Default link' };
  };

  const simulateGupshupComment = async () => {
    try {
      console.log('Testing comment → DM flow...');
      
      // Get or create a sandbox post for testing
      const testPost = await getOrCreateTestPost();
      if (!testPost) {
        toast({
          title: "No sandbox post available",
          description: "Click 'Create Sandbox Post' first.",
          variant: "destructive"
        });
        return;
      }

      const commentText = `test comment ${testPost.code || 'LINK'}`;
      const testUser = 'test_user_' + Date.now();

      console.log('Simulate details:', { 
        stage: 'simulate', 
        pickedId: testPost.ig_post_id, 
        provider: currentProvider,
        automationEnabled: testPost.automation_enabled,
        commentText 
      });

      // Log simulation attempt
      await supabase.from('events').insert({
        type: 'sandbox_simulate_attempt',
        ig_post_id: testPost.ig_post_id,
        ig_user: testUser,
        comment_text: `Attempt: ${commentText}`
      });

      const { data, error } = await supabase.functions.invoke('webhook-comments', {
        body: {
          ig_post_id: testPost.ig_post_id,
          ig_user: testUser,
          comment_text: commentText,
          created_at: new Date().toISOString()
        }
      });

      if (error) throw error;

      toast({
        title: data.success ? "Simulation Complete" : "Simulation Result",
        description: data.message || "Test completed",
        variant: data.success ? "default" : "destructive"
      });

      // Refresh activity to show new events
      if (data.success) {
        setTimeout(() => window.location.reload(), 1000);
      }

    } catch (error: any) {
      console.error('Simulation failed:', error);
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const simulateSandboxDM = async () => {
    try {
      // Get or create a sandbox post for testing
      const testPost = await getOrCreateTestPost();
      if (!testPost) {
        toast({
          title: "No sandbox post available",
          description: "Click 'Create Sandbox Post' first.",
          variant: "destructive"
        });
        return;
      }

      const testUser = 'test_user_' + Date.now();
      let success = false;
      
      if (currentProvider === 'sandbox') {
        success = await sendInstagramDM(testUser, "Hello from sandbox!");
      } else {
        success = await sendGupshupDM(testUser, "Hello from Gupshup!");
      }

      // Log simulation attempt
      await supabase.from('events').insert({
        type: 'sandbox_simulate_attempt',
        ig_post_id: testPost.ig_post_id,
        ig_user: testUser,
        comment_text: `Direct DM test via ${currentProvider}`
      });
      
      toast({
        title: `${currentProvider === 'sandbox' ? 'Sandbox' : 'Gupshup'} DM Sent`,
        description: success ? "DM sent successfully" : "Failed to send DM",
        variant: success ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error('DM test failed:', error);
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createSandboxPost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          ig_post_id: `sandbox-post-${Date.now()}`,
          caption: 'Test post for sandbox',
          code: 'LINK',
          link: null,
          automation_enabled: true,
          account_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sandbox post created",
        description: "Test post added successfully"
      });

      await loadData(); // Refresh the list
    } catch (error: any) {
      console.error('Error creating sandbox post:', error);
      toast({
        title: "Error",
        description: "Failed to create sandbox post",
        variant: "destructive"
      });
    }
  };

  const getOrCreateTestPost = async () => {
    try {
      // First, try to find an existing sandbox post with automation enabled
      let testPost = posts.find(p => 
        p.ig_post_id?.includes('sandbox-post-') && p.automation_enabled
      );

      if (testPost) {
        console.log('Using existing sandbox post:', testPost.ig_post_id);
        return testPost;
      }

      // If no enabled sandbox post, try to find any sandbox post and enable it
      testPost = posts.find(p => p.ig_post_id?.includes('sandbox-post-'));
      if (testPost && !testPost.automation_enabled) {
        console.log('Enabling automation for existing sandbox post:', testPost.ig_post_id);
        const { error } = await supabase
          .from('posts')
          .update({ automation_enabled: true })
          .eq('id', testPost.id);

        if (error) throw error;

        toast({
          title: "Automation enabled",
          description: "Sandbox post automation turned on for testing"
        });

        await loadData(); // Refresh
        return { ...testPost, automation_enabled: true };
      }

      // If no sandbox post exists, create one
      console.log('Creating new sandbox post for testing');
      await createSandboxPost();
      
      // Return the newly created post
      const { data: newPosts } = await supabase
        .from('posts')
        .select('*')
        .eq('account_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      return newPosts?.[0] || null;
    } catch (error) {
      console.error('Error getting/creating test post:', error);
      return null;
    }
  };

  const handleProviderChange = (provider: MessagingProvider) => {
    setProviderOverride(provider);
    setCurrentProvider(provider);
    toast({
      title: "Provider Changed",
      description: `Switched to ${provider} mode`,
    });
  };

  if (loading) {
    return (
      <>
        <HeaderNav />
        <div className="pt-24 px-6 max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeaderNav />
      <div className="pt-24 px-6 max-w-6xl mx-auto">
        {currentProvider === 'sandbox' && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ⚠️ Running in sandbox mode - messages will be logged only, not sent
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Posts</h1>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Provider:</span>
              <Select 
                value={currentProvider} 
                onValueChange={handleProviderChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">sandbox</SelectItem>
                  {availableProvider === 'gupshup' && (
                    <SelectItem value="gupshup">gupshup</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={createSandboxPost}
              >
                Create Sandbox Post
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={simulateSandboxDM}
              >
                <Eye className="w-4 h-4 mr-2" />
                Test {currentProvider} DM
              </Button>
              <Button 
                variant="outline"
                onClick={simulateGupshupComment}
              >
                <Eye className="w-4 h-4 mr-2" />
                Test Comments
              </Button>
              <Button asChild>
                <Link to="/simulate">
                  <Eye className="w-4 h-4 mr-2" />
                  Simulate Page
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No posts yet. Click 'Create Sandbox Post' to add a test post.</p>
              <Button onClick={createSandboxPost}>Create Sandbox Post</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => {
              const linkStatus = getLinkStatus(post);
              return (
                <Card key={post.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Thumbnail placeholder */}
                      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                        <Eye className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {post.ig_post_id || 'Post ID not set'}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {post.caption || 'No caption'}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={post.automation_enabled ? "default" : "secondary"}>
                              {post.automation_enabled ? 'Active' : 'Paused'}
                            </Badge>
                            
                            <Badge 
                              variant={linkStatus.status === 'disabled' ? 'destructive' : 'outline'}
                            >
                              {linkStatus.text}
                            </Badge>
                            
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/posts/${post.id}`}>
                                <Settings className="w-4 h-4 mr-1" />
                                Edit
                              </Link>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {post.code && (
                            <span>Code: <strong>{post.code}</strong></span>
                          )}
                          {getEffectiveLink(post) && (
                            <span className="flex items-center gap-1">
                              Link: 
                              <a 
                                href={getEffectiveLink(post)!} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                {new URL(getEffectiveLink(post)!).hostname}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </span>
                          )}
                          <span>
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}