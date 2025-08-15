import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Logo } from "@/components/ui/logo";

interface BlogPost {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  category: string | null;
  created_at: string;
}

export default function Resources() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, subtitle, slug, category, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pt-2.5">
      {/* Header */}
      <header className="py-6" style={{ paddingLeft: 'clamp(25px, 4vw, 64px)' }}>
        <Logo />
      </header>

      <div style={{ paddingLeft: 'clamp(25px, 4vw, 64px)' }}>
        <div className="max-w-4xl pr-6">
          <header className="mb-16">
          <h1 className="text-5xl font-bold font-serif text-foreground mb-4">Resources</h1>
          <p className="text-xl text-muted-foreground font-sans">
            Insights, guides, and stories to help you grow.
          </p>
        </header>

        {loading ? (
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-b border-border pb-8">
                <div className="h-8 bg-muted rounded mb-3 w-3/4"></div>
                <div className="h-5 bg-muted rounded mb-2 w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-serif text-muted-foreground mb-4">No posts yet</h2>
            <p className="text-muted-foreground">Check back soon for our latest insights.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {posts.map((post) => (
              <article key={post.id} className="border-b border-border pb-12 last:border-b-0">
                <Link to={`/resources/${post.slug}`} className="group">
                  <h2 className="text-3xl font-bold font-serif text-foreground mb-3 group-hover:text-muted-foreground transition-colors">
                    {post.title}
                  </h2>
                  {post.subtitle && (
                    <p className="text-lg text-muted-foreground mb-4 font-sans leading-relaxed">
                      {post.subtitle}
                    </p>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground font-sans">
                    {post.category && (
                      <Link 
                        to={`/resources/category/${post.category.toLowerCase()}`}
                        className="hover:text-foreground mr-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {post.category}
                      </Link>
                    )}
                    <time dateTime={post.created_at}>
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}