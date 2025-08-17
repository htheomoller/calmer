import { MobileNav } from "@/components/layout/mobile-nav";
import { TrendingUp, Calendar, Target } from "lucide-react";

export default function Progress() {
  // Sample data - will be replaced with real data from Supabase
  const streak = 5;
  const weeklyCompletion = 78;
  const totalStepsCompleted = 23;

  const weekData = [
    { day: 'Mon', completed: 3, total: 4 },
    { day: 'Tue', completed: 4, total: 4 },
    { day: 'Wed', completed: 2, total: 4 },
    { day: 'Thu', completed: 4, total: 4 },
    { day: 'Fri', completed: 3, total: 4 },
    { day: 'Sat', completed: 1, total: 4 },
    { day: 'Sun', completed: 2, total: 4 },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border px-4 py-6">
        <h1 className="text-2xl font-bold text-left">Your Progress</h1>
        <p className="text-muted-foreground text-left">Building mindful social media habits</p>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-6 space-y-4">
        {/* Current Streak */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-primary/20 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-left">Current Streak</h3>
          </div>
          <p className="text-3xl font-bold text-primary">{streak} days</p>
          <p className="text-sm text-muted-foreground text-left">Keep going! You're building a great habit.</p>
        </div>

        {/* Weekly Completion */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-secondary p-2 rounded-lg">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-left">This Week</h3>
            </div>
            <span className="text-2xl font-bold">{weeklyCompletion}%</span>
          </div>
          
          {/* Week Progress Bars */}
          <div className="space-y-3">
            {weekData.map((day) => {
              const percentage = (day.completed / day.total) * 100;
              return (
                <div key={day.day} className="flex items-center space-x-3">
                  <span className="text-xs w-8 text-muted-foreground">{day.day}</span>
                  <div className="flex-1 bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right text-muted-foreground">
                    {day.completed}/{day.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Progress */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-secondary p-2 rounded-lg">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-left">All Time</h3>
          </div>
          <p className="text-3xl font-bold mb-1">{totalStepsCompleted}</p>
          <p className="text-sm text-muted-foreground text-left">mindful steps completed</p>
        </div>

        {/* Insights */}
        <div className="bg-card border rounded-2xl p-6">
          <h3 className="font-semibold mb-4 text-left">This Week's Insights</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p className="text-sm text-muted-foreground text-left">
                You're most consistent with your morning intention setting
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p className="text-sm text-muted-foreground text-left">
                Evening reflection could use some attention
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p className="text-sm text-muted-foreground text-left">
                You've reduced mindless scrolling by an estimated 2 hours this week
              </p>
            </div>
          </div>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}