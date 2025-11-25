import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "./providers/QueryClientProvider";
import { ReduxProvider } from "./providers/ReduxProvider";
import { SupabaseProvider } from "./contexts/SupabaseContext";
import { AuthProvider } from "./contexts/AuthContext";
import { MenuProvider } from "./contexts/MenuContext";
import { ConstantsProvider } from "./contexts/ConstantsContext";
import { router } from "./router";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";

function AppContent() {
  return <RouterProvider router={router} />;
}

function App() {
  return (
    <ReduxProvider>
      <QueryClientProvider>
        <SupabaseProvider>
          <AuthProvider>
            <ConstantsProvider>
              <MenuProvider>
                <TooltipProvider delayDuration={0}>
                  <Toaster />
                  <AppContent />
                </TooltipProvider>
              </MenuProvider>
            </ConstantsProvider>
          </AuthProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

export default App;
