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
import { useUpdatePatientInfo, useGetPatientById } from "@/hooks/useDoctor";
import { useConstants } from "@/contexts/ConstantsContext";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { GENDER_OPTIONS } from "../constants/patient";
import { useMemo, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";

interface EditPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string | null;
}

// Schema for editing patient - only fields supported by backend
const editPatientSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodType: z.string().optional(),
  weight: z.number().positive("Weight must be a positive number").optional(),
  height: z.number().positive("Height must be a positive number").optional(),
}).refine(
  (data) => {
    return (
      data.dateOfBirth !== undefined ||
      data.gender !== undefined ||
      data.bloodType !== undefined ||
      data.weight !== undefined ||
      data.height !== undefined
    );
  },
  {
    message: "At least one field must be provided for update",
  }
);

type EditPatientFormData = z.infer<typeof editPatientSchema>;

export function EditPatientDialog({ open, onOpenChange, patientId }: Readonly<EditPatientDialogProps>) {
  const { constants } = useConstants();

  // Fetch patient data
  const { data: patientResponse } = useGetPatientById(patientId ?? "", {
    enabled: Boolean(patientId) && open,
  });
  const patient = patientResponse?.data ?? null;

  // Transform API gender response to UI format
  const genderOptions = useMemo(() => {
    if (!constants?.gender || !Array.isArray(constants.gender)) {
      return [...GENDER_OPTIONS];
    }

    return constants.gender
      .filter((g) => g !== "ALL")
      .map((g) => {
        const value = g.toLowerCase();
        const label = g
          .split("_")
          .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
          .join(" ");
        return { value, label };
      });
  }, [constants]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<EditPatientFormData>({
    resolver: zodResolver(editPatientSchema),
    defaultValues: {
      dateOfBirth: "",
      gender: "",
      bloodType: "",
      weight: undefined,
      height: undefined,
    },
  });

  // Reset form when patient data loads
  useEffect(() => {
    if (patient && open) {
      let dob = "";
      if (patient.dateOfBirth) {
        if (typeof patient.dateOfBirth === 'string') {
          dob = patient.dateOfBirth;
        } else {
          dob = new Date(patient.dateOfBirth).toISOString();
        }
      }
      
      reset({
        dateOfBirth: dob,
        gender: patient.gender?.toLowerCase() || "",
        bloodType: patient.bloodType || "",
        weight: patient.patientInfo?.weight ?? undefined,
        height: patient.patientInfo?.height ?? undefined,
      });
    }
  }, [patient, open, reset]);

  const genderValue = watch("gender");

  const updatePatientMutation = useUpdatePatientInfo({
    onError: (error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });

  const onSubmit = async (data: EditPatientFormData) => {
    if (!patientId) return;
    
    // Only send fields that have values
    const updateData: Record<string, any> = {};
    if (data.dateOfBirth) updateData.dateOfBirth = data.dateOfBirth;
    if (data.gender) updateData.gender = data.gender;
    if (data.bloodType) updateData.bloodType = data.bloodType;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.height !== undefined) updateData.height = data.height;

    try {
      const response = await updatePatientMutation.mutateAsync({
        patientId,
        data: updateData,
      });
      
      if (response.error) {
        toast.error(response.message || "Failed to update patient");
      } else {
        toast.success("Patient updated successfully");
        reset();
        onOpenChange(false);
      }
    } catch {
      // Error is already handled by onError callback
    }
  };

  const handleClose = () => {
    if (!updatePatientMutation.isPending) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-4 max-w-[375px] md:max-w-[640px] w-full">
        <DialogHeader>
          <DialogTitle>
            <h4>Edit patient</h4>
          </DialogTitle>
          <DialogDescription className="pt-4 md:pt-[26px]">
            Update patient information. Leave fields unchanged if you don't want to modify them.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-4">
            {/* Date of Birth */}
            <div className="space-y-1">
              <label htmlFor="dateOfBirth" className="typo-body-2">
                Date of birth
              </label>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => {
                  let selectedDate: Date | undefined;
                  if (field.value) {
                    const parsedDate = new Date(field.value);
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
                            "px-2 md:px-4 py-[6px] md:py-[9.5px] w-full justify-start text-left",
                            errors.dateOfBirth ? "border-destructive" : ""
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
                <p className="typo-body-2 text-destructive md:mt-1">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <label htmlFor="gender" className="typo-body-2">
                Gender
              </label>
              <Select
                value={genderValue}
                onValueChange={(value) => setValue("gender", value)}
              >
                <SelectTrigger
                  className={cn("px-2 md:px-4 py-[6px] md:py-[9.5px]", errors.gender ? "border-destructive" : "")}
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
                <p className="typo-body-2 text-destructive md:mt-1">{errors.gender.message}</p>
              )}
            </div>

            {/* Blood Type */}
            <div className="space-y-1">
              <label htmlFor="bloodType" className="typo-body-2">
                Blood type
              </label>
              <Input
                {...register("bloodType")}
                placeholder="e.g., A+, O-"
                className={cn("px-2 md:px-4 py-[6px] md:py-[9.5px]", errors.bloodType ? "border-destructive" : "")}
              />
              {errors.bloodType && (
                <p className="typo-body-2 text-destructive md:mt-1">{errors.bloodType.message}</p>
              )}
            </div>

            {/* Weight */}
            <div className="space-y-1">
              <label htmlFor="weight" className="typo-body-2">
                Weight (kg)
              </label>
              <Input
                {...register("weight", { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder="Weight in kg"
                className={cn("px-2 md:px-4 py-[6px] md:py-[9.5px]", errors.weight ? "border-destructive" : "")}
              />
              {errors.weight && (
                <p className="typo-body-2 text-destructive md:mt-1">
                  {errors.weight.message}
                </p>
              )}
            </div>

            {/* Height */}
            <div className="space-y-1">
              <label htmlFor="height" className="typo-body-2">
                Height (cm)
              </label>
              <Input
                {...register("height", { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder="Height in cm"
                className={cn("px-2 md:px-4 py-[6px] md:py-[9.5px]", errors.height ? "border-destructive" : "")}
              />
              {errors.height && (
                <p className="typo-body-2 text-destructive md:mt-1">
                  {errors.height.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updatePatientMutation.isPending}
              className="px-4 py-[7.5px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updatePatientMutation.isPending}
              className="px-4 py-[7.5px] space-x-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatePatientMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span className="typo-body-2 text-primary-foreground">Update Patient</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

