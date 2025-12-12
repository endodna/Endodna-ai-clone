import { Button } from "@/components/ui/button";

interface ErrorStateProps {
    readonly message: string;
    readonly onRetry: () => void;
}

export function ErrorState({ message, onRetry }: Readonly<ErrorStateProps>) {
    return (
        <div className="rounded-3xl border border-destructive bg-primary-foreground p-5 text-center">
            <p className="typo-body-2 text-destructive">{message}</p>
            <Button size="sm" className="mt-4" onClick={onRetry}>
                <span className="text-primary-foreground">Try again</span>
            </Button>
        </div>
    );
}

