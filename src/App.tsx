import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { MysticBackground } from "@/components/effects";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { useDeepLinks } from "@/hooks/useDeepLinks";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import OAuthCallback from "./pages/OAuthCallback";
import VideoTool from "./pages/VideoTool";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

const App = () => {
  // Necesario en móvil nativo: procesa el deep link del callback y cierra el Custom Tab.
  useDeepLinks();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MysticBackground />
        <Toaster />
        <Sonner />
        <AppErrorBoundary>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/callback" element={<OAuthCallback />} />
              <Route path="/video-tool" element={<VideoTool />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AppErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
