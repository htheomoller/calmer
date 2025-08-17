import { useState } from "react";
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
  const {
    toast
  } = useToast();
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
  return <div className="min-h-screen bg-gradient-to-b from-slate-50 via-green-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Fixed Header */}
      <HeaderNav />

      {/* Hero Section */}
      <main className="pt-64 px-[clamp(25px,4vw,64px)]">
        <div className="max-w-2xl">
          <h1 className="text-6xl md:text-8xl font-medium leading-none tracking-tight mb-6" data-animate="fade-in" data-delay="0.1s">
            Stop letting Instagram
            <span className="text-foreground"> <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">burn you out</span>.</span>
          </h1>

          <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground mb-8" data-animate="fade-in" data-delay="0.3s">You started your business to help people, not to spend hours scrolling, posting, and stressing about engagement. There's a better way.</p>

          {/* Button and Counter */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 mb-12" data-animate="fade-in" data-delay="0.5s">
            <div className="mb-4 md:mb-0">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button className="bg-black text-white rounded-full hover:bg-gray-800 flex items-center space-x-3 font-extralight text-2xl px-[18px] py-[10px]">
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

            <p className="text-sm text-muted-foreground">Join the waitlist. 82 did yesterday.</p>
          </div>

          {/* Problem Description */}
          <div className="space-y-8 mb-12">
            <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground" data-animate="fade-in" data-delay="0.7s">Calmer lets you send an instant, thoughtful DM whenever someone comments on your post — with your link, offer, or message. Setit up once and forget it.
Sell more, stress less, and stay off Instagram while your business keeps growing.
          </p>
            <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground" data-animate="fade-in" data-delay="0.9s">
              But somehow, you find yourself trapped in an endless cycle of content creation.
            </p>
            <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground" data-animate="fade-in" data-delay="1.1s">
              Hours spent crafting posts, responding to comments, analyzing metrics...
            </p>
            <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground" data-animate="fade-in" data-delay="1.3s">
              And still feeling like you're shouting into the void.
            </p>
            <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground" data-animate="fade-in" data-delay="1.5s">
              What if there was a better way to connect authentically with your audience?
            </p>
          </div>

          <div className="mb-12" data-animate="fade-in" data-delay="1.7s">
            <Link to="/landing-story" className="text-sm text-muted-foreground hover:text-foreground">
              See the story →
            </Link>
          </div>

          {/* Solution Preview */}
          <div className="mb-12" data-animate="fade-in" data-delay="1.9s">
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
      <footer className="px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Built for small business owners who want to escape digital burnout
          </p>
        </div>
      </footer>

    </div>;
}