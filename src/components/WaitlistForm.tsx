import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PUBLIC_CONFIG } from "@/config/public";
import { supabase } from "@/integrations/supabase/client";

export const WaitlistForm = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("add-to-waitlist", {
        body: { 
          email,
          listId: PUBLIC_CONFIG.BREVO_WAITLIST_LIST_ID
        },
        headers: {
          "X-Form-Secret": PUBLIC_CONFIG.WAITLIST_FORM_SECRET,
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        setMessage("⚠️ Try again later.");
        setIsSuccess(false);
        return;
      }

      if (data?.ok) {
        setMessage("✅ You're on the waitlist!");
        setIsSuccess(true);
        setEmail("");
      } else {
        setMessage("⚠️ Try again later.");
        setIsSuccess(false);
      }
    } catch (error) {
      console.error("Error submitting waitlist:", error);
      setMessage("⚠️ Try again later.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !email}
            className="px-6"
          >
            {isLoading ? "..." : "Join Waitlist"}
          </Button>
        </div>
        
        {message && (
          <p className={`text-center text-sm ${
            isSuccess ? "text-green-600" : "text-amber-600"
          }`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};