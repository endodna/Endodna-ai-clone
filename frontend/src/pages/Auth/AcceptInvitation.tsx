import { useNavigate } from "react-router-dom";
import AuthContainer from "@/components/auth/AuthContainer";
import { Button } from "@/components/ui/button";


export default function AcceptInvitation() {
    const navigate = useNavigate();
    // const [isLoading, setIsLoading] = useState(true);

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
                    onClick={() => navigate("/auth/reset-password")}
                    className="ml-auto w-full bg-violet-600 hover:bg-violet-600"
                >
                    Create Password
                </Button>
            </div>
        </AuthContainer>
    );
}
