export interface PageParams {
  page: number;
  pageSize: number;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Page<T> {
  items: T[];
  total: number;
}

export function toPageMeta(
  page: number,
  pageSize: number,
  total: number,
): PageMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function toSkip(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
