import { useNavigate } from "react-router-dom";
import AuthContainer from "@/components/auth/AuthContainer";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

export default function AcceptInvitation() {
    const navigate = useNavigate();
    const auth = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session);
            if (event === "SIGNED_IN" && session?.user) {
                setIsLoading(false); 
            } 
            else if(event  === "INITIAL_SESSION"){
                if(!session?.user){
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
                    <div className="text-4xl pt-4 text-neutral-700 font-semibold">
                        Welcome!
                    </div>
                    <div className="text-xs text-neutral-700">
                        <p>
                        To complete your account setup, please click the button below to create your password.
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
