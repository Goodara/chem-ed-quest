import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Modules from "./pages/Modules";
import ModuleContent from "./pages/ModuleContent";
import Quiz from "./pages/Quiz";
import QuizResults from "./pages/QuizResults";
import CreateModule from "./pages/CreateModule";
import AdminAnalytics from "./pages/AdminAnalytics";
import StudentComments from "./pages/StudentComments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/modules" element={<Modules />} />
              <Route path="/modules/:id" element={<ModuleContent />} />
              <Route path="/quiz/:moduleId" element={<Quiz />} />
              <Route path="/quiz-results" element={<QuizResults />} />
              <Route path="/admin/modules/new" element={<CreateModule />} />
              <Route path="/admin/modules/:id/edit" element={<CreateModule />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/comments" element={<StudentComments />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
