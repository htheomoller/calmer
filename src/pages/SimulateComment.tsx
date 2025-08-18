import { useState } from "react";
import { HeaderNav } from "@/components/layout/header-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function SimulateComment() {
  const [formData, setFormData] = useState({
    ig_post_id: '',
    ig_user: '',
    comment_text: '',
    created_at: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('https://upzjnifdcmevsdfmzwzw.supabase.co/functions/v1/simulate-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwempuaWZkY21ldnNkZm16d3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjc5MDUsImV4cCI6MjA3MDYwMzkwNX0.s136RNSm8DfsE_qC_llnaQY2nmbwH0vxhYq84MypTg0`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: "Comment simulated",
          description: data.message || "Comment processed successfully"
        });
      } else {
        toast({
          title: "Simulation failed",
          description: data.error || "Failed to process comment",
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