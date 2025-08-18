import { useState } from "react";
import { CalmButton } from "@/components/ui/calm-button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HeaderNav } from "@/components/layout/header-nav";
const Index = () => {
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
  return <div className="min-h-screen bg-[#fafafa]">
      <HeaderNav />

      <main className="pt-32 px-[clamp(25px,4vw,64px)]">
        <div className="max-w-2xl mt-32">
          <h1 data-anim className="text-6xl md:text-8xl font-medium leading-none tracking-tight mb-6">
            Stop letting Instagram
            <span className="text-foreground"> <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">burn you out</span>.</span>
          </h1>

          <p data-anim data-anim-delay="120" data-anim-y="10px" className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground mb-8">
            You started your business to help people, not to spend hours scrolling, posting, and hustling in the DMs. There's a better way.
          </p>

          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 mb-12">
            <div data-anim data-anim-delay="240" data-anim-scale="0.98" className="mb-4 md:mb-0">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button className="bg-black text-white rounded-full hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-3 font-extralight text-2xl px-[18px] py-[10px]">
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

            <p data-anim data-anim-delay="360" className="text-sm text-muted-foreground">Join the waitlist. 82 did yesterday.</p>
          </div>

          <div className="space-y-8 mb-12">
            <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground">Calmer lets you send an instant, thoughtful DM whenever someone comments on your post — with your link, offer, or message. Set it up once and forget it. Yes, it's that simple.</p>
            
            <div className="mb-8">
              <h3 data-anim className="text-xl font-semibold mb-4">How it works</h3>
              <div className="space-y-3">
                <p data-anim data-anim-delay="80" className="text-muted-foreground">
                  <span className="font-bold">1 Post as usual</span><br />
                  Share on Instagram and add a simple instruction in your caption (e.g. "Comment yes for the link").
                </p>
                <p data-anim data-anim-delay="160" className="text-muted-foreground">
                  <span className="font-bold">2 Calmer handles it</span><br />
                  We read the caption, catch the comments, and know exactly what to send.
                </p>
                <p data-anim data-anim-delay="240" className="text-muted-foreground">
                  <span className="font-bold">3 Instant DM</span><br />
                  Your follower gets a thoughtful message right away, without you lifting a finger.
                </p>
              </div>
            </div>

            <p className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground">
              Sell more, stress less, and stay off Instagram while your business keeps growing.
            </p>
          </div>
        </div>
      </main>

      <footer className="px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Built for small business owners who want to escape digital burnout
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;