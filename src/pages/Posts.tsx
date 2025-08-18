import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HeaderNav } from "@/components/layout/header-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Settings, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendInstagramDM } from "@/integrations/sandbox/client";

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
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

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
      console.log('Testing Gupshup comment → DM flow...');
      
      const { data, error } = await supabase.functions.invoke('webhooks/gupshup', {
        body: {
          ig_post_id: 'test-post-gupshup',
          ig_user: 'test_user_' + Date.now(),
          comment_text: 'test comment',
          dm_override: {
            message: 'Test DM from Gupshup integration! 🚀',
            direct: true
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Test Complete",
        description: `Provider: ${data.provider} | ${data.message}`,
        variant: data.success ? "default" : "destructive"
      });

    } catch (error: any) {
      console.error('Gupshup test failed:', error);
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const simulateSandboxDM = async () => {
    try {
      const success = await sendInstagramDM("test-user", "Hello from sandbox!");
      
      toast({
        title: "Sandbox DM Sent",
        description: success ? "DM logged successfully" : "Failed to log DM",
        variant: success ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error('Sandbox DM test failed:', error);
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Posts</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => simulateSandboxDM()}
            >
              <Eye className="w-4 h-4 mr-2" />
              Simulate Comment → DM
            </Button>
            <Button 
              variant="outline"
              onClick={() => simulateGupshupComment()}
            >
              <Eye className="w-4 h-4 mr-2" />
              Test Gupshup DM
            </Button>
            <Button asChild>
              <Link to="/simulate">
                <Eye className="w-4 h-4 mr-2" />
                Test Comments
              </Link>
            </Button>
          </div>
        </div>

        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No posts found. Posts will appear here when you connect your Instagram account.</p>
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