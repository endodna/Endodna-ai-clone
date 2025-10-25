import { z } from "zod";
import { ReusableForm, FormField } from "@/components/forms";
import { PasswordValidation } from "@/components/forms/PasswordValidation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContainer from "@/components/auth/AuthContainer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const schema = z
    .object({
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(
                /[!@#$%^&*(),.?":{}|<>]/,
                "Password must contain at least one special character",
            ),
        confirmPassword: z
            .string()
            .min(8, "Password must be at least 8 characters"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

const formFields: FormField[] = [
    {
        name: "password",
        type: "password",
        label: "Password",
        placeholder: "Enter your new password",
        required: true,
    },
    {
        name: "confirmPassword",
        type: "password",
        label: "Confirm Password",
        placeholder: "Confirm your new password",
        required: true,
    },
];

export default function ResetPasswordForm() {
    const navigate = useNavigate();
    const auth = useAuth();

    const defaultValues = {
        password: "",
        confirmPassword: "",
    };

    const [fields, setFields] = useState(formFields);
    const [isLoading, setIsLoading] = useState(true);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [success, setSuccess] = useState(false);
    
    useEffect(() => {
        const now = new Date();
        const sessionExpiry = new Date(auth?.session?.expires_at || 0);

        if (auth?.userConfig?.isPasswordSet || sessionExpiry > now) {
            navigate("/dashboard");
        }
        return () => { };
    }, [auth?.session, auth?.userConfig?.isPasswordSet, navigate]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event == "PASSWORD_RECOVERY") {
                setIsLoading(false);
            } else if(event  === "INITIAL_SESSION"){
                if(!session?.user){
                    setIsLoading(false);
                    navigate("/");
                }
            }
            return () => subscription.unsubscribe();
        })
    }, [navigate])

    const handleFieldChange = (fieldName: string, value: any) => {
        if (fieldName === "password") {
            setPassword(value);
        } else if (fieldName === "confirmPassword") {
            setConfirmPassword(value);
        }
    };

    const handleApiError = (_fieldName: string, _errorMessage: string) => {
        setFields((prevFields) =>
            prevFields.map((field) =>
                field.name === _fieldName
                    ? { ...field, customError: _errorMessage }
                    : field,
            ),
        );
    };

    const handleClearAllCustomErrors = () => {
        setFields((prevFields) =>
            prevFields.map((field) => ({
                ...field,
                customError: undefined,
            })),
        );
    };

    const handleSubmit = async (_data: z.infer<typeof schema>) => {
        setIsLoading(true);
        const { error } = await auth.setPassword({
            password: _data.password,
            confirmPassword: _data.confirmPassword,
        });
        setIsLoading(false);

        if (error) {
            handleApiError("confirmPassword", error);
            return;
        }
        setSuccess(true);
    };

    if (success) {
        return (
            <AuthContainer
                header={
                    <div className="flex flex-col gap-4">
                        <div className="text-4xl pt-4 text-neutral-700 font-semibold">
                            Password reset successful
                        </div>
                        <Button
                            onClick={() => navigate("/")}
                            className="ml-auto w-full bg-violet-600 hover:bg-violet-600"
                        >
                            Back to Login
                        </Button>
                    </div>
                }
            />
        );
    }

    // if(!isLoading && !isPasswordRecovery) {
    //     return <Navigate to="/" replace />;
    // }

    return (
        <AuthContainer
            header={
                <div>
                    <div className="text-4xl pt-4 text-neutral-700 font-semibold">
                        Enter new password
                    </div>
                    <div className="text-xs text-neutral-700">
                        <span>Please enter your new password</span>
                    </div>
                </div>
            }
        >
            <div>
                <ReusableForm
                    defaultValues={defaultValues}
                    schema={schema}
                    fields={fields}
                    onSubmit={handleSubmit}
                    submitText="Reset Password"
                    showReset={false}
                    disabled={isLoading}
                    isLoading={isLoading}
                    onFieldChange={handleFieldChange}
                    onClearAllCustomErrors={handleClearAllCustomErrors}
                >
                    <PasswordValidation
                        password={password}
                        confirmPassword={confirmPassword}
                    />
                </ReusableForm>
            </div>
        </AuthContainer>
    );
}
