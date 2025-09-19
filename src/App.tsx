import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { SessionContextProvider } from "./components/SessionContextProvider";
import AppHeader from "./components/AppHeader";
import Sidebar from "./components/Sidebar";
import AppRoutes from "./components/AppRoutes"; // Import the new AppRoutes component

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
                <AppRoutes /> {/* Use the new AppRoutes component here */}
              </main>
            </div>
          </div>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;