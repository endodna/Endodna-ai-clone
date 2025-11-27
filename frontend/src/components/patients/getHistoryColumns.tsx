import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface HistoryEntry {
    id: string;
    date: string;
    dateLabel: string;
    testosterone: {
        value: string;
        description: string;
    };
    estradiol: {
        value: string;
        description: string;
    };
    vitaminD: string;
    diindolylmethane: string;
}

export const getHistoryColumns = (): ColumnDef<HistoryEntry>[] => [
    {
        id: "date",
        accessorKey: "date",
        header: () => <span className="text-foreground">Date</span>,
        cell: ({ row }) => {
            const entry = row.original;
            return (
                <div className="flex flex-col">
                    <span className="text-foreground typo-body-2 font-medium">
                        {entry.date}
                    </span>
                    <span className="text-foreground typo-body-3 text-neutral-500 mt-0.5">
                        {entry.dateLabel}
                    </span>
                </div>
            );
        },
    },
    {
        id: "testosterone",
        accessorKey: "testosterone",
        header: () => <span className="text-foreground">Testosterone</span>,
        cell: ({ row }) => {
            const entry = row.original;
            return (
                <div className="flex flex-col">
                    <span className="text-foreground typo-body-2">
                        {entry.testosterone.value}
                    </span>
                    <span className="text-foreground typo-body-3 text-neutral-500 mt-0.5">
                        {entry.testosterone.description}
                    </span>
                </div>
            );
        },
    },
    {
        id: "estradiol",
        accessorKey: "estradiol",
        header: () => <span className="text-foreground">Estradiol</span>,
        cell: ({ row }) => {
            const entry = row.original;
            return (
                <div className="flex flex-col">
                    <span className="text-foreground typo-body-2">
                        {entry.estradiol.value}
                    </span>
                    <span className="text-foreground typo-body-3 text-neutral-500 mt-0.5">
                        {entry.estradiol.description}
                    </span>
                </div>
            );
        },
    },
    {
        id: "vitaminD",
        accessorKey: "vitaminD",
        header: () => <span className="text-foreground">Vitamin D</span>,
        cell: ({ row }) => {
            const entry = row.original;
            return (
                <span className="text-foreground typo-body-2">
                    {entry.vitaminD}
                </span>
            );
        },
    },
    {
        id: "diindolylmethane",
        accessorKey: "diindolylmethane",
        header: () => <span className="text-foreground">Diindolylmethane</span>,
        cell: ({ row }) => {
            const entry = row.original;
            return (
                <span className="text-foreground typo-body-2">
                    {entry.diindolylmethane}
                </span>
            );
        },
    },
    {
        id: "actions",
        header: "",
        cell: () => (
            <div className="text-right" onClick={(e) => e.stopPropagation()}>
                <EllipsisVertical className="h-5 w-5 text-neutral-500-old" />
            </div>
        ),
    },
];

