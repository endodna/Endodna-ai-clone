import { Skeleton } from "@/components/ui/skeleton";

export function PatientHeaderSkeleton() {
    const skeletonBg = "bg-muted-foreground/10";
    const skeletonHighlight = "bg-muted-foreground/20";

    return (
        <div className="rounded-3xl border border-muted-foreground bg-primary-foreground divide-y divide-muted-foreground/40">
            {/* Info block */}
            <div className="space-y-6 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
                <div className="flex items-center gap-4">
                    <Skeleton className={`h-16 w-16 rounded-full ${skeletonBg} ${skeletonHighlight}`} />
                    <div className="flex-1 space-y-2">
                        <Skeleton className={`h-6 w-40 ${skeletonBg} ${skeletonHighlight}`} />
                        <Skeleton className={`h-4 w-24 ${skeletonBg} ${skeletonHighlight}`} />
                    </div>
                </div>
                <div className="space-y-4 pt-4">
                    {[0, 1, 2].map((index) => (
                        <div key={`info-${index}`} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton className={`h-6 w-6 rounded-full ${skeletonBg} ${skeletonHighlight}`} />
                                <Skeleton className={`h-4 w-24 ${skeletonBg} ${skeletonHighlight}`} />
                            </div>
                            <Skeleton className={`h-4 w-24 ${skeletonBg} ${skeletonHighlight}`} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Alerts */}
            <div className="space-y-3 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
                <div className="flex items-center justify-between">
                    <Skeleton className={`h-5 w-24 ${skeletonBg} ${skeletonHighlight}`} />
                    <Skeleton className={`h-4 w-12 ${skeletonBg} ${skeletonHighlight}`} />
                </div>
                <div className="space-y-2">
                    {[0, 1].map((index) => (
                        <Skeleton key={`alert-${index}`} className={`h-4 w-full ${skeletonBg} ${skeletonHighlight}`} />
                    ))}
                </div>
            </div>

            {/* Allergies */}
            <div className="space-y-2 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
                <Skeleton className={`h-5 w-24 ${skeletonBg} ${skeletonHighlight}`} />
                <Skeleton className={`h-4 w-32 ${skeletonBg} ${skeletonHighlight}`} />
            </div>
        </div>
    );
}

