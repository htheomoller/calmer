import { useState, useEffect, useRef } from "react";
import { CalmButton } from "@/components/ui/calm-button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Logo } from "@/components/ui/logo";
export default function LandingProblem() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    toast
  } = useToast();

  // Animation refs
  const headerRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLHeadingElement>(null);
  const counterRef = useRef<HTMLParagraphElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const problemsRef = useRef<HTMLDivElement>(null);
  const storyLinkRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  const subButtonRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const elements = [headerRef.current, heroRef.current, counterRef.current, subtitleRef.current, problemsRef.current, storyLinkRef.current, solutionRef.current, subButtonRef.current];

    // Initialize elements as hidden immediately
    elements.forEach((el, index) => {
      if (el) {
        el.classList.add("opacity-0", "translate-y-1", "transition-all", "duration-700");
        el.style.transitionDelay = `${index * 200}ms`;
      }
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("opacity-0", "translate-y-1");
          entry.target.classList.add("opacity-100", "translate-y-0");
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: "50px"
    });

    // Start observing after a brief delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      elements.forEach(el => {
        if (el) {
          observer.observe(el);
        }
      });
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);
  const handleWaitlistJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);

    // TODO: Integrate with Brevo API
    setTimeout(() => {
      toast({
        title: "You're on the list!",
        description: "We'll notify you when Calmer is ready to help you escape digital burnout."
      });
      setEmail("");
      setIsLoading(false);
      setIsDialogOpen(false);
    }, 1000);
  };
  return <div className="min-h-screen bg-[#fafafa]">
      {/* Fixed Header */}
      <header ref={headerRef} className="fixed top-0 left-0 right-0 bg-white z-50 py-6" style={{
      paddingLeft: 'clamp(25px, 4vw, 64px)'
    }}>
        <Logo />
      </header>

      {/* Hero Section */}
      <main style={{
      paddingLeft: 'clamp(25px, 4vw, 64px)'
    }} className="pt-32 pr-[clamp(25px,4vw,64px)]">
        <div className="max-w-2xl">
          <h2 ref={heroRef} style={{
          fontFamily: 'Inter, sans-serif'
        }} className="leading-none md:leading-none tracking-tight mb-6 font-semibold md:text-8xl text-6xl">
            Stop letting social media
            <span className="text-foreground"> burn you out.</span>
          </h2>

          <p ref={subtitleRef} style={{
          fontFamily: 'Inter, sans-serif'
        }} className="text-foreground mb-8 leading-tight md:leading-snug tracking-tight text-2xl">
            You started your business to help people, not to spend hours scrolling, 
            posting, and stressing about engagement. There's a better way.
          </p>

          {/* Button and Counter */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 mb-8">
            {/* Sub Button */}
            <div ref={subButtonRef} className="mb-4 md:mb-0">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button className="bg-black text-white rounded-full hover:bg-gray-800 transition-colors flex items-center space-x-3 font-extralight text-2xl px-[18px] py-[10px]">
                    <span className="font-extralight text-2xl">+</span>
                    <span className="font-extralight text-2xl">get calmer.</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold mb-2">Get early access to calmer.</DialogTitle>
                    <p className="text-muted-foreground mb-6">
                      Join 200+ small business owners taking back control
                    </p>
                  </DialogHeader>
                  
                  <form onSubmit={handleWaitlistJoin} className="space-y-4">
                    <Input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="w-full" required />
                    <CalmButton type="submit" variant="default" disabled={isLoading} className="w-full">
                      {isLoading ? "Joining..." : "Join Waitlist"}
                    </CalmButton>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Counter */}
            <p ref={counterRef} className="text-sm text-muted-foreground">Join the waitlist. 82 did yesterday.</p>
          </div>

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
    </div>;
}