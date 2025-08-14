import { useState } from "react";
import { CalmButton } from "@/components/ui/calm-button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function LandingProblem() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-left">Calmer</h1>
          <Link to="/landing-story" className="text-sm text-muted-foreground hover:text-foreground">
            See the story →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-4 py-12">
        <div className="max-w-2xl mx-auto text-left">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Stop letting social media
            <span className="text-primary"> burn you out</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            You started your business to help people, not to spend hours scrolling, 
            posting, and stressing about engagement. There's a better way.
          </p>

          {/* Problem Points */}
          <div className="space-y-4 mb-12">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-3 flex-shrink-0"></div>
              <p className="text-lg">Spending 2+ hours daily on social media without clear results</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-3 flex-shrink-0"></div>
              <p className="text-lg">Feeling overwhelmed by constant posting pressure</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-3 flex-shrink-0"></div>
              <p className="text-lg">Getting distracted from actual business work</p>
            </div>
          </div>

          {/* Solution Preview */}
          <div className="bg-card border rounded-2xl p-6 mb-12">
            <h3 className="text-xl font-semibold mb-4">What if you could:</h3>
            <div className="space-y-3">
              <p className="text-muted-foreground">✓ Have a personalized daily plan that actually works</p>
              <p className="text-muted-foreground">✓ Use social media intentionally, not compulsively</p>
              <p className="text-muted-foreground">✓ Focus on your business while staying visible online</p>
            </div>
          </div>

          {/* Waitlist Form */}
          <div className="bg-secondary/20 rounded-2xl p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Get early access to Calmer</h3>
            <p className="text-muted-foreground mb-6">
              Join 200+ small business owners taking back control
            </p>
            
            <form onSubmit={handleWaitlistJoin} className="max-w-sm mx-auto">
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
                  variant="primary"
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