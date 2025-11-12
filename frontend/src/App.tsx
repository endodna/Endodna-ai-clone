import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "./providers/QueryClientProvider";
import { SupabaseProvider } from "./contexts/SupabaseContext";
import { AuthProvider } from "./contexts/AuthContext";
import { MenuProvider } from "./contexts/MenuContext";
import { router } from "./router";
import { Toaster } from "sonner";

function AppContent() {
  return <RouterProvider router={router} />;
}

function App() {
  return (
    <QueryClientProvider>
      <SupabaseProvider>
        <AuthProvider>
          <MenuProvider>
            <Toaster />
            <AppContent />
          </MenuProvider>
        </AuthProvider>
      </SupabaseProvider>
    </QueryClientProvider>
  );
}

export default App;
