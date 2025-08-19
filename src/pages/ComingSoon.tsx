import { useEffect } from "react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { HeaderNav } from "@/components/layout/header-nav";
const ComingSoon = () => {
  useEffect(() => {
    // Add noindex meta tag for this page only
    const metaRobots = document.createElement("meta");
    metaRobots.name = "robots";
    metaRobots.content = "noindex,nofollow";
    document.head.appendChild(metaRobots);

    // Cleanup on unmount
    return () => {
      document.head.removeChild(metaRobots);
    };
  }, []);
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center relative z-0">
      <div className="relative z-50 pointer-events-auto">
        <HeaderNav />
      </div>
      <main className="px-[clamp(25px,4vw,64px)] flex-1 flex items-center pt-[120px] relative z-0">
        <div className="max-w-2xl mx-auto">
          <h1 data-anim className="text-6xl md:text-8xl font-medium leading-none tracking-tight mb-6">
            Stop letting Instagram
            <span className="text-foreground"> <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">burn you out</span>.</span>
          </h1>

          <p data-anim data-anim-delay="120" data-anim-y="10px" className="text-2xl leading-tight md:leading-snug tracking-tight text-foreground mb-8">
            You started your business to help people, not to spend hours scrolling, posting, and hustling in the DMs. There's a better way.
          </p>

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

            <div className="pt-8">
              <WaitlistForm />
            </div>
          </div>
        </div>
      </main>

      <footer className="px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg font-medium text-foreground mb-2">
            Coming Soon — Calmer is not open yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Built for small business owners who want to escape digital burnout
          </p>
        </div>
      </footer>
    </div>
  );
};
export default ComingSoon;