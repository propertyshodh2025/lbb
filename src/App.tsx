import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom"; // Import useLocation
import { SessionContextProvider } from "./components/SessionContextProvider";
import AppHeader from "./components/AppHeader";
import Sidebar from "./components/Sidebar";
import AppRoutes from "./components/AppRoutes";
import { ThemeProvider } from "./contexts/ThemeContext";
import React, { useState } from 'react';

const queryClient = new QueryClient();

const AppContent = () => { // Create a new component to use hooks
  const [devRole, setDevRole] = useState<'admin' | 'manager' | 'editor' | 'client' | 'media_client' | null>(null);
  const location = useLocation(); // Get current location

  // Determine if sidebar should be hidden
  const hideSidebar = location.pathname === '/admin';

  return (
    <SessionContextProvider devRole={devRole}>
      <div className="flex min-h-screen">
        {!hideSidebar && <Sidebar />} {/* Conditionally render Sidebar */}
        <div className="flex flex-col flex-grow">
          <AppHeader />
          <main className="flex-grow relative z-10"> {/* Added relative z-10 */}
            <AppRoutes onSelectDevRole={setDevRole} />
          </main>
        </div>
      </div>
    </SessionContextProvider>
  );
};

const App = () => {
  console.log("App component rendered");

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent /> {/* Render the new AppContent component */}
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;