import { Schema } from "effect"

export type CellValue = string | number | boolean | ReadonlyArray<string> | null | undefined

export type FilterOption = { readonly value: string; readonly label: string }

export type FilterKind =
  | { readonly _tag: "Text" }
  | { readonly _tag: "Options"; readonly options: ReadonlyArray<FilterOption> }
  | { readonly _tag: "NumberRange" }
  | { readonly _tag: "DateRange" }
  | { readonly _tag: "Boolean" }

export const TextFilter = Schema.TaggedStruct("Text", { query: Schema.String })

export const OptionsFilter = Schema.TaggedStruct("Options", { values: Schema.Array(Schema.String) })

export const NumberRangeFilter = Schema.TaggedStruct("NumberRange", {
  min: Schema.NullOr(Schema.Finite),
  max: Schema.NullOr(Schema.Finite)
})

export const DateRangeFilter = Schema.TaggedStruct("DateRange", {
  from: Schema.NullOr(Schema.String),
  to: Schema.NullOr(Schema.String)
})

export const BooleanFilter = Schema.TaggedStruct("Boolean", { value: Schema.Boolean })

export const FilterValue = Schema.Union([TextFilter, OptionsFilter, NumberRangeFilter, DateRangeFilter, BooleanFilter])
export type FilterValue = typeof FilterValue.Type

export const SortDirection = Schema.Literals(["asc", "desc"])
export type SortDirection = typeof SortDirection.Type

export const Sort = Schema.Struct({ column: Schema.String, direction: SortDirection })
export type Sort = typeof Sort.Type

export type ColumnData<Row> = {
  readonly id: string
  readonly value?: (row: Row) => CellValue
  readonly sortable?: boolean
  readonly filter?: FilterKind
}

export type Query = {
  readonly sort: Sort | null
  readonly search: string
  readonly filters: Readonly<Record<string, FilterValue>>
}

export type SearchText<Row> = (row: Row) => string

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })

const folded = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

const isList = (value: CellValue): value is ReadonlyArray<string> => Array.isArray(value)

export const cellText = (value: CellValue): string => {
  if (value === null || value === undefined) return ""
  if (isList(value)) return value.join(", ")

  return String(value)
}

const asList = (value: CellValue): ReadonlyArray<string> => {
  if (value === null || value === undefined) return []
  if (isList(value)) return value

  return [String(value)]
}

const isEmpty = (value: CellValue): boolean => cellText(value) === ""

const dayOf = (value: CellValue): string | null => {
  if (typeof value === "string") return value === "" ? null : value.slice(0, 10)

  return null
}

const within = <A extends string | number>(value: A, low: A | null, high: A | null): boolean => {
  if (low !== null && value < low) return false

  return high === null || value <= high
}

const inNumberRange = (value: CellValue, min: number | null, max: number | null): boolean =>
  typeof value === "number" && within(value, min, max)

const inDateRange = (value: CellValue, from: string | null, to: string | null): boolean => {
  const day = dayOf(value)

  return day !== null && within(day, from, to)
}

export const filterIsActive = (filter: FilterValue): boolean => {
  switch (filter._tag) {
    case "Text":
      return filter.query.trim() !== ""
    case "Options":
      return filter.values.length > 0
    case "NumberRange":
      return filter.min !== null || filter.max !== null
    case "DateRange":
      return filter.from !== null || filter.to !== null
    case "Boolean":
      return true
  }
}

export const matchesFilter = (value: CellValue, filter: FilterValue): boolean => {
  if (!filterIsActive(filter)) return true
  switch (filter._tag) {
    case "Text":
      return folded(cellText(value)).includes(folded(filter.query.trim()))
    case "Options":
      return asList(value).some((item) => filter.values.includes(item))
    case "NumberRange":
      return inNumberRange(value, filter.min, filter.max)
    case "DateRange":
      return inDateRange(value, filter.from, filter.to)
    case "Boolean":
      return value === filter.value
  }
}

export const matchesSearch = (text: string, search: string): boolean => {
  const haystack = folded(text)

  return folded(search)
    .split(/\s+/)
    .filter((word) => word !== "")
    .every((word) => haystack.includes(word))
}

const kindRank = (value: CellValue): number => {
  if (typeof value === "boolean") return 0
  if (typeof value === "number") return 1

  return 2
}

const compareFilled = (left: CellValue, right: CellValue): number => {
  if (kindRank(left) !== kindRank(right)) return kindRank(left) - kindRank(right)
  if (typeof left === "number" && typeof right === "number") return left - right
  if (typeof left === "boolean" && typeof right === "boolean") return Number(left) - Number(right)

  return collator.compare(cellText(left), cellText(right))
}

export const compareValues = (left: CellValue, right: CellValue, direction: SortDirection): number => {
  if (isEmpty(left) && isEmpty(right)) return 0
  if (isEmpty(left)) return 1
  if (isEmpty(right)) return -1
  const order = compareFilled(left, right)

  return direction === "asc" ? order : -order
}

const valueOf = <Row>(column: ColumnData<Row> | undefined, row: Row): CellValue =>
  column?.value === undefined ? undefined : column.value(row)

const passesFilters = <Row>(
  row: Row,
  columns: ReadonlyArray<ColumnData<Row>>,
  filters: Readonly<Record<string, FilterValue>>
): boolean =>
  Object.entries(filters).every(([id, filter]) =>
    matchesFilter(
      valueOf(
        columns.find((column) => column.id === id),
        row
      ),
      filter
    )
  )

const sorted = <Row>(rows: ReadonlyArray<Row>, columns: ReadonlyArray<ColumnData<Row>>, sort: Sort | null) => {
  const column = columns.find((candidate) => candidate.id === sort?.column)
  if (sort === null || column === undefined) return rows

  return rows.toSorted((left, right) => compareValues(valueOf(column, left), valueOf(column, right), sort.direction))
}

const passesSearch = <Row>(row: Row, search: string, searchText: SearchText<Row> | undefined): boolean =>
  searchText === undefined || matchesSearch(searchText(row), search)

export const queryRows = <Row>(
  query: Query,
  rows: ReadonlyArray<Row>,
  columns: ReadonlyArray<ColumnData<Row>>,
  searchText?: SearchText<Row>
): ReadonlyArray<Row> =>
  sorted(
    rows.filter((row) => passesSearch(row, query.search, searchText) && passesFilters(row, columns, query.filters)),
    columns,
    query.sort
  )

export type RowWindow = {
  readonly start: number
  readonly end: number
  readonly before: number
  readonly after: number
}

export const rowWindow = (
  count: number,
  rowHeightPx: number,
  firstVisible: number,
  visibleCount: number,
  overscan: number
): RowWindow => {
  const start = Math.min(Math.max(0, firstVisible - overscan), Math.max(0, count - 1))
  const end = Math.min(count, firstVisible + visibleCount + overscan)
  const last = Math.max(start, end)

  return { start, end: last, before: start * rowHeightPx, after: (count - last) * rowHeightPx }
}

export const nextSort = (sort: Sort | null, column: string): Sort | null => {
  if (sort?.column !== column) return { column, direction: "asc" }

  return sort.direction === "asc" ? { column, direction: "desc" } : null
}
