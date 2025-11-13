import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "./providers/QueryClientProvider";
import { SupabaseProvider } from "./contexts/SupabaseContext";
import { AuthProvider } from "./contexts/AuthContext";
import { MenuProvider } from "./contexts/MenuContext";
import { router } from "./router";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";

function AppContent() {
  return <RouterProvider router={router} />;
}

function App() {
  return (
    <QueryClientProvider>
      <SupabaseProvider>
        <AuthProvider>
          <MenuProvider>
            <TooltipProvider delayDuration={0}>
              <Toaster />
              <AppContent />
            </TooltipProvider>
          </MenuProvider>
        </AuthProvider>
      </SupabaseProvider>
    </QueryClientProvider>
  );
}

export default App;
