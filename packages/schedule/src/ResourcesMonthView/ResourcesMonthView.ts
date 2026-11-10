import * as stylex from "@stylexjs/stylex"
import { Function, Option } from "effect"
import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Message as PopoverMessage } from "@foldkit/ui/popover"
import type { Child } from "@sth-ui/core/content.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { setStyle, stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight } from "@sth-ui/core/theme/tokens.stylex.ts"
import { addMonths, dayOfWeek, endOfMonth, startOfMonth } from "@sth-ui/dates/date/date.ts"
import type { DateString, DayOfWeek } from "@sth-ui/dates/date/date.ts"
import { dateOf } from "../datetime.ts"
import type { Interaction } from "../DayView/interaction.ts"
import { gotInteraction, gotMoreEvents, Message as ViewMessages } from "../DayView/model.ts"
import type { Message as ViewMessage, Model as ViewModel } from "../DayView/model.ts"
import { gestureFlags, WatchTimeGrid } from "../DayView/pointer.ts"
import type {
  ScheduleEvent as EventData,
  ScheduleResource,
  ScheduleResourceGroup,
  ScheduleViewLevel
} from "../events.ts"
import { formatDateTime } from "../format.ts"
import type { DateLabelFormat } from "../format.ts"
import { scheduleLabels } from "../labels.ts"
import type { ScheduleLabels } from "../labels.ts"
import { clampMaxEvents, monthDaysOf, resourcesMonthEvents } from "../monthLayout.ts"
import type { MonthDayEvents, MonthSegment, MonthSpan } from "../monthLayout.ts"
import { MoreEvents } from "../MoreEvents/MoreEvents.ts"
import type { MoreEventsPart } from "../MoreEvents/MoreEvents.ts"
import { expandRecurringEvents } from "../recurrence.ts"
import { resourceRows } from "../resourcesLayout.ts"
import type { ResourceRow } from "../resourcesLayout.ts"
import { ScheduleEvent } from "../ScheduleEvent/ScheduleEvent.ts"
import type { RenderEvent, ScheduleEventPart } from "../ScheduleEvent/ScheduleEvent.ts"
import { resourceViews, ScheduleHeader } from "../ScheduleHeader/ScheduleHeader.ts"
import type { ScheduleHeaderPart } from "../ScheduleHeader/ScheduleHeader.ts"
import { GridBehaviour } from "../TimeGrid/TimeGrid.ts"
import { timelineStyles, timelineVarsFor } from "../Timeline/Timeline.ts"
import { timelineVars } from "../Timeline/Timeline.stylex.ts"
import { lastDayOf } from "../weekLayout.ts"

export type ResourcesMonthViewPart =
  | ScheduleHeaderPart
  | ScheduleEventPart
  | MoreEventsPart
  | "resourcesMonthView"
  | "resourcesMonthViewRoot"
  | "resourcesMonthViewScrollArea"
  | "resourcesMonthViewInner"
  | "resourcesMonthViewDayLabelsRow"
  | "resourcesMonthViewCorner"
  | "resourcesMonthViewDayLabel"
  | "resourcesMonthViewDayLabelWeekday"
  | "resourcesMonthViewDayLabelNumber"
  | "resourcesMonthViewRow"
  | "resourcesMonthViewResourceLabel"
  | "resourcesMonthViewGroupColumn"
  | "resourcesMonthViewRowSlots"
  | "resourcesMonthViewCell"
  | "resourcesMonthViewEventWrapper"
  | "resourcesMonthViewBackgroundEvent"

export type ResourcesMonthViewOptions = {
  readonly locale?: string
  readonly weekdayFormat?: DateLabelFormat
  readonly weekendDays?: ReadonlyArray<DayOfWeek>
  readonly withWeekendDays?: boolean
  readonly startScrollDate?: string
  readonly highlightToday?: boolean
  readonly radius?: StyleValue
  readonly withHeader?: boolean
  readonly headerFormat?: DateLabelFormat
  readonly dayWidth?: StyleValue
  readonly rowHeight?: StyleValue
  readonly groupLabelWidth?: StyleValue
  readonly maxHeight?: StyleValue
  readonly mode?: "default" | "static"
  readonly withEventsDragAndDrop?: boolean
  readonly withEventResize?: boolean
  readonly withDragSlotSelect?: boolean
  readonly withExternalEventDrop?: boolean
  readonly maxEventsPerTimeSlot?: number
  readonly recurrenceExpansionLimit?: number
}

export type ResourcesMonthViewProps<M> = ResourcesMonthViewOptions &
  StylesApiProps<ResourcesMonthViewPart> & {
    readonly date: DateString
    readonly resources: ReadonlyArray<ScheduleResource>
    readonly groups?: ReadonlyArray<ScheduleResourceGroup>
    readonly events?: ReadonlyArray<EventData>
    readonly now?: string
    readonly labels?: Partial<ScheduleLabels>
    readonly renderEventBody?: (event: EventData) => Child
    readonly renderEvent?: RenderEvent<M>
    readonly renderResourceLabel?: (resource: ScheduleResource) => Child
    readonly renderGroupLabel?: (group: ScheduleResourceGroup) => Child
    readonly previousControlProps?: ReadonlyArray<Attribute<M>>
    readonly nextControlProps?: ReadonlyArray<Attribute<M>>
    readonly todayControlProps?: ReadonlyArray<Attribute<M>>
    readonly viewSelectProps?: ReadonlyArray<Attribute<M>>
    readonly onDateChange?: (date: DateString) => M
    readonly onViewChange?: (view: ScheduleViewLevel) => M
    readonly onDayClick?: (cell: { readonly resourceId: ScheduleResource["id"]; readonly date: DateString }) => M
    readonly onEventClick?: (event: EventData) => M
    readonly model?: ViewModel
    readonly toParentMessage?: (message: ViewMessage) => M
    readonly canDragEvent?: (event: EventData) => boolean
    readonly canResizeEvent?: (event: EventData) => boolean
  }

export type ResourcesMonthViewConfig = ComponentConfig<ResourcesMonthViewOptions, ResourcesMonthViewPart>

const borderColor = `light-dark(${palette.gray3}, ${palette.dark4})`
const border = `1px solid ${borderColor}`
const hover = `light-dark(${palette.gray0}, ${palette.dark6})`

const styles = stylex.create({
  dayLabels: {
    display: "flex",
    borderBottom: border,
    position: "sticky",
    top: 0,
    zIndex: 6,
    backgroundColor: colors.body
  },
  dayLabel: {
    flex: `0 0 ${timelineVars.slotWidth}`,
    boxSizing: "border-box",
    borderInlineEnd: border,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "4px",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium
  },
  weekend: { color: palette.red6 },
  number: {
    fontSize: fontSize.sm,
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "100%"
  },
  today: { backgroundColor: accent.filled, color: accent.contrast },
  cells: { position: "relative", display: "flex", minHeight: timelineVars.rowHeight },
  cell: {
    flex: `0 0 ${timelineVars.slotWidth}`,
    boxSizing: "border-box",
    padding: 0,
    borderWidth: 0,
    borderInlineEnd: border,
    backgroundColor: { default: "transparent", ":hover": hover },
    cursor: "pointer",
    outlineOffset: "-2px"
  },
  marked: { backgroundColor: { default: accent.light, ":hover": accent.light } },
  still: { cursor: "default", pointerEvents: "none" },
  events: { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3 },
  more: {
    position: "absolute",
    bottom: 0,
    height: "18px",
    paddingInline: "4px",
    display: "flex",
    pointerEvents: "auto"
  }
})

const continuesGroup = (row: ResourceRow) =>
  Option.exists(row.group, (group) => group.position === "middle" || group.position === "last")

const within = (day: DateString, first: string, last: string) => day >= first && day <= last

const dropMarked = (
  interaction: Extract<Interaction, { _tag: "Dragging" }>,
  resource: ScheduleResource,
  day: DateString
) =>
  Option.contains(interaction.resourceId, resource.id) && within(day, dateOf(interaction.start), lastDayOf(interaction))

const selectMarked = (
  interaction: Extract<Interaction, { _tag: "SelectingDays" }>,
  resource: ScheduleResource,
  day: DateString
) => {
  const [first, last] = [interaction.anchor, interaction.current].toSorted()

  return Option.contains(interaction.resourceId, resource.id) && within(day, String(first), String(last))
}

const marked = (interaction: Interaction, resource: ScheduleResource, day: DateString) => {
  if (interaction._tag === "Dragging") return dropMarked(interaction, resource, day)

  return interaction._tag === "SelectingDays" && selectMarked(interaction, resource, day)
}

export const ResourcesMonthView =
  (config: { readonly ResourcesMonthView?: ResourcesMonthViewConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ResourcesMonthViewProps<M>): Html => {
    const props = withDefaults(config.ResourcesMonthView, input)
    const getStyles = stylesApi<M, ResourcesMonthViewPart>(h, props, config.ResourcesMonthView, "resourcesMonthView")
    const labels = scheduleLabels(props.labels)
    const date = props.date
    const locale = props.locale ?? "en"
    const isStatic = props.mode === "static"
    const max = clampMaxEvents(props.maxEventsPerTimeSlot)
    const weekendDays = props.weekendDays ?? [0, 6]
    const days = monthDaysOf(date, { weekendDays, withWeekendDays: props.withWeekendDays ?? true })
    const expanded = expandRecurringEvents({
      events: props.events,
      rangeStart: `${startOfMonth(date)} 00:00:00`,
      rangeEnd: `${endOfMonth(date)} 23:59:59`,
      ...(props.recurrenceExpansionLimit === undefined ? {} : { expansionLimit: props.recurrenceExpansionLimit })
    })
    const rows = resourceRows(props.resources, props.groups).map((row) => ({
      ...row,
      layout: resourcesMonthEvents({
        events: expanded.filter((event) => event.resourceId === row.resource.id),
        days,
        maxEventsPerDay: max
      })
    }))
    const hasGroups = rows.some((row) => Option.isSome(row.group))
    const forwarded = {
      ...(props.styles === undefined ? {} : { styles: props.styles }),
      ...(props.attributes === undefined ? {} : { attributes: props.attributes })
    }
    const send = props.toParentMessage
    const interactive = send !== undefined && props.model !== undefined && !isStatic
    const interaction: Interaction = props.model?.interaction.interaction ?? { _tag: "Idle" }
    const today = Option.getOrElse(Option.map(Option.fromNullishOr(props.now), dateOf), () => date)
    const isToday = (day: DateString) => (props.highlightToday ?? true) && props.now !== undefined && day === today
    const canDrag = (event: EventData) =>
      interactive && props.withEventsDragAndDrop === true && (props.canDragEvent?.(event) ?? true)
    const canResize = (event: EventData) =>
      interactive && props.withEventResize === true && (props.canResizeEvent?.(event) ?? true)
    const lane = (row: number) =>
      setStyle(["top", `calc((100% - 18px) * ${row} / ${max} + 1px)`], ["height", `calc((100% - 18px) / ${max} - 2px)`])

    const cellNode = (resource: ScheduleResource) => (day: DateString, index: number) =>
      h.keyed("button")(
        day,
        [
          ...getStyles(
            "resourcesMonthViewCell",
            styles.cell,
            isStatic && styles.still,
            marked(interaction, resource, day) && styles.marked,
            shared.focusRing
          ),
          h.Type("button"),
          h.DataAttribute("day-cell", ""),
          h.DataAttribute("date", day),
          h.DataAttribute("resource-id", String(resource.id)),
          ...(typeof resource.id === "number" ? [h.DataAttribute("resource-numeric", "")] : []),
          ...(marked(interaction, resource, day) ? [h.DataAttribute("marked", "")] : []),
          h.AriaLabel(`${resource.label} ${formatDateTime(`${day} 00:00:00`, "MMMM D, YYYY", locale)}`),
          h.Tabindex(!isStatic && index === 0 && resource.id === rows[0]?.resource.id ? 0 : -1),
          ...(props.onDayClick === undefined || isStatic
            ? []
            : [h.OnClick(props.onDayClick({ resourceId: resource.id, date: day }))])
        ],
        []
      )

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
        resizable: canResize(segment.event),
        resizeAxis: "horizontal",
        resizing: interaction._tag === "Resizing" && interaction.eventId === segment.event.id,
        renderEventBody: props.renderEventBody,
        renderEvent: props.renderEvent,
        ...(props.onEventClick === undefined || isStatic ? {} : { onClick: props.onEventClick(segment.event) }),
        layout: setStyle(
          ["position", "absolute"],
          ["pointerEvents", "auto"],
          ["left", `calc(${segment.offset}% + 1px)`],
          ["width", `calc(${segment.width}% - 2px)`],
          ...lane(segment.row).values
        )
      })

    const backgroundNode = (span: MonthSpan) =>
      h.keyed("div")(
        `background-${span.event.id}`,
        [
          ...getStyles(
            "resourcesMonthViewBackgroundEvent",
            timelineStyles.background,
            setStyle(["left", `${span.offset}%`], ["width", `${span.width}%`])
          ),
          h.DataAttribute("event-id", String(span.event.id))
        ],
        [props.renderEventBody === undefined ? span.event.title : props.renderEventBody(span.event)]
      )

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

    const moreNode = (resource: ScheduleResource) => (day: MonthDayEvents, index: number) =>
      day.hidden > 0
        ? [
            h.keyed("div")(
              `more-${day.date}`,
              getStyles(
                "resourcesMonthViewEventWrapper",
                styles.more,
                setStyle(["left", `${(index / days.length) * 100}%`], ["width", `${100 / days.length}%`])
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
                  ...moreProps(`${String(resource.id)}@${day.date}`)
                })
              ]
            )
          ]
        : []

    const rowNode = (row: (typeof rows)[number]) =>
      h.keyed("div")(
        String(row.resource.id),
        [...getStyles("resourcesMonthViewRow", timelineStyles.row), h.DataAttribute("month-week", "")],
        [
          h.div(getStyles("resourcesMonthViewRow", timelineStyles.sticky), [
            ...(hasGroups
              ? [
                  h.div(
                    getStyles(
                      "resourcesMonthViewGroupColumn",
                      timelineStyles.group,
                      continuesGroup(row) && timelineStyles.groupHidden
                    ),
                    [
                      Option.match(row.group, {
                        onNone: () => "",
                        onSome: ({ group }) =>
                          props.renderGroupLabel === undefined ? group.label : props.renderGroupLabel(group)
                      })
                    ]
                  )
                ]
              : []),
            h.div(getStyles("resourcesMonthViewResourceLabel", timelineStyles.label), [
              props.renderResourceLabel === undefined ? row.resource.label : props.renderResourceLabel(row.resource)
            ])
          ]),
          h.div(getStyles("resourcesMonthViewRowSlots", styles.cells), [
            ...days.map(cellNode(row.resource)),
            h.div(getStyles("resourcesMonthViewEventWrapper", styles.events), [
              ...row.layout.background.map(backgroundNode),
              ...row.layout.segments.map(segmentNode),
              ...row.layout.dayEvents.flatMap(moreNode(row.resource))
            ])
          ])
        ]
      )

    const header =
      (props.withHeader ?? true)
        ? [
            ScheduleHeader(h, {
              ...forwarded,
              view: "month",
              views: resourceViews,
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
          "resourcesMonthView",
          timelineStyles.root,
          timelineVarsFor({
            ...(props.radius === undefined ? {} : { radius: props.radius }),
            ...(props.dayWidth === undefined ? {} : { slotWidth: props.dayWidth }),
            ...(props.rowHeight === undefined ? {} : { rowHeight: props.rowHeight }),
            ...(props.groupLabelWidth === undefined ? {} : { groupLabelWidth: props.groupLabelWidth }),
            ...(props.maxHeight === undefined ? {} : { maxHeight: props.maxHeight })
          })
        ),
        ...(isStatic ? [h.DataAttribute("static", "")] : [])
      ],
      [
        ...header,
        h.div(getStyles("resourcesMonthViewRoot", timelineStyles.frame), [
          h.div(
            [
              ...getStyles("resourcesMonthViewScrollArea", timelineStyles.scroll),
              h.DataAttribute("horizontal", ""),
              h.OnMount(
                Mount.mapMessage(
                  GridBehaviour({ startScrollTime: props.startScrollDate ?? "", layout: "rows" }),
                  Function.absurd<M>
                )
              )
            ],
            [
              h.div(
                [
                  ...getStyles("resourcesMonthViewInner", timelineStyles.inner),
                  h.DataAttribute("month-grid", ""),
                  h.DataAttribute("day-resize", ""),
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
                  h.div(getStyles("resourcesMonthViewDayLabelsRow", styles.dayLabels), [
                    h.div(getStyles("resourcesMonthViewCorner", timelineStyles.corner), [
                      ...(hasGroups
                        ? [h.div(getStyles("resourcesMonthViewCorner", timelineStyles.groupCorner), [])]
                        : []),
                      h.div(getStyles("resourcesMonthViewCorner", timelineStyles.cornerCell), [])
                    ]),
                    ...days.map((day) =>
                      h.keyed("div")(
                        `label-${day}`,
                        [
                          ...getStyles(
                            "resourcesMonthViewDayLabel",
                            styles.dayLabel,
                            weekendDays.includes(dayOfWeek(day)) && styles.weekend
                          ),
                          h.DataAttribute("slot-start", day)
                        ],
                        [
                          h.span(getStyles("resourcesMonthViewDayLabelWeekday"), [
                            formatDateTime(`${day} 00:00:00`, props.weekdayFormat ?? "ddd", locale)
                          ]),
                          h.span(
                            getStyles("resourcesMonthViewDayLabelNumber", styles.number, isToday(day) && styles.today),
                            [String(Number(day.slice(8, 10)))]
                          )
                        ]
                      )
                    )
                  ]),
                  ...rows.map(rowNode)
                ]
              )
            ]
          )
        ])
      ]
    )
  }
