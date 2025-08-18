import { useState, useEffect } from "react";
import { HeaderNav } from "@/components/layout/header-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  type: string | null;
  ig_user: string | null;
  ig_post_id: string | null;
  comment_text: string | null;
  matched: boolean | null;
  sent_dm: boolean | null;
  created_at: string;
}

export default function Activity() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [postIdFilter, setPostIdFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, [postIdFilter, typeFilter]);

  const loadEvents = async () => {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (postIdFilter) {
        query = query.ilike('ig_post_id', `%${postIdFilter}%`);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load activity",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventBadge = (event: Event) => {
    if (event.type === 'dm_sent' && event.sent_dm) {
      return <Badge className="bg-green-100 text-green-800">DM Sent</Badge>;
    }
    if (event.type === 'comment' && event.matched) {
      return <Badge className="bg-blue-100 text-blue-800">Matched</Badge>;
    }
    if (event.type === 'comment' && !event.matched) {
      return <Badge variant="secondary">No Match</Badge>;
    }
    if (event.type === 'limit_hit') {
      return <Badge variant="destructive">Limit Hit</Badge>;
    }
    if (event.type === 'no_link') {
      return <Badge variant="outline">No Link</Badge>;
    }
    return <Badge variant="outline">{event.type || 'Unknown'}</Badge>;
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
                <div key={i} className="h-24 bg-muted rounded"></div>
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
        <h1 className="text-3xl font-bold mb-8">Activity</h1>
        
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="post_filter">Filter by Post ID</Label>
                <Input
                  id="post_filter"
                  value={postIdFilter}
                  onChange={(e) => setPostIdFilter(e.target.value)}
                  placeholder="Enter post ID..."
                />
              </div>
              
              <div>
                <Label htmlFor="type_filter">Filter by Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="comment">Comments</SelectItem>
                    <SelectItem value="dm_sent">DM Sent</SelectItem>
                    <SelectItem value="limit_hit">Limit Hit</SelectItem>
                    <SelectItem value="no_link">No Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        {events.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No activity found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getEventBadge(event)}
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          {event.ig_user && (
                            <span className="font-medium">@{event.ig_user}</span>
                          )}
                          {event.ig_post_id && (
                            <span className="text-muted-foreground">
                              Post: {event.ig_post_id}
                            </span>
                          )}
                        </div>
                        
                        {event.comment_text && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            "{event.comment_text}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{new Date(event.created_at).toLocaleDateString()}</p>
                      <p>{new Date(event.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}