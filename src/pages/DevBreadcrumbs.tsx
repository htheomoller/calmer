// SANDBOX_START: Dev breadcrumbs page
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logBreadcrumb } from '@/lib/devlog';

interface Breadcrumb {
  id: string;
  created_at: string;
  author_email: string;
  scope: string;
  summary: string;
  details: any;
  tags: string[];
}

export default function DevBreadcrumbs() {
  // Guard: only show in development
  if (import.meta.env.PROD) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">404 - Not Found</h1>
          <p className="text-muted-foreground">This page is only available in development.</p>
        </div>
      </div>
    );
  }

  const [scope, setScope] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [tags, setTags] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [minutes, setMinutes] = useState(() => {
    return localStorage.getItem('dev-breadcrumbs-minutes') || '10080'; // Default to 7 days
  });

  const scopePresets = ['sandbox', 'waitlist', 'routing', 'auth', 'triggers', 'gupshup'];

  const addBreadcrumb = async () => {
    if (!scope.trim() || !summary.trim()) {
      toast({
        title: "Error",
        description: "Scope and summary are required",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Error",
        description: "Must be logged in to add breadcrumbs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const row = {
        author_email: currentUser,
        scope: scope.trim(),
        summary: summary.trim(),
        details: details.trim() || null,
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      const { error } = await supabase.from('dev_breadcrumbs').insert(row);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Breadcrumb added successfully",
      });

      // Clear form
      setScope('');
      setSummary('');
      setDetails('');
      setTags('');

      // Refresh list
      loadBreadcrumbs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to add breadcrumb',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testInsert = async () => {
    logBreadcrumb({
      scope: 'selftest',
      summary: 'UI test note',
      details: { t: Date.now(), from: 'test-button' },
      tags: ['debug']
    });
    // Wait a moment then refresh
    setTimeout(loadBreadcrumbs, 500);
  };

  const loadBreadcrumbs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setBreadcrumbs([]);
        setCurrentUser('');
        return;
      }

      setCurrentUser(user.email);

      const now = new Date();
      const since = new Date(now.getTime() - parseInt(minutes) * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('dev_breadcrumbs')
        .select('*')
        .eq('author_email', user.email)
        .gte('created_at', since)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setBreadcrumbs(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to load breadcrumbs',
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadBreadcrumbs();
  }, [minutes]);

  useEffect(() => {
    localStorage.setItem('dev-breadcrumbs-minutes', minutes);
  }, [minutes]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Breadcrumbs (Build Log)</h1>
          <p className="text-muted-foreground">Track development changes and notes for easy cleanup later.</p>
        </div>
        <div className="text-right">
          <Badge variant="outline" className="mb-2">
            viewer: {currentUser || '(not logged in)'}
          </Badge>
          {currentUser && (
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testInsert}
                className="mr-2"
              >
                Test Insert
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadBreadcrumbs}
              >
                Refresh
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Note Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Note</CardTitle>
          <CardDescription>
            Log a development change or note for future reference.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Scope</label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger>
                  <SelectValue placeholder="Select or type scope..." />
                </SelectTrigger>
                <SelectContent>
                  {scopePresets.map(preset => (
                    <SelectItem key={preset} value={preset}>
                      {preset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!scopePresets.includes(scope) && (
                <Input
                  placeholder="Custom scope..."
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Summary</label>
              <Input
                placeholder="Brief description..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Details</label>
            <Textarea
              placeholder="Longer description (markdown ok)..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <Input
              placeholder="tag1, tag2, tag3..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <Button onClick={addBreadcrumb} disabled={loading}>
            {loading ? 'Adding...' : 'Add Note'}
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Notes
            <Select value={minutes} onValueChange={setMinutes}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">Last hour</SelectItem>
                <SelectItem value="1440">Last 24h</SelectItem>
                <SelectItem value="10080">Last 7 days</SelectItem>
                <SelectItem value="43200">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!currentUser ? (
            <p className="text-muted-foreground text-center py-4">
              Please log in to view breadcrumbs.
            </p>
          ) : breadcrumbs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No breadcrumbs found for the selected time period.
            </p>
          ) : (
            <div className="space-y-4">
              {breadcrumbs.map((breadcrumb) => (
                <div key={breadcrumb.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{breadcrumb.scope}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(breadcrumb.created_at)}
                        </span>
                      </div>
                      <h3 className="font-medium">{breadcrumb.summary}</h3>
                      {breadcrumb.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {breadcrumb.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {breadcrumb.details && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{breadcrumb.summary}</DialogTitle>
                            <DialogDescription>
                              {breadcrumb.scope} • {formatDate(breadcrumb.created_at)}
                            </DialogDescription>
                          </DialogHeader>
                           <div className="mt-4">
                             <pre className="whitespace-pre-wrap text-sm">
                               {typeof breadcrumb.details === 'string' 
                                 ? breadcrumb.details 
                                 : JSON.stringify(breadcrumb.details, null, 2)}
                             </pre>
                           </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
// SANDBOX_END