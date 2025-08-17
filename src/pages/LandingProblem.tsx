import { useState, useEffect } from "react";
import { CalmButton } from "@/components/ui/calm-button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HeaderNav } from "@/components/layout/header-nav";

export default function LandingProblem() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { toast } = useToast();

  // Simple scroll effect for background color only
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollY / maxScroll, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Color interpolation function
  const interpolateColor = (progress: number) => {
    const startColor = [0, 0, 98]; // Light gray
    const midColor = [120, 25, 95]; // Light sage green
    const endColor = [210, 35, 95]; // Light blue

    let currentColor;
    if (progress <= 0.5) {
      const t = progress * 2;
      currentColor = [
        startColor[0] + (midColor[0] - startColor[0]) * t,
        startColor[1] + (midColor[1] - startColor[1]) * t,
        startColor[2] + (midColor[2] - startColor[2]) * t
      ];
    } else {
      const t = (progress - 0.5) * 2;
      currentColor = [
        midColor[0] + (endColor[0] - midColor[0]) * t,
        midColor[1] + (endColor[1] - midColor[1]) * t,
        midColor[2] + (endColor[2] - midColor[2]) * t
      ];
    }

    return `hsl(${currentColor[0]}, ${currentColor[1]}%, ${currentColor[2]}%)`;
  };

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

  return (
    <div 
      className="min-h-screen transition-colors duration-300 ease-out"
      style={{ backgroundColor: interpolateColor(scrollProgress) }}
    >
      {/* Fixed Header */}
      <HeaderNav />

      {/* Hero Section */}
      <main className="pt-32 px-[clamp(25px,4vw,64px)]">
        <div className="max-w-2xl">
          <h1 className="text-6xl md:text-8xl font-semibold leading-none tracking-tight mb-6 animate-fade-in">
            Stop letting social media
            <span className="text-foreground"> burn you out.</span>
          </h1>

          <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground mb-8 animate-fade-in" 
             style={{ animationDelay: '200ms' }}>
            You started your business to help people, not to spend hours scrolling, 
            posting, and stressing about engagement. There's a better way.
          </p>

          {/* Button and Counter */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 mb-12 animate-fade-in" 
               style={{ animationDelay: '400ms' }}>
            <div className="mb-4 md:mb-0">
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
                    <Input 
                      type="email" 
                      placeholder="Enter your email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      className="w-full" 
                      required 
                    />
                    <CalmButton type="submit" variant="default" disabled={isLoading} className="w-full">
                      {isLoading ? "Joining..." : "Join Waitlist"}
                    </CalmButton>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <p className="text-sm text-muted-foreground">Join the waitlist. 82 did yesterday.</p>
          </div>

          {/* Problem Description */}
          <div className="space-y-8 mb-12">
            <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground animate-fade-in" 
               style={{ animationDelay: '600ms' }}>
              You started your business with passion and a vision to make a difference.
            </p>
            <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground animate-fade-in" 
               style={{ animationDelay: '800ms' }}>
              But somehow, you find yourself trapped in an endless cycle of content creation.
            </p>
            <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground animate-fade-in" 
               style={{ animationDelay: '1000ms' }}>
              Hours spent crafting posts, responding to comments, analyzing metrics...
            </p>
            <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground animate-fade-in" 
               style={{ animationDelay: '1200ms' }}>
              And still feeling like you're shouting into the void.
            </p>
            <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground animate-fade-in" 
               style={{ animationDelay: '1400ms' }}>
              What if there was a better way to connect authentically with your audience?
            </p>
          </div>

          <div className="mb-12 animate-fade-in" style={{ animationDelay: '1600ms' }}>
            <Link to="/landing-story" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              See the story →
            </Link>
          </div>

          {/* Solution Preview */}
          <div className="mb-12 animate-fade-in" style={{ animationDelay: '1800ms' }}>
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

      {/* Extra content for scroll effect */}
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-center">
          Scroll to see the background color transition effect
        </p>
      </div>
    </div>
  );
}