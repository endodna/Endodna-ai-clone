import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { ReusableFormProps } from "./types";
import { Spinner } from "@/components/ui/spinner";

export function ReusableForm<T extends z.ZodTypeAny>({
  schema,
  fields,
  onSubmit,
  submitText = "Submit",
  resetText = "Reset",
  showReset = true,
  className = "",
  defaultValues,
  isLoading = false,
  children,
  onFieldChange,
  onClearAllCustomErrors,
  disabled = false,
}: ReusableFormProps<T>) {
  const form = useForm({
    resolver: zodResolver(schema as any),
    defaultValues: (defaultValues || {}) as any,
  });

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleReset = () => {
    form.reset();
  };

  const isFormValid = form.formState.isValid && !disabled;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
      <div className="flex flex-col gap-4">
        {fields.map((field) => (
          <FormFieldRenderer
            key={field.name}
            field={field}
            control={form.control}
            className={field.className}
            onFieldChange={onFieldChange}
            onClearAllCustomErrors={onClearAllCustomErrors}
          />
        ))}

        {children}
      </div>

      <div className="flex justify-between mt-6">
        {showReset && (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
          >
            {resetText}
          </Button>
        )}

        <Button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="ml-auto w-full bg-violet-600 hover:bg-violet-600"
        >
          {isLoading ? <Spinner /> : null}
          {submitText}
        </Button>
      </div>
    </form>
  );
}
