import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { initLeanAnimations } from "@/lib/lean-anim";
import { debugClickBlockers } from "@/lib/debug-blockers";
import Index from "./pages/Index";
import AccountSettings from "./pages/AccountSettings";
import Posts from "./pages/Posts";
import PostDetails from "./pages/PostDetails";
import Activity from "./pages/Activity";
import SimulateComment from "./pages/SimulateComment";
import Resources from "./pages/Resources";
import ResourcePost from "./pages/ResourcePost";
import ResourceCategory from "./pages/ResourceCategory";
import Health from "./pages/Health";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/health" element={<Health />} />
      <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
      <Route path="/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
      <Route path="/posts/:id" element={<ProtectedRoute><PostDetails /></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
      <Route path="/simulate" element={<ProtectedRoute><SimulateComment /></ProtectedRoute>} />
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
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
