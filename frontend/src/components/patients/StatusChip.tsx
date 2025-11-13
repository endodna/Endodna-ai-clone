import { cn } from "@/lib/utils";

type StatusVariant = "neutral" | "warning" | "success" | "danger";

interface StatusChipProps {
  label: string;
  variant?: StatusVariant;
}

export function StatusChip({ label, variant = "neutral" }: StatusChipProps) {
  const stylesByVariant: Record<StatusVariant, string> = {
    neutral: "bg-neutral-100 text-neutral-700",
    warning: "bg-amber-100 text-amber-700",
    success: "bg-emerald-100 text-emerald-700",
    danger: "bg-rose-100 text-rose-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        stylesByVariant[variant],
      )}
    >
      {label}
    </span>
  );
}


