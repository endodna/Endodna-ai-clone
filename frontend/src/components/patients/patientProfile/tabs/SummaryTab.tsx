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

    if (isLoading) {
        return (
            <div className="rounded-3xl border border-neutral-100 bg-white p-6 space-y-4">
                <div className="flex items-center gap-3 text-neutral-700">
                    <Spinner className="size-5" />
                    <span className="text-sm font-medium">Generating patient summary...</span>
                </div>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        );
    }

    if (isError || data?.error) {
        return (
            <div className="rounded-3xl border border-neutral-100 bg-white p-6">
                <p className="mt-2 text-sm text-red-600">
                    {data?.message || "Failed to load patient summary"}
                </p>
            </div>
        );
    }

    if (!data?.data) {
        return (
            <div className="bg-white rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
                <h3 className="text-2xl font-semibold leading-none text-neutral-900">Summary</h3>
                <div className="flex flex-col items-center justify-center bg-neutral-100 border-2 rounded-lg min-h-[120px] md:min-h-[230px]">
                    <p className="text-sm font-normal text-neutral-900 leading-normal text-wrap">AI summary will be available once recent lab results are uploaded.</p>
                </div>
            </div>
        );
    }

    const summaryData = data.data as { summary: string; followUpPrompts: string[] };

    return (
        <div className="rounded-lg bg-white p-6 space-y-6 shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]">
            <h3 className="text-2xl font-semibold leading-none text-neutral-900">Summary</h3>

            {/* Summary Content - Rendered with react-markdown */}
            <div className="">
                <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                    components={{}}
                >
                    {summaryData.summary}
                </ReactMarkdown>
            </div>

            {/* Follow up prompts */}
            {summaryData.followUpPrompts && summaryData.followUpPrompts.length > 0 && (
                <div className="space-y-2 md:space-y-3">
                    <p className="text-base font-semibold text-neutral-900 leading-normal">Follow up prompts</p>
                    <div className="flex flex-wrap gap-1 md:gap-2">
                        {summaryData.followUpPrompts.map((prompt) => (
                            <Tooltip key={`prompt-tooltip-${prompt}`}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="px-2 py-[3px] bg-neutral-100 rounded-lg"
                                    >
                                        <Sparkles className="w-4 h-4 stroke-[2.5px] flex-shrink-0 text-[#525252]" />
                                        <span>{truncateText(prompt, 50)}</span>
                                    </Button>
                                </TooltipTrigger>
                                
                                <TooltipContent side="top" align="center" className="bg-white border border-neutral-200 shadow-lg rounded-lg">
                                    <span className="text-sm text-neutral-900">{prompt}</span>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


