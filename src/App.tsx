import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { SessionContextProvider } from "./components/SessionContextProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import AppHeader from "./components/AppHeader";
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import EditorDashboard from "./pages/EditorDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import RoleBasedRedirect from "./pages/RoleBasedRedirect";
import ProfilePage from "./pages/ProfilePage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import TaskDetailsPage from "./pages/TaskDetailsPage";
import Sidebar from "./components/Sidebar"; // Import the new Sidebar component

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <div className="flex min-h-screen"> {/* Flex container for sidebar and main content */}
            <Sidebar /> {/* Render Sidebar */}
            <div className="flex flex-col flex-grow"> {/* Main content area */}
              <AppHeader /> {/* Header for mobile */}
              <main className="flex-grow">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<RoleBasedRedirect />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/projects/:id" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><ProjectDetailsPage /></ProtectedRoute>} />
                    <Route path="/tasks/:id" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'editor']}><TaskDetailsPage /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/manager" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><ManagerDashboard /></ProtectedRoute>} />
                    <Route path="/editor" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'editor']}><EditorDashboard /></ProtectedRoute>} />
                    <Route path="/client" element={<ProtectedRoute allowedRoles={['client', 'admin']}><ClientDashboard /></ProtectedRoute>} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;