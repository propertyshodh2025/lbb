import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { SessionContextProvider } from "./components/SessionContextProvider";
import AppHeader from "./components/AppHeader";
import Sidebar from "./components/Sidebar";
import AppRoutes from "./components/AppRoutes";
import { ThemeProvider } from "./contexts/ThemeContext"; // Import ThemeProvider

const queryClient = new QueryClient();

const App = () => {
  console.log("App component rendered");
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider> {/* Wrap with ThemeProvider */}
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SessionContextProvider>
              <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex flex-col flex-grow">
                  <AppHeader />
                  <main className="flex-grow">
                    <AppRoutes />
                  </main>
                </div>
              </div>
            </SessionContextProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;