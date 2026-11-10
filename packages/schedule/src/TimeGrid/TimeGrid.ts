import * as stylex from "@stylexjs/stylex"
import { Array as Arr, Effect, Option, Schema, Stream } from "effect"
import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "@sth-ui/core/content.ts"
import { setStyle, setVars, sx } from "@sth-ui/core/styles/StylesApi.ts"
import type { GetStyles, PartAttributes, PartStyles } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, radius } from "@sth-ui/core/theme/tokens.stylex.ts"
import type { DateString } from "@sth-ui/dates/date/date.ts"
import { businessHoursState } from "../businessHours.ts"
import type { BusinessHoursState } from "../businessHours.ts"
import { currentTimePosition } from "../dayLayout.ts"
import type { DayPositionedEvent, DayTimeInterval } from "../dayLayout.ts"
import { dateOf, minutesBetween } from "../datetime.ts"
import type { DateTimeString } from "../datetime.ts"
import type { ScheduleEvent as EventData } from "../events.ts"
import { formatDateTime } from "../format.ts"
import type { DateLabelFormat } from "../format.ts"
import type { ScheduleLabels } from "../labels.ts"
import type { Interaction, SelectedSlots } from "../DayView/interaction.ts"
import { ScheduleEvent } from "../ScheduleEvent/ScheduleEvent.ts"
import type { RenderEvent } from "../ScheduleEvent/ScheduleEvent.ts"
import { flowTarget, slotTarget } from "./keys.ts"
import { timeGridVars } from "./TimeGrid.stylex.ts"

export type TimeGridPart = "slot" | "slotLabel" | "backgroundEvent" | "currentTime" | "currentTimeBubble"

const border = `light-dark(${palette.gray3}, ${palette.dark4})`

const hover = `light-dark(${palette.gray1}, ${palette.dark5})`

export const timeGridStyles = stylex.create({
  column: { position: "relative" },
  label: {
    height: `calc(${timeGridVars.slotHeight} * var(--slot-label-size, 1))`,
    borderTopWidth: { default: "1px", ":first-of-type": 0 },
    borderTopStyle: "solid",
    borderTopColor: border,
    fontSize: fontSize.sm,
    textAlign: "right",
    padding: "4px 8px",
    boxSizing: "border-box",
    fontVariantNumeric: "tabular-nums"
  },
  subHour: { borderTopStyle: "dotted" },
  hiddenLine: { borderTopColor: "transparent" },
  slot: {
    display: "block",
    width: "100%",
    padding: 0,
    borderWidth: 0,
    borderTopWidth: "1px",
    borderTopStyle: "dotted",
    borderTopColor: border,
    height: `calc(${timeGridVars.slotHeight} * var(--slot-size))`,
    position: "relative",
    cursor: "pointer",
    backgroundColor: { default: "transparent", ":hover": hover },
    outlineOffset: "-2px"
  },
  firstSlot: { borderTopColor: "transparent" },
  hourStart: { borderTopStyle: "solid" },
  allDaySlot: { height: timeGridVars.allDaySlotHeight, borderTopWidth: 0 },
  still: { cursor: "default", pointerEvents: "none" },
  selected: { backgroundColor: { default: accent.light, ":hover": accent.light } },
  business: { backgroundColor: { default: `light-dark(${palette.white}, ${palette.dark7})`, ":hover": hover } },
  nonBusiness: { backgroundColor: { default: `light-dark(${palette.gray0}, ${palette.dark6})`, ":hover": hover } },
  partialBusiness: {
    backgroundImage: `linear-gradient(to bottom, light-dark(${palette.gray0}, ${palette.dark6}) var(--business-hours-from), light-dark(${palette.white}, ${palette.dark7}) var(--business-hours-from), light-dark(${palette.white}, ${palette.dark7}) var(--business-hours-to), light-dark(${palette.gray0}, ${palette.dark6}) var(--business-hours-to))`
  },
  background: {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 2,
    overflow: "hidden",
    fontSize: "12px",
    fontWeight: fontWeight.medium,
    padding: "3px 4px",
    boxSizing: "border-box",
    backgroundColor: accent.light,
    color: accent.lightColor,
    opacity: 0.6
  },
  interactiveBackground: {
    pointerEvents: "auto",
    cursor: "pointer",
    borderWidth: 0,
    fontFamily: "inherit",
    textAlign: "start"
  },
  preview: { position: "absolute", pointerEvents: "none", zIndex: 5, display: "flex" },
  currentTime: {
    position: "absolute",
    insetInlineStart: "var(--current-time-start, -80px)",
    insetInlineEnd: 0,
    height: "1px",
    backgroundColor: palette.red6,
    zIndex: 4,
    pointerEvents: "none"
  },
  bubble: {
    position: "absolute",
    insetInlineStart: "30px",
    top: "-9px",
    fontSize: "11px",
    fontWeight: fontWeight.bold,
    lineHeight: "18px",
    paddingInline: "4px",
    borderRadius: radius.sm,
    backgroundColor: palette.red6,
    color: colors.white
  },
  thumb: {
    position: "absolute",
    insetInlineStart: "calc(var(--current-time-thumb, 80px) - 4px)",
    top: "-4px",
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    backgroundColor: palette.red6
  }
})

const isSlot = (element: Element): element is HTMLButtonElement => element instanceof HTMLButtonElement

const groupsOf = (container: Element, group: string, item: string): ReadonlyArray<ReadonlyArray<HTMLButtonElement>> =>
  Array.from(container.querySelectorAll(group)).map((element) =>
    Array.from(element.querySelectorAll(item)).filter(isSlot)
  )

const transpose = <A>(rows: ReadonlyArray<ReadonlyArray<A>>): ReadonlyArray<ReadonlyArray<A>> =>
  Array.from({ length: Math.max(0, ...rows.map((row) => row.length)) }, (_, column) =>
    rows.flatMap((row) => row.slice(column, column + 1))
  )

type Layout = "columns" | "rows" | "flow" | "timeline"

type Cell = { readonly group: number; readonly item: number }

const groupsFor = (container: Element, layout: Layout): ReadonlyArray<ReadonlyArray<HTMLButtonElement>> => {
  if (layout === "rows") return transpose(groupsOf(container, "[data-month-week]", "[data-day-cell]"))
  if (layout === "flow") return groupsOf(container, "[data-day-row]", "[data-day-cell]")
  if (layout === "timeline") return transpose(groupsOf(container, "[data-time-grid]", "[data-time-slot]"))

  return groupsOf(container, "[data-time-grid]", "[data-time-slot]")
}

const positionOf = (groups: ReadonlyArray<ReadonlyArray<HTMLButtonElement>>, target: EventTarget | null) =>
  Option.fromNullishOr(
    groups
      .flatMap((items, group) => items.map((element, item) => ({ element, cell: { group, item } })))
      .find((entry) => entry.element === target)
  )

const targetOf = (
  layout: Layout,
  key: string,
  cell: Cell,
  groups: ReadonlyArray<ReadonlyArray<unknown>>
): Option.Option<Cell> => {
  if (layout === "flow") {
    return Option.map(
      flowTarget(
        key,
        { row: cell.group, item: cell.item },
        groups.map((items) => items.length)
      ),
      ({ row, item }) => ({ group: row, item })
    )
  }
  const size = { columns: groups.length, slots: Math.max(0, ...groups.map((items) => items.length)) }

  return Option.map(slotTarget(key, { column: cell.group, slot: cell.item }, size), ({ column, slot }) => ({
    group: column,
    item: slot
  }))
}

const slotKeys = (container: Element, layout: Layout) => (event: KeyboardEvent) => {
  const groups = groupsFor(container, layout)
  Option.map(
    Option.flatMap(positionOf(groups, event.target), ({ cell }) => targetOf(layout, event.key, cell, groups)),
    (target) =>
      Arr.get(groups, target.group).pipe(
        Option.flatMap((items) => Arr.get(items, target.item)),
        Option.map((element) => {
          event.preventDefault()
          element.focus()
        })
      )
  )
}

const scrollToTime = (element: Element, startScrollTime: string) => {
  const slots = Array.from(element.querySelectorAll("[data-slot-start]"))
  const target = slots.find((slot) => String(slot.getAttribute("data-slot-start")) >= startScrollTime)
  if (target === undefined) return
  element.scrollTo(
    element.hasAttribute("data-horizontal")
      ? { left: target.getBoundingClientRect().left - element.getBoundingClientRect().left + element.scrollLeft }
      : { top: target.getBoundingClientRect().top - element.getBoundingClientRect().top + element.scrollTop }
  )
}

export const GridBehaviour = Mount.defineStream("ScheduleGridBehaviour", {
  args: { startScrollTime: Schema.String, layout: Schema.Literals(["columns", "rows", "flow", "timeline"]) },
  messages: [Schema.Never],
  execute: ({ element, startScrollTime, layout }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => {
          scrollToTime(element, startScrollTime)
          const listener = slotKeys(element, layout)
          element.ownerDocument.addEventListener("keydown", listener)

          return () => element.ownerDocument.removeEventListener("keydown", listener)
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export type LabelGroup = {
  readonly startTime: string
  readonly endTime: string
  readonly isHourStart: boolean
  readonly slotsCount: number
}

export const labelGroups = (slots: ReadonlyArray<DayTimeInterval>): ReadonlyArray<LabelGroup> =>
  slots.reduce<ReadonlyArray<LabelGroup>>((groups, slot) => {
    const last = groups.at(-1)
    if (last === undefined || slot.isLabelStart) {
      return [
        ...groups,
        { startTime: slot.startTime, endTime: slot.endTime, isHourStart: slot.isHourStart, slotsCount: 1 }
      ]
    }

    return [...groups.slice(0, -1), { ...last, endTime: slot.endTime, slotsCount: last.slotsCount + 1 }]
  }, [])

const businessStyle = (state: BusinessHoursState) => {
  if (state._tag === "Business") return [timeGridStyles.business]
  if (state._tag === "NonBusiness") return [timeGridStyles.nonBusiness]
  if (state._tag === "Partial") {
    return [
      timeGridStyles.partialBusiness,
      setVars(["--business-hours-from", `${state.from}%`], ["--business-hours-to", `${state.to}%`])
    ]
  }

  return []
}

const businessData = <M>(h: HtmlBuilder<M>, state: BusinessHoursState) => {
  if (state._tag === "Business") return [h.DataAttribute("business-hours", "")]
  if (state._tag === "NonBusiness") return [h.DataAttribute("non-business-hours", "")]

  return state._tag === "Partial" ? [h.DataAttribute("partial-business-hours", "")] : []
}

export type GridSettings = {
  readonly slots: ReadonlyArray<DayTimeInterval>
  readonly startTime: string
  readonly endTime: string
  readonly intervalMinutes: number
  readonly interval: number
  readonly startMinutes: number
  readonly span: number
  readonly subHourLines: boolean
  readonly businessHours: readonly [string, string]
  readonly highlight: boolean
  readonly isStatic: boolean
  readonly labels: ScheduleLabels
  readonly locale: string
  readonly slotLabelFormat: DateLabelFormat
}

export type ColumnContext<M> = GridSettings & {
  readonly h: HtmlBuilder<M>
  readonly part: GetStyles<M, TimeGridPart>
  readonly forwarded: { readonly styles?: PartStyles<string>; readonly attributes?: PartAttributes<string> }
  readonly cascade: boolean
  readonly interaction: Interaction
  readonly selection: Option.Option<SelectedSlots>
  readonly canDrag: (event: EventData) => boolean
  readonly canResize: (event: EventData) => boolean
  readonly expanded: ReadonlyArray<EventData>
  readonly renderEventBody: ((event: EventData) => Child) | undefined
  readonly renderEvent: RenderEvent<M> | undefined
  readonly onEventClick: ((event: EventData) => M) | undefined
  readonly onTimeSlotClick:
    | ((slot: { readonly slotStart: DateTimeString; readonly slotEnd: DateTimeString }) => M)
    | undefined
  readonly getTimeSlotProps:
    | ((slot: { readonly start: DateTimeString; readonly end: DateTimeString }) => ReadonlyArray<Attribute<M>>)
    | undefined
  readonly interactiveBackground: boolean
}

const percentOf = (settings: GridSettings, date: DateString, value: DateTimeString) =>
  ((minutesBetween(`${date} 00:00:00`, value) - settings.startMinutes) / settings.span) * 100

const eventNode =
  <M>(ctx: ColumnContext<M>, date: DateString) =>
  (event: DayPositionedEvent) => {
    const interaction = ctx.interaction
    const resizing = interaction._tag === "Resizing" && interaction.eventId === event.id
    const top = resizing ? percentOf(ctx, date, interaction.start) : event.position.top
    const height = resizing ? percentOf(ctx, date, interaction.end) - top : event.position.height

    return ScheduleEvent(ctx.h, {
      ...ctx.forwarded,
      event,
      cascade: ctx.cascade,
      static: ctx.isStatic,
      draggable: ctx.canDrag(event),
      dragging: interaction._tag === "Dragging" && interaction.eventId === event.id,
      resizable: ctx.canResize(event),
      resizing,
      invalid: resizing && !interaction.valid,
      renderEventBody: ctx.renderEventBody,
      renderEvent: ctx.renderEvent,
      ...(ctx.onEventClick === undefined || ctx.isStatic ? {} : { onClick: ctx.onEventClick(event) }),
      layout: setStyle(
        ["position", "absolute"],
        ["top", `${top}%`],
        ["height", `${height}%`],
        ["insetInlineStart", `${event.position.offset}%`],
        ["width", `${event.position.width}%`],
        ["--event-z-index", String(event.position.column + 3)]
      )
    })
  }

const previewNodes = <M>(ctx: ColumnContext<M>, date: DateString): ReadonlyArray<Html> => {
  const interaction = ctx.interaction
  if (interaction._tag !== "Dragging") return []
  if (interaction.target !== "slot") return []
  if (dateOf(interaction.start) !== date) return []
  const top = percentOf(ctx, date, interaction.start)
  const h = ctx.h

  return ctx.expanded
    .filter((event) => event.id === interaction.eventId)
    .map((dragged) =>
      h.keyed("div")(
        "drag-preview",
        [
          ...sx(
            h,
            timeGridStyles.preview,
            setStyle(
              ["top", `${top}%`],
              ["height", `${percentOf(ctx, date, interaction.end) - top}%`],
              ["insetInlineStart", "0"],
              ["width", "100%"]
            )
          ),
          h.DataAttribute("drag-preview", ""),
          ...(interaction.valid ? [] : [h.DataAttribute("invalid", "")])
        ],
        [
          ScheduleEvent(h, {
            ...ctx.forwarded,
            event: dragged,
            static: true,
            invalid: !interaction.valid,
            renderEventBody: ctx.renderEventBody,
            renderEvent: ctx.renderEvent,
            layout: setStyle(["flexGrow", "1"])
          })
        ]
      )
    )
}

export const backgroundNode =
  <M>(ctx: ColumnContext<M>, layout: (event: DayPositionedEvent) => ReadonlyArray<readonly [string, string]>) =>
  (event: DayPositionedEvent) => {
    const h = ctx.h
    const click =
      ctx.interactiveBackground && ctx.onEventClick !== undefined && !ctx.isStatic
        ? [h.Type("button"), h.OnClick(ctx.onEventClick(event))]
        : []

    return h.keyed(click.length > 0 ? "button" : "div")(
      `background-${event.id}`,
      [
        ...click,
        ...ctx.part(
          "backgroundEvent",
          timeGridStyles.background,
          click.length > 0 && timeGridStyles.interactiveBackground,
          setStyle(...layout(event))
        ),
        h.DataAttribute("event-id", String(event.id))
      ],
      [ctx.renderEventBody === undefined ? event.title : ctx.renderEventBody(event)]
    )
  }

export const columnBackgroundLayout = (event: DayPositionedEvent): ReadonlyArray<readonly [string, string]> => [
  ["top", `${event.position.top}%`],
  ["height", `${event.position.height}%`],
  ["insetInlineStart", "0"],
  ["width", "100%"]
]

const isSelected = (selection: Option.Option<SelectedSlots>, date: DateString, index: number) =>
  Option.match(selection, {
    onNone: () => false,
    onSome: (selected) => selected.date === date && index >= selected.first && index <= selected.last
  })

const slotNode =
  <M>(ctx: ColumnContext<M>, date: DateString, tabbable: boolean) =>
  (slot: DayTimeInterval, index: number) => {
    const h = ctx.h
    const slotStart = `${date} ${slot.startTime}`
    const slotEnd = `${date} ${slot.endTime}`
    const state = businessHoursState({
      start: slot.startTime,
      end: slot.endTime,
      businessHours: ctx.businessHours,
      highlight: ctx.highlight
    })
    const selected = isSelected(ctx.selection, date, index)

    return h.keyed("button")(
      slot.startTime,
      [
        ...ctx.part(
          "slot",
          timeGridStyles.slot,
          index === 0 && timeGridStyles.firstSlot,
          slot.isHourStart && timeGridStyles.hourStart,
          !ctx.subHourLines && !slot.isHourStart && timeGridStyles.hiddenLine,
          ctx.isStatic && timeGridStyles.still,
          ...businessStyle(state),
          selected && timeGridStyles.selected,
          setVars(["--slot-size", String(ctx.interval / 60)])
        ),
        h.Type("button"),
        h.DataAttribute("time-slot", ""),
        h.DataAttribute("slot-start", slot.startTime),
        ...(index === 0 ? [h.DataAttribute("first", "")] : []),
        ...(slot.isHourStart ? [h.DataAttribute("hour-start", "")] : []),
        ...(selected ? [h.DataAttribute("selected", "")] : []),
        ...businessData(h, state),
        h.AriaLabel(`${ctx.labels.timeSlot} ${slot.startTime} - ${slot.endTime}`),
        h.Tabindex(tabbable && !ctx.isStatic && index === 0 ? 0 : -1),
        ...(ctx.onTimeSlotClick === undefined || ctx.isStatic
          ? []
          : [h.OnClick(ctx.onTimeSlotClick({ slotStart, slotEnd }))]),
        ...(ctx.getTimeSlotProps?.({ start: slotStart, end: slotEnd }) ?? [])
      ],
      []
    )
  }

export const columnChildren = <M>(
  ctx: ColumnContext<M>,
  column: {
    readonly date: DateString
    readonly regularEvents: ReadonlyArray<DayPositionedEvent>
    readonly backgroundEvents: ReadonlyArray<DayPositionedEvent>
    readonly indicator: ReadonlyArray<Html>
    readonly tabbable: boolean
  }
): ReadonlyArray<Html> => [
  ...column.backgroundEvents.map(backgroundNode(ctx, columnBackgroundLayout)),
  ...column.regularEvents.map(eventNode(ctx, column.date)),
  ...previewNodes(ctx, column.date),
  ...column.indicator,
  ...ctx.slots.map(slotNode(ctx, column.date, column.tabbable))
]

export const labelNodes = <M>(
  h: HtmlBuilder<M>,
  part: GetStyles<M, TimeGridPart>,
  settings: GridSettings,
  date: DateString
) =>
  labelGroups(settings.slots).map((group, index) => {
    const state = businessHoursState({
      start: group.startTime,
      end: group.endTime,
      businessHours: settings.businessHours,
      highlight: settings.highlight
    })

    return h.keyed("div")(
      group.startTime,
      [
        ...part(
          "slotLabel",
          timeGridStyles.label,
          !group.isHourStart && timeGridStyles.subHour,
          !settings.subHourLines && !group.isHourStart && timeGridStyles.hiddenLine,
          ...businessStyle(state),
          setVars(["--slot-label-size", String((group.slotsCount * settings.interval) / 60)])
        ),
        ...(group.isHourStart ? [] : [h.DataAttribute("sub-hour", "")]),
        ...businessData(h, state),
        ...(index === 0 ? [h.DataAttribute("first", "")] : [])
      ],
      [formatDateTime(`${date} ${group.startTime}`, settings.slotLabelFormat, settings.locale)]
    )
  })

export const indicatorNodes = <M>(
  h: HtmlBuilder<M>,
  part: GetStyles<M, TimeGridPart>,
  settings: GridSettings,
  input: {
    readonly now: DateTimeString
    readonly bubble: boolean
    readonly layout: ReadonlyArray<readonly [string, string]>
  }
): ReadonlyArray<Html> => {
  const top = currentTimePosition({
    now: input.now,
    startTime: settings.startTime,
    endTime: settings.endTime,
    intervalMinutes: settings.intervalMinutes
  })
  if (top < 0 || top > 100) return []

  return [
    h.div(
      [
        ...part("currentTime", timeGridStyles.currentTime, setStyle(["top", `${top}%`], ...input.layout)),
        h.DataAttribute("current-time", "")
      ],
      [
        input.bubble
          ? h.span(part("currentTimeBubble", timeGridStyles.bubble), [
              formatDateTime(input.now, settings.slotLabelFormat, settings.locale)
            ])
          : h.span(part("currentTimeBubble", timeGridStyles.thumb), [])
      ]
    )
  ]
}
