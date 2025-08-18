import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useIsMobile } from "@/hooks/use-mobile";

const resourceItems = [
  { href: "/resources/digital-minimalism-guide", label: "The Art of Digital Minimalism" }
];

export function HeaderNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-50 py-6 px-[clamp(25px,4vw,64px)]">
        <div className="flex items-center justify-between">
          <Logo />
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="flex items-center space-x-8">
              <div 
                className="relative"
                onMouseEnter={() => setIsResourcesOpen(true)}
                onMouseLeave={() => setIsResourcesOpen(false)}
              >
                <button
                  onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                  className="text-foreground hover:text-muted-foreground transition-colors font-medium flex items-center space-x-1"
                >
                  <span>Resources</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {/* Resources Dropdown */}
                {isResourcesOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-border py-2 z-50">
                    <Link
                      to="/resources"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      All Resources
                    </Link>
                    <div className="border-t border-border my-1"></div>
                    {resourceItems.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
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
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-40 animate-fade-in-fast">
          <div className="pt-24 px-6">
            <nav className="space-y-6">
              <div>
                <button
                  onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                  className="block text-foreground hover:text-muted-foreground transition-colors font-medium text-xl py-3 w-full text-left"
                >
                  Resources
                </button>
                <div className="ml-4 space-y-2 mt-2">
                  <Link
                    to="/resources"
                    className="block text-muted-foreground hover:text-foreground transition-colors text-lg py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    All Resources
                  </Link>
                  <div className="border-t border-border my-1 ml-4"></div>
                  {resourceItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="block text-muted-foreground hover:text-foreground transition-colors text-lg py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}