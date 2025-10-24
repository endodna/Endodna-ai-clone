import { z } from "zod";
import { ReusableForm, FormField } from "@/components/forms";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContainer from "@/components/auth/AuthContainer";

const loginSchema = z.object({
  email: z.email(
    "Please enter a valid email format (e.g. yourname@example.com)",
  ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginFormFields: FormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "user@mail.com",
    required: true,
  },
  {
    name: "password",
    type: "password",
    label: "Password",
    placeholder: "Enter your password",
    required: true,
  },
];

export default function LoginForm() {
  const navigate = useNavigate();
  const auth = useAuth();

  const defaultValues = {
    email: "",
    password: "",
  };

  const [fields, setFields] = useState(loginFormFields);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    const { error, data: response } = await auth.signIn({
      email: data.email,
      password: data.password,
    });
    setIsLoading(false);

    if (error) {
      handleApiError("password", error);
      return;
    }

    if (response.user?.id) {
      navigate("/dashboard");
    }
  };

  return (
    <AuthContainer
      header={
        <div>
          <div className="text-4xl pt-4 text-neutral-700 font-semibold">
            Welcome Back
          </div>
          <div className="text-xs text-neutral-700">
            <span>
              Don't have an account?
              <a href="#" className="ml-1 text-violet-500">
                Create an account
              </a>
            </span>
          </div>
        </div>
      }
    >
      <div>
        <ReusableForm
          defaultValues={defaultValues}
          schema={loginSchema}
          fields={fields}
          onSubmit={handleLogin}
          submitText="Login"
          showReset={false}
          isLoading={isLoading}
          onClearAllCustomErrors={handleClearAllCustomErrors}
        />
        <div className="text-xs text-neutral-700 mt-4">
          <span>Forgot your login details?</span>{" "}
          <Link to={"/auth/forgot-password"} className="text-violet-600">
            Reset password
          </Link>
        </div>
      </div>
    </AuthContainer>
  );
}
