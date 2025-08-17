import { useState } from "react";
import { CalmButton } from "@/components/ui/calm-button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HeaderNav } from "@/components/layout/header-nav";

export default function LandingProblem() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

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
    <div className="min-h-screen dynamic-gradient">
      {/* Fixed Header */}
      <HeaderNav />

      {/* Hero Section */}
      <main className="pt-64 px-[clamp(25px,4vw,64px)]">
        <div className="max-w-2xl">
          <div data-animate="fade-in">
            <h1 className="text-6xl md:text-8xl font-medium leading-none tracking-tight mb-6">
              Stop letting Instagram
              <span className="text-foreground"> <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">burn you out</span>.</span>
            </h1>
          </div>

          <div data-animate="fade-in" data-delay="0.3s">
            <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground mb-8">You started your business to help people, not to spend hours scrolling, posting, and hustling in the DMs. There's a better way.</p>
          </div>

          {/* Button and Counter */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 mb-12" data-animate="fade-in" data-delay="0.5s">
            <div className="mb-4 md:mb-0">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button className="bg-black text-white rounded-full hover:bg-gray-800 hover:scale-105 transition-all duration-300 flex items-center space-x-3 font-extralight text-2xl px-[18px] py-[10px]">
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

            <div data-animate="fade-in" data-delay="0.7s">
              <p className="text-sm text-muted-foreground">Join the waitlist. 82 did yesterday.</p>
            </div>
          </div>

          {/* Problem Description */}
          <div className="space-y-8 mb-12">
            <div data-animate="fade-in" data-delay="0.9s">
              <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground">Calmer lets you send an instant, thoughtful DM whenever someone comments on your post — with your link, offer, or message. Set it up once and forget it. It's that simple.</p>
            </div>
            
            {/* How it works */}
            <div className="mb-8" data-animate="fade-in" data-delay="1.1s">
              <h3 className="text-xl font-semibold mb-4">How it works</h3>
              <div className="space-y-3">
                <div data-animate="fade-in" data-delay="1.3s">
                  <p className="text-muted-foreground">
                    <span className="font-bold">1 Post as usual</span><br />
                    Share on Instagram and add a simple instruction in your caption (e.g. "Comment yes for the link").
                  </p>
                </div>
                <div data-animate="fade-in" data-delay="1.5s">
                  <p className="text-muted-foreground">
                    <span className="font-bold">2 Calmer handles it</span><br />
                    We read the caption, catch the comments, and know exactly what to send.
                  </p>
                </div>
                <div data-animate="fade-in" data-delay="1.7s">
                  <p className="text-muted-foreground">
                    <span className="font-bold">3 Instant DM</span><br />
                    Your follower gets a thoughtful message right away, without you lifting a finger.
                  </p>
                </div>
              </div>
            </div>

            <div data-animate="fade-in" data-delay="1.9s">
              <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground">Sell more, stress less, and stay off Instagram while your business keeps growing.</p>
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
    </div>
  );
}