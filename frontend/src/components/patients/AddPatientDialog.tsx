import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePatient } from "@/hooks/useDoctor";
import { useConstants } from "@/contexts/ConstantsContext";
import { cn } from "@/lib/utils";
import { addPatientSchema } from "@/schemas/patient.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { GENDER_OPTIONS } from "../constants/patient";
import { useMemo } from "react";
import { z } from "zod";
import { PatientSuccessDialog } from "./PatientSuccessDialog";
import { PatientUploadRecordsDialog } from "./PatientUploadRecordsDialog";
import { UploadRecordsSuccessDialog } from "./UploadRecordsSuccessDialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  closeAddPatientDialog,
  openSuccessDialog,
  setError,
  clearError,
  setCurrentPatientId,
} from "@/store/features/patient";

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ValidationError {
  field: string;
  message: string;
}

export function AddPatientDialog({ open, onOpenChange }: Readonly<AddPatientDialogProps>) {
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.patientDialog);

  // Get constants from context
  const { constants } = useConstants();

  // Transform API gender response to UI format
  const genderOptions = useMemo(() => {
    if (!constants?.gender || !Array.isArray(constants.gender)) {
      // Fallback to static constants if API fails
      return [...GENDER_OPTIONS];
    }

    return constants.gender
      .filter((g) => g !== "ALL") // Remove "ALL" - not applicable for patient forms
      .map((g) => {
        // Convert enum value to lowercase for value
        const value = g.toLowerCase();
        
        // Format label: "PREFER_NOT_TO_SAY" -> "Prefer Not To Say"
        const label = g
          .split("_")
          .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
          .join(" ");

        return { value, label };
      });
  }, [constants]);

  // Create schema with dynamic gender options
  const schema = useMemo(() => addPatientSchema(genderOptions), [genderOptions]);
  
  // Infer form data type from schema
  type AddPatientFormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
    setError: setFormError,
  } = useForm<AddPatientFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      dateOfBirth: "",
      gender: "",
      phoneNumber: "",
      homePhone: "",
      workPhone: "",
    },
  });

  const genderValue = watch("gender");

  const createPatientMutation = useCreatePatient({
    onSuccess: (response) => {
      if (response.error) {
        // Handle error response
        if (
          response.data &&
          typeof response.data === "object" &&
          "errors" in response.data &&
          Array.isArray((response.data as { errors: ValidationError[] }).errors)
        ) {
          // Validation errors from backend
          const validationErrors = (response.data as { errors: ValidationError[] }).errors;
          for (const err of validationErrors) {
            const fieldName = err.field as keyof AddPatientFormData;
            setFormError(fieldName, {
              type: "server",
              message: err.message,
            });
          }
        } else {
          // Other error messages
          dispatch(setError(response.message || "Failed to create patient"));
        }
      } else {
        // Success - patient created successfully
        reset();
        dispatch(clearError());
        onOpenChange(false);
        dispatch(closeAddPatientDialog());
        dispatch(setCurrentPatientId(response.data?.id ?? null));
        dispatch(openSuccessDialog());
      }
    },
    onError: (error) => {
      dispatch(setError(error.message || "An unexpected error occurred"));
    },
  });

  const onSubmit = async (data: AddPatientFormData) => {
    dispatch(clearError());
    createPatientMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createPatientMutation.isPending) {
      reset();
      dispatch(clearError());
      onOpenChange(false);
      dispatch(closeAddPatientDialog());
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-4 max-w-[375px] md:max-w-[640px] w-full">
        <DialogHeader>
          <DialogTitle>
            <h4 className="text-xl leading-[120%] font-semibold">Add new patient</h4>
          </DialogTitle>
          <DialogDescription className="text-base text-neutral-600 pt-4 md:pt-[26px]">
            Build your patient list by adding individuals under your care. Once added, you’ll be able to assign health goals, and monitor their health progress.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-4">
            {/* First Name */}
            <div className="space-y-1">
              <label htmlFor="firstName" className="text-sm font-medium leading-normal">First name *</label>
              <Input
                {...register("firstName")}
                placeholder="First name"
                className={cn("px-2 md:px-4 py-[6px] md:py-[9.5px]", errors.firstName ? "border-red-500" : "")}
              />
              {errors.firstName && (
                <p className="text-sm font-medium leading-normal text-red-500 md:mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <label htmlFor="lastName" className="text-sm font-medium leading-normal">
                Last name *
              </label>
              <Input
                {...register("lastName")}
                placeholder="Last name"
                className={cn("px-2 md:px-4 py-[6px] md:py-[9.5px]", errors.lastName ? "border-red-500" : "")}
              />
              {errors.lastName && (
                <p className="text-sm font-medium leading-normal text-red-500 md:mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-1">
              <label htmlFor="dateOfBirth" className="text-sm font-medium leading-normal">
                Date of birth *
              </label>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => {
                  // Parse the date string to Date object
                  let selectedDate: Date | undefined;
                  if (field.value) {
                    const parsedDate = new Date(field.value);
                    // Check if date is valid
                    if (!Number.isNaN(parsedDate.getTime())) {
                      selectedDate = parsedDate;
                    }
                  }

                  return (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "px-2 md:px-4 py-[6px] md:py-[9.5px] w-full justify-start text-left font-normal",
                            errors.dateOfBirth ? "border-red-500" : ""
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? (
                            format(selectedDate, "MM/dd/yyyy")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          captionLayout="dropdown"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              const utcDate = new Date(Date.UTC(
                                date.getFullYear(),
                                date.getMonth(),
                                date.getDate()
                              ));

                              const utcTimestamp = utcDate.toISOString();
                              field.onChange(utcTimestamp);
                            } else {
                              field.onChange("");
                            }
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                        />

                      </PopoverContent>
                    </Popover>
                  );
                }}
              />
              {errors.dateOfBirth && (
                <p className="text-sm font-medium leading-normal text-red-500 md:mt-1">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <label htmlFor="gender" className="text-sm font-medium leading-normal">
                Gender *
              </label>
              <Select
                value={genderValue}
                onValueChange={(value) => setValue("gender", value)}
              >
                <SelectTrigger
                  className={cn("px-2 md:px-4 py-[6px] md:py-[9.5px]", errors.gender ? "border-red-500" : "")}
                >
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm font-medium leading-normal text-red-500 md:mt-1">{errors.gender.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium leading-normal">
                Email *
              </label>
              <Input
                {...register("email")}
                type="email"
                placeholder="user@mail.com"
                className={cn("px-2 md:px-4 py-[6px] md:py-[9.5px]", errors.email ? "border-red-500" : "")}
              />
              {errors.email && (
                <p className="text-sm font-medium leading-normal text-red-500 md:mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Mobile Phone */}
            <div className="space-y-1">
              <label htmlFor="phoneNumber" className="text-sm font-medium leading-normal">
                Mobile phone *
              </label>
              <Input
                {...register("phoneNumber")}
                type="tel"
                placeholder="+121201234567"
                className={cn("px-2 md:px-4 py-[6px] md:py-[9.5px]", errors.phoneNumber ? "border-red-500" : "")}
              />
              {errors.phoneNumber && (
                <p className="text-sm font-medium leading-normal text-red-500 md:mt-1">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Home Phone */}
            <div className="space-y-1">
              <label htmlFor="homePhone" className="text-sm font-medium leading-normal">
                Home phone
              </label>
              <Input
                {...register("homePhone")}
                type="tel"
                placeholder="+121201234567"
                className={cn("px-2 md:px-4 py-[6px] md:py-[9.5px]", errors.homePhone ? "border-red-500" : "")}
              />
            </div>

            {/* Work Phone */}
            <div className="space-y-1">
              <label htmlFor="workPhone" className="text-sm font-medium leading-normal">
                Work phone
              </label>
              <Input
                {...register("workPhone")}
                type="tel"
                placeholder="+121201234567"
                className={cn("px-2 md:px-4 py-[6px] md:py-[9.5px]", errors.workPhone ? "border-red-500" : "")}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm font-medium leading-normal text-red-500 md:mt-1">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={createPatientMutation.isPending}
              className="px-4 py-[7.5px] space-x-2 bg-violet-700 hover:bg-violet-400 text-neutral-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createPatientMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span className="text-sm font-medium leading-normal">Add Patient</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <PatientSuccessDialog />
      <PatientUploadRecordsDialog />
      <UploadRecordsSuccessDialog />
    </Dialog>
  );
}

