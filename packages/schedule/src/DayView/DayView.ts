import * as stylex from "@stylexjs/stylex"
import { Function, Option } from "effect"
import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "@sth-ui/core/content.ts"
import { radiusValue, sizeValue } from "@sth-ui/core/styles/styleProps.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { setDefinedVars, setStyle, stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { radius } from "@sth-ui/core/theme/tokens.stylex.ts"
import { addDays } from "@sth-ui/dates/date/date.ts"
import type { DateString } from "@sth-ui/dates/date/date.ts"
import { clampIntervalMinutes, dayTimeIntervals, dayViewEvents } from "../dayLayout.ts"
import type { DayPositionedEvent, EventOverlapMode } from "../dayLayout.ts"
import { dateOf } from "../datetime.ts"
import type { DateTimeString } from "../datetime.ts"
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
import { dayViewVars } from "./DayView.stylex.ts"
import {
  backgroundNode,
  columnBackgroundLayout,
  columnChildren,
  indicatorNodes,
  labelNodes,
  GridBehaviour,
  timeGridStyles
} from "../TimeGrid/TimeGrid.ts"
import type { ColumnContext, GridSettings, TimeGridPart } from "../TimeGrid/TimeGrid.ts"
import { timeGridVars } from "../TimeGrid/TimeGrid.stylex.ts"
import { gridOf, selectedSlots } from "./interaction.ts"
import { gotInteraction, gotMoreEvents, Message as DayViewMessages } from "./model.ts"
import type { Message as DayViewMessage, Model as DayViewModel } from "./model.ts"
import { AgendaView } from "../AgendaView/AgendaView.ts"
import type { AgendaViewPart } from "../AgendaView/AgendaView.ts"
import { MoreEvents } from "../MoreEvents/MoreEvents.ts"
import type { MoreEventsPart } from "../MoreEvents/MoreEvents.ts"
import { gestureFlags, WatchTimeGrid } from "./pointer.ts"

export type DayViewPart =
  | ScheduleHeaderPart
  | ScheduleEventPart
  | MoreEventsPart
  | AgendaViewPart
  | "dayView"
  | "dayViewScrollArea"
  | "dayViewInner"
  | "dayViewSlotLabels"
  | "dayViewSlotLabel"
  | "dayViewSlots"
  | "dayViewAllDay"
  | "dayViewAllDayEvents"
  | "dayViewTimeSlots"
  | "dayViewSlot"
  | "dayViewBackgroundEvent"
  | "dayViewCurrentTime"
  | "dayViewCurrentTimeBubble"

export type DayViewOptions = {
  readonly startTime?: string
  readonly endTime?: string
  readonly intervalMinutes?: number
  readonly withSubHourGridLines?: boolean
  readonly eventOverlapMode?: EventOverlapMode
  readonly withAllDaySlot?: boolean
  readonly locale?: string
  readonly radius?: StyleValue
  readonly slotLabelFormat?: DateLabelFormat
  readonly slotLabelInterval?: number
  readonly headerFormat?: DateLabelFormat
  readonly withCurrentTimeIndicator?: boolean
  readonly withCurrentTimeBubble?: boolean
  readonly withHeader?: boolean
  readonly slotHeight?: StyleValue
  readonly allDaySlotHeight?: StyleValue
  readonly maxHeight?: StyleValue
  readonly highlightBusinessHours?: boolean
  readonly businessHours?: readonly [string, string]
  readonly mode?: "default" | "static"
  readonly recurrenceExpansionLimit?: number
  readonly withEventsDragAndDrop?: boolean
  readonly withEventResize?: boolean
  readonly withDragSlotSelect?: boolean
  readonly eventOverlapRaiseDelay?: number
  readonly startScrollTime?: string
  readonly withInteractiveBackgroundEvents?: boolean
  readonly withExternalEventDrop?: boolean
  readonly withAgenda?: boolean
}

export type DayViewProps<M> = DayViewOptions &
  StylesApiProps<DayViewPart> & {
    readonly date: DateString
    readonly events?: ReadonlyArray<EventData>
    readonly now?: DateTimeString
    readonly labels?: Partial<ScheduleLabels>
    readonly renderEventBody?: (event: EventData) => Child
    readonly renderEvent?: RenderEvent<M>
    readonly previousControlProps?: ReadonlyArray<Attribute<M>>
    readonly nextControlProps?: ReadonlyArray<Attribute<M>>
    readonly todayControlProps?: ReadonlyArray<Attribute<M>>
    readonly viewSelectProps?: ReadonlyArray<Attribute<M>>
    readonly getTimeSlotProps?: (slot: {
      readonly start: DateTimeString
      readonly end: DateTimeString
    }) => ReadonlyArray<Attribute<M>>
    readonly onDateChange?: (date: DateString) => M
    readonly onViewChange?: (view: ScheduleViewLevel) => M
    readonly onTimeSlotClick?: (slot: { readonly slotStart: DateTimeString; readonly slotEnd: DateTimeString }) => M
    readonly onAllDaySlotClick?: (date: DateString) => M
    readonly onEventClick?: (event: EventData) => M
    readonly model?: DayViewModel
    readonly toParentMessage?: (message: DayViewMessage) => M
    readonly canDragEvent?: (event: EventData) => boolean
    readonly canResizeEvent?: (event: EventData) => boolean
  }

export type DayViewConfig = ComponentConfig<DayViewOptions, DayViewPart>

const border = `light-dark(${palette.gray3}, ${palette.dark4})`

const styles = stylex.create({
  root: {
    [timeGridVars.slotHeight]: "64px",
    [timeGridVars.allDaySlotHeight]: "44px",
    [dayViewVars.radius]: radius.default,
    borderRadius: dayViewVars.radius
  },
  scrollArea: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: border,
    borderRadius: dayViewVars.radius,
    overflowY: "auto",
    maxHeight: dayViewVars.maxHeight
  },
  inner: { display: "flex" },
  labels: { width: "80px", flexShrink: 0 },
  allDayLabel: { height: timeGridVars.allDaySlotHeight, borderTopWidth: 0 },
  slots: { flexGrow: 1, minWidth: 0 },
  allDay: { position: "relative", height: timeGridVars.allDaySlotHeight },
  allDayEvents: {
    position: "absolute",
    inset: "2px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    zIndex: 3,
    pointerEvents: "none",
    overflowY: "auto"
  }
})

const agenda = AgendaView({})

const maxAllDay = 2

const visibleAllDay = <A>(events: ReadonlyArray<A>): ReadonlyArray<A> =>
  events.length > maxAllDay ? events.slice(0, maxAllDay - 1) : events

const timeGridParts = {
  slot: "dayViewSlot",
  slotLabel: "dayViewSlotLabel",
  backgroundEvent: "dayViewBackgroundEvent",
  currentTime: "dayViewCurrentTime",
  currentTimeBubble: "dayViewCurrentTimeBubble"
} as const

export const DayView =
  (config: { readonly DayView?: DayViewConfig }) =>
  <M>(h: HtmlBuilder<M>, input: DayViewProps<M>): Html => {
    const props = withDefaults(config.DayView, input)
    const getStyles = stylesApi<M, DayViewPart>(h, props, config.DayView, "dayView")
    const labels = scheduleLabels(props.labels)
    const date = props.date
    const startTime = props.startTime ?? "00:00:00"
    const endTime = props.endTime ?? "23:59:59"
    const intervalMinutes = props.intervalMinutes ?? 15
    const interval = clampIntervalMinutes(intervalMinutes)
    const locale = props.locale ?? "en"
    const isStatic = props.mode === "static"
    const subHourLines = props.withSubHourGridLines ?? true
    const businessHours = props.businessHours ?? ["09:00:00", "17:00:00"]
    const highlight = props.highlightBusinessHours ?? false
    const slotLabelFormat = props.slotLabelFormat ?? "HH:mm"
    const slots = dayTimeIntervals({
      startTime,
      endTime,
      intervalMinutes,
      labelIntervalMinutes: props.slotLabelInterval ?? 60
    })
    const expanded = expandRecurringEvents({
      events: props.events,
      rangeStart: `${date} 00:00:00`,
      rangeEnd: `${date} 23:59:59`,
      ...(props.recurrenceExpansionLimit === undefined ? {} : { expansionLimit: props.recurrenceExpansionLimit })
    })
    const data = dayViewEvents({
      events: expanded,
      date,
      startTime,
      endTime,
      intervalMinutes,
      eventOverlapMode: props.eventOverlapMode ?? "columns"
    })
    const cascade = props.eventOverlapMode === "cascade"
    const forwarded = {
      ...(props.styles === undefined ? {} : { styles: props.styles }),
      ...(props.attributes === undefined ? {} : { attributes: props.attributes })
    }
    const agendaOpen = props.withAgenda === true && props.model?.agendaOpen === true
    const send = props.toParentMessage
    const interactive = send !== undefined && props.model !== undefined && !isStatic
    const grid = gridOf({ date, events: [], startTime, endTime, intervalMinutes })
    const part: GetStyles<M, TimeGridPart> = (name, ...rest) => getStyles(timeGridParts[name], ...rest)
    const settings: GridSettings = {
      slots,
      startTime,
      endTime,
      intervalMinutes,
      interval,
      startMinutes: grid.startMinutes,
      span: grid.span,
      subHourLines,
      businessHours,
      highlight,
      isStatic,
      labels,
      locale,
      slotLabelFormat
    }
    const column: ColumnContext<M> = {
      ...settings,
      h,
      part,
      forwarded,
      cascade,
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

    const allDayNode = (event: DayPositionedEvent) =>
      ScheduleEvent(h, {
        ...forwarded,
        event,
        nowrap: true,
        static: isStatic,
        renderEventBody: props.renderEventBody,
        renderEvent: props.renderEvent,
        ...(props.onEventClick === undefined || isStatic ? {} : { onClick: props.onEventClick(event) }),
        layout: setStyle(["pointerEvents", "auto"], ["maxHeight", "50%"], ["flexShrink", "0"])
      })

    const moreNode = (events: ReadonlyArray<DayPositionedEvent>): ReadonlyArray<Html> =>
      events.length > maxAllDay
        ? [
            MoreEvents(h, {
              ...forwarded,
              events,
              moreEventsCount: events.length - (maxAllDay - 1),
              labels,
              static: isStatic,
              renderEventBody: props.renderEventBody,
              renderEvent: props.renderEvent,
              onEventClick: props.onEventClick,
              ...(props.model === undefined || send === undefined
                ? {}
                : {
                    popover: {
                      model: props.model.moreEvents,
                      toParentMessage: (message) => send(gotMoreEvents(message))
                    }
                  })
            })
          ]
        : []

    const now = Option.fromNullishOr(props.now)
    const indicator = Option.filter(
      now,
      (current) => (props.withCurrentTimeIndicator ?? true) && dateOf(current) === date
    ).pipe(
      Option.match({
        onNone: () => [],
        onSome: (current) =>
          indicatorNodes(h, part, settings, { now: current, bubble: props.withCurrentTimeBubble ?? true, layout: [] })
      })
    )

    const today = Option.getOrElse(Option.map(now, dateOf), () => date)
    const header =
      (props.withHeader ?? true)
        ? [
            ScheduleHeader(h, {
              ...forwarded,
              view: "day",
              labels,
              title: formatDateTime(`${date} 00:00:00`, props.headerFormat ?? "MMMM D, YYYY", locale),
              ...(props.onDateChange === undefined
                ? {}
                : {
                    onPrevious: props.onDateChange(addDays(date, -1)),
                    onNext: props.onDateChange(addDays(date, 1)),
                    onToday: props.onDateChange(today)
                  }),
              ...(props.onViewChange === undefined ? {} : { onViewChange: props.onViewChange }),
              ...(props.withAgenda === true && send !== undefined && props.model !== undefined
                ? { onAgendaClick: send(DayViewMessages.ToggledAgenda()), agendaActive: props.model.agendaOpen }
                : {}),
              ...(props.previousControlProps === undefined ? {} : { previousControlProps: props.previousControlProps }),
              ...(props.nextControlProps === undefined ? {} : { nextControlProps: props.nextControlProps }),
              ...(props.todayControlProps === undefined ? {} : { todayControlProps: props.todayControlProps }),
              ...(props.viewSelectProps === undefined ? {} : { viewSelectProps: props.viewSelectProps })
            })
          ]
        : []

    return h.div(
      [
        ...getStyles(
          "dayView",
          styles.root,
          setDefinedVars(
            [dayViewVars.radius, props.radius === undefined ? undefined : radiusValue(props.radius)],
            [timeGridVars.slotHeight, props.slotHeight === undefined ? undefined : sizeValue(props.slotHeight)],
            [
              timeGridVars.allDaySlotHeight,
              props.allDaySlotHeight === undefined ? undefined : sizeValue(props.allDaySlotHeight)
            ],
            [dayViewVars.maxHeight, props.maxHeight === undefined ? undefined : sizeValue(props.maxHeight)],
            [
              "--event-raise-delay",
              props.eventOverlapRaiseDelay === undefined ? undefined : `${props.eventOverlapRaiseDelay}ms`
            ]
          )
        ),
        ...(isStatic ? [h.DataAttribute("static", "")] : []),
        ...(subHourLines ? [] : [h.DataAttribute("hide-sub-hour-grid-lines", "")])
      ],
      [
        ...header,
        ...(agendaOpen
          ? [
              agenda(h, {
                ...forwarded,
                rangeStart: date,
                rangeEnd: date,
                events: props.events,
                locale,
                labels: props.labels,
                mode: props.mode,
                onEventClick: props.onEventClick,
                recurrenceExpansionLimit: props.recurrenceExpansionLimit
              })
            ]
          : [
              h.div(
                [
                  ...getStyles("dayViewScrollArea", styles.scrollArea),
                  h.OnMount(
                    Mount.mapMessage(
                      GridBehaviour({ startScrollTime: props.startScrollTime ?? "", layout: "columns" }),
                      Function.absurd<M>
                    )
                  )
                ],
                [
                  h.div(getStyles("dayViewInner", styles.inner), [
                    h.div(getStyles("dayViewSlotLabels", styles.labels), [
                      ...((props.withAllDaySlot ?? true)
                        ? [
                            h.div(
                              [
                                ...getStyles("dayViewSlotLabel", timeGridStyles.label, styles.allDayLabel),
                                h.DataAttribute("all-day", "")
                              ],
                              [labels.allDay]
                            )
                          ]
                        : []),
                      ...labelNodes(h, part, settings, date)
                    ]),
                    h.div(
                      [
                        ...getStyles("dayViewSlots", styles.slots),
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
                        ...((props.withAllDaySlot ?? true)
                          ? [
                              h.div(getStyles("dayViewAllDay", styles.allDay), [
                                ...data.backgroundAllDayEvents.map(backgroundNode(column, columnBackgroundLayout)),
                                h.div(getStyles("dayViewAllDayEvents", styles.allDayEvents), [
                                  ...visibleAllDay(data.allDayEvents).map(allDayNode),
                                  ...moreNode(data.allDayEvents)
                                ]),
                                h.button(
                                  [
                                    ...getStyles(
                                      "dayViewSlot",
                                      timeGridStyles.slot,
                                      timeGridStyles.allDaySlot,
                                      isStatic && timeGridStyles.still
                                    ),
                                    h.Type("button"),
                                    h.DataAttribute("all-day", ""),
                                    h.AriaLabel(`${labels.timeSlot} ${labels.allDay}`),
                                    ...(props.onAllDaySlotClick === undefined || isStatic
                                      ? []
                                      : [h.OnClick(props.onAllDaySlotClick(date))])
                                  ],
                                  []
                                )
                              ])
                            ]
                          : []),
                        h.div(
                          [
                            ...getStyles("dayViewTimeSlots", timeGridStyles.column),
                            h.DataAttribute("time-grid", ""),
                            h.DataAttribute("grid-minutes", String(grid.span)),
                            h.DataAttribute("date", date)
                          ],
                          [
                            ...columnChildren(column, {
                              date,
                              regularEvents: data.regularEvents,
                              backgroundEvents: data.backgroundTimedEvents,
                              indicator,
                              tabbable: true
                            })
                          ]
                        )
                      ]
                    )
                  ])
                ]
              )
            ])
      ]
    )
  }
