import { useState } from "react";
import { CalmButton } from "@/components/ui/calm-button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function LandingStory() {
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
        title: "Welcome to the journey!",
        description: "We'll be in touch soon with early access to Calmer.",
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
          <h1 className="text-2xl font-bold text-left">calmer.</h1>
          <Link to="/landing-problem" className="text-sm text-muted-foreground hover:text-foreground">
            See the problem →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-4 py-12">
        <div className="max-w-2xl mx-auto text-left">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-8">
            I built my business to help people,
            <span className="text-foreground"> not to scroll endlessly</span>
          </h2>
          
          <div className="space-y-6 mb-12 text-lg text-muted-foreground leading-relaxed">
            <p>
              Sarah runs a wellness coaching practice. She loves helping her clients transform their lives, 
              but social media was slowly consuming hers.
            </p>
            
            <p>
              "I'd open Instagram to post about my morning meditation workshop, and suddenly it's 2 PM. 
              I've been scrolling for three hours, comparing myself to other coaches, and I haven't done 
              any actual work."
            </p>
            
            <p>
              Sound familiar? You're not alone.
            </p>
          </div>

          {/* The Transformation */}
          <div className="bg-card border rounded-2xl p-8 mb-12">
            <h3 className="text-2xl font-semibold mb-6 text-left">Sarah's transformation with calmer.:</h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium text-red-600 mb-3">Before Calmer</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 3-4 hours daily on social media</li>
                  <li>• Constant comparison with competitors</li>
                  <li>• Posting sporadically when anxious</li>
                  <li>• Feeling like a fraud online</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-3">After calmer.</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 45 minutes of intentional social media</li>
                  <li>• Authentic posts that attract ideal clients</li>
                  <li>• Clear boundaries around social time</li>
                  <li>• 2x more client inquiries from social media</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-6 text-left">How calmer. works:</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-medium text-foreground">1</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Personal chat assessment</h4>
                  <p className="text-sm text-muted-foreground">We learn about your business and current social media challenges</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-medium text-foreground">2</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Custom daily framework</h4>
                  <p className="text-sm text-muted-foreground">Get a personalized plan that fits your business and schedule</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-medium text-foreground">3</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Gentle daily guidance</h4>
                  <p className="text-sm text-muted-foreground">Simple steps that build mindful social media habits</p>
                </div>
              </div>
            </div>
          </div>

          {/* Waitlist Form */}
          <div className="bg-secondary/20 rounded-2xl p-8">
            <h3 className="text-2xl font-semibold mb-3 text-left">Start your own transformation</h3>
            <p className="text-muted-foreground mb-6 text-left">
              Join the waitlist and be among the first to escape social media burnout
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
                  {isLoading ? "Joining..." : "Get Early Access"}
                </CalmButton>
              </div>
            </form>
            
            <p className="text-xs text-muted-foreground mt-4 text-left">
              No spam, just updates on your journey to calmer social media
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Built for business owners who know there's a better way
          </p>
        </div>
      </footer>
    </div>
  );
}