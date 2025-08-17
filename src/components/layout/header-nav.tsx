import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { href: "/resources", label: "Resources" }
];

export function HeaderNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-50 py-6 px-[clamp(25px,4vw,64px)]">
        <div className="flex items-center justify-between">
          <Logo />
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-foreground hover:text-muted-foreground transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Mobile Hamburger */}
          {isMobile && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors z-[60] relative"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobile && isMenuOpen && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-40 animate-fade-in">
          <div className="pt-24 px-6">
            <nav className="space-y-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block text-foreground hover:text-muted-foreground transition-colors font-medium text-xl py-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}