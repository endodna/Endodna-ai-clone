import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCreateReport } from "@/hooks/useDoctor";
import { toast } from "sonner";

const reportSchema = z.object({
  code: z.string().min(1, "Code is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  genders: z
    .array(z.enum(["MALE", "FEMALE", "ALL"]))
    .min(1, "Please select a gender"),
  price: z
    .number()
    .nonnegative("Price can't be negative")
    .refine((val) => !isNaN(val), { message: "Price must be a number" }),
});

export type ReportFormValues = z.infer<typeof reportSchema>;

type AddReportModalProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

export default function AddReportModal({ open, setOpen }: AddReportModalProps) {
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      code: "",
      title: "",
      description: "",
      genders: ["ALL"],
      price: 0,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = form;

  const createReportMutation = useCreateReport({
    onError: (error) => {
      toast.error(error.message || "Failed to create report");
    },
  });

  const onSubmit = async (data: ReportFormValues) => {
    const payload = {
      code: data.code,
      title: data.title,
      description: data.description ?? null,
      genders: data.genders,
      price: data.price,
    };

    try {
      const response = await createReportMutation.mutateAsync({
        data: payload,
      });

      if (response.error) {
        toast.error(response.message || "Failed to create report");
        return;
      }

      toast.success("Report created successfully");
      reset();
      setOpen(false);
    } catch (err) {
      console.error("Create report failed:", err);
      toast.error((err as Error)?.message || "Failed to create report");
    }
  };

  const genders = watch("genders") as ReportFormValues["genders"];

  const genderLabels: Record<"MALE" | "FEMALE" | "ALL", string> = {
    MALE: "Male",
    FEMALE: "Female",
    ALL: "All",
  };

  const toggleGender = (g: ReportFormValues["genders"][number]) => {
    const current = (
      Array.isArray(genders) ? genders : []
    ) as ReportFormValues["genders"];

    if (g === "ALL") {
      setValue("genders", ["ALL"], { shouldValidate: true, shouldDirty: true });
      return;
    }

    const withoutAll = current.filter(
      (x) => x !== "ALL"
    ) as ReportFormValues["genders"];

    const isSelected = withoutAll.includes(g);
    const next = isSelected
      ? (withoutAll.filter((x) => x !== g) as ReportFormValues["genders"])
      : ([...withoutAll, g] as ReportFormValues["genders"]);

    const final =
      next.length === 0 ? (["ALL"] as ReportFormValues["genders"]) : next;

    setValue("genders", final, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Report</DialogTitle>
          <DialogDescription>
            Fill the details to create a new report
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className="mb-1">Code</Label>
            <Input {...register("code")} placeholder="FEMALE_HORMONE" />
            {errors.code && (
              <p className="mt-1 text-sm text-destructive">
                {errors.code.message}
              </p>
            )}
          </div>

          <div>
            <Label className="mb-1">Title</Label>
            <Input
              {...register("title")}
              placeholder="Comprehensive Female Hormone Health Report"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label className="mb-1">Description</Label>
            <Textarea
              {...register("description")}
              rows={3}
              placeholder="A detailed health analysis report"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label className="mb-1">Gender</Label>

            <div className="flex gap-2">
              {(["MALE", "FEMALE", "ALL"] as const).map((g) => {
                const selected = Array.isArray(genders) && genders.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGender(g)}
                    className={cn(
                      "px-3 py-1 rounded-md border hover:text-primary",
                      selected
                        ? "bg-primary-foreground text-foreground border-foreground"
                        : "bg-transparent text-muted-foreground"
                    )}
                  >
                    {genderLabels[g]}
                  </button>
                );
              })}
            </div>
            {errors.genders && (
              <p className="mt-1 text-sm text-destructive">
                {(errors.genders as any)?.message || "Please select a gender"}
              </p>
            )}
          </div>

          <div>
            <Label className="mb-1">Price</Label>
            <Input
              type="number"
              step="1"
              {...register("price", { valueAsNumber: true })}
              placeholder="99.99"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-destructive">
                {errors.price.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <div className="flex gap-2 justify-end w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
              >
                {" "}
                Create Report
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
