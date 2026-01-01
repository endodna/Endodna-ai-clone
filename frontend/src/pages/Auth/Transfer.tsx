import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { authApi } from "@/handlers/api/api";
import { useAuth } from "@/contexts/AuthContext";
import AuthContainer from "@/components/auth/AuthContainer";
import { Loading } from "@/components/Loading";
import { buildIdUrl } from "@/utils/subdomain";

export default function Transfer() {
  const { getProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasProcessed = useRef(false);

//   useEffect(() => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const code = urlParams.get("code");
//     const state = urlParams.get("state");

//     if (!code || !state) {
//       window.location.href = buildIdUrl("/") + "?logout=true";
//       return;
//     }
//   }, []);

  useEffect(() => {
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    const handleTransfer = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");

        let transferCode = code;
        let transferState = state;

        if (!transferCode || !transferState) {
          transferCode = sessionStorage.getItem("transfer_code");
          transferState = sessionStorage.getItem("transfer_state");

          if (!transferCode || !transferState) {
            setError("Transfer code and state are required");
            setLoading(false);
            return;
          }
        } else {
          sessionStorage.setItem("transfer_code", transferCode);
          sessionStorage.setItem("transfer_state", transferState);
          window.history.replaceState({}, "", "/auth/transfer");
        }

        const response = await authApi.exchangeTransferCode(transferCode, transferState);

        sessionStorage.removeItem("transfer_code");
        sessionStorage.removeItem("transfer_state");
        
        if (response.error || !response.data) {
          setError(response.message || "Failed to exchange transfer code");
          setLoading(false);
          return;
        }

        const { access_token, refresh_token } = response.data;

        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        console.log("sessionError", sessionError);
        if (sessionError) {
          setError("Failed to set session");
          setLoading(false);
          return;
        }

        await getProfile();

        window.location.replace("/dashboard");
      } catch (err: any) {
        setError(err.message || "An error occurred during transfer");
        setLoading(false);
      }
    };

    handleTransfer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <AuthContainer header={<></>}>
        <Loading />
      </AuthContainer>
    );
  }
  console.log("error", error);

  if (error) {
    return (
      <AuthContainer
        header={<></>}
      >
        <div className="text-center flex flex-col items-center justify-center gap-4">
            <h2>Unable to complete login process!</h2>
          <button
            onClick={() => window.location.href = buildIdUrl("/")}
            className="px-4 py-2 mt-4 bg-primary text-primary-foreground rounded"
          >
            Return to Login
          </button>
        </div>
      </AuthContainer>
    );
  }

  return null;
}

