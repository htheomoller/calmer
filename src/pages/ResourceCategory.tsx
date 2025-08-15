import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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

export default function ResourceCategory() {
  const { category } = useParams<{ category: string }>();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (category) {
      fetchCategoryPosts();
    }
  }, [category]);

  const fetchCategoryPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, subtitle, slug, category, created_at')
        .eq('published', true)
        .ilike('category', category || '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching category posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const capitalizedCategory = category?.charAt(0).toUpperCase() + category?.slice(1);

  return (
    <div className="min-h-screen bg-[#fafafa] pt-2.5">
      {/* Header */}
      <header className="py-6" style={{ paddingLeft: 'clamp(25px, 4vw, 64px)' }}>
        <Logo />
      </header>

      <div style={{ paddingLeft: 'clamp(25px, 4vw, 64px)' }}>
        <div className="max-w-4xl pr-6 py-12">
          <header className="mb-16">
            <Link to="/resources" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
              ← Back to Resources
            </Link>
          <h1 className="text-5xl font-bold font-serif text-foreground mb-4">
            {capitalizedCategory}
          </h1>
          <p className="text-xl text-muted-foreground font-sans">
            Articles about {capitalizedCategory?.toLowerCase()}.
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
            <h2 className="text-2xl font-serif text-muted-foreground mb-4">
              No posts in {capitalizedCategory}
            </h2>
            <p className="text-muted-foreground mb-6">
              We haven't published any articles in this category yet.
            </p>
            <Link to="/resources" className="text-primary hover:text-primary/80">
              Browse all resources
            </Link>
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