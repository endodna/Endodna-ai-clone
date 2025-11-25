import { useNavigate } from "react-router-dom";
import AuthContainer from "@/components/auth/AuthContainer";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

const getInvitationData = () => {
  try {
    const keys = Object.keys(localStorage);
    const key = keys.find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    if (!key) return { doctorName: "", orgName: "" };

    const data = JSON.parse(localStorage.getItem(key) || "{}");
    const metadata = data?.user?.user_metadata;
    if (!metadata) return { doctorName: "", orgName: "" };

    const firstName = metadata.firstName || "";
    const lastName = metadata.lastName || "";
    const orgName = metadata?.organization?.name || "";

    return {
      doctorName: `${firstName} ${lastName}`.trim(),
      orgName,
    };
  } catch {
    return { doctorName: "", orgName: "" };
  }
};

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const { doctorName, orgName } = getInvitationData();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      if (event === "SIGNED_IN" && session?.user) {
        setIsLoading(false);
      } else if (event === "INITIAL_SESSION") {
        if (!session?.user) {
          setIsLoading(false);
          navigate("/");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, auth]);

  return (
    <AuthContainer
      header={
        <div className="flex flex-col gap-4">
          <div className="typo-h1 pt-4 text-neutral-700-old">
            Welcome!
          </div>
          <div className="typo-body-1 text-neutral-600-old">
            <p>
              {doctorName} has invited you to join{" "}
              <span className="">{orgName}</span>. Here you&apos;ll
              be able to access your medical and labs records easily.
            </p>
          </div>
        </div>
      }
    >
      <div>
        <Button
          disabled={isLoading}
          onClick={() => navigate("/auth/reset-password")}
          className="ml-auto w-full bg-violet-600 hover:bg-violet-600"
        >
          {isLoading ? <Spinner /> : "Create Password"}
        </Button>
      </div>
    </AuthContainer>
  );
}
