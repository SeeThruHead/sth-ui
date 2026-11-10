import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { Option } from "effect"
import { addDays } from "@sth-ui/dates/date/date.ts"
import type { DateString } from "@sth-ui/dates/date/date.ts"
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
import { resourceRows, resourcesDayEvents } from "../resourcesLayout.ts"
import type { ScheduleEventPart } from "../ScheduleEvent/ScheduleEvent.ts"
import { resourceViews, ScheduleHeader } from "../ScheduleHeader/ScheduleHeader.ts"
import type { ScheduleHeaderPart } from "../ScheduleHeader/ScheduleHeader.ts"
import { timeline, timelineStyles, timelineVarsFor } from "../Timeline/Timeline.ts"
import type { TimelineOptions, TimelinePart, TimelineProps } from "../Timeline/Timeline.ts"

export type { ResourceSlot } from "../Timeline/Timeline.ts"

export type ResourcesDayViewPart =
  | ScheduleHeaderPart
  | ScheduleEventPart
  | MoreEventsPart
  | "resourcesDayView"
  | "resourcesDayViewRoot"
  | "resourcesDayViewScrollArea"
  | "resourcesDayViewInner"
  | "resourcesDayViewTimeLabelsRow"
  | "resourcesDayViewCorner"
  | "resourcesDayViewTimeLabel"
  | "resourcesDayViewRow"
  | "resourcesDayViewGroupColumn"
  | "resourcesDayViewResourceLabel"
  | "resourcesDayViewRowSlots"
  | "resourcesDayViewRowSlot"
  | "resourcesDayViewEventWrapper"
  | "resourcesDayViewAllDayEvents"
  | "resourcesDayViewBackgroundEvent"
  | "resourcesDayViewCurrentTime"

export type ResourcesDayViewOptions = TimelineOptions & {
  readonly startScrollTime?: string
  readonly withHeader?: boolean
  readonly headerFormat?: DateLabelFormat
}

export type ResourcesDayViewProps<M> = ResourcesDayViewOptions &
  Omit<TimelineProps<M>, "styles" | "attributes"> &
  StylesApiProps<ResourcesDayViewPart> & {
    readonly date: DateString
    readonly resources: ReadonlyArray<ScheduleResource>
    readonly groups?: ReadonlyArray<ScheduleResourceGroup>
    readonly events?: ReadonlyArray<EventData>
    readonly labels?: Partial<ScheduleLabels>
    readonly onDateChange?: (date: DateString) => M
    readonly onViewChange?: (view: ScheduleViewLevel) => M
  }

export type ResourcesDayViewConfig = ComponentConfig<ResourcesDayViewOptions, ResourcesDayViewPart>

const parts = {
  frame: "resourcesDayViewRoot",
  scroll: "resourcesDayViewScrollArea",
  inner: "resourcesDayViewInner",
  labelsRow: "resourcesDayViewTimeLabelsRow",
  corner: "resourcesDayViewCorner",
  timeLabel: "resourcesDayViewTimeLabel",
  dayLabel: "resourcesDayViewTimeLabel",
  row: "resourcesDayViewRow",
  group: "resourcesDayViewGroupColumn",
  label: "resourcesDayViewResourceLabel",
  slots: "resourcesDayViewRowSlots",
  slot: "resourcesDayViewRowSlot",
  wrapper: "resourcesDayViewEventWrapper",
  allDay: "resourcesDayViewAllDayEvents",
  background: "resourcesDayViewBackgroundEvent",
  now: "resourcesDayViewCurrentTime"
} as const

export const ResourcesDayView =
  (config: { readonly ResourcesDayView?: ResourcesDayViewConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ResourcesDayViewProps<M>): Html => {
    const props = withDefaults(config.ResourcesDayView, input)
    const getStyles = stylesApi<M, ResourcesDayViewPart>(h, props, config.ResourcesDayView, "resourcesDayView")
    const part: GetStyles<M, TimelinePart> = (name, ...rest) => getStyles(parts[name], ...rest)
    const labels = scheduleLabels(props.labels)
    const date = props.date
    const forwarded = {
      ...(props.styles === undefined ? {} : { styles: props.styles }),
      ...(props.attributes === undefined ? {} : { attributes: props.attributes })
    }
    const expanded = expandRecurringEvents({
      events: props.events,
      rangeStart: `${date} 00:00:00`,
      rangeEnd: `${date} 23:59:59`,
      ...(props.recurrenceExpansionLimit === undefined ? {} : { expansionLimit: props.recurrenceExpansionLimit })
    })
    const days = resourcesDayEvents({
      rows: resourceRows(props.resources, props.groups),
      events: expanded,
      date,
      startTime: props.startTime ?? "00:00:00",
      endTime: props.endTime ?? "23:59:59",
      intervalMinutes: props.intervalMinutes ?? 60
    })
    const rows = days.map((day) => ({
      resource: day.resource,
      group: day.group,
      segments: [
        {
          date,
          regularEvents: day.events.regularEvents,
          backgroundEvents: [...day.events.backgroundTimedEvents, ...day.events.backgroundAllDayEvents]
        }
      ],
      bars: day.events.allDayEvents.map((event, row) => ({ event, offset: 0, width: 100, row }))
    }))
    const today = Option.getOrElse(Option.map(Option.fromNullishOr(props.now), dateOf), () => date)
    const header =
      (props.withHeader ?? true)
        ? [
            ScheduleHeader(h, {
              ...forwarded,
              view: "day",
              views: resourceViews,
              labels,
              title: formatDateTime(`${date} 00:00:00`, props.headerFormat ?? "MMMM D, YYYY", props.locale ?? "en"),
              ...(props.onDateChange === undefined
                ? {}
                : {
                    onPrevious: props.onDateChange(addDays(date, -1)),
                    onNext: props.onDateChange(addDays(date, 1)),
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
        ...getStyles("resourcesDayView", timelineStyles.root, timelineVarsFor(props)),
        ...(props.mode === "static" ? [h.DataAttribute("static", "")] : [])
      ],
      [
        ...header,
        timeline({
          h,
          props,
          part,
          labels,
          days: [date],
          rows,
          expanded,
          dayLabel: Option.none(),
          startScrollTime: props.startScrollTime ?? ""
        })
      ]
    )
  }
