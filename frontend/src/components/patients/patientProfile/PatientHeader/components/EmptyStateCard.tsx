interface EmptyStateCardProps {
    readonly message: string;
}

export function EmptyStateCard({ message }: Readonly<EmptyStateCardProps>) {
    return (
        <div className="rounded-3xl border border-dashed border-muted-foreground bg-primary-foreground p-5 text-center typo-body-2 text-foreground">
            {message}
        </div>
    );
}

