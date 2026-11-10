import * as stylex from "@stylexjs/stylex"
import { Array as Arr, Function, Option } from "effect"
import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "@sth-ui/core/content.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { radiusValue, sizeValue } from "@sth-ui/core/styles/styleProps.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { setDefinedVars, setStyle, stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, radius } from "@sth-ui/core/theme/tokens.stylex.ts"
import { addDays, dayOfWeek, weekNumber } from "@sth-ui/dates/date/date.ts"
import type { DateString, DayOfWeek } from "@sth-ui/dates/date/date.ts"
import { AgendaView } from "../AgendaView/AgendaView.ts"
import type { AgendaViewPart } from "../AgendaView/AgendaView.ts"
import { clampIntervalMinutes, dayTimeIntervals } from "../dayLayout.ts"
import type { EventOverlapMode } from "../dayLayout.ts"
import { dateOf } from "../datetime.ts"
import type { DateTimeString } from "../datetime.ts"
import { gridOf, selectedSlots } from "../DayView/interaction.ts"
import type { Interaction } from "../DayView/interaction.ts"
import { gotInteraction, Message as ViewMessage } from "../DayView/model.ts"
import type { Message as ViewMessageType, Model as ViewModel } from "../DayView/model.ts"
import { gestureFlags, WatchTimeGrid } from "../DayView/pointer.ts"
import type { ScheduleEvent as EventData, ScheduleViewLevel } from "../events.ts"
import { formatDateTime } from "../format.ts"
import type { DateLabelFormat } from "../format.ts"
import { scheduleLabels } from "../labels.ts"
import type { ScheduleLabels } from "../labels.ts"
import { expandRecurringEvents } from "../recurrence.ts"
import { ScheduleEvent } from "../ScheduleEvent/ScheduleEvent.ts"
import type { RenderEvent, ScheduleEventPart } from "../ScheduleEvent/ScheduleEvent.ts"
import { ScheduleHeader } from "../ScheduleHeader/ScheduleHeader.ts"
import type { ScheduleHeaderPart } from "../ScheduleHeader/ScheduleHeader.ts"
import {
  backgroundNode,
  columnChildren,
  indicatorNodes,
  labelNodes,
  GridBehaviour,
  timeGridStyles
} from "../TimeGrid/TimeGrid.ts"
import type { ColumnContext, GridSettings, TimeGridPart } from "../TimeGrid/TimeGrid.ts"
import { timeGridVars } from "../TimeGrid/TimeGrid.stylex.ts"
import { lastDayOf, weekDays, weekViewEvents } from "../weekLayout.ts"
import type { WeekAllDayEvent } from "../weekLayout.ts"
import { weekViewVars } from "./WeekView.stylex.ts"

export type WeekViewPart =
  | ScheduleHeaderPart
  | ScheduleEventPart
  | AgendaViewPart
  | "weekView"
  | "weekViewRoot"
  | "weekViewScrollArea"
  | "weekViewHeader"
  | "weekViewCorner"
  | "weekViewWeekLabel"
  | "weekViewWeekNumber"
  | "weekViewDayLabel"
  | "weekViewDayWeekday"
  | "weekViewDayNumber"
  | "weekViewAllDaySlots"
  | "weekViewAllDaySlotsLabel"
  | "weekViewAllDaySlotsList"
  | "weekViewAllDaySlotsEvents"
  | "weekViewInner"
  | "weekViewSlotLabels"
  | "weekViewSlotLabel"
  | "weekViewDay"
  | "weekViewDaySlots"
  | "weekViewDaySlot"
  | "weekViewBackgroundEvent"
  | "weekViewCurrentTime"
  | "weekViewCurrentTimeBubble"

export type WeekViewOptions = {
  readonly startTime?: string
  readonly endTime?: string
  readonly intervalMinutes?: number
  readonly withSubHourGridLines?: boolean
  readonly slotLabelFormat?: DateLabelFormat
  readonly slotLabelInterval?: number
  readonly firstDayOfWeek?: DayOfWeek
  readonly weekdayFormat?: DateLabelFormat
  readonly weekendDays?: ReadonlyArray<DayOfWeek>
  readonly withWeekendDays?: boolean
  readonly eventOverlapMode?: EventOverlapMode
  readonly eventOverlapRaiseDelay?: number
  readonly highlightToday?: boolean
  readonly radius?: StyleValue
  readonly locale?: string
  readonly withWeekNumber?: boolean
  readonly withCurrentTimeIndicator?: boolean
  readonly withCurrentTimeBubble?: boolean
  readonly forceCurrentTimeIndicator?: boolean
  readonly withAllDaySlots?: boolean
  readonly withHeader?: boolean
  readonly weekLabelFormat?: DateLabelFormat
  readonly slotHeight?: StyleValue
  readonly allDaySlotHeight?: StyleValue
  readonly maxHeight?: StyleValue
  readonly highlightBusinessHours?: boolean
  readonly businessHours?: readonly [string, string]
  readonly mode?: "default" | "static"
  readonly withEventsDragAndDrop?: boolean
  readonly withEventResize?: boolean
  readonly withDragSlotSelect?: boolean
  readonly withExternalEventDrop?: boolean
  readonly withInteractiveBackgroundEvents?: boolean
  readonly startScrollTime?: string
  readonly withAgenda?: boolean
  readonly recurrenceExpansionLimit?: number
}

export type WeekViewProps<M> = WeekViewOptions &
  StylesApiProps<WeekViewPart> & {
    readonly date: DateString
    readonly events?: ReadonlyArray<EventData>
    readonly now?: DateTimeString
    readonly labels?: Partial<ScheduleLabels>
    readonly renderEventBody?: (event: EventData) => Child
    readonly renderEvent?: RenderEvent<M>
    readonly renderWeekLabel?: (range: { readonly weekStart: DateString; readonly weekEnd: DateString }) => Child
    readonly getTimeSlotProps?: (slot: {
      readonly start: DateTimeString
      readonly end: DateTimeString
    }) => ReadonlyArray<Attribute<M>>
    readonly previousControlProps?: ReadonlyArray<Attribute<M>>
    readonly nextControlProps?: ReadonlyArray<Attribute<M>>
    readonly todayControlProps?: ReadonlyArray<Attribute<M>>
    readonly viewSelectProps?: ReadonlyArray<Attribute<M>>
    readonly onDateChange?: (date: DateString) => M
    readonly onViewChange?: (view: ScheduleViewLevel) => M
    readonly onDayClick?: (date: DateString) => M
    readonly onTimeSlotClick?: (slot: { readonly slotStart: DateTimeString; readonly slotEnd: DateTimeString }) => M
    readonly onAllDaySlotClick?: (date: DateString) => M
    readonly onEventClick?: (event: EventData) => M
    readonly model?: ViewModel
    readonly toParentMessage?: (message: ViewMessageType) => M
    readonly canDragEvent?: (event: EventData) => boolean
    readonly canResizeEvent?: (event: EventData) => boolean
  }

export type WeekViewConfig = ComponentConfig<WeekViewOptions, WeekViewPart>

const border = `light-dark(${palette.gray3}, ${palette.dark4})`

const styles = stylex.create({
  root: {
    [timeGridVars.slotHeight]: "64px",
    [timeGridVars.allDaySlotHeight]: "48px",
    [weekViewVars.radius]: radius.default
  },
  frame: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: border,
    borderRadius: weekViewVars.radius,
    overflow: "hidden"
  },
  scrollArea: { overflowY: "auto", maxHeight: weekViewVars.maxHeight },
  header: {
    display: "flex",
    position: "sticky",
    top: 0,
    zIndex: 6,
    backgroundColor: colors.body,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: border
  },
  corner: {
    height: "58px",
    flex: "0 0 80px",
    lineHeight: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  weekLabel: { textAlign: "center", marginBottom: "4px", fontSize: fontSize.sm },
  weekNumber: { fontWeight: fontWeight.medium, textAlign: "center", fontSize: fontSize.lg },
  dayLabel: {
    height: "58px",
    minWidth: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    lineHeight: 1,
    fontWeight: fontWeight.medium,
    fontFamily: "inherit",
    color: "inherit",
    userSelect: "none",
    cursor: "pointer",
    flex: 1,
    padding: 0,
    borderWidth: 0,
    borderInlineStartWidth: "1px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: border,
    backgroundColor: { default: "transparent", ":hover": `light-dark(${palette.gray0}, ${palette.dark6})` }
  },
  weekend: { color: colors.error },
  still: { cursor: "default", pointerEvents: "none" },
  weekday: { textAlign: "center", fontSize: fontSize.sm, textTransform: "capitalize" },
  dayNumber: {
    width: "26px",
    aspectRatio: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "100%",
    fontSize: fontSize.sm
  },
  today: { backgroundColor: accent.filled, color: accent.contrast },
  allDaySlots: {
    display: "flex",
    height: timeGridVars.allDaySlotHeight,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: border
  },
  allDayLabel: {
    flex: "0 0 80px",
    textAlign: "right",
    padding: "4px 8px",
    fontSize: fontSize.sm,
    boxSizing: "border-box"
  },
  allDayList: { position: "relative", flexGrow: 1, display: "flex" },
  allDayEvents: { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" },
  allDaySlot: {
    flex: 1,
    height: "100%",
    padding: 0,
    borderWidth: 0,
    borderInlineStartWidth: "1px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: border,
    cursor: "pointer",
    backgroundColor: { default: "transparent", ":hover": `light-dark(${palette.gray1}, ${palette.dark5})` }
  },
  inner: { display: "flex", position: "relative" },
  dropTarget: { backgroundColor: { default: accent.light, ":hover": accent.light } },
  labels: { flex: "0 0 80px" },
  day: {
    flex: 1,
    minWidth: "80px",
    borderInlineStartWidth: "1px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: border
  }
})

const timeGridParts = {
  slot: "weekViewDaySlot",
  slotLabel: "weekViewSlotLabel",
  backgroundEvent: "weekViewBackgroundEvent",
  currentTime: "weekViewCurrentTime",
  currentTimeBubble: "weekViewCurrentTimeBubble"
} as const

const agenda = AgendaView({})

const allDayDropDays = (interaction: Interaction, days: ReadonlyArray<DateString>): ReadonlyArray<DateString> => {
  if (interaction._tag !== "Dragging") return []
  if (interaction.target !== "midnight") return []

  return days.filter((day) => day >= dateOf(interaction.start) && day <= lastDayOf(interaction))
}

export const WeekView =
  (config: { readonly WeekView?: WeekViewConfig }) =>
  <M>(h: HtmlBuilder<M>, input: WeekViewProps<M>): Html => {
    const props = withDefaults(config.WeekView, input)
    const getStyles = stylesApi<M, WeekViewPart>(h, props, config.WeekView, "weekView")
    const labels = scheduleLabels(props.labels)
    const date = props.date
    const startTime = props.startTime ?? "00:00:00"
    const endTime = props.endTime ?? "23:59:59"
    const intervalMinutes = props.intervalMinutes ?? 60
    const locale = props.locale ?? "en"
    const isStatic = props.mode === "static"
    const week = {
      firstDayOfWeek: props.firstDayOfWeek ?? 1,
      weekendDays: props.weekendDays ?? [0, 6],
      withWeekendDays: props.withWeekendDays ?? true
    }
    const days = weekDays(date, week)
    const first = Arr.headNonEmpty(days)
    const last = Arr.lastNonEmpty(days)
    const expanded = expandRecurringEvents({
      events: props.events,
      rangeStart: `${first} 00:00:00`,
      rangeEnd: `${last} 23:59:59`,
      ...(props.recurrenceExpansionLimit === undefined ? {} : { expansionLimit: props.recurrenceExpansionLimit })
    })
    const data = weekViewEvents({
      ...week,
      events: expanded,
      date,
      startTime,
      endTime,
      intervalMinutes,
      eventOverlapMode: props.eventOverlapMode ?? "columns"
    })
    const forwarded = {
      ...(props.styles === undefined ? {} : { styles: props.styles }),
      ...(props.attributes === undefined ? {} : { attributes: props.attributes })
    }
    const send = props.toParentMessage
    const interactive = send !== undefined && props.model !== undefined && !isStatic
    const agendaOpen = props.withAgenda === true && props.model?.agendaOpen === true
    const grid = gridOf({ date, events: [], startTime, endTime, intervalMinutes })
    const part: GetStyles<M, TimeGridPart> = (name, ...rest) => getStyles(timeGridParts[name], ...rest)
    const settings: GridSettings = {
      slots: dayTimeIntervals({
        startTime,
        endTime,
        intervalMinutes,
        labelIntervalMinutes: props.slotLabelInterval ?? 60
      }),
      startTime,
      endTime,
      intervalMinutes,
      interval: clampIntervalMinutes(intervalMinutes),
      startMinutes: grid.startMinutes,
      span: grid.span,
      subHourLines: props.withSubHourGridLines ?? true,
      businessHours: props.businessHours ?? ["09:00:00", "17:00:00"],
      highlight: props.highlightBusinessHours ?? false,
      isStatic,
      labels,
      locale,
      slotLabelFormat: props.slotLabelFormat ?? "HH:mm"
    }
    const column: ColumnContext<M> = {
      ...settings,
      h,
      part,
      forwarded,
      cascade: props.eventOverlapMode === "cascade",
      interaction: props.model?.interaction.interaction ?? { _tag: "Idle" },
      selection: props.model === undefined ? Option.none() : selectedSlots(props.model.interaction),
      canDrag: (event) => interactive && props.withEventsDragAndDrop === true && (props.canDragEvent?.(event) ?? true),
      canResize: (event) => interactive && props.withEventResize === true && (props.canResizeEvent?.(event) ?? true),
      expanded,
      renderEventBody: props.renderEventBody,
      renderEvent: props.renderEvent,
      onEventClick: props.onEventClick,
      onTimeSlotClick: props.onTimeSlotClick,
      getTimeSlotProps: props.getTimeSlotProps,
      interactiveBackground: props.withInteractiveBackgroundEvents === true
    }
    const now = Option.fromNullishOr(props.now)
    const today = Option.getOrElse(Option.map(now, dateOf), () => date)
    const indicator = Option.flatMap(now, (current) =>
      Option.fromNullishOr(
        days.find((day) =>
          props.forceCurrentTimeIndicator === true
            ? dayOfWeek(day) === dayOfWeek(dateOf(current))
            : day === dateOf(current)
        )
      ).pipe(Option.map((day) => ({ day, time: current.slice(11) })))
    ).pipe(Option.filter(() => props.withCurrentTimeIndicator ?? true))
    const indicatorFor = (day: DateString) =>
      Option.match(
        Option.filter(indicator, (shown) => shown.day === day),
        {
          onNone: () => [],
          onSome: ({ time }) =>
            indicatorNodes(h, part, settings, {
              now: `${day} ${time}`,
              bubble: (props.withCurrentTimeBubble ?? true) && day === first,
              layout: [["insetInlineStart", day === first ? "-80px" : "0"]]
            })
        }
      )
    const isWeekend = (day: DateString) => week.weekendDays.includes(dayOfWeek(day))
    const isToday = (day: DateString) => props.highlightToday === true && Option.isSome(now) && day === today

    const dayLabel = (day: DateString, index: number) =>
      h.keyed("button")(
        day,
        [
          ...getStyles(
            "weekViewDayLabel",
            styles.dayLabel,
            isWeekend(day) && styles.weekend,
            isStatic && styles.still,
            shared.focusRing
          ),
          h.Type("button"),
          h.AriaLabel(`${labels.weekday} ${day}`),
          h.Tabindex(!isStatic && index === 0 ? 0 : -1),
          ...(isToday(day) ? [h.DataAttribute("today", "")] : []),
          ...(isWeekend(day) ? [h.DataAttribute("weekend", "")] : []),
          ...(props.onDayClick === undefined || isStatic ? [] : [h.OnClick(props.onDayClick(day))])
        ],
        [
          h.span(getStyles("weekViewDayWeekday", styles.weekday), [
            formatDateTime(`${day} 00:00:00`, props.weekdayFormat ?? "ddd", locale)
          ]),
          h.span(getStyles("weekViewDayNumber", styles.dayNumber, isToday(day) && styles.today), [
            String(Number(day.slice(8, 10)))
          ])
        ]
      )

    const allDayNode = (event: WeekAllDayEvent) =>
      ScheduleEvent(h, {
        ...forwarded,
        event,
        nowrap: true,
        static: isStatic,
        hanging: event.position.hanging,
        draggable: column.canDrag(event),
        dragging: column.interaction._tag === "Dragging" && column.interaction.eventId === event.id,
        renderEventBody: props.renderEventBody,
        renderEvent: props.renderEvent,
        ...(props.onEventClick === undefined || isStatic ? {} : { onClick: props.onEventClick(event) }),
        layout: setStyle(
          ["position", "absolute"],
          ["zIndex", "2"],
          ["pointerEvents", "auto"],
          ["top", `calc(${event.position.row * 50}% + 1px)`],
          ["left", `calc(${event.position.offset}% + 1px)`],
          ["width", `calc(${event.position.width}% - 1px)`],
          ["height", "calc(50% - 2px)"]
        )
      })

    const dropDays = allDayDropDays(column.interaction, days)
    const isDropTarget = (day: DateString) => dropDays.includes(day)

    const allDaySlot = (day: DateString, index: number) =>
      h.keyed("button")(
        `all-day-${day}`,
        [
          ...getStyles(
            "weekViewDaySlot",
            styles.allDaySlot,
            isStatic && timeGridStyles.still,
            isDropTarget(day) && styles.dropTarget
          ),
          h.Type("button"),
          ...(isDropTarget(day) ? [h.DataAttribute("drop-target", "")] : []),
          h.DataAttribute("all-day", ""),
          h.AriaLabel(`${labels.allDay} ${day}`),
          h.Tabindex(!isStatic && index === 0 ? 0 : -1),
          ...(props.onAllDaySlotClick === undefined || isStatic ? [] : [h.OnClick(props.onAllDaySlotClick(day))])
        ],
        []
      )

    const allDayBackground = data.dayEvents.flatMap((day, index) =>
      day.backgroundEvents
        .filter((event) => event.position.allDay)
        .map(
          backgroundNode(column, () => [
            ["top", "0"],
            ["height", "100%"],
            ["left", `${(index / days.length) * 100}%`],
            ["width", `${100 / days.length}%`]
          ])
        )
    )

    const dayColumn = (day: (typeof data.dayEvents)[number], index: number) =>
      h.keyed("div")(day.date, getStyles("weekViewDay", styles.day), [
        h.div(
          [
            ...getStyles("weekViewDaySlots", timeGridStyles.column),
            h.DataAttribute("time-grid", ""),
            h.DataAttribute("date", day.date),
            h.DataAttribute("grid-minutes", String(grid.span))
          ],
          columnChildren(column, {
            date: day.date,
            regularEvents: day.regularEvents,
            backgroundEvents: day.backgroundEvents.filter((event) => !event.position.allDay),
            indicator: indicatorFor(day.date),
            tabbable: index === 0
          })
        )
      ])

    const weekLabel =
      props.renderWeekLabel === undefined
        ? `${formatDateTime(`${first} 00:00:00`, props.weekLabelFormat ?? "MMM DD", locale)} – ${formatDateTime(`${last} 00:00:00`, props.weekLabelFormat ?? "MMM DD", locale)}, ${first.slice(0, 4)}`
        : props.renderWeekLabel({ weekStart: first, weekEnd: last })

    const header =
      (props.withHeader ?? true)
        ? [
            ScheduleHeader(h, {
              ...forwarded,
              view: "week",
              labels,
              title: weekLabel,
              ...(props.onDateChange === undefined
                ? {}
                : {
                    onPrevious: props.onDateChange(addDays(date, -7)),
                    onNext: props.onDateChange(addDays(date, 7)),
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

    const allDayRow =
      (props.withAllDaySlots ?? true)
        ? [
            h.div(
              [...getStyles("weekViewAllDaySlots", styles.allDaySlots), h.DataAttribute("all-day-row", "")],
              [
                h.div(getStyles("weekViewAllDaySlotsLabel", styles.allDayLabel), [labels.allDay]),
                h.div(getStyles("weekViewAllDaySlotsList", styles.allDayList), [
                  ...allDayBackground,
                  h.div(getStyles("weekViewAllDaySlotsEvents", styles.allDayEvents), data.allDayEvents.map(allDayNode)),
                  ...days.map(allDaySlot)
                ])
              ]
            )
          ]
        : []

    const frame = h.div(getStyles("weekViewRoot", styles.frame), [
      h.div(
        [
          ...getStyles("weekViewScrollArea", styles.scrollArea),
          h.OnMount(
            Mount.mapMessage(
              GridBehaviour({ startScrollTime: props.startScrollTime ?? "", layout: "columns" }),
              Function.absurd<M>
            )
          )
        ],
        [
          h.div(getStyles("weekViewHeader", styles.header), [
            h.div(
              getStyles("weekViewCorner", styles.corner),
              (props.withWeekNumber ?? true)
                ? [
                    h.div(getStyles("weekViewWeekLabel", styles.weekLabel), [labels.week]),
                    h.div(getStyles("weekViewWeekNumber", styles.weekNumber), [
                      String(weekNumber(weekDays(date, { firstDayOfWeek: 1 })))
                    ])
                  ]
                : []
            ),
            ...days.map(dayLabel)
          ]),
          h.div(
            [
              ...gestureFlags({
                drag: interactive && props.withEventsDragAndDrop === true,
                resize: interactive && props.withEventResize === true,
                select: interactive && props.withDragSlotSelect === true,
                external: interactive && props.withExternalEventDrop === true
              }).map((name) => h.DataAttribute(name, "")),
              ...(send === undefined
                ? []
                : [h.OnMount(Mount.mapMessage(WatchTimeGrid(), (message) => send(gotInteraction(message))))])
            ],
            [
              ...allDayRow,
              h.div(getStyles("weekViewInner", styles.inner), [
                h.div(getStyles("weekViewSlotLabels", styles.labels), labelNodes(h, part, settings, date)),
                ...data.dayEvents.map(dayColumn)
              ])
            ]
          )
        ]
      )
    ])

    return h.div(
      [
        ...getStyles(
          "weekView",
          styles.root,
          setDefinedVars(
            [weekViewVars.radius, props.radius === undefined ? undefined : radiusValue(props.radius)],
            [timeGridVars.slotHeight, props.slotHeight === undefined ? undefined : sizeValue(props.slotHeight)],
            [
              timeGridVars.allDaySlotHeight,
              props.allDaySlotHeight === undefined ? undefined : sizeValue(props.allDaySlotHeight)
            ],
            [weekViewVars.maxHeight, props.maxHeight === undefined ? undefined : sizeValue(props.maxHeight)],
            [
              "--event-raise-delay",
              props.eventOverlapRaiseDelay === undefined ? undefined : `${props.eventOverlapRaiseDelay}ms`
            ]
          )
        ),
        ...(isStatic ? [h.DataAttribute("static", "")] : []),
        ...((props.withWeekendDays ?? true) ? [h.DataAttribute("with-weekends", "")] : [])
      ],
      [
        ...header,
        ...(agendaOpen
          ? [
              agenda(h, {
                ...forwarded,
                rangeStart: first,
                rangeEnd: last,
                events: props.events,
                locale,
                labels: props.labels,
                mode: props.mode,
                onEventClick: props.onEventClick,
                recurrenceExpansionLimit: props.recurrenceExpansionLimit
              })
            ]
          : [frame])
      ]
    )
  }
