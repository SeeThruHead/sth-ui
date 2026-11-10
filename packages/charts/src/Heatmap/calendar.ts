import { Array as Arr, DateTime } from "effect"

const day = 86_400_000

export type HeatmapDate = string | DateTime.DateTime

const pad = (value: number) => String(value).padStart(2, "0")

const formatDate = (date: DateTime.DateTime): string =>
  `${DateTime.getPartUtc(date, "year")}-${pad(DateTime.getPartUtc(date, "month"))}-${pad(DateTime.getPartUtc(date, "day"))}`

const addDays = (date: DateTime.DateTime, days: number): DateTime.DateTime => DateTime.add(date, { days })

export const toUtcMidnight = (input: HeatmapDate): DateTime.DateTime =>
  DateTime.startOf(DateTime.toUtc(typeof input === "string" ? DateTime.makeUnsafe(input) : input), "day")

const weekStart = (date: DateTime.DateTime, firstDayOfWeek: number): DateTime.DateTime =>
  addDays(date, -((DateTime.getPartUtc(date, "weekDay") - firstDayOfWeek + 7) % 7))

export type DatesOptions = {
  readonly startDate: HeatmapDate
  readonly endDate: HeatmapDate
  readonly withOutsideDates: boolean
  readonly firstDayOfWeek: number
}

export const getDatesRange = (options: DatesOptions): ReadonlyArray<ReadonlyArray<string | null>> => {
  const start = toUtcMidnight(options.startDate)
  const end = toUtcMidnight(options.endDate)
  const first = weekStart(start, options.firstDayOfWeek)
  const lastWeek = weekStart(end, options.firstDayOfWeek)
  const weeks = Math.round((DateTime.toEpochMillis(lastWeek) - DateTime.toEpochMillis(first)) / day / 7) + 1

  return Arr.makeBy(weeks, (week) =>
    Arr.makeBy(7, (index) => {
      const date = addDays(first, week * 7 + index)
      const inside = DateTime.between(date, { minimum: start, maximum: end })

      return options.withOutsideDates || inside ? formatDate(date) : null
    })
  )
}

export const monthOf = (date: string): number => DateTime.getPartUtc(DateTime.makeUnsafe(date), "month") - 1

export type MonthRange = { readonly month: number; readonly position: number; readonly size: number }

export const getMonthsRange = (weeks: ReadonlyArray<ReadonlyArray<string | null>>): ReadonlyArray<MonthRange> =>
  weeks.reduce<ReadonlyArray<MonthRange>>((ranges, week, position) => {
    const month = monthOf(String(week[0] ?? week.at(-1)))
    const current = ranges.at(-1)
    if (current === undefined || current.month !== month) return [...ranges, { month, position, size: 1 }]

    return [...ranges.slice(0, -1), { ...current, size: current.size + 1 }]
  }, [])

export type HeatmapColumn =
  | { readonly type: "spacer" }
  | { readonly type: "column"; readonly month: number; readonly weekIndex: number }

type MonthColumn = Extract<HeatmapColumn, { readonly type: "column" }>

const weekColumns = (week: ReadonlyArray<string | null>, weekIndex: number): ReadonlyArray<MonthColumn> =>
  Arr.dedupeAdjacent(week.flatMap((date) => (date === null ? [] : [monthOf(date)]))).map((month) => ({
    type: "column" as const,
    month,
    weekIndex
  }))

const changesMonth = (previous: MonthColumn | undefined, column: MonthColumn): boolean =>
  previous !== undefined && previous.month !== column.month

export const getColumns = (
  weeks: ReadonlyArray<ReadonlyArray<string | null>>,
  splitMonths: boolean
): ReadonlyArray<HeatmapColumn> => {
  if (!splitMonths) {
    return weeks.map((week, weekIndex) => ({
      type: "column" as const,
      month: monthOf(String(week.find((date) => date !== null))),
      weekIndex
    }))
  }

  return weeks
    .flatMap(weekColumns)
    .flatMap((column, index, all) =>
      changesMonth(all[index - 1], column) ? [{ type: "spacer" as const }, column] : [column]
    )
}

export const firstMonthColumn = (columns: ReadonlyArray<HeatmapColumn>, month: number): number =>
  columns.findIndex((column) => column.type === "column" && column.month === month)

export const heatColor = (value: number, min: number, max: number, colors: ReadonlyArray<string>): string => {
  const percent = max === min ? 1 : (value - min) / (max - min)
  const index = Math.round((colors.length - 1) * Math.min(1, Math.max(0, percent)))

  return colors[index] ?? ""
}

export const boundaries = (
  data: Readonly<Record<string, number>>,
  domain: readonly [number, number] | undefined
): readonly [number, number] => {
  if (domain !== undefined) return domain
  const values = Object.values(data)

  return [Math.min(...values), Math.max(...values)]
}

export const rotateWeekdays = (names: ReadonlyArray<string>, firstDayOfWeek: number): ReadonlyArray<string> => [
  ...names.slice(firstDayOfWeek),
  ...names.slice(0, firstDayOfWeek)
]
