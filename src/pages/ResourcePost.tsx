import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileNav } from "@/components/layout/mobile-nav";

interface BlogPost {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  category: string | null;
  tags: string[];
  created_at: string;
}

export default function ResourcePost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true);
        } else {
          throw error;
        }
      } else {
        setPost(data);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="h-4 bg-muted rounded mb-8 w-24"></div>
          <div className="h-12 bg-muted rounded mb-6"></div>
          <div className="h-6 bg-muted rounded mb-8 w-1/2"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded"></div>
            ))}
          </div>
        </div>
        <MobileNav />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <Link to="/resources" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
            ← Back to Resources
          </Link>
          <div className="text-center py-16">
            <h1 className="text-3xl font-serif text-foreground mb-4">Post not found</h1>
            <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
            <Link to="/resources" className="text-primary hover:text-primary/80">
              Browse all resources
            </Link>
          </div>
        </div>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <article className="max-w-2xl mx-auto px-6 py-12">
        <Link to="/resources" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
          ← Back to Resources
        </Link>
        
        <header className="mb-12">
          <h1 className="text-5xl font-bold font-serif text-foreground leading-tight mb-6">
            {post.title}
          </h1>
          
          {post.subtitle && (
            <h2 className="text-2xl font-serif text-muted-foreground leading-relaxed mb-8">
              {post.subtitle}
            </h2>
          )}
          
          <div className="flex items-center text-sm text-muted-foreground font-sans border-t border-border pt-6">
            {post.category && (
              <Link 
                to={`/resources/category/${post.category.toLowerCase()}`}
                className="hover:text-foreground mr-4 font-medium"
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
        </header>

        <div 
          className="prose prose-lg max-w-none font-body text-[21px] leading-[1.58] text-foreground"
          style={{
            fontFamily: 'Charter, Georgia, serif',
          }}
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }}
        />

        {post.tags && post.tags.length > 0 && (
          <footer className="mt-16 pt-8 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded-full font-sans"
                >
                  {tag}
                </span>
              ))}
            </div>
          </footer>
        )}
      </article>
      <MobileNav />
    </div>
  );
}