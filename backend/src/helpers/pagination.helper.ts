import { logger } from "./logger.helper";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
  defaultLimit?: number;
  traceId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationQueryParams {
  page?: string | number;
  limit?: string | number;
  search?: string;
}

export class PaginationHelper {
  static parseQueryParams(
    query: PaginationQueryParams,
    options: PaginationOptions = {},
  ): { page: number; limit: number; skip: number; search?: string } {
    const { defaultLimit = 10, maxLimit = 100 } = options;

    let page = 1;
    let limit = defaultLimit;

    if (query.page !== undefined) {
      const parsedPage =
        typeof query.page === "string" ? parseInt(query.page, 10) : query.page;
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage;
      }
    }

    if (query.limit !== undefined) {
      const parsedLimit =
        typeof query.limit === "string"
          ? parseInt(query.limit, 10)
          : query.limit;
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, maxLimit);
      }
    }

    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  static async paginate<T, TFindManyArgs>(
    modelDelegate: {
      findMany: (args: TFindManyArgs) => Promise<T[]>;
      count: (args?: any) => Promise<number>;
    },
    findManyArgs: TFindManyArgs = {} as TFindManyArgs,
    paginationOptions: PaginationOptions = {},
  ): Promise<PaginatedResult<T>> {
    const { traceId } = paginationOptions;
    try {
      const {
        defaultLimit = 10,
        maxLimit = 100,
        page: providedPage,
        limit: providedLimit,
      } = paginationOptions;

      const page = providedPage && providedPage > 0 ? providedPage : 1;
      const limit =
        providedLimit && providedLimit > 0
          ? Math.min(providedLimit, maxLimit)
          : defaultLimit;
      const skip = (page - 1) * limit;

      const countArgs =
        findManyArgs &&
          typeof findManyArgs === "object" &&
          "where" in findManyArgs
          ? { where: (findManyArgs as any).where }
          : undefined;

      const [data, total] = await Promise.all([
        modelDelegate.findMany({
          ...findManyArgs,
          skip,
          take: limit,
        } as TFindManyArgs),
        modelDelegate.count(countArgs),
      ]);

      const totalPages = Math.ceil(total / limit);

      const meta: PaginationMeta = {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };

      return {
        data,
        meta,
      };
    } catch (error) {
      logger.error("Error in pagination", {
        traceId,
        error: error,
        method: "PaginationHelper.paginate",
      });
      throw error;
    }
  }

  static createMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

export default PaginationHelper;
