import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    Mic,
    SendHorizontal,
    Stethoscope,
    Upload,
    UserRound,
} from "lucide-react";
import { useRef, useState } from "react";

interface AiSummaryProps {
    readonly className?: string;
    readonly onSubmit?: (payload: { prompt: string; model: string; persona: string }) => void;
}

const MODEL_OPTIONS = [
    {
        id: "gpt-5",
        label: "GPT 5°",
        description: "Best for nuanced clinical reasoning.",
    },
    {
        id: "bios-clinician",
        label: "BIOS Clinician",
        description: "Grounded in EndoDNA clinical guidance.",
    },
    {
        id: "bios-fast",
        label: "BIOS Fast",
        description: "Quicker responses for short answers.",
    },
];

const PERSONA_OPTIONS = [
    {
        id: "patient",
        label: "Patient Specific",
        description: "Simplify language for patient-facing notes.",
        icon: UserRound,
    },
    {
        id: "research",
        label: "Research Based",
        description: "Clinical tone grounded in evidence.",
        icon: Stethoscope,
    },
] as const;

export function AiSummary({ className, onSubmit }: Readonly<AiSummaryProps>) {
    const [prompt, setPrompt] = useState("");
    const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0]);
    const [persona, setPersona] =
        useState<(typeof PERSONA_OPTIONS)[number]>(PERSONA_OPTIONS[0]);
    const uploadInputRef = useRef<HTMLInputElement | null>(null);

    const isSubmitDisabled = prompt.trim().length === 0;

    const handleSubmit = () => {
        if (isSubmitDisabled) {
            return;
        }

        onSubmit?.({
            prompt: prompt.trim(),
            model: selectedModel.id,
            persona: persona.id,
        });

        setPrompt("");
    };

    const handlePersonaSelect = (option: (typeof PERSONA_OPTIONS)[number]) => {
        setPersona(option);
    };

    return (
        <div
            className={cn(
                "rounded-3xl space-y-4 shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]",
                className,
            )}
        >
            <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 md:p-5">
                <Textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Ask BIOS"
                    className="min-h-[80px] resize-none border-none bg-transparent p-0 text-base text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-0"
                />

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div>
                            <input
                                ref={uploadInputRef}
                                type="file"
                                className="hidden"
                                onChange={(event) => {
                                    // Handle file selection if needed later
                                    if (event.target.files?.length) {
                                        // For now we just clear the input to allow re-uploading same file
                                        event.target.value = "";
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-white text-black hover:bg-neutral-100"
                                aria-label="Upload reference files"
                                onClick={() => uploadInputRef.current?.click()}
                            >
                                <Upload className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-1 py-1 shadow-sm">
                            {PERSONA_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const isActive = option.id === persona.id;
                                return (
                                    <Tooltip key={option.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={() => handlePersonaSelect(option)}
                                                className={cn(
                                                    "flex h-7 w-7 items-center justify-center rounded-full border text-xs transition",
                                                    isActive
                                                        ? "border-violet-500 bg-white text-violet-600 shadow-[0_4px_12px_rgba(109,62,245,0.25)]"
                                                        : "border-transparent bg-transparent text-neutral-500 hover:border-neutral-200",
                                                )}
                                                aria-label={option.label}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            align="center"
                                            className="w-48 rounded-xl border border-neutral-200 bg-white px-4 py-4 text-xs text-neutral-900 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
                                        >
                                            <p className="text-sm font-semibold text-neutral-900">{option.label}</p>
                                            <p className="mt-1 text-[11px] font-normal text-neutral-500">
                                                {option.description}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="gap-2 rounded-full border border-neutral-200 bg-white px-4 py-[6px] text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                                >
                                    <ChevronDown className="h-4 w-4 text-black" />
                                    {selectedModel.label}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                                {MODEL_OPTIONS.map((option) => (
                                    <DropdownMenuItem
                                        key={option.id}
                                        className="flex flex-col items-start gap-1 py-2"
                                        onClick={() => setSelectedModel(option)}
                                    >
                                        <span className="text-sm font-medium text-neutral-900">
                                            {option.label}
                                        </span>
                                        <span className="text-xs text-neutral-500">
                                            {option.description}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="ms-auto flex flex-1 flex-wrap items-center justify-end gap-2">
                        

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full bg-white text-black hover:bg-neutral-100"
                            aria-label="Record voice note"
                        >
                            <Mic className="h-5 w-5" />
                        </Button>

                        <Button
                            type="button"
                            className="h-10 w-10 gap-2 bg-violet-700 px-5 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isSubmitDisabled}
                            onClick={handleSubmit}
                        >
                            <SendHorizontal className="h-4 w-4 rotate-[-45deg]" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}


