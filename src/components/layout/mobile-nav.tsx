import { MessageCircle, CheckSquare, TrendingUp, BookOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const location = useLocation();
  
  const navItems = [
    {
      href: "/resources",
      icon: BookOpen,
      label: "Resources",
      isActive: location.pathname.startsWith("/resources")
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label, isActive }) => (
          <Link
            key={href}
            to={href}
            className={cn(
              "flex flex-col items-center px-3 py-2 rounded-lg transition-colors text-xs",
              isActive 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}