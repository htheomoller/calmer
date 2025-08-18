import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { initLeanAnimations } from "@/lib/lean-anim";
import { debugClickBlockers } from "@/lib/debug-blockers";
import Index from "./pages/Index";
import Resources from "./pages/Resources";
import ResourcePost from "./pages/ResourcePost";
import ResourceCategory from "./pages/ResourceCategory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    initLeanAnimations();
    
    // Detect Live Preview environment and enable debug
    const isLivePreview = window.location.hostname.includes('lovable') || 
                         document.querySelector('[data-editor]') ||
                         window.parent !== window;
    
    if (isLivePreview) {
      document.documentElement.classList.add('live-preview');
      // Debug click blockers in dev
      setTimeout(() => debugClickBlockers(), 1000);
    }
  }, [pathname]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/resources/:slug" element={<ResourcePost />} />
      <Route path="/resources/category/:category" element={<ResourceCategory />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
