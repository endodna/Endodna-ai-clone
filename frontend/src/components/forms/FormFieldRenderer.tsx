import { Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import { FormFieldProps } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export function FormFieldRenderer({
  field,
  control,
  className,
  onFieldChange,
  onClearAllCustomErrors,
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [customError, setCustomError] = useState(field.customError);

  useEffect(() => {
    setCustomError(field.customError || "");
  }, [field.customError]);

  const clearCustomError = () => {
    if (customError) {
      setCustomError("");
    }
    onClearAllCustomErrors?.();
  };

  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField, fieldState }) => {
        const renderField = () => {
          switch (field.type) {
            case "text":
            case "email":
            case "number":
              return (
                <Input
                  {...controllerField}
                  type={field.type}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  className={`${className} placeholder:text-xs`}
                  aria-invalid={fieldState.invalid}
                  onFocus={clearCustomError}
                  onChange={(e) => {
                    controllerField.onChange(e);
                    clearCustomError();
                    onFieldChange?.(field.name, e.target.value);
                  }}
                />
              );

            case "password":
              return (
                <div className="relative">
                  <Input
                    {...controllerField}
                    type={showPassword ? "text" : "password"}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    className={`${className} pr-10 placeholder:text-xs`}
                    aria-invalid={fieldState.invalid}
                    onFocus={clearCustomError}
                    onChange={(e) => {
                      controllerField.onChange(e);
                      clearCustomError();
                      onFieldChange?.(field.name, e.target.value);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={field.disabled}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              );

            case "textarea":
              return (
                <Textarea
                  {...controllerField}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  className={`${className} placeholder:text-xs`}
                  aria-invalid={fieldState.invalid}
                  rows={4}
                  onFocus={clearCustomError}
                  onChange={(e) => {
                    controllerField.onChange(e);
                    clearCustomError();
                    onFieldChange?.(field.name, e.target.value);
                  }}
                />
              );

            case "select":
              return (
                <Select
                  {...controllerField}
                  disabled={field.disabled}
                  onValueChange={(value) => {
                    controllerField.onChange(value);
                    clearCustomError();
                  }}
                  onOpenChange={(open) => {
                    if (open) {
                      clearCustomError();
                    }
                  }}
                >
                  <SelectTrigger
                    className={className}
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue
                      placeholder={field.placeholder || "Select an option"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={String(option.value)}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );

            case "checkbox":
              return (
                <div
                  className="flex items-center space-x-2"
                  onClick={clearCustomError}
                >
                  <Checkbox
                    {...controllerField}
                    checked={controllerField.value}
                    onCheckedChange={(checked) => {
                      controllerField.onChange(checked);
                      clearCustomError();
                    }}
                    disabled={field.disabled}
                    aria-invalid={fieldState.invalid}
                  />
                  <Label className="  leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {field.label}
                  </Label>
                </div>
              );

            case "radio":
              return (
                <RadioGroup
                  {...controllerField}
                  disabled={field.disabled}
                  aria-invalid={fieldState.invalid}
                  onValueChange={(value) => {
                    controllerField.onChange(value);
                    clearCustomError();
                  }}
                  onClick={clearCustomError}
                >
                  {field.options?.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={String(option.value)}
                        id={`${field.name}-${option.value}`}
                        disabled={option.disabled}
                      />
                      <Label
                        htmlFor={`${field.name}-${option.value}`}
                        className="  leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              );

            default:
              return (
                <Input
                  {...controllerField}
                  type="text"
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  className={`${className} placeholder:text-xs`}
                  aria-invalid={fieldState.invalid}
                />
              );
          }
        };

        return (
          <div className="space-y-2">
            {field.type !== "checkbox" && (
              <Label htmlFor={field.name} className="text-xs ">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}

            <div className={field.className}>{renderField()}</div>

            {field.description && (
              <p className=" text-muted-foreground">
                {field.description}
              </p>
            )}

            {fieldState.invalid && fieldState.error && (
              <p className="text-xs  text-red-500">
                {fieldState.error.message}
              </p>
            )}
            {customError && (
              <p className="text-xs  text-red-500">{customError}</p>
            )}
          </div>
        );
      }}
    />
  );
}
