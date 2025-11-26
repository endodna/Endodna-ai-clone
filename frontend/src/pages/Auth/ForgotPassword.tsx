import { z } from "zod";
import { ReusableForm, FormField } from "@/components/forms";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContainer from "@/components/auth/AuthContainer";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "lucide-react";

const loginSchema = z.object({
  email: z.email(
    "Please enter a valid email format (e.g. yourname@example.com)",
  ),
});

const formFields: FormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "user@mail.com",
    required: true,
  },
];

export default function LoginForm() {
  const navigate = useNavigate();
  const auth = useAuth();

  const defaultValues = {
    email: "",
  };

  const [fields, setFields] = useState(formFields);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleApiError = (fieldName: string, errorMessage: string) => {
    setFields((prevFields) =>
      prevFields.map((field) =>
        field.name === fieldName
          ? { ...field, customError: errorMessage }
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

  const handleSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    const { error } = await auth.forgotPassword({
      email: data.email,
    });
    setIsLoading(false);

    if (error) {
      handleApiError("email", error);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <AuthContainer
        header={
          <div className="flex flex-col gap-4">
            <div className="pt-4 text-neutral-700-old ">
              Instructions Sent!
            </div>
            <div className="text-neutral-700-old">
              <p>
                You’ll receive an email shortly to help you create a new
                password.
              </p>
              <p>Don’t forget to check your spam folder.</p>
            </div>
          </div>
        }
      >
        <div>
          <Button
            onClick={() => navigate("/")}
          >
            Back to Login
          </Button>
        </div>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer
      header={
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ChevronLeftIcon className="w-4 h-auto text-xs text-violet-600" />
            <Link to={"/"} className="text-violet-600">
              Login
            </Link>
          </div>
          <div>
            <div className=" pt-4 text-neutral-700-old ">
              Forgot Password
            </div>
            <div className="text-xs text-neutral-700-old">
              Please enter your email to reset your password
            </div>
          </div>
        </div>
      }
    >
      <div>
        <ReusableForm
          defaultValues={defaultValues}
          schema={loginSchema}
          fields={fields}
          onSubmit={handleSubmit}
          submitText="Send Reset Link"
          showReset={false}
          isLoading={isLoading}
          onClearAllCustomErrors={handleClearAllCustomErrors}
        />
      </div>
    </AuthContainer>
  );
}
