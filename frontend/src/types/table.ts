import { ColumnMeta } from "@tanstack/react-table";

export interface TableColumnMeta extends ColumnMeta<unknown, unknown> {
  headerClassName?: string;
  cellClassName?: string;
}

