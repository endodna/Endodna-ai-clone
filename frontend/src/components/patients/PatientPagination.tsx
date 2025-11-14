import { useMemo } from "react";
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

interface PatientPaginationProps {
  pagination?: PatientsApiResponse["pagination"] | null;
  onPageChange: (page: number) => void;
}

export function PatientPagination({
  pagination,
  onPageChange,
}: PatientPaginationProps) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const { page: currentPage, totalPages, hasPreviousPage, hasNextPage } =
    pagination;

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: (number | string)[] = [];
    const siblingCount = 1;
    const firstPage = 1;
    const lastPage = totalPages;

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
  }, [currentPage, totalPages]);

  return (
    <Pagination>
      <PaginationContent className="flex items-center gap-1">
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(event) => {
              event.preventDefault();
              if (hasPreviousPage) {
                onPageChange(currentPage - 1);
              }
            }}
            className={!hasPreviousPage ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {paginationItems.map((item, index) => (
          <PaginationItem
            key={typeof item === "number" ? item : `${item}-${index}`}
          >
            {typeof item === "number" ? (
              <PaginationLink
                href="#"
                size="default"
                isActive={item === currentPage}
                onClick={(event) => {
                  event.preventDefault();
                  if (item !== currentPage) {
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
            onClick={(event) => {
              event.preventDefault();
              if (hasNextPage) {
                onPageChange(currentPage + 1);
              }
            }}
            className={cn("text-sm font-medium leading-normal text-neutral-700", !hasNextPage && "!pointer-events-none !opacity-50")}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}


