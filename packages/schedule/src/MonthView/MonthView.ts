import * as stylex from "@stylexjs/stylex"
import { Array as Arr, Function, Option } from "effect"
import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "@sth-ui/core/content.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { radiusValue } from "@sth-ui/core/styles/styleProps.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { setDefinedVars, setStyle, setVars, stylesApi, sx, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, radius } from "@sth-ui/core/theme/tokens.stylex.ts"
import { addMonths, dayOfWeek, endOfMonth, isSameMonth, startOfMonth, weekNumber } from "@sth-ui/dates/date/date.ts"
import type { DateString, DayOfWeek } from "@sth-ui/dates/date/date.ts"
import { AgendaView } from "../AgendaView/AgendaView.ts"
import type { AgendaViewPart } from "../AgendaView/AgendaView.ts"
import { dateOf } from "../datetime.ts"
import type { DateTimeString } from "../datetime.ts"
import type { Interaction } from "../DayView/interaction.ts"
import { gotInteraction, gotMoreEvents, Message as ViewMessage } from "../DayView/model.ts"
import type { Message as ViewMessageType, Model as ViewModel } from "../DayView/model.ts"
import { gestureFlags, WatchTimeGrid } from "../DayView/pointer.ts"
import type { Message as PopoverMessage } from "@foldkit/ui/popover"
import type { ScheduleEvent as EventData, ScheduleViewLevel } from "../events.ts"
import { formatDateTime } from "../format.ts"
import type { DateLabelFormat } from "../format.ts"
import { scheduleLabels } from "../labels.ts"
import type { ScheduleLabels } from "../labels.ts"
import { clampMaxEvents, monthViewEvents } from "../monthLayout.ts"
import type { MonthDayEvents, MonthSegment, MonthSpan, MonthWeek } from "../monthLayout.ts"
import { MoreEvents } from "../MoreEvents/MoreEvents.ts"
import type { MoreEventsPart } from "../MoreEvents/MoreEvents.ts"
import { expandRecurringEvents } from "../recurrence.ts"
import { ScheduleEvent } from "../ScheduleEvent/ScheduleEvent.ts"
import type { RenderEvent, ScheduleEventPart } from "../ScheduleEvent/ScheduleEvent.ts"
import { ScheduleHeader } from "../ScheduleHeader/ScheduleHeader.ts"
import type { ScheduleHeaderPart } from "../ScheduleHeader/ScheduleHeader.ts"
import { GridBehaviour } from "../TimeGrid/TimeGrid.ts"
import { lastDayOf } from "../weekLayout.ts"
import { monthViewVars } from "./MonthView.stylex.ts"

export type MonthViewPart =
  | ScheduleHeaderPart
  | ScheduleEventPart
  | MoreEventsPart
  | AgendaViewPart
  | "monthView"
  | "monthViewWeekdays"
  | "monthViewWeekdaysCorner"
  | "monthViewWeekday"
  | "monthViewWeek"
  | "monthViewWeekNumber"
  | "monthViewDay"
  | "monthViewDayLabel"
  | "monthViewEvents"
  | "monthViewBackgroundEvent"

export type MonthViewOptions = {
  readonly withWeekNumbers?: boolean
  readonly withWeekDays?: boolean
  readonly withWeekendDays?: boolean
  readonly locale?: string
  readonly firstDayOfWeek?: DayOfWeek
  readonly weekdayFormat?: DateLabelFormat
  readonly weekendDays?: ReadonlyArray<DayOfWeek>
  readonly consistentWeeks?: boolean
  readonly highlightToday?: boolean
  readonly radius?: StyleValue
  readonly withOutsideDays?: boolean
  readonly withHeader?: boolean
  readonly headerFormat?: DateLabelFormat
  readonly mode?: "default" | "static"
  readonly withEventsDragAndDrop?: boolean
  readonly withDragSlotSelect?: boolean
  readonly withExternalEventDrop?: boolean
  readonly withInteractiveBackgroundEvents?: boolean
  readonly maxEventsPerDay?: number
  readonly withAgenda?: boolean
  readonly recurrenceExpansionLimit?: number
}

export type MonthViewProps<M> = MonthViewOptions &
  StylesApiProps<MonthViewPart> & {
    readonly date: DateString
    readonly events?: ReadonlyArray<EventData>
    readonly now?: DateTimeString
    readonly labels?: Partial<ScheduleLabels>
    readonly renderEventBody?: (event: EventData) => Child
    readonly renderEvent?: RenderEvent<M>
    readonly getDayProps?: (date: DateString) => ReadonlyArray<Attribute<M>>
    readonly getWeekNumberProps?: (weekStart: DateString) => ReadonlyArray<Attribute<M>>
    readonly previousControlProps?: ReadonlyArray<Attribute<M>>
    readonly nextControlProps?: ReadonlyArray<Attribute<M>>
    readonly todayControlProps?: ReadonlyArray<Attribute<M>>
    readonly viewSelectProps?: ReadonlyArray<Attribute<M>>
    readonly onDateChange?: (date: DateString) => M
    readonly onViewChange?: (view: ScheduleViewLevel) => M
    readonly onDayClick?: (date: DateString) => M
    readonly onWeekNumberClick?: (weekStart: DateString) => M
    readonly onEventClick?: (event: EventData) => M
    readonly model?: ViewModel
    readonly toParentMessage?: (message: ViewMessageType) => M
    readonly canDragEvent?: (event: EventData) => boolean
  }

export type MonthViewConfig = ComponentConfig<MonthViewOptions, MonthViewPart>

const border = `1px solid light-dark(${palette.gray3}, ${palette.dark4})`
const shade = `light-dark(${palette.gray0}, ${palette.dark6})`

const styles = stylex.create({
  root: { [monthViewVars.radius]: radius.default, borderRadius: monthViewVars.radius, overflow: "hidden" },
  grid: { borderRadius: monthViewVars.radius, overflowX: "auto", borderInlineEnd: border, borderBlockEnd: border },
  weekdays: { display: "flex" },
  corner: { flex: "0 0 42px", borderBlockStart: border, borderInlineStart: border },
  weekday: {
    flex: 1,
    minWidth: "84px",
    height: "36px",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    borderBlockStart: border,
    borderInlineStart: border,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textTransform: "capitalize",
    userSelect: "none"
  },
  week: { display: "flex", position: "relative" },
  weekNumber: {
    flex: "0 0 42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    fontFamily: "inherit",
    color: "inherit",
    padding: "4px",
    borderWidth: 0,
    borderBlockStart: border,
    borderInlineStart: border,
    cursor: "pointer",
    userSelect: "none",
    backgroundColor: { default: "transparent", ":hover": shade }
  },
  day: {
    flex: 1,
    minWidth: "84px",
    height: `calc(52px + ${monthViewVars.maxEvents} * 24px)`,
    padding: "4px",
    fontWeight: fontWeight.medium,
    fontFamily: "inherit",
    color: "inherit",
    borderWidth: 0,
    borderBlockStart: border,
    borderInlineStart: border,
    cursor: "pointer",
    display: "flex",
    alignItems: "flex-start",
    position: "relative",
    boxSizing: "border-box",
    backgroundColor: { default: "transparent", ":hover": shade }
  },
  weekend: { color: palette.red6 },
  outside: { opacity: 0.4 },
  still: { cursor: "default", pointerEvents: "none" },
  dropTarget: { backgroundColor: { default: accent.light, ":hover": accent.light } },
  label: {
    width: "26px",
    aspectRatio: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "100%",
    fontSize: fontSize.sm,
    userSelect: "none"
  },
  today: { backgroundColor: accent.filled, color: accent.contrast },
  events: { position: "absolute", insetInlineEnd: 0, top: "30px", bottom: "22px", pointerEvents: "none", zIndex: 3 },
  background: {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 2,
    borderRadius: monthViewVars.radius,
    backgroundColor: accent.light,
    color: accent.lightColor,
    opacity: 0.6,
    top: 0,
    bottom: "-21px",
    overflow: "hidden",
    fontSize: "12px",
    fontWeight: fontWeight.medium,
    padding: "3px 4px",
    boxSizing: "border-box",
    borderWidth: 0,
    fontFamily: "inherit",
    textAlign: "start"
  },
  interactiveBackground: { pointerEvents: "auto", cursor: "pointer" },
  more: { position: "absolute", bottom: "-20px", paddingInline: "4px", display: "flex", pointerEvents: "auto" },
  dimmed: { color: colors.dimmed }
})

const agenda = AgendaView({})

const dropDays = (interaction: Interaction, days: ReadonlyArray<DateString>) => {
  if (interaction._tag !== "Dragging") return []

  return days.filter((day) => day >= dateOf(interaction.start) && day <= lastDayOf(interaction))
}

const selectedDays = (interaction: Interaction, day: DateString) => {
  if (interaction._tag !== "SelectingDays") return false
  const [first, last] = [interaction.anchor, interaction.current].toSorted()

  return day >= String(first) && day <= String(last)
}

export const MonthView =
  (config: { readonly MonthView?: MonthViewConfig }) =>
  <M>(h: HtmlBuilder<M>, input: MonthViewProps<M>): Html => {
    const props = withDefaults(config.MonthView, input)
    const getStyles = stylesApi<M, MonthViewPart>(h, props, config.MonthView, "monthView")
    const labels = scheduleLabels(props.labels)
    const date = props.date
    const locale = props.locale ?? "en"
    const isStatic = props.mode === "static"
    const max = clampMaxEvents(props.maxEventsPerDay)
    const withOutsideDays = props.withOutsideDays ?? true
    const options = {
      firstDayOfWeek: props.firstDayOfWeek ?? 1,
      withOutsideDays,
      consistentWeeks: props.consistentWeeks ?? true,
      withWeekendDays: props.withWeekendDays ?? true,
      weekendDays: props.weekendDays ?? [0, 6],
      maxEventsPerDay: max
    }
    const expanded = expandRecurringEvents({
      events: props.events,
      rangeStart: `${addMonths(startOfMonth(date), -1)} 00:00:00`,
      rangeEnd: `${addMonths(endOfMonth(date), 1)} 23:59:59`,
      ...(props.recurrenceExpansionLimit === undefined ? {} : { expansionLimit: props.recurrenceExpansionLimit })
    })
    const weeks = monthViewEvents({ ...options, events: expanded, date })
    const forwarded = {
      ...(props.styles === undefined ? {} : { styles: props.styles }),
      ...(props.attributes === undefined ? {} : { attributes: props.attributes })
    }
    const send = props.toParentMessage
    const interactive = send !== undefined && props.model !== undefined && !isStatic
    const interaction: Interaction = props.model?.interaction.interaction ?? { _tag: "Idle" }
    const allDays = weeks.flatMap((week) => week.days)
    const dropping = dropDays(interaction, allDays)
    const today = Option.getOrElse(Option.map(Option.fromNullishOr(props.now), dateOf), () => date)
    const isToday = (day: DateString) => (props.highlightToday ?? true) && props.now !== undefined && day === today
    const isWeekend = (day: DateString) => options.weekendDays.includes(dayOfWeek(day))
    const shown = (day: DateString) => withOutsideDays || isSameMonth(day, date)
    const withWeekNumbers = props.withWeekNumbers === true
    const canDrag = (event: EventData) =>
      interactive && props.withEventsDragAndDrop === true && (props.canDragEvent?.(event) ?? true)

    const dayCell = (week: MonthWeek) => (day: DateString, index: number) => {
      if (!shown(day)) {
        return h.keyed("div")(
          day,
          [...getStyles("monthViewDay", styles.day, styles.still), h.DataAttribute("static", "")],
          []
        )
      }
      const outside = !isSameMonth(day, date)
      const dropTarget = dropping.includes(day)
      const selected = selectedDays(interaction, day)

      return h.keyed("button")(
        day,
        [
          ...getStyles(
            "monthViewDay",
            styles.day,
            isWeekend(day) && styles.weekend,
            outside && styles.outside,
            isStatic && styles.still,
            (dropTarget || selected) && styles.dropTarget,
            shared.focusRing
          ),
          h.Type("button"),
          h.DataAttribute("day-cell", ""),
          h.DataAttribute("date", day),
          h.AriaLabel(formatDateTime(`${day} 00:00:00`, "MMMM D, YYYY", locale)),
          h.Tabindex(!isStatic && week === weeks[0] && index === 0 ? 0 : -1),
          ...(outside ? [h.DataAttribute("outside", "")] : []),
          ...(isWeekend(day) ? [h.DataAttribute("weekend", "")] : []),
          ...(isToday(day) ? [h.DataAttribute("today", "")] : []),
          ...(dropTarget ? [h.DataAttribute("drop-target", "")] : []),
          ...(selected ? [h.DataAttribute("drag-selected", "")] : []),
          ...(props.onDayClick === undefined || isStatic ? [] : [h.OnClick(props.onDayClick(day))]),
          ...(props.getDayProps?.(day) ?? [])
        ],
        [
          h.span(getStyles("monthViewDayLabel", styles.label, isToday(day) && styles.today), [
            String(Number(day.slice(8, 10)))
          ])
        ]
      )
    }

    const rowHeight = 100 / max

    const segmentNode = (segment: MonthSegment) =>
      ScheduleEvent(h, {
        ...forwarded,
        event: segment.event,
        nowrap: true,
        static: isStatic,
        hanging: segment.hanging,
        clipStart: segment.clipStart,
        clipEnd: segment.clipEnd,
        draggable: canDrag(segment.event),
        dragging: interaction._tag === "Dragging" && interaction.eventId === segment.event.id,
        renderEventBody: props.renderEventBody,
        renderEvent: props.renderEvent,
        ...(props.onEventClick === undefined || isStatic ? {} : { onClick: props.onEventClick(segment.event) }),
        layout: setStyle(
          ["position", "absolute"],
          ["pointerEvents", "auto"],
          ["top", `calc(${segment.row * rowHeight}% + 1px)`],
          ["left", `calc(${segment.offset}% + 1px)`],
          ["width", `calc(${segment.width}% - 2px)`],
          ["height", `calc(${rowHeight}% - 2px)`]
        )
      })

    const backgroundNode = (span: MonthSpan) => {
      const click =
        props.withInteractiveBackgroundEvents === true && props.onEventClick !== undefined && !isStatic
          ? [h.Type("button"), h.OnClick(props.onEventClick(span.event))]
          : []

      return h.keyed(click.length > 0 ? "button" : "div")(
        `background-${span.event.id}`,
        [
          ...click,
          ...getStyles(
            "monthViewBackgroundEvent",
            styles.background,
            click.length > 0 && styles.interactiveBackground,
            setStyle(["left", `calc(${span.offset}% + 2px)`], ["width", `calc(${span.width}% - 3px)`])
          ),
          h.DataAttribute("event-id", String(span.event.id))
        ],
        [props.renderEventBody === undefined ? span.event.title : props.renderEventBody(span.event)]
      )
    }

    const moreProps = (day: DateString) => {
      if (props.model === undefined || send === undefined) return {}
      if (props.model.moreDate !== day) return { onOpen: send(ViewMessage.OpenedMoreEvents({ date: day })) }

      return {
        popover: {
          model: props.model.moreEvents,
          toParentMessage: (message: PopoverMessage) => send(gotMoreEvents(message))
        }
      }
    }

    const moreNode = (week: MonthWeek) => (day: MonthDayEvents, index: number) =>
      day.hidden > 0
        ? [
            h.keyed("div")(
              `more-${day.date}`,
              sx(
                h,
                styles.more,
                setStyle(["left", `${(index / week.days.length) * 100}%`], ["width", `${100 / week.days.length}%`])
              ),
              [
                MoreEvents(h, {
                  ...forwarded,
                  events: day.events,
                  moreEventsCount: day.hidden,
                  labels,
                  static: isStatic,
                  renderEventBody: props.renderEventBody,
                  renderEvent: props.renderEvent,
                  onEventClick: props.onEventClick,
                  ...moreProps(day.date)
                })
              ]
            )
          ]
        : []

    const weekNode = (week: MonthWeek) =>
      h.keyed("div")(
        week.days.join(),
        [...getStyles("monthViewWeek", styles.week), h.DataAttribute("month-week", "")],
        [
          ...(withWeekNumbers
            ? [
                h.button(
                  [
                    ...getStyles("monthViewWeekNumber", styles.weekNumber, isStatic && styles.still, shared.focusRing),
                    h.Type("button"),
                    h.AriaLabel(`${labels.week} ${weekNumber(week.days)}`),
                    ...(props.onWeekNumberClick === undefined || isStatic
                      ? []
                      : [h.OnClick(props.onWeekNumberClick(Arr.headNonEmpty(week.days)))]),
                    ...(props.getWeekNumberProps?.(Arr.headNonEmpty(week.days)) ?? [])
                  ],
                  [String(weekNumber(week.days))]
                )
              ]
            : []),
          ...week.days.map(dayCell(week)),
          h.div(
            [
              ...getStyles("monthViewEvents", styles.events),
              ...sx(h, setStyle(["insetInlineStart", withWeekNumbers ? "42px" : "0"]))
            ],
            [
              ...week.background.map(backgroundNode),
              ...week.segments.map(segmentNode),
              ...week.dayEvents.flatMap(moreNode(week))
            ]
          )
        ]
      )

    const firstWeek = Arr.headNonEmpty(weeks).days

    const header =
      (props.withHeader ?? true)
        ? [
            ScheduleHeader(h, {
              ...forwarded,
              view: "month",
              labels,
              title: formatDateTime(`${date} 00:00:00`, props.headerFormat ?? "MMMM YYYY", locale),
              ...(props.onDateChange === undefined
                ? {}
                : {
                    onPrevious: props.onDateChange(addMonths(date, -1)),
                    onNext: props.onDateChange(addMonths(date, 1)),
                    onToday: props.onDateChange(today)
                  }),
              ...(props.onViewChange === undefined ? {} : { onViewChange: props.onViewChange }),
              ...(props.withAgenda === true && send !== undefined && props.model !== undefined
                ? { onAgendaClick: send(ViewMessage.ToggledAgenda()), agendaActive: props.model.agendaOpen }
                : {}),
              ...(props.previousControlProps === undefined ? {} : { previousControlProps: props.previousControlProps }),
              ...(props.nextControlProps === undefined ? {} : { nextControlProps: props.nextControlProps }),
              ...(props.todayControlProps === undefined ? {} : { todayControlProps: props.todayControlProps }),
              ...(props.viewSelectProps === undefined ? {} : { viewSelectProps: props.viewSelectProps })
            })
          ]
        : []

    const grid = h.div(
      [
        ...sx(h, styles.grid),
        h.DataAttribute("month-grid", ""),
        ...gestureFlags({
          drag: interactive && props.withEventsDragAndDrop === true,
          resize: false,
          select: interactive && props.withDragSlotSelect === true,
          external: interactive && props.withExternalEventDrop === true
        }).map((name) => h.DataAttribute(name, "")),
        ...(send === undefined
          ? []
          : [h.OnMount(Mount.mapMessage(WatchTimeGrid(), (message) => send(gotInteraction(message))))])
      ],
      [
        ...((props.withWeekDays ?? true)
          ? [
              h.div(getStyles("monthViewWeekdays", styles.weekdays), [
                ...(withWeekNumbers ? [h.div(getStyles("monthViewWeekdaysCorner", styles.corner), [])] : []),
                ...firstWeek.map((day) =>
                  h.keyed("div")(`weekday-${day}`, getStyles("monthViewWeekday", styles.weekday), [
                    formatDateTime(`${day} 00:00:00`, props.weekdayFormat ?? "ddd", locale)
                  ])
                )
              ])
            ]
          : []),
        ...weeks.map(weekNode)
      ]
    )

    return h.div(
      [
        ...getStyles(
          "monthView",
          styles.root,
          setVars([monthViewVars.maxEvents, String(max)]),
          setDefinedVars([monthViewVars.radius, props.radius === undefined ? undefined : radiusValue(props.radius)])
        ),
        ...(isStatic ? [h.DataAttribute("static", "")] : []),
        ...(withWeekNumbers ? [h.DataAttribute("with-week-numbers", "")] : []),
        h.OnMount(Mount.mapMessage(GridBehaviour({ startScrollTime: "", layout: "rows" }), Function.absurd<M>))
      ],
      [
        ...header,
        ...(props.withAgenda === true && props.model?.agendaOpen === true
          ? [
              agenda(h, {
                ...forwarded,
                rangeStart: startOfMonth(date),
                rangeEnd: endOfMonth(date),
                events: props.events,
                locale,
                labels: props.labels,
                mode: props.mode,
                onEventClick: props.onEventClick,
                recurrenceExpansionLimit: props.recurrenceExpansionLimit
              })
            ]
          : [grid])
      ]
    )
  }
