import { useState, useEffect } from "react";
import { HeaderNav } from "@/components/layout/header-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function SimulateComment() {
  const [formData, setFormData] = useState({
    ig_post_id: '',
    ig_user: '',
    comment_text: '',
    created_at: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [availablePost, setAvailablePost] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAvailablePost();
  }, []);

  const loadAvailablePost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('account_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (posts && posts.length > 0) {
        const post = posts[0];
        setAvailablePost(post);
        setFormData(prev => ({
          ...prev,
          ig_post_id: post.ig_post_id || '',
          comment_text: post.code ? `Cool post! ${post.code}` : 'Cool post! LINK'
        }));
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('simulate-comment', {
        body: formData
      });

      if (error) throw error;
      setResult(data);

      if (data.success) {
        toast({
          title: "Sandbox DM generated (logged)",
          description: data.message || "Comment processed successfully"
        });
      } else {
        const errorMsg = data.error || "Failed to process comment";
        let toastTitle = "Simulation failed";
        
        if (errorMsg.includes("No post found") || errorMsg.includes("automation disabled")) {
          toastTitle = "Automation disabled or link missing";
        } else if (errorMsg.includes("No match") || errorMsg.includes("keyword")) {
          toastTitle = "No code match in comment";
        }
        
        toast({
          title: toastTitle,
          description: errorMsg,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error simulating comment:', error);
      toast({
        title: "Error",
        description: "Failed to simulate comment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HeaderNav />
      <div className="pt-24 px-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simulate Comment</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Comment Processing</CardTitle>
            {availablePost && (
              <p className="text-sm text-muted-foreground">
                Using post: {availablePost.ig_post_id} | Code: "{availablePost.code || 'LINK'}"
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="ig_post_id">Instagram Post ID</Label>
                <Input
                  id="ig_post_id"
                  value={formData.ig_post_id}
                  onChange={(e) => setFormData({...formData, ig_post_id: e.target.value})}
                  placeholder="e.g., 123456789"
                  required
                />
              </div>

              <div>
                <Label htmlFor="ig_user">Instagram User</Label>
                <Input
                  id="ig_user"
                  value={formData.ig_user}
                  onChange={(e) => setFormData({...formData, ig_user: e.target.value})}
                  placeholder="e.g., testuser123"
                  required
                />
              </div>

              <div>
                <Label htmlFor="comment_text">Comment Text</Label>
                <Textarea
                  id="comment_text"
                  value={formData.comment_text}
                  onChange={(e) => setFormData({...formData, comment_text: e.target.value})}
                  placeholder="e.g., This looks great! LINK"
                  rows={3}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Processing...' : 'Simulate Comment'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Simulation Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}