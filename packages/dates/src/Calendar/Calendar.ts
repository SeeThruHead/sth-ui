import * as stylex from "@stylexjs/stylex"
import type { Cause } from "effect"
import { Array as Arr, Effect, Option, Queue, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "@sth-ui/core/content.ts"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { space } from "@sth-ui/core/theme/tokens.stylex.ts"
import { CalendarHeader } from "../CalendarHeader/CalendarHeader.ts"
import type {
  CalendarHeaderConfig,
  CalendarHeaderControl,
  CalendarHeaderPart
} from "../CalendarHeader/CalendarHeader.ts"
import { decadeRange, formatDate } from "../date/date.ts"
import type { DateString } from "../date/date.ts"
import type { DayConfig } from "../Day/Day.ts"
import { Month } from "../Month/Month.ts"
import type { MonthConfig, MonthPart, MonthSettings } from "../Month/Month.ts"
import { MonthsList } from "../MonthsList/MonthsList.ts"
import type { MonthsListConfig, MonthsListPart } from "../MonthsList/MonthsList.ts"
import type { ControlState } from "../PickerControl/controlsTable.ts"
import type { PickerControlConfig } from "../PickerControl/PickerControl.ts"
import type { WeekdaysRowConfig } from "../WeekdaysRow/WeekdaysRow.ts"
import { YearsList } from "../YearsList/YearsList.ts"
import type { YearsListConfig, YearsListPart } from "../YearsList/YearsList.ts"
import { directionOf, nextControl } from "./keys.ts"
import type { ControlIndex } from "./keys.ts"
import { columnDate, nextDisabled, previousDisabled } from "./levels.ts"
import { clampLevel, Message } from "./model.ts"
import type { CalendarContext, Model } from "./model.ts"

export type CalendarPart = "calendar" | "levelsGroup" | CalendarHeaderPart | MonthPart | MonthsListPart | YearsListPart

export type CalendarAriaLabels = {
  readonly monthLevelControl?: string
  readonly yearLevelControl?: string
  readonly nextMonth?: string
  readonly previousMonth?: string
  readonly nextYear?: string
  readonly previousYear?: string
  readonly nextDecade?: string
  readonly previousDecade?: string
}

export type CalendarOptions = {
  readonly monthLabelFormat?: string
  readonly yearLabelFormat?: string
  readonly decadeLabelFormat?: string
  readonly monthsListFormat?: string
  readonly yearsListFormat?: string
  readonly headerControlsOrder?: ReadonlyArray<CalendarHeaderControl>
  readonly enableKeyboardNavigation?: boolean
}

export type CalendarProps<M> = CalendarOptions &
  CalendarContext &
  Omit<MonthSettings<M>, "focusableDate"> &
  StylesApiProps<CalendarPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly static?: boolean
    readonly ariaLabels?: CalendarAriaLabels
    readonly nextLabel?: string
    readonly previousLabel?: string
    readonly nextIcon?: Child
    readonly previousIcon?: Child
    readonly getMonthControlProps?: (month: DateString) => ControlState
    readonly getYearControlProps?: (year: DateString) => ControlState
    readonly onMonthMouseEnter?: (month: DateString) => M
    readonly onYearMouseEnter?: (year: DateString) => M
    readonly onMouseLeave?: M
  }

export type CalendarConfig = ComponentConfig<CalendarOptions, CalendarPart>

export type CalendarComponents = {
  readonly Calendar?: CalendarConfig
  readonly CalendarHeader?: CalendarHeaderConfig
  readonly Month?: MonthConfig
  readonly Day?: DayConfig
  readonly WeekdaysRow?: WeekdaysRowConfig
  readonly MonthsList?: MonthsListConfig
  readonly YearsList?: YearsListConfig
  readonly PickerControl?: PickerControlConfig
}

const styles = stylex.create({
  calendar: { display: "inline-block" },
  fullWidth: { display: "block", width: "100%" },
  group: { display: "flex", gap: space.md },
  column: { flexGrow: 0 },
  fullColumn: { flexGrow: 1 }
})

const controlSelector = "[data-date], [data-picker-control]"

const tablesOf = (root: Element) => Array.from(root.querySelectorAll("[data-level-column] table"))

const rowsOf = (table: Element) => Array.from(table.querySelectorAll("tbody tr"))

const controlsOf = (row: Element) => Array.from(row.querySelectorAll<HTMLElement>(controlSelector))

const unfocusable = (control: HTMLElement) => {
  if (control.hasAttribute("disabled")) return true

  return control.hasAttribute("data-hidden") || control.hasAttribute("data-outside")
}

type Pressed = {
  readonly key: string
  readonly ctrlKey: boolean
  readonly shiftKey: boolean
  readonly target: EventTarget | null
}

const pressedOf = (event: Event): Pressed => ({
  key: String(Reflect.get(event, "key")),
  ctrlKey: Reflect.get(event, "ctrlKey") === true || Reflect.get(event, "metaKey") === true,
  shiftKey: Reflect.get(event, "shiftKey") === true,
  target: event.target
})

const isHtml = (target: EventTarget | null): target is HTMLElement => target instanceof HTMLElement

const focusMove = (root: Element, pressed: Pressed) =>
  Option.flatMap(directionOf(pressed.key), (direction) =>
    Option.flatMap(Option.liftPredicate(pressed.target, isHtml), (target) => {
      const grid = tablesOf(root).map((table) => rowsOf(table).map(controlsOf))
      const control = (at: ControlIndex) =>
        Arr.getUnsafe(Arr.getUnsafe(Arr.getUnsafe(grid, at.levelIndex), at.rowIndex), at.cellIndex)
      const located = grid.flatMap((rows, levelIndex) =>
        rows.flatMap((row, rowIndex) => {
          const cellIndex = row.indexOf(target)

          return cellIndex < 0 ? [] : [{ levelIndex, rowIndex, cellIndex }]
        })
      )

      return Option.flatMap(Arr.head(located), (from) =>
        Option.map(
          nextControl(
            grid.map((rows) => rows.map((row) => row.length)),
            from,
            direction,
            (at) => unfocusable(control(at))
          ),
          control
        )
      )
    })
  )

const pageKey = (pressed: Pressed) => {
  if (pressed.key.toLowerCase() === "y") return true
  if (!pressed.ctrlKey) return false

  return pressed.key === "ArrowUp" || pressed.key === "ArrowDown"
}

type PageKey = ReturnType<typeof Message.PressedPageKey>

const keyboard = (queue: Queue.Queue<PageKey, Cause.Done>, root: Element, pages: boolean) => {
  const onKey = (event: Event) => {
    const pressed = pressedOf(event)
    if (pages && pageKey(pressed)) {
      event.preventDefault()
      Queue.offerUnsafe(
        queue,
        Message.PressedPageKey({ key: pressed.key, ctrlKey: pressed.ctrlKey, shiftKey: pressed.shiftKey })
      )
      return
    }
    Option.map(focusMove(root, pressed), (control) => {
      event.preventDefault()
      control.focus()
    })
  }
  root.addEventListener("keydown", onKey)

  return () => root.removeEventListener("keydown", onKey)
}

const KeyboardMount = Mount.defineStream("CalendarKeyboard", {
  args: { pages: Schema.Boolean },
  messages: [Message.PressedPageKey],
  execute: ({ element, pages }) =>
    Stream.callback<PageKey>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => keyboard(queue, element, pages)),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const Calendar =
  (config: CalendarComponents) =>
  <M>(h: HtmlBuilder<M>, input: CalendarProps<M>): Html => {
    const props = withDefaults(config.Calendar, input)
    const getStyles = stylesApi<M, CalendarPart>(h, props, config.Calendar, "calendar")
    const level = clampLevel(props.model.level, props)
    const columns = Math.max(props.numberOfColumns ?? 1, 1)
    const locale = props.locale ?? "en"
    const send = props.toParentMessage
    const forwarded = {
      ...(props.styles === undefined ? {} : { styles: props.styles }),
      ...(props.unstyled === undefined ? {} : { unstyled: props.unstyled })
    }
    const shared = {
      ...forwarded,
      ...(props.size === undefined ? {} : { size: props.size }),
      ...(props.fullWidth === undefined ? {} : { fullWidth: props.fullWidth }),
      ...(props.today === undefined ? {} : { today: props.today }),
      ...(props.minDate === undefined ? {} : { minDate: props.minDate }),
      ...(props.maxDate === undefined ? {} : { maxDate: props.maxDate })
    }
    const labels = props.ariaLabels ?? {}
    const nextLabel =
      { month: labels.nextMonth, year: labels.nextYear, decade: labels.nextDecade }[level] ?? props.nextLabel
    const previousLabel =
      { month: labels.previousMonth, year: labels.previousYear, decade: labels.previousDecade }[level] ??
      props.previousLabel
    const levelLabel = { month: labels.monthLevelControl, year: labels.yearLevelControl, decade: undefined }[level]
    const headerLabel = (date: DateString) => {
      if (level === "month") return formatDate(date, props.monthLabelFormat ?? "MMMM YYYY", locale)
      if (level === "year") return formatDate(date, props.yearLabelFormat ?? "YYYY", locale)
      const [first, last] = decadeRange(date)
      const format = props.decadeLabelFormat ?? "YYYY"

      return `${formatDate(first, format, locale)} – ${formatDate(last, format, locale)}`
    }
    const body = (date: DateString) => {
      if (level === "year") {
        return MonthsList(config)(h, {
          ...shared,
          year: date,
          locale,
          ...(props.monthsListFormat === undefined ? {} : { monthsListFormat: props.monthsListFormat }),
          ...(props.getMonthControlProps === undefined ? {} : { getMonthControlProps: props.getMonthControlProps }),
          ...(props.onMonthMouseEnter === undefined ? {} : { onMonthMouseEnter: props.onMonthMouseEnter }),
          ...(props.static === true ? {} : { onMonthClick: (month: DateString) => send(Message.ChoseMonth({ month })) })
        })
      }
      if (level === "decade") {
        return YearsList(config)(h, {
          ...shared,
          decade: date,
          locale,
          ...(props.yearsListFormat === undefined ? {} : { yearsListFormat: props.yearsListFormat }),
          ...(props.getYearControlProps === undefined ? {} : { getYearControlProps: props.getYearControlProps }),
          ...(props.onYearMouseEnter === undefined ? {} : { onYearMouseEnter: props.onYearMouseEnter }),
          ...(props.static === true ? {} : { onYearClick: (year: DateString) => send(Message.ChoseYear({ year })) })
        })
      }

      return Month(config)(h, { ...props, ...shared, month: date, locale })
    }
    const column = (index: number) => {
      const date = columnDate(level, props.model.date, index)
      const last = columnDate(level, props.model.date, columns - 1)

      return h.div(
        [
          ...getStyles("levelsGroup", styles.column, props.fullWidth === true && styles.fullColumn),
          h.DataAttribute("level-column", String(index))
        ],
        [
          CalendarHeader(config)(h, {
            ...forwarded,
            ...(props.size === undefined ? {} : { size: props.size }),
            ...(props.fullWidth === undefined ? {} : { fullWidth: props.fullWidth }),
            ...(props.headerControlsOrder === undefined ? {} : { headerControlsOrder: props.headerControlsOrder }),
            ...(nextLabel === undefined ? {} : { nextLabel }),
            ...(previousLabel === undefined ? {} : { previousLabel }),
            ...(levelLabel === undefined ? {} : { levelLabel }),
            ...(props.nextIcon === undefined ? {} : { nextIcon: props.nextIcon }),
            ...(props.previousIcon === undefined ? {} : { previousIcon: props.previousIcon }),
            label: headerLabel(date),
            withPrevious: index === 0,
            withNext: index === columns - 1,
            previousDisabled: previousDisabled(level, props.model.date, props.minDate),
            nextDisabled: nextDisabled(level, last, props.maxDate),
            hasNextLevel: props.static !== true && clampLevel(level === "month" ? "year" : "decade", props) !== level,
            onPrevious: send(Message.Previous()),
            onNext: send(Message.Next()),
            onLevelClick: send(Message.LevelUp())
          }),
          body(date)
        ]
      )
    }

    return h.div(
      [
        ...getStyles("calendar", styles.calendar, props.fullWidth === true && styles.fullWidth),
        h.DataAttribute("calendar", ""),
        ...(props.onMouseLeave === undefined ? [] : [h.OnMouseLeave(props.onMouseLeave)]),
        h.DataAttribute("level", level),
        ...(props.fullWidth === true ? [h.DataAttribute("full-width", "")] : []),
        ...(props.static === true
          ? []
          : [h.OnMount(Mount.mapMessage(KeyboardMount({ pages: props.enableKeyboardNavigation !== false }), send))])
      ],
      [
        h.div(
          getStyles("levelsGroup", styles.group),
          Array.from({ length: columns }, (_column, index) => column(index))
        )
      ]
    )
  }
