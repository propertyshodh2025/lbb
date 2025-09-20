import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { SessionContextProvider } from "./components/SessionContextProvider";
import AppHeader from "./components/AppHeader";
import Sidebar from "./components/Sidebar";
import AppRoutes from "./components/AppRoutes";
import { ThemeProvider } from "./contexts/ThemeContext";
import React, { useState } from 'react'; // Import useState

const queryClient = new QueryClient();

const App = () => {
  console.log("App component rendered");
  const [devRole, setDevRole] = useState<'admin' | 'manager' | 'editor' | 'client' | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SessionContextProvider devRole={devRole}> {/* Pass devRole to context provider */}
              <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex flex-col flex-grow">
                  <AppHeader />
                  <main className="flex-grow">
                    <AppRoutes onSelectDevRole={setDevRole} /> {/* Pass setDevRole to AppRoutes */}
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