import { useState, useEffect, useRef } from "react";
import { CalmButton } from "@/components/ui/calm-button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function LandingProblem() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Animation refs
  const headerRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const problemsRef = useRef<HTMLDivElement>(null);
  const storyLinkRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  const waitlistRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elements = [
      headerRef.current,
      heroRef.current,
      subtitleRef.current,
      problemsRef.current,
      storyLinkRef.current,
      solutionRef.current,
      waitlistRef.current,
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("opacity-0", "translate-y-1");
            entry.target.classList.add("opacity-100", "translate-y-0");
          }
        });
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    elements.forEach((el, index) => {
      if (el) {
        el.classList.add("opacity-0", "translate-y-1", "transition-all", "duration-700");
        el.style.transitionDelay = `${index * 200}ms`;
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  const handleWaitlistJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    
    // TODO: Integrate with Brevo API
    setTimeout(() => {
      toast({
        title: "You're on the list!",
        description: "We'll notify you when Calmer is ready to help you escape digital burnout.",
      });
      setEmail("");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background pt-2.5">
      {/* Header */}
      <header ref={headerRef} className="py-6" style={{ paddingLeft: 'clamp(25px, 4vw, 64px)' }}>
        <h1 className="text-2xl font-bold">calmer.</h1>
      </header>

      {/* Hero Section */}
      <main className="pt-16" style={{ paddingLeft: 'clamp(25px, 4vw, 64px)' }}>
        <div className="max-w-2xl">
          <h2 ref={heroRef} className="text-7xl md:text-8xl font-medium leading-tight md:leading-none mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            Stop letting social media
            <span className="text-foreground"> burn you out.</span>
          </h2>
          
          <p ref={subtitleRef} className="text-xl text-muted-foreground mb-8 leading-relaxed">
            You started your business to help people, not to spend hours scrolling, 
            posting, and stressing about engagement. There's a better way.
          </p>

          {/* Problem Points */}
          <div ref={problemsRef} className="space-y-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-foreground mt-3 flex-shrink-0"></div>
              <p className="text-lg">Spending 2+ hours daily on social media without clear results?</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-foreground mt-3 flex-shrink-0"></div>
              <p className="text-lg">Feeling overwhelmed by constant posting pressure?</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-foreground mt-3 flex-shrink-0"></div>
              <p className="text-lg">Getting distracted from actual business work?</p>
            </div>
          </div>

          <div ref={storyLinkRef} className="mb-12">
            <Link to="/landing-story" className="text-sm text-muted-foreground hover:text-foreground">
              See the story →
            </Link>
          </div>

          {/* Solution Preview */}
          <div ref={solutionRef} className="mb-12">
            <h3 className="text-xl font-semibold mb-4">What if you could:</h3>
            <div className="space-y-3">
              <p className="text-muted-foreground">✓ Have a personalized daily plan that actually works</p>
              <p className="text-muted-foreground">✓ Use social media intentionally, not compulsively</p>
              <p className="text-muted-foreground">✓ Focus on your business while staying visible online</p>
            </div>
          </div>

          {/* Waitlist Form */}
          <div ref={waitlistRef} className="bg-gray-100 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-2 text-left">Get early access to calmer.</h3>
            <p className="text-muted-foreground mb-6 text-left">
              Join 200+ small business owners taking back control
            </p>
            
            <form onSubmit={handleWaitlistJoin} className="max-w-sm">
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  required
                />
                <CalmButton
                  type="submit"
                  variant="default"
                  disabled={isLoading}
                >
                  {isLoading ? "Joining..." : "Join Waitlist"}
                </CalmButton>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Built for small business owners who want to escape digital burnout
          </p>
        </div>
      </footer>
    </div>
  );
}