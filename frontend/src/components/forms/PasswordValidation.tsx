import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

interface PasswordValidationProps {
  password: string;
  confirmPassword?: string;
}

interface ValidationRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const validationRules: ValidationRule[] = [
  {
    id: "minLength",
    label: "Minimum of 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "At least 1 uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "At least 1 lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "At least 1 number",
    test: (password) => /\d/.test(password),
  },
  {
    id: "special",
    label: "At least 1 special character",
    test: (password) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>]/.test(password),
  },
];

export function PasswordValidation({
  password,
  confirmPassword,
}: PasswordValidationProps) {
  const [validations, setValidations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newValidations: Record<string, boolean> = {};

    validationRules.forEach((rule) => {
      newValidations[rule.id] = rule.test(password);
    });

    // Add password match validation if confirmPassword is provided
    if (confirmPassword !== undefined) {
      newValidations["match"] =
        password === confirmPassword && password.length > 0;
    }

    setValidations(newValidations);
  }, [password, confirmPassword]);


  return (
    <div className="mt-2 space-y-1">
      {validationRules.map((rule) => (
        <div key={rule.id} className="flex items-center space-x-2">
          {validations[rule.id] ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <X className="h-3 w-3 text-gray-400" />
          )}
          <span
            className={`text-xs ${validations[rule.id] ? "text-green-600" : "text-gray-500"}`}
          >
            {rule.label}
          </span>
        </div>
      ))}

      {confirmPassword !== undefined && (
        <div className="flex items-center space-x-2">
          {validations["match"] ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <X className="h-3 w-3 text-gray-400" />
          )}
          <span
            className={`text-xs ${validations["match"] ? "text-green-600" : "text-gray-500"}`}
          >
            Passwords must match
          </span>
        </div>
      )}
    </div>
  );
}
