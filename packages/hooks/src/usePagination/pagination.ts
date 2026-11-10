import { clampPage, firstPage, lastPage } from "@sth-ui/core/components/Pagination/model.ts"
import type { PaginationBounds } from "@sth-ui/core/components/Pagination/model.ts"

export { clampPage, firstPage, lastPage, paginationRange } from "@sth-ui/core/components/Pagination/model.ts"
export type {
  PaginationBounds,
  PaginationRangeItem,
  PaginationRangeOptions
} from "@sth-ui/core/components/Pagination/model.ts"

export const nextPage = (bounds: PaginationBounds, active: number): number => clampPage(bounds, active + 1)

export const previousPage = (bounds: PaginationBounds, active: number): number => clampPage(bounds, active - 1)

export const toFirstPage = (bounds: PaginationBounds): number => firstPage(bounds)

export const toLastPage = (bounds: PaginationBounds): number => lastPage(bounds)
