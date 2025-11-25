import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { TableColumnMeta } from "@/types/table";

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationConfig {
  /**
   * Maximum number of pages to show before using ellipsis.
   * If totalPages <= maxVisiblePages, all pages will be shown.
   * @default 7
   */
  maxVisiblePages?: number;
  /**
   * Number of pages to show on each side of the current page when using ellipsis.
   * @default 1
   */
  siblingCount?: number;
  /**
   * Size of pagination buttons. Can be "default", "sm", "lg", or "icon".
   * @default "default"
   */
  buttonSize?: "default" | "sm" | "lg" | "icon";
  /**
   * Custom className for the pagination container (spacing between table and pagination).
   * @default "space-y-4"
   */
  containerClassName?: string;
  /**
   * Custom className for the pagination content wrapper.
   * @default "flex items-center gap-1"
   */
  contentClassName?: string;
  /**
   * Whether to show the pagination component even when there's only 1 page.
   * @default false
   */
  showOnSinglePage?: boolean;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
  cellClassName?: string;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  onRowClick?: (row: TData) => void;
  pagination?: PaginationInfo | null;
  onPageChange?: (page: number) => void;
  paginationConfig?: PaginationConfig;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  headerClassName,
  rowClassName,
  cellClassName,
  enableSorting = false,
  enableFiltering = false,
  onRowClick,
  pagination,
  onPageChange,
  paginationConfig,
}: Readonly<DataTableProps<TData, TValue>>) {
  const {
    maxVisiblePages = 7,
    siblingCount = 1,
    buttonSize = "default",
    containerClassName = "space-y-4",
    contentClassName = "flex items-center gap-1",
    showOnSinglePage = false,
  } = paginationConfig || {};
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: enableFiltering ? setColumnFilters : undefined,
    state: {
      ...(enableSorting ? { sorting } : {}),
      ...(enableFiltering ? { columnFilters } : {}),
    },
  });

  const paginationItems = React.useMemo(() => {
    if (!pagination || (!showOnSinglePage && pagination.totalPages <= 1)) {
      return [];
    }

    if (pagination.totalPages <= maxVisiblePages) {
      return Array.from({ length: pagination.totalPages }, (_, index) => index + 1);
    }

    const pages: (number | string)[] = [];
    const firstPage = 1;
    const lastPage = pagination.totalPages;
    const currentPage = pagination.page;

    pages.push(firstPage);

    const leftSiblingIndex = Math.max(
      currentPage - siblingCount,
      firstPage + 1,
    );
    const rightSiblingIndex = Math.min(
      currentPage + siblingCount,
      lastPage - 1,
    );

    if (leftSiblingIndex > firstPage + 1) {
      pages.push("start-ellipsis");
    }

    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      pages.push(i);
    }

    if (rightSiblingIndex < lastPage - 1) {
      pages.push("end-ellipsis");
    }

    pages.push(lastPage);

    return pages;
  }, [pagination, maxVisiblePages, siblingCount, showOnSinglePage]);

  return (
    <div className={containerClassName}>
      <div className={cn("overflow-auto rounded-2xl", className)}>
        <Table className="border-separate border-spacing-y-2 ">
          <TableHeader className={headerClassName}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "text-neutral-950 typo-body-2  ",
                      (header.column.columnDef.meta as TableColumnMeta)?.headerClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="bg-white">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "border-none",
                    onRowClick && "cursor-pointer hover:bg-neutral-50 transition-colors",
                    rowClassName
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-2 text-neutral-700-old",
                        cellClassName,
                        (cell.column.columnDef.meta as TableColumnMeta)?.cellClassName
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (showOnSinglePage || pagination.totalPages > 1) && onPageChange && (
        <Pagination>
          <PaginationContent className={contentClassName}>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                size={buttonSize}
                onClick={(event) => {
                  event.preventDefault();
                  if (pagination.hasPreviousPage) {
                    onPageChange(pagination.page - 1);
                  }
                }}
                className={pagination.hasPreviousPage ? "" : "pointer-events-none opacity-50"}
              />
            </PaginationItem>

            {paginationItems.map((item, index) => (
              <PaginationItem
                key={typeof item === "number" ? item : `${item}-${index}`}
              >
                {typeof item === "number" ? (
                  <PaginationLink
                    href="#"
                    size={buttonSize}
                    isActive={item === pagination.page}
                    onClick={(event) => {
                      event.preventDefault();
                      if (item !== pagination.page) {
                        onPageChange(item);
                      }
                    }}
                  >
                    {item}
                  </PaginationLink>
                ) : (
                  <PaginationEllipsis />
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                size={buttonSize}
                onClick={(event) => {
                  event.preventDefault();
                  if (pagination.hasNextPage) {
                    onPageChange(pagination.page + 1);
                  }
                }}
                className={cn("typo-body-2   text-neutral-700-old", !pagination.hasNextPage && "!pointer-events-none !opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
