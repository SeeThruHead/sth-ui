export type PaginationRangeItem = number | "dots"

export type PaginationBounds = {
  readonly total: number
  readonly startValue?: number
}

export type PaginationRangeOptions = PaginationBounds & {
  readonly active: number
  readonly siblings?: number
  readonly boundaries?: number
}

const range = (start: number, end: number): ReadonlyArray<number> =>
  Array.from({ length: Math.max(end - start + 1, 0) }, (_, index) => start + index)

export const firstPage = (bounds: PaginationBounds): number => Math.max(Math.trunc(bounds.startValue ?? 1), 1)

export const lastPage = (bounds: PaginationBounds): number => Math.max(Math.trunc(bounds.total), firstPage(bounds))

export const clampPage = (bounds: PaginationBounds, page: number): number =>
  Math.min(Math.max(page, firstPage(bounds)), lastPage(bounds))

export const paginationRange = (options: PaginationRangeOptions): ReadonlyArray<PaginationRangeItem> => {
  const siblings = options.siblings ?? 1
  const boundaries = options.boundaries ?? 1
  const start = firstPage(options)
  const end = lastPage(options)
  const active = options.active
  if (siblings * 2 + 3 + boundaries * 2 >= end - start + 1) return range(start, end)
  const leftSibling = Math.max(active - siblings, start + boundaries - 1)
  const rightSibling = Math.min(active + siblings, end - boundaries)
  const leftDots = leftSibling > start + boundaries + 1
  const rightDots = rightSibling < end - (boundaries + 1)
  if (!leftDots && rightDots)
    return [...range(start, start + siblings * 2 + boundaries + 1), "dots", ...range(end - boundaries + 1, end)]
  if (leftDots && !rightDots)
    return [...range(start, start + boundaries - 1), "dots", ...range(end - (boundaries + 1 + 2 * siblings), end)]

  return [
    ...range(start, start + boundaries - 1),
    "dots",
    ...range(leftSibling, rightSibling),
    "dots",
    ...range(end - boundaries + 1, end)
  ]
}
