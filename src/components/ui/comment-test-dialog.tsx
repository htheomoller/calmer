import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Post {
  id: string;
  ig_post_id: string;
  caption?: string;
  automation_enabled: boolean;
  trigger_mode?: string;
  trigger_list?: string[];
  typo_tolerance?: boolean;
}

interface CommentTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posts: Post[];
  onTest: (data: { postId: string; userHandle: string; commentText: string }) => void;
  onCreatePost?: () => Promise<Post | null>;
}

export function CommentTestDialog({
  open,
  onOpenChange,
  posts,
  onTest,
  onCreatePost,
}: CommentTestDialogProps) {
  const [selectedPostId, setSelectedPostId] = useState<string>("");
  const [userHandle, setUserHandle] = useState("@test_user");
  const [commentText, setCommentText] = useState("please LINK");
  const [isCreating, setIsCreating] = useState(false);

  // Find active sandbox posts
  const sandboxPosts = posts.filter(p => 
    p.ig_post_id?.includes('sandbox-post-') && p.automation_enabled === true
  );

  useEffect(() => {
    if (open) {
      // Auto-select first sandbox post if available
      if (sandboxPosts.length > 0 && !selectedPostId) {
        setSelectedPostId(sandboxPosts[0].id);
      }
      // If no sandbox posts exist, create one
      else if (sandboxPosts.length === 0 && !selectedPostId && onCreatePost) {
        handleCreateAndSelect();
      }
    }
  }, [open, sandboxPosts, selectedPostId, onCreatePost]);

  const handleCreateAndSelect = async () => {
    if (!onCreatePost) return;
    
    setIsCreating(true);
    try {
      const newPost = await onCreatePost();
      if (newPost) {
        setSelectedPostId(newPost.id);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleTest = () => {
    if (!selectedPostId) return;
    
    onTest({
      postId: selectedPostId,
      userHandle: userHandle.trim(),
      commentText: commentText.trim(),
    });
    
    onOpenChange(false);
  };

  const selectedPost = posts.find(p => p.id === selectedPostId);

  const getTriggerSummary = () => {
    if (!selectedPost) return '';
    
    const mode = selectedPost.trigger_mode || 'exact_phrase';
    const triggers = selectedPost.trigger_list || ['LINK'];
    const typos = selectedPost.typo_tolerance || false;
    
    const modeText = {
      exact_phrase: 'Exact phrase',
      any_keywords: 'Any keywords',
      all_words: 'All words'
    }[mode] || mode;
    
    return `Mode: ${modeText} · Triggers: ${triggers.join(', ')} · Typos: ${typos ? 'on' : 'off'}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Test Comment</DialogTitle>
          <DialogDescription>
            Simulate a comment on your post to test the automation workflow.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post-select">Select Post</Label>
            {isCreating ? (
              <div className="text-sm text-muted-foreground">Creating sandbox post...</div>
            ) : sandboxPosts.length > 0 ? (
              <Select value={selectedPostId} onValueChange={setSelectedPostId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a post" />
                </SelectTrigger>
                <SelectContent>
                  {sandboxPosts.map((post) => (
                    <SelectItem key={post.id} value={post.id}>
                      {post.ig_post_id} {post.automation_enabled ? "(Active)" : "(Disabled)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground">
                No sandbox posts available.{" "}
                {onCreatePost && (
                  <Button variant="link" className="p-0 h-auto" onClick={handleCreateAndSelect}>
                    Create one now
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-handle">User Handle</Label>
            <Input
              id="user-handle"
              value={userHandle}
              onChange={(e) => setUserHandle(e.target.value)}
              placeholder="@test_user"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment-text">Comment Text</Label>
            <Input
              id="comment-text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="please LINK"
            />
            <p className="text-xs text-muted-foreground">
              Try "hello" (no match) or "please LINK" (match)
            </p>
          </div>

          {selectedPost && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Current trigger rules:</p>
              <p className="text-xs text-muted-foreground">{getTriggerSummary()}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleTest} 
            disabled={!selectedPostId || isCreating}
          >
            Run Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}