import { Array as Arr, Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "@sth-ui/core/content.ts"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { addDays, weekNumber } from "@sth-ui/dates/date/date.ts"
import type { DateString, DayOfWeek } from "@sth-ui/dates/date/date.ts"
import { dateOf } from "../datetime.ts"
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
import type { MoreEventsPart } from "../MoreEvents/MoreEvents.ts"
import { expandRecurringEvents } from "../recurrence.ts"
import { resourceRows } from "../resourcesLayout.ts"
import type { ScheduleEventPart } from "../ScheduleEvent/ScheduleEvent.ts"
import { resourceViews, ScheduleHeader } from "../ScheduleHeader/ScheduleHeader.ts"
import type { ScheduleHeaderPart } from "../ScheduleHeader/ScheduleHeader.ts"
import { timeline, timelineStyles, timelineVarsFor } from "../Timeline/Timeline.ts"
import type { TimelineOptions, TimelinePart, TimelineProps } from "../Timeline/Timeline.ts"
import { weekDays, weekViewEvents } from "../weekLayout.ts"

export type ResourcesWeekViewPart =
  | ScheduleHeaderPart
  | ScheduleEventPart
  | MoreEventsPart
  | "resourcesWeekView"
  | "resourcesWeekViewRoot"
  | "resourcesWeekViewScrollArea"
  | "resourcesWeekViewInner"
  | "resourcesWeekViewTimeLabelsRow"
  | "resourcesWeekViewCorner"
  | "resourcesWeekViewDayLabel"
  | "resourcesWeekViewTimeLabel"
  | "resourcesWeekViewRow"
  | "resourcesWeekViewGroupColumn"
  | "resourcesWeekViewResourceLabel"
  | "resourcesWeekViewRowSlots"
  | "resourcesWeekViewRowSlot"
  | "resourcesWeekViewEventWrapper"
  | "resourcesWeekViewAllDayEvents"
  | "resourcesWeekViewBackgroundEvent"
  | "resourcesWeekViewCurrentTime"

export type ResourcesWeekViewOptions = TimelineOptions & {
  readonly startScrollDateTime?: string
  readonly withHeader?: boolean
  readonly weekLabelFormat?: DateLabelFormat
  readonly firstDayOfWeek?: DayOfWeek
  readonly weekendDays?: ReadonlyArray<DayOfWeek>
  readonly withWeekendDays?: boolean
  readonly weekdayFormat?: DateLabelFormat
  readonly highlightToday?: boolean
}

export type ResourcesWeekViewProps<M> = ResourcesWeekViewOptions &
  Omit<TimelineProps<M>, "styles" | "attributes"> &
  StylesApiProps<ResourcesWeekViewPart> & {
    readonly date: DateString
    readonly resources: ReadonlyArray<ScheduleResource>
    readonly groups?: ReadonlyArray<ScheduleResourceGroup>
    readonly events?: ReadonlyArray<EventData>
    readonly labels?: Partial<ScheduleLabels>
    readonly renderWeekLabel?: (range: { readonly weekStart: DateString; readonly weekEnd: DateString }) => Child
    readonly onDateChange?: (date: DateString) => M
    readonly onViewChange?: (view: ScheduleViewLevel) => M
  }

export type ResourcesWeekViewConfig = ComponentConfig<ResourcesWeekViewOptions, ResourcesWeekViewPart>

const parts = {
  frame: "resourcesWeekViewRoot",
  scroll: "resourcesWeekViewScrollArea",
  inner: "resourcesWeekViewInner",
  labelsRow: "resourcesWeekViewTimeLabelsRow",
  corner: "resourcesWeekViewCorner",
  timeLabel: "resourcesWeekViewTimeLabel",
  dayLabel: "resourcesWeekViewDayLabel",
  row: "resourcesWeekViewRow",
  group: "resourcesWeekViewGroupColumn",
  label: "resourcesWeekViewResourceLabel",
  slots: "resourcesWeekViewRowSlots",
  slot: "resourcesWeekViewRowSlot",
  wrapper: "resourcesWeekViewEventWrapper",
  allDay: "resourcesWeekViewAllDayEvents",
  background: "resourcesWeekViewBackgroundEvent",
  now: "resourcesWeekViewCurrentTime"
} as const

export const ResourcesWeekView =
  (config: { readonly ResourcesWeekView?: ResourcesWeekViewConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ResourcesWeekViewProps<M>): Html => {
    const props = withDefaults(config.ResourcesWeekView, input)
    const getStyles = stylesApi<M, ResourcesWeekViewPart>(h, props, config.ResourcesWeekView, "resourcesWeekView")
    const part: GetStyles<M, TimelinePart> = (name, ...rest) => getStyles(parts[name], ...rest)
    const labels = scheduleLabels(props.labels)
    const date = props.date
    const locale = props.locale ?? "en"
    const week = {
      firstDayOfWeek: props.firstDayOfWeek ?? 1,
      weekendDays: props.weekendDays ?? [0, 6],
      withWeekendDays: props.withWeekendDays ?? true
    }
    const days = weekDays(date, week)
    const first = Arr.headNonEmpty(days)
    const last = Arr.lastNonEmpty(days)
    const forwarded = {
      ...(props.styles === undefined ? {} : { styles: props.styles }),
      ...(props.attributes === undefined ? {} : { attributes: props.attributes })
    }
    const expanded = expandRecurringEvents({
      events: props.events,
      rangeStart: `${first} 00:00:00`,
      rangeEnd: `${last} 23:59:59`,
      ...(props.recurrenceExpansionLimit === undefined ? {} : { expansionLimit: props.recurrenceExpansionLimit })
    })
    const rows = resourceRows(props.resources, props.groups).map((row) => {
      const layout = weekViewEvents({
        ...week,
        events: expanded.filter((event) => event.resourceId === row.resource.id),
        date,
        startTime: props.startTime ?? "00:00:00",
        endTime: props.endTime ?? "23:59:59",
        intervalMinutes: props.intervalMinutes ?? 60
      })

      return {
        ...row,
        segments: layout.dayEvents.map((day) => ({
          date: day.date,
          regularEvents: day.regularEvents,
          backgroundEvents: day.backgroundEvents
        })),
        bars: layout.allDayEvents.map((event) => ({
          event,
          offset: event.position.offset,
          width: event.position.width,
          row: event.position.row
        }))
      }
    })
    const today = Option.getOrElse(Option.map(Option.fromNullishOr(props.now), dateOf), () => date)
    const weekLabelFormat = props.weekLabelFormat ?? "MMM DD"
    const title =
      props.renderWeekLabel === undefined
        ? `${formatDateTime(`${first} 00:00:00`, weekLabelFormat, locale)} – ${formatDateTime(`${last} 00:00:00`, weekLabelFormat, locale)}, ${first.slice(0, 4)}`
        : props.renderWeekLabel({ weekStart: first, weekEnd: last })
    const dayLabel = (day: DateString) => {
      const label = formatDateTime(`${day} 00:00:00`, props.weekdayFormat ?? "ddd D", locale)

      return props.highlightToday === true && props.now !== undefined && day === today ? `${label} •` : label
    }
    const header =
      (props.withHeader ?? true)
        ? [
            ScheduleHeader(h, {
              ...forwarded,
              view: "week",
              views: resourceViews,
              labels,
              title,
              ...(props.onDateChange === undefined
                ? {}
                : {
                    onPrevious: props.onDateChange(addDays(date, -7)),
                    onNext: props.onDateChange(addDays(date, 7)),
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
        ...getStyles("resourcesWeekView", timelineStyles.root, timelineVarsFor(props)),
        h.DataAttribute("week-number", String(weekNumber(weekDays(date, { firstDayOfWeek: 1 })))),
        ...(props.mode === "static" ? [h.DataAttribute("static", "")] : [])
      ],
      [
        ...header,
        timeline({
          h,
          props,
          part,
          labels,
          days,
          rows,
          expanded,
          dayLabel: Option.some(dayLabel),
          startScrollTime: Option.getOrElse(
            Option.map(Option.fromNullishOr(props.startScrollDateTime), (value) => value.slice(11)),
            () => ""
          )
        })
      ]
    )
  }
