import { z } from "zod";
import { ReactNode } from "react";
import { Control } from "react-hook-form";

export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "select"
  | "textarea"
  | "checkbox"
  | "radio";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormField {
  name: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  options?: SelectOption[];
  validation?: z.ZodTypeAny;
  className?: string;
  defaultValue?: any;
  customError?: string;
}

export interface ReusableFormProps<T extends z.ZodTypeAny> {
  schema: T;
  fields: FormField[];
  onSubmit: (data: z.infer<T>) => void | Promise<void>;
  submitText?: string;
  resetText?: string;
  showReset?: boolean;
  className?: string;
  defaultValues?: Partial<z.infer<T>>;
  isLoading?: boolean;
  children?: ReactNode;
  onFieldChange?: (fieldName: string, value: any) => void;
  onClearAllCustomErrors?: () => void;
  disabled?: boolean;
}

export interface FormFieldProps {
  field: FormField;
  control: Control<any>;
  className?: string;
  onFieldChange?: (fieldName: string, value: any) => void;
  onClearAllCustomErrors?: () => void;
}
