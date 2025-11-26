import { AiSummary } from "@/components/patients/patientProfile/aiSummary/AiSummary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGetPatientSummary } from "@/hooks/useDoctor";
import { truncateText } from "@/utils/utils";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface SummaryTabProps {
    readonly patientId?: string;
}

export function SummaryTab({ patientId }: Readonly<SummaryTabProps>) {
    const { data, isLoading, isError } = useGetPatientSummary(patientId ?? "", {
        enabled: Boolean(patientId),
    });

    const renderSummaryCard = () => {
        if (isLoading) {
            const skeletonBg = "bg-neutral-200";
            const skeletonHighlight = "bg-neutral-100";

            return (
                <div className="rounded-3xl border border-neutral-100 bg-white p-6 space-y-4">
                    <div className="flex items-center gap-3 text-neutral-700-old">
                        <Spinner className="size-5" />
                        <span className="typo-body-2">Generating patient summary...</span>
                    </div>
                    <Skeleton className={`h-6 w-32 ${skeletonBg} ${skeletonHighlight}`} />
                    <Skeleton className={`h-4 w-full ${skeletonBg} ${skeletonHighlight}`} />
                    <Skeleton className={`h-4 w-3/4 ${skeletonBg} ${skeletonHighlight}`} />
                </div>
            );
        }

        if (isError || data?.error) {
            return (
                <div className="rounded-3xl border border-neutral-100 bg-white p-6">
                    <p className="mt-2 typo-body-2 text-red-600">
                        {data?.message || "Failed to load patient summary"}
                    </p>
                </div>
            );
        }

        if (!data?.data) {
            return (
                <div className="space-y-4 rounded-3xl border border-neutral-100 bg-white p-6">
                    <h3 className="typo-h3 text-neutral-900-old">Summary</h3>
                    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 text-center">
                        <p className="typo-body-2 text-neutral-700-old">
                            AI summary will be available once recent lab results are uploaded.
                        </p>
                    </div>
                </div>
            );
        }

        const summaryData = data.data as { summary: string; followUpPrompts: string[] };

        return (
            <div className="space-y-6 rounded-3xl border border-neutral-100 bg-white p-6 shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]">
                <h3 className="">Summary</h3>

                {/* <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                    >
                        {summaryData.summary}
                    </ReactMarkdown> */}
                <div className="[&_p]:mt-4">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                        {summaryData.summary.replace(/<br\s*\/?>/g, "\n\n").trim()}
                    </ReactMarkdown>
                </div>

                {summaryData.followUpPrompts && summaryData.followUpPrompts.length > 0 && (
                    <div className="space-y-2 md:space-y-3">
                        <p className="typo-body-1 text-neutral-900-old">
                            Follow up prompts
                        </p>
                        <div className="flex flex-wrap gap-1 md:gap-2">
                            {summaryData.followUpPrompts.map((prompt) => (
                                <Tooltip key={`prompt-tooltip-${prompt}`}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="rounded-lg px-2 py-[3px]"
                                        >
                                            <Sparkles className="h-4 w-4 flex-shrink-0 text-[#525252]" />
                                            <span>{truncateText(prompt, 50)}</span>
                                        </Button>
                                    </TooltipTrigger>

                                    <TooltipContent
                                        side="top"
                                        align="center"
                                        className="rounded-lg border border-neutral-200 shadow-lg"
                                        variant="inverted"
                                    >
                                        <span className="typo-body-2 text-neutral-900-old">{prompt}</span>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-4 pb-16 lg:gap-6 lg:pb-24">
            {renderSummaryCard()}
            <div className="sticky bottom-4 w-full lg:bottom-6">
                <AiSummary className="w-full" patientId={patientId} />
            </div>
        </div>
    );
}


