import { useState } from "react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CalmButton } from "@/components/ui/calm-button";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyStep {
  id: string;
  title: string;
  description: string;
  timeEstimate: string;
  category: string;
  completed: boolean;
}

export default function MyPlan() {
  const [todaysSteps, setTodaysSteps] = useState<DailyStep[]>([
    {
      id: "morning_intention",
      title: "Set Your Daily Intention",
      description: "Before opening any social app, take 2 minutes to write down what you want to accomplish today.",
      timeEstimate: "2 min",
      category: "mindfulness",
      completed: false
    },
    {
      id: "single_platform_check",
      title: "Check One Platform Only",
      description: "Choose one platform to check for messages and engagement. Avoid the scroll trap.",
      timeEstimate: "10 min",
      category: "engagement",
      completed: true
    },
    {
      id: "value_first_content",
      title: "Share One Helpful Tip",
      description: "Post something that helps your audience solve a small problem.",
      timeEstimate: "15 min",
      category: "content",
      completed: false
    },
    {
      id: "evening_reflection",
      title: "Reflect on Your Day",
      description: "Did your social media use align with your business goals today?",
      timeEstimate: "3 min",
      category: "reflection",
      completed: false
    }
  ]);

  const toggleStepCompletion = (stepId: string) => {
    setTodaysSteps(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { ...step, completed: !step.completed }
          : step
      )
    );
  };

  const completedCount = todaysSteps.filter(step => step.completed).length;
  const progressPercentage = Math.round((completedCount / todaysSteps.length) * 100);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border px-4 py-6">
        <h1 className="text-2xl font-bold text-left mb-2">Today's Plan</h1>
        <div className="flex items-center space-x-4">
          <div className="flex-1 bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-sm font-medium">{completedCount}/{todaysSteps.length}</span>
        </div>
      </div>

      {/* Steps */}
      <div className="px-4 py-6 space-y-4">
        {todaysSteps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "bg-card border rounded-2xl p-4 transition-all duration-200",
              step.completed && "bg-primary/5 border-primary/20"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <CalmButton
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleStepCompletion(step.id)}
                    className={cn(
                      "h-6 w-6 rounded-full p-0",
                      step.completed 
                        ? "text-primary hover:text-primary/80" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </CalmButton>
                  <h3 className={cn(
                    "font-medium text-left",
                    step.completed && "line-through text-muted-foreground"
                  )}>
                    {step.title}
                  </h3>
                </div>
                
                <p className={cn(
                  "text-sm text-muted-foreground text-left mb-3",
                  step.completed && "line-through"
                )}>
                  {step.description}
                </p>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{step.timeEstimate}</span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-secondary rounded-full capitalize">
                    {step.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Encouragement */}
      {progressPercentage === 100 && (
        <div className="mx-4 bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center">
          <h3 className="font-semibold text-primary mb-2">Great job today! 🎉</h3>
          <p className="text-sm text-muted-foreground">
            You've completed all your steps. Take a moment to appreciate your intentional approach to social media.
          </p>
        </div>
      )}

      <MobileNav />
    </div>
  );
}