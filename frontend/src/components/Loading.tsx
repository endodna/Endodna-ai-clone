import { Loader2 } from "lucide-react";

export function Loading({ loadingMessage = "Loading..." }: { loadingMessage?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
        <p className="text-neutral-500 text-sm">{loadingMessage}</p>
    </div>
  );
}