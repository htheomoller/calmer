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
// SANDBOX_START (audit)
import { MarkdownModal } from '@/components/dev/MarkdownModal';
// SANDBOX_END

interface Breadcrumb {
  id: string;
  created_at: string;
  at?: string; // Legacy field for fallback  
  user_id: string;
  scope: string;
  summary: string;
  details: any;
  tags: string[];
}

export default function DevBreadcrumbs() {
  // Guard: only show in development/preview
  if (!(import.meta.env.DEV || import.meta.env.MODE === 'development' || import.meta.env.MODE === 'preview')) {
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
  // SANDBOX_START (polish)
  const [scopeFilter, setScopeFilter] = useState(() => {
    return localStorage.getItem('dev_breadcrumbs_filter') || 'all';
  });
  // SANDBOX_END
  // SANDBOX_START (audit)
  const [modalPath, setModalPath] = useState<string>('');
  // SANDBOX_END

  const scopePresets = ['sandbox', 'waitlist', 'routing', 'auth', 'triggers', 'gupshup'];

  // SANDBOX_START (polish)
  const getScopeColor = (scope: string) => {
    switch (scope.toLowerCase()) {
      case 'sandbox': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'selftest': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'waitlist': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'routing': return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'auth': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'audit': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatFriendlyDate = (dateString: string) => {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(dateString));
  };

  const groupBreadcrumbsByDay = (breadcrumbs: Breadcrumb[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: Breadcrumb[] } = {};
    
    breadcrumbs.forEach(breadcrumb => {
      const date = new Date(breadcrumb.created_at ?? breadcrumb.at ?? '');
      let groupKey: string;
      
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = new Intl.DateTimeFormat(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).format(date);
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(breadcrumb);
    });

    return groups;
  };

  const filteredBreadcrumbs = scopeFilter === 'all' 
    ? breadcrumbs 
    : breadcrumbs.filter(b => b.scope.toLowerCase() === scopeFilter.toLowerCase());
  // SANDBOX_END

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
      // Use logBreadcrumb function instead of direct insert to handle proper structure
      const result = await logBreadcrumb({
        scope: scope.trim(),
        summary: summary.trim(),
        details: details.trim() ? JSON.parse(`{"note": ${JSON.stringify(details.trim())}}`) : null,
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
      });

      if (!result.ok) {
        throw new Error(result.error || 'Failed to add breadcrumb');
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
      if (!user) {
        setBreadcrumbs([]);
        setCurrentUser('');
        return;
      }

      setCurrentUser(user.email || '');

      const now = new Date();
      const since = new Date(now.getTime() - parseInt(minutes) * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('dev_breadcrumbs')
        .select('*')
        .eq('user_id', user.id)
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

  // Auto-refresh every 5s in DEV
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const id = setInterval(() => loadBreadcrumbs(), 5000);
    return () => clearInterval(id);
  }, []);

  // SANDBOX_START (polish)
  useEffect(() => {
    localStorage.setItem('dev_breadcrumbs_filter', scopeFilter);
  }, [scopeFilter]);
  // SANDBOX_END

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Breadcrumbs (Build Log)</h1>
          <p className="text-muted-foreground">Track development changes and notes for easy cleanup later.</p>
          <Badge variant="outline" className="mt-2 text-xs">
            {import.meta.env.DEV ? 'ENV: DEV • dev routes enabled' : 
             (typeof window !== 'undefined' && localStorage.getItem('calmer.dev.unlocked') === '1') ? 
             'ENV: PREVIEW (dev-unlocked)' : 'ENV: PREVIEW'}
          </Badge>
        </div>
        <div className="text-right">
          {/* SANDBOX_START (polish) */}
          <Badge variant="outline" className="mb-2 text-xs">
            viewer: {currentUser || 'anonymous'} · window: {
              minutes === '60' ? 'last hour' :
              minutes === '1440' ? 'last 24h' :
              minutes === '10080' ? 'last 7 days' :
              minutes === '43200' ? 'last 30 days' : `${minutes}min`
            }
          </Badge>
          {/* SANDBOX_END */}
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
            <div className="flex gap-2">
              {/* SANDBOX_START (polish) */}
              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="selftest">SelfTest</SelectItem>
                  <SelectItem value="waitlist">Waitlist</SelectItem>
                  <SelectItem value="routing">Routing</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                </SelectContent>
              </Select>
              {/* SANDBOX_END */}
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
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!currentUser ? (
            <p className="text-muted-foreground text-center py-4">
              Please log in to view breadcrumbs.
            </p>
          ) : filteredBreadcrumbs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No breadcrumbs found for the selected filters.
            </p>
          ) : (
            /* SANDBOX_START (polish) */
            <div className="space-y-6">
              {Object.entries(groupBreadcrumbsByDay(filteredBreadcrumbs)).map(([dayGroup, dayBreadcrumbs]) => (
                <div key={dayGroup}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 border-b pb-1">
                    {dayGroup}
                  </h3>
                  <div className="space-y-4">
                    {dayBreadcrumbs.map((breadcrumb) => (
                      <div key={breadcrumb.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getScopeColor(breadcrumb.scope)}>
                                {breadcrumb.scope}
                              </Badge>
                               <span className="text-sm text-muted-foreground">
                                 {formatFriendlyDate(breadcrumb.created_at ?? breadcrumb.at ?? '')}
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
                          <div className="flex gap-2">
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
                                       {breadcrumb.scope} • {formatFriendlyDate(breadcrumb.created_at ?? breadcrumb.at ?? '')}
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
                            {/* SANDBOX_START (audit) */}
                            {!import.meta.env.PROD && breadcrumb.scope === 'audit' && breadcrumb.details?.artifacts && (
                              <>
                                {breadcrumb.details.artifacts.report && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-indigo-600"
                                    onClick={() => setModalPath(breadcrumb.details.artifacts.report)}
                                  >
                                    Open report
                                  </Button>
                                )}
                                {breadcrumb.details.artifacts.plan && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-indigo-600"
                                    onClick={() => setModalPath(breadcrumb.details.artifacts.plan)}
                                  >
                                    Open plan
                                  </Button>
                                )}
                              </>
                            )}
                            {/* SANDBOX_END */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            /* SANDBOX_END */
          )}
        </CardContent>
      </Card>
      
      {/* SANDBOX_START (audit) */}
      {modalPath && (
        <MarkdownModal 
          path={modalPath} 
          onClose={() => setModalPath('')}
          title={modalPath.includes('report') ? 'Audit Report' : 'Cleanup Plan'}
        />
      )}
      {/* SANDBOX_END */}
    </div>
  );
}
// SANDBOX_END