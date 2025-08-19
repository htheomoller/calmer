import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, LogOut, User } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const resourceItems = [
  { href: "/resources/digital-minimalism-guide", label: "The Art of Digital Minimalism" }
];

export function HeaderNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-50 py-6 px-[clamp(25px,4vw,64px)]">
        <div className="flex items-center justify-between">
          <Logo />
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="flex items-center space-x-8">
              {user ? (
                <>
                  <Link
                    to="/posts"
                    className="text-foreground hover:text-muted-foreground transition-colors font-medium"
                  >
                    Posts
                  </Link>
                  <Link
                    to="/activity"
                    className="text-foreground hover:text-muted-foreground transition-colors font-medium"
                  >
                    Activity
                  </Link>
                  <Link
                    to="/settings"
                    className="text-foreground hover:text-muted-foreground transition-colors font-medium"
                  >
                    Settings
                  </Link>
                  <div className="relative">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={signOut}
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  {/* Only show Resources link on non-public pages when logged out */}
                  {!['/', '/comingsoon'].includes(location.pathname) && (
                    <Link
                      to="/resources"
                      className="text-foreground hover:text-muted-foreground transition-colors font-medium"
                    >
                      Resources
                    </Link>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <Link to="/login">
                      <User className="h-4 w-4 mr-2" />
                      Login
                    </Link>
                  </Button>
                </div>
              )}
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
            {user ? (
              <>
                <Link
                  to="/posts"
                  className="block text-foreground hover:text-muted-foreground transition-colors font-medium text-xl py-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Posts
                </Link>
                <Link
                  to="/activity"
                  className="block text-foreground hover:text-muted-foreground transition-colors font-medium text-xl py-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Activity
                </Link>
                <Link
                  to="/settings"
                  className="block text-foreground hover:text-muted-foreground transition-colors font-medium text-xl py-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Settings
                </Link>
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
                <Button
                  variant="outline"
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                {/* Only show Resources link on non-public pages when logged out */}
                {!['/', '/comingsoon'].includes(location.pathname) && (
                  <Link
                    to="/resources"
                    className="block text-foreground hover:text-muted-foreground transition-colors font-medium text-xl py-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Resources
                  </Link>
                )}
                <Button asChild className="w-full">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
        </div>
      )}
    </>
  );
}