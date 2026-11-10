import * as stylex from "@stylexjs/stylex"
import { Array as Arr, Function, Option } from "effect"
import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Message as PopoverMessage } from "@foldkit/ui/popover"
import type { Child } from "@sth-ui/core/content.ts"
import { radiusValue, sizeValue } from "@sth-ui/core/styles/styleProps.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { setDefinedVars, setStyle, setVars } from "@sth-ui/core/styles/StylesApi.ts"
import type { GetStyles, PartAttributes, PartStyles } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, radius } from "@sth-ui/core/theme/tokens.stylex.ts"
import type { DateString } from "@sth-ui/dates/date/date.ts"
import { businessHoursState } from "../businessHours.ts"
import { clampIntervalMinutes, currentTimePosition, dayTimeIntervals } from "../dayLayout.ts"
import type { DayPositionedEvent, DayTimeInterval } from "../dayLayout.ts"
import { dateOf, minutesBetween } from "../datetime.ts"
import type { DateTimeString } from "../datetime.ts"
import { gridOf, selectedSlots } from "../DayView/interaction.ts"
import type { Interaction } from "../DayView/interaction.ts"
import { gotInteraction, gotMoreEvents, Message as ViewMessages } from "../DayView/model.ts"
import type { Message as ViewMessage, Model as ViewModel } from "../DayView/model.ts"
import { gestureFlags, WatchTimeGrid } from "../DayView/pointer.ts"
import type { EventId, ScheduleEvent as EventData, ScheduleResource, ScheduleResourceGroup } from "../events.ts"
import { formatDateTime } from "../format.ts"
import type { DateLabelFormat } from "../format.ts"
import type { ScheduleLabels } from "../labels.ts"
import { MoreEvents } from "../MoreEvents/MoreEvents.ts"
import { overflows } from "../resourcesLayout.ts"
import type { ResourceRow } from "../resourcesLayout.ts"
import { ScheduleEvent } from "../ScheduleEvent/ScheduleEvent.ts"
import type { RenderEvent } from "../ScheduleEvent/ScheduleEvent.ts"
import { GridBehaviour } from "../TimeGrid/TimeGrid.ts"
import { timelineVars } from "./Timeline.stylex.ts"

export type TimelinePart =
  | "frame"
  | "scroll"
  | "inner"
  | "labelsRow"
  | "corner"
  | "timeLabel"
  | "dayLabel"
  | "row"
  | "group"
  | "label"
  | "slots"
  | "slot"
  | "wrapper"
  | "allDay"
  | "background"
  | "now"

export type TimelineSegment = {
  readonly date: DateString
  readonly regularEvents: ReadonlyArray<DayPositionedEvent>
  readonly backgroundEvents: ReadonlyArray<DayPositionedEvent>
}

export type TimelineBar = {
  readonly event: EventData
  readonly offset: number
  readonly width: number
  readonly row: number
}

export type TimelineRow = ResourceRow & {
  readonly segments: ReadonlyArray<TimelineSegment>
  readonly bars: ReadonlyArray<TimelineBar>
}

export type ResourceSlot = {
  readonly resourceId: EventId
  readonly slotStart: DateTimeString
  readonly slotEnd: DateTimeString
}

export type TimelineOptions = {
  readonly startTime?: string
  readonly endTime?: string
  readonly intervalMinutes?: number
  readonly minEventSize?: number
  readonly slotLabelFormat?: DateLabelFormat
  readonly radius?: StyleValue
  readonly locale?: string
  readonly withCurrentTimeIndicator?: boolean
  readonly slotWidth?: StyleValue
  readonly rowHeight?: StyleValue
  readonly groupLabelWidth?: StyleValue
  readonly maxHeight?: StyleValue
  readonly highlightBusinessHours?: boolean
  readonly businessHours?: readonly [string, string]
  readonly mode?: "default" | "static"
  readonly withEventsDragAndDrop?: boolean
  readonly withEventResize?: boolean
  readonly withDragSlotSelect?: boolean
  readonly withExternalEventDrop?: boolean
  readonly withInteractiveBackgroundEvents?: boolean
  readonly maxEventsPerTimeSlot?: number
  readonly recurrenceExpansionLimit?: number
}

export type TimelineProps<M> = TimelineOptions & {
  readonly styles?: PartStyles<string>
  readonly attributes?: PartAttributes<string>
  readonly now?: DateTimeString
  readonly renderEventBody?: (event: EventData) => Child
  readonly renderEvent?: RenderEvent<M>
  readonly renderResourceLabel?: (resource: ScheduleResource) => Child
  readonly renderGroupLabel?: (group: ScheduleResourceGroup) => Child
  readonly previousControlProps?: ReadonlyArray<Attribute<M>>
  readonly nextControlProps?: ReadonlyArray<Attribute<M>>
  readonly todayControlProps?: ReadonlyArray<Attribute<M>>
  readonly viewSelectProps?: ReadonlyArray<Attribute<M>>
  readonly onTimeSlotClick?: (slot: ResourceSlot) => M
  readonly onEventClick?: (event: EventData) => M
  readonly model?: ViewModel
  readonly toParentMessage?: (message: ViewMessage) => M
  readonly canDragEvent?: (event: EventData) => boolean
  readonly canResizeEvent?: (event: EventData) => boolean
}

export type TimelineInput<M> = {
  readonly h: HtmlBuilder<M>
  readonly props: TimelineProps<M>
  readonly part: GetStyles<M, TimelinePart>
  readonly labels: ScheduleLabels
  readonly days: Arr.NonEmptyReadonlyArray<DateString>
  readonly rows: ReadonlyArray<TimelineRow>
  readonly expanded: ReadonlyArray<EventData>
  readonly dayLabel: Option.Option<(date: DateString) => string>
  readonly startScrollTime: string
}

const borderColor = `light-dark(${palette.gray3}, ${palette.dark4})`
const border = `1px solid ${borderColor}`
const hover = `light-dark(${palette.gray1}, ${palette.dark5})`
const businessBg = `light-dark(${palette.white}, ${palette.dark7})`
const offBg = `light-dark(${palette.gray0}, ${palette.dark6})`

export const timelineStyles = stylex.create({
  root: {
    [timelineVars.radius]: radius.default,
    [timelineVars.slotWidth]: "80px",
    [timelineVars.rowHeight]: "64px",
    [timelineVars.groupLabelWidth]: "80px"
  },
  frame: { border, borderRadius: timelineVars.radius, overflow: "hidden" },
  scroll: { overflow: "auto", maxHeight: timelineVars.maxHeight },
  inner: { display: "inline-flex", flexDirection: "column", minWidth: "100%" },
  labelsRow: {
    display: "flex",
    borderBottom: border,
    position: "sticky",
    top: 0,
    zIndex: 6,
    backgroundColor: colors.body
  },
  corner: {
    flex: "0 0 auto",
    display: "flex",
    position: "sticky",
    insetInlineStart: 0,
    zIndex: 7,
    backgroundColor: colors.body
  },
  cornerCell: { flex: "0 0 120px", borderInlineEnd: border },
  groupCorner: { flex: `0 0 ${timelineVars.groupLabelWidth}`, borderInlineEnd: border },
  dayColumn: { display: "flex", flexDirection: "column" },
  dayLabel: {
    padding: "4px 6px",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    borderBottom: border,
    borderInlineEnd: border,
    whiteSpace: "nowrap"
  },
  times: { display: "flex" },
  timeLabel: {
    flex: `0 0 calc(${timelineVars.slotWidth} * var(--slot-label-size, 1))`,
    boxSizing: "border-box",
    padding: "4px 6px",
    fontSize: fontSize.xs,
    borderInlineEnd: border,
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums"
  },
  row: { display: "flex", borderTop: { default: border, ":first-of-type": "none" } },
  sticky: { position: "sticky", insetInlineStart: 0, zIndex: 5, display: "flex", backgroundColor: colors.body },
  group: {
    flex: `0 0 ${timelineVars.groupLabelWidth}`,
    boxSizing: "border-box",
    borderInlineEnd: border,
    padding: "6px",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium
  },
  groupHidden: { color: "transparent" },
  label: {
    flex: "0 0 120px",
    boxSizing: "border-box",
    minHeight: timelineVars.rowHeight,
    padding: "6px 8px",
    borderInlineEnd: border,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    display: "flex",
    alignItems: "center"
  },
  segments: { position: "relative", display: "flex" },
  slots: { position: "relative", display: "flex", minHeight: timelineVars.rowHeight, borderInlineEnd: border },
  barsOffset: { paddingTop: "calc(22px * var(--bar-rows, 0))" },
  slot: {
    flex: `0 0 calc(${timelineVars.slotWidth} * var(--slot-size))`,
    boxSizing: "border-box",
    padding: 0,
    borderWidth: 0,
    borderInlineEnd: `1px dotted ${borderColor}`,
    backgroundColor: { default: "transparent", ":hover": hover },
    cursor: "pointer",
    outlineOffset: "-2px"
  },
  hourEnd: { borderInlineEnd: border },
  still: { cursor: "default", pointerEvents: "none" },
  business: { backgroundColor: { default: businessBg, ":hover": hover } },
  nonBusiness: { backgroundColor: { default: offBg, ":hover": hover } },
  partial: {
    backgroundImage: `linear-gradient(to right, ${offBg} var(--business-hours-from), ${businessBg} var(--business-hours-from), ${businessBg} var(--business-hours-to), ${offBg} var(--business-hours-to))`
  },
  selected: { backgroundColor: { default: accent.light, ":hover": accent.light } },
  wrapper: {
    position: "absolute",
    display: "flex",
    zIndex: 3,
    boxSizing: "border-box",
    padding: "1px",
    pointerEvents: "none"
  },
  bar: {
    position: "absolute",
    height: "20px",
    display: "flex",
    zIndex: 4,
    boxSizing: "border-box",
    padding: "1px",
    pointerEvents: "none"
  },
  background: {
    position: "absolute",
    top: 0,
    bottom: 0,
    zIndex: 2,
    pointerEvents: "none",
    overflow: "hidden",
    fontSize: "12px",
    fontWeight: fontWeight.medium,
    padding: "3px 4px",
    boxSizing: "border-box",
    backgroundColor: accent.light,
    color: accent.lightColor,
    opacity: 0.6,
    borderWidth: 0,
    fontFamily: "inherit",
    textAlign: "start"
  },
  interactiveBackground: { pointerEvents: "auto", cursor: "pointer" },
  more: {
    position: "absolute",
    bottom: 0,
    height: "22px",
    paddingInline: "4px",
    display: "flex",
    zIndex: 4,
    pointerEvents: "auto"
  },
  preview: { position: "absolute", top: "2px", bottom: "2px", display: "flex", zIndex: 5, pointerEvents: "none" },
  now: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "1px",
    backgroundColor: palette.red6,
    zIndex: 4,
    pointerEvents: "none"
  }
})

const styles = timelineStyles

export const timelineVarsFor = (props: TimelineOptions) =>
  setDefinedVars(
    [timelineVars.radius, props.radius === undefined ? undefined : radiusValue(props.radius)],
    [timelineVars.slotWidth, props.slotWidth === undefined ? undefined : sizeValue(props.slotWidth)],
    [timelineVars.rowHeight, props.rowHeight === undefined ? undefined : sizeValue(props.rowHeight)],
    [timelineVars.groupLabelWidth, props.groupLabelWidth === undefined ? undefined : sizeValue(props.groupLabelWidth)],
    [timelineVars.maxHeight, props.maxHeight === undefined ? undefined : sizeValue(props.maxHeight)]
  )

const businessStyle = (state: ReturnType<typeof businessHoursState>) => {
  if (state._tag === "Business") return [styles.business]
  if (state._tag === "NonBusiness") return [styles.nonBusiness]
  if (state._tag === "Partial") {
    return [
      styles.partial,
      setVars(["--business-hours-from", `${state.from}%`], ["--business-hours-to", `${state.to}%`])
    ]
  }

  return []
}

const continuesGroup = (row: ResourceRow) =>
  Option.exists(row.group, (group) => group.position === "middle" || group.position === "last")

const draggedHere = (
  interaction: Extract<Interaction, { _tag: "Dragging" }>,
  resource: ScheduleResource,
  date: DateString
) => Option.contains(interaction.resourceId, resource.id) && dateOf(interaction.start) === date

const barRows = (row: TimelineRow) => (row.bars.length === 0 ? 0 : Math.max(...row.bars.map((bar) => bar.row)) + 1)

const covers = (
  selected: { readonly date: string; readonly first: number; readonly last: number },
  date: DateString,
  index: number
) => {
  if (selected.date !== date) return false

  return index >= selected.first && index <= selected.last
}

export const timeline = <M>(input: TimelineInput<M>): Html => {
  const { h, props, part, labels, days, rows, expanded } = input
  const startTime = props.startTime ?? "00:00:00"
  const endTime = props.endTime ?? "23:59:59"
  const intervalMinutes = props.intervalMinutes ?? 60
  const interval = clampIntervalMinutes(intervalMinutes)
  const locale = props.locale ?? "en"
  const isStatic = props.mode === "static"
  const max = Math.max(1, props.maxEventsPerTimeSlot ?? 2)
  const minSize = props.minEventSize ?? 1
  const businessHours = props.businessHours ?? ["09:00:00", "17:00:00"]
  const highlight = props.highlightBusinessHours ?? false
  const slots = dayTimeIntervals({ startTime, endTime, intervalMinutes, labelIntervalMinutes: interval })
  const grid = gridOf({ date: Arr.headNonEmpty(days), events: [], startTime, endTime, intervalMinutes })
  const percentOf = (date: DateString, value: DateTimeString) =>
    ((minutesBetween(`${date} 00:00:00`, value) - grid.startMinutes) / grid.span) * 100
  const hasGroups = rows.some((row) => Option.isSome(row.group))
  const forwarded = {
    ...(props.styles === undefined ? {} : { styles: props.styles }),
    ...(props.attributes === undefined ? {} : { attributes: props.attributes })
  }
  const send = props.toParentMessage
  const interactive = send !== undefined && props.model !== undefined && !isStatic
  const interaction: Interaction = props.model?.interaction.interaction ?? { _tag: "Idle" }
  const selection = props.model === undefined ? Option.none() : selectedSlots(props.model.interaction)
  const selectedResource = interaction._tag === "Selecting" ? interaction.resourceId : Option.none()
  const isSelected = (resource: ScheduleResource, date: DateString, index: number) =>
    Option.match(selection, {
      onNone: () => false,
      onSome: (selected) => Option.contains(selectedResource, resource.id) && covers(selected, date, index)
    })
  const canDrag = (event: EventData) =>
    interactive && props.withEventsDragAndDrop === true && (props.canDragEvent?.(event) ?? true)
  const canResize = (event: EventData) =>
    interactive && props.withEventResize === true && (props.canResizeEvent?.(event) ?? true)
  const firstResource = rows[0]?.resource.id
  const firstDay = Arr.headNonEmpty(days)

  const slotNode = (resource: ScheduleResource, date: DateString) => (slot: DayTimeInterval, index: number) => {
    const slotStart = `${date} ${slot.startTime}`
    const slotEnd = `${date} ${slot.endTime}`
    const state = businessHoursState({ start: slot.startTime, end: slot.endTime, businessHours, highlight })
    const selected = isSelected(resource, date, index)

    return h.keyed("button")(
      slot.startTime,
      [
        ...part(
          "slot",
          styles.slot,
          slot.isHourStart && styles.hourEnd,
          isStatic && styles.still,
          ...businessStyle(state),
          selected && styles.selected,
          setVars(["--slot-size", String(interval / 60)])
        ),
        h.Type("button"),
        h.DataAttribute("time-slot", ""),
        h.DataAttribute("slot-start", slot.startTime),
        ...(selected ? [h.DataAttribute("selected", "")] : []),
        h.AriaLabel(`${labels.resourceSlot} ${resource.label} ${date} ${slot.startTime} - ${slot.endTime}`),
        h.Tabindex(!isStatic && index === 0 && date === firstDay && resource.id === firstResource ? 0 : -1),
        ...(props.onTimeSlotClick === undefined || isStatic
          ? []
          : [h.OnClick(props.onTimeSlotClick({ resourceId: resource.id, slotStart, slotEnd }))])
      ],
      []
    )
  }

  const eventNode = (date: DateString) => (event: DayPositionedEvent) => {
    const resizing = interaction._tag === "Resizing" && interaction.eventId === event.id
    const left = resizing ? percentOf(date, interaction.start) : event.position.top
    const width = resizing ? percentOf(date, interaction.end) - left : event.position.height
    const lanes = event.position.overlaps > max

    return h.keyed("div")(
      `wrapper-${event.id}`,
      part(
        "wrapper",
        styles.wrapper,
        setStyle(
          ["left", `${left}%`],
          ["width", `max(${width}%, ${minSize}px)`],
          ["top", lanes ? `calc((100% - 22px) * ${event.position.column} / ${max})` : `${event.position.offset}%`],
          ["height", lanes ? `calc((100% - 22px) / ${max})` : `${event.position.width}%`]
        )
      ),
      [
        ScheduleEvent(h, {
          ...forwarded,
          event,
          nowrap: true,
          static: isStatic,
          draggable: canDrag(event),
          dragging: interaction._tag === "Dragging" && interaction.eventId === event.id,
          resizable: canResize(event),
          resizeAxis: "horizontal",
          resizing,
          invalid: resizing && !interaction.valid,
          renderEventBody: props.renderEventBody,
          renderEvent: props.renderEvent,
          ...(props.onEventClick === undefined || isStatic ? {} : { onClick: props.onEventClick(event) }),
          layout: setStyle(["flexGrow", "1"], ["pointerEvents", "auto"])
        })
      ]
    )
  }

  const backgroundNode = (event: DayPositionedEvent) => {
    const click =
      props.withInteractiveBackgroundEvents === true && props.onEventClick !== undefined && !isStatic
        ? [h.Type("button"), h.OnClick(props.onEventClick(event))]
        : []

    return h.keyed(click.length > 0 ? "button" : "div")(
      `background-${event.id}`,
      [
        ...click,
        ...part(
          "background",
          styles.background,
          click.length > 0 && styles.interactiveBackground,
          setStyle(
            ["left", `${event.position.allDay ? 0 : event.position.top}%`],
            ["width", `${event.position.allDay ? 100 : event.position.height}%`]
          )
        ),
        h.DataAttribute("event-id", String(event.id))
      ],
      [props.renderEventBody === undefined ? event.title : props.renderEventBody(event)]
    )
  }

  const previewNode = (resource: ScheduleResource, date: DateString) => {
    if (interaction._tag !== "Dragging") return []
    const dragged = expanded.filter(
      (event) => event.id === interaction.eventId && draggedHere(interaction, resource, date)
    )
    const left = percentOf(date, interaction.start)

    return dragged.map((event) =>
      h.keyed("div")(
        "drag-preview",
        [
          ...part(
            "wrapper",
            styles.preview,
            setStyle(["left", `${left}%`], ["width", `${percentOf(date, interaction.end) - left}%`])
          ),
          h.DataAttribute("drag-preview", ""),
          ...(interaction.valid ? [] : [h.DataAttribute("invalid", "")])
        ],
        [
          ScheduleEvent(h, {
            ...forwarded,
            event,
            static: true,
            invalid: !interaction.valid,
            nowrap: true,
            layout: setStyle(["flexGrow", "1"])
          })
        ]
      )
    )
  }

  const moreProps = (key: string) => {
    if (props.model === undefined || send === undefined) return {}
    if (props.model.moreDate !== key) return { onOpen: send(ViewMessages.OpenedMoreEvents({ date: key })) }

    return {
      popover: {
        model: props.model.moreEvents,
        toParentMessage: (message: PopoverMessage) => send(gotMoreEvents(message))
      }
    }
  }

  const moreNodes = (resource: ScheduleResource, segment: TimelineSegment) =>
    overflows(segment.regularEvents, max).map((overflow) =>
      h.keyed("div")(
        `more-${overflow.start}`,
        part(
          "wrapper",
          styles.more,
          setStyle(["left", `${overflow.start}%`], ["width", `${overflow.end - overflow.start}%`])
        ),
        [
          MoreEvents(h, {
            ...forwarded,
            events: overflow.events,
            moreEventsCount: overflow.hidden,
            labels,
            static: isStatic,
            renderEventBody: props.renderEventBody,
            renderEvent: props.renderEvent,
            onEventClick: props.onEventClick,
            ...moreProps(`${String(resource.id)}@${segment.date}@${overflow.start}`)
          })
        ]
      )
    )

  const nowFor = (date: DateString) =>
    Option.fromNullishOr(props.now).pipe(
      Option.filter((now) => (props.withCurrentTimeIndicator ?? true) && dateOf(now) === date),
      Option.map((now) => currentTimePosition({ now, startTime, endTime, intervalMinutes })),
      Option.filter((left) => left >= 0 && left <= 100),
      Option.toArray
    )

  const barNode = (bar: TimelineBar) =>
    h.keyed("div")(
      `bar-${bar.event.id}`,
      part(
        "allDay",
        styles.bar,
        setStyle(["left", `${bar.offset}%`], ["width", `${bar.width}%`], ["top", `${bar.row * 22}px`])
      ),
      [
        ScheduleEvent(h, {
          ...forwarded,
          event: bar.event,
          nowrap: true,
          static: isStatic,
          renderEventBody: props.renderEventBody,
          renderEvent: props.renderEvent,
          ...(props.onEventClick === undefined || isStatic ? {} : { onClick: props.onEventClick(bar.event) }),
          layout: setStyle(["flexGrow", "1"], ["pointerEvents", "auto"])
        })
      ]
    )

  const segmentNode = (row: TimelineRow) => (segment: TimelineSegment) => {
    const resource = row.resource

    return h.keyed("div")(
      segment.date,
      [
        ...part("slots", styles.slots),
        h.DataAttribute("time-grid", ""),
        h.DataAttribute("horizontal", ""),
        h.DataAttribute("date", segment.date),
        h.DataAttribute("grid-minutes", String(grid.span)),
        h.DataAttribute("resource-id", String(resource.id)),
        ...(typeof resource.id === "number" ? [h.DataAttribute("resource-numeric", "")] : [])
      ],
      [
        ...segment.backgroundEvents.map(backgroundNode),
        ...segment.regularEvents.filter((event) => event.position.column < max).map(eventNode(segment.date)),
        ...moreNodes(resource, segment),
        ...previewNode(resource, segment.date),
        ...nowFor(segment.date).map((left) =>
          h.keyed("div")(
            "now",
            [...part("now", styles.now, setStyle(["left", `${left}%`])), h.DataAttribute("current-time", "")],
            []
          )
        ),
        ...slots.map(slotNode(resource, segment.date))
      ]
    )
  }

  const rowNode = (row: TimelineRow) =>
    h.keyed("div")(
      String(row.resource.id),
      [...part("row", styles.row), h.DataAttribute("resource-id", String(row.resource.id))],
      [
        h.div(part("row", styles.sticky), [
          ...(hasGroups
            ? [
                h.div(part("group", styles.group, continuesGroup(row) && styles.groupHidden), [
                  Option.match(row.group, {
                    onNone: () => "",
                    onSome: ({ group }) =>
                      props.renderGroupLabel === undefined ? group.label : props.renderGroupLabel(group)
                  })
                ])
              ]
            : []),
          h.div(part("label", styles.label), [
            props.renderResourceLabel === undefined ? row.resource.label : props.renderResourceLabel(row.resource)
          ])
        ]),
        h.div(
          part(
            "allDay",
            styles.segments,
            barRows(row) > 0 && styles.barsOffset,
            setVars(["--bar-rows", String(barRows(row))])
          ),
          [...row.bars.map(barNode), ...row.segments.map(segmentNode(row))]
        )
      ]
    )

  const timeLabels = slots.map((slot) =>
    h.keyed("div")(
      `label-${slot.startTime}`,
      part(
        "timeLabel",
        styles.timeLabel,
        ...businessStyle(businessHoursState({ start: slot.startTime, end: slot.endTime, businessHours, highlight })),
        setVars(["--slot-label-size", String(interval / 60)])
      ),
      [formatDateTime(`${firstDay} ${slot.startTime}`, props.slotLabelFormat ?? "HH:mm", locale)]
    )
  )

  const labelColumns = Option.match(input.dayLabel, {
    onNone: () => timeLabels,
    onSome: (label) =>
      days.map((day) =>
        h.keyed("div")(`day-${day}`, part("dayLabel", styles.dayColumn), [
          h.div(part("dayLabel", styles.dayLabel), [label(day)]),
          h.div(part("dayLabel", styles.times), timeLabels)
        ])
      )
  })

  return h.div(part("frame", styles.frame), [
    h.div(
      [
        ...part("scroll", styles.scroll),
        h.DataAttribute("horizontal", ""),
        h.OnMount(
          Mount.mapMessage(
            GridBehaviour({ startScrollTime: input.startScrollTime, layout: "timeline" }),
            Function.absurd<M>
          )
        )
      ],
      [
        h.div(
          [
            ...part("inner", styles.inner),
            h.DataAttribute("horizontal", ""),
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
            h.div(part("labelsRow", styles.labelsRow), [
              h.div(part("corner", styles.corner), [
                ...(hasGroups ? [h.div(part("corner", styles.groupCorner), [])] : []),
                h.div(part("corner", styles.cornerCell), [])
              ]),
              ...labelColumns
            ]),
            ...rows.map(rowNode)
          ]
        )
      ]
    )
  ])
}
