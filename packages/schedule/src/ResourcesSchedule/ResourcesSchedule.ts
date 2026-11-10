import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "@sth-ui/core/content.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import type { DateString } from "@sth-ui/dates/date/date.ts"
import type { DateTimeString } from "../datetime.ts"
import { defined } from "../defined.ts"
import type { EventId, ScheduleEvent as EventData, ScheduleResource, ScheduleResourceGroup } from "../events.ts"
import type { ScheduleLabels } from "../labels.ts"
import { ResourcesDayView } from "../ResourcesDayView/ResourcesDayView.ts"
import type { ResourcesDayViewConfig, ResourcesDayViewOptions } from "../ResourcesDayView/ResourcesDayView.ts"
import { ResourcesMonthView } from "../ResourcesMonthView/ResourcesMonthView.ts"
import type { ResourcesMonthViewConfig, ResourcesMonthViewOptions } from "../ResourcesMonthView/ResourcesMonthView.ts"
import { ResourcesWeekView } from "../ResourcesWeekView/ResourcesWeekView.ts"
import type { ResourcesWeekViewConfig, ResourcesWeekViewOptions } from "../ResourcesWeekView/ResourcesWeekView.ts"
import { gotView, Message } from "../Schedule/model.ts"
import type { Message as ScheduleMessage, Model } from "../Schedule/model.ts"
import type { RenderEvent } from "../ScheduleEvent/ScheduleEvent.ts"

export type ResourcesSchedulePart = "root"

export type ResourcesScheduleOptions = {
  readonly locale?: string
  readonly radius?: StyleValue
  readonly mode?: "default" | "static"
  readonly withEventsDragAndDrop?: boolean
  readonly withEventResize?: boolean
  readonly withDragSlotSelect?: boolean
  readonly withExternalEventDrop?: boolean
  readonly withInteractiveBackgroundEvents?: boolean
  readonly recurrenceExpansionLimit?: number
}

export type ResourcesScheduleProps<M> = ResourcesScheduleOptions &
  StylesApiProps<ResourcesSchedulePart> & {
    readonly model: Model
    readonly toParentMessage: (message: ScheduleMessage) => M
    readonly resources: ReadonlyArray<ScheduleResource>
    readonly groups?: ReadonlyArray<ScheduleResourceGroup>
    readonly events?: ReadonlyArray<EventData>
    readonly now?: DateTimeString
    readonly labels?: Partial<ScheduleLabels>
    readonly renderEventBody?: (event: EventData) => Child
    readonly renderEvent?: RenderEvent<M>
    readonly renderResourceLabel?: (resource: ScheduleResource) => Child
    readonly canDragEvent?: (event: EventData) => boolean
    readonly canResizeEvent?: (event: EventData) => boolean
    readonly onTimeSlotClick?: (slot: {
      readonly resourceId: EventId
      readonly slotStart: DateTimeString
      readonly slotEnd: DateTimeString
    }) => M
    readonly onDayClick?: (cell: { readonly resourceId: EventId; readonly date: DateString }) => M
    readonly onEventClick?: (event: EventData) => M
    readonly previousControlProps?: ReadonlyArray<Attribute<M>>
    readonly dayViewProps?: ResourcesDayViewOptions
    readonly weekViewProps?: ResourcesWeekViewOptions
    readonly monthViewProps?: ResourcesMonthViewOptions
  }

export type ResourcesScheduleConfig = ComponentConfig<ResourcesScheduleOptions, ResourcesSchedulePart>

export const ResourcesSchedule =
  (
    config: { readonly ResourcesSchedule?: ResourcesScheduleConfig } & {
      readonly ResourcesDayView?: ResourcesDayViewConfig
      readonly ResourcesWeekView?: ResourcesWeekViewConfig
      readonly ResourcesMonthView?: ResourcesMonthViewConfig
    }
  ) =>
  <M>(h: HtmlBuilder<M>, input: ResourcesScheduleProps<M>): Html => {
    const props = withDefaults(config.ResourcesSchedule, input)
    const getStyles = stylesApi<M, ResourcesSchedulePart>(h, props, config.ResourcesSchedule, "root")
    const model = props.model
    const send = props.toParentMessage
    const isStatic = props.mode === "static"
    const common = {
      ...defined({
        groups: props.groups,
        events: props.events,
        now: props.now,
        locale: props.locale,
        radius: props.radius,
        labels: props.labels,
        mode: props.mode,
        renderEventBody: props.renderEventBody,
        renderEvent: props.renderEvent,
        renderResourceLabel: props.renderResourceLabel,
        canDragEvent: props.canDragEvent,
        canResizeEvent: props.canResizeEvent,
        onEventClick: props.onEventClick,
        recurrenceExpansionLimit: props.recurrenceExpansionLimit,
        previousControlProps: props.previousControlProps,
        withDragSlotSelect: props.withDragSlotSelect,
        withExternalEventDrop: props.withExternalEventDrop
      }),
      resources: props.resources,
      date: model.date,
      withEventsDragAndDrop: props.withEventsDragAndDrop === true && !isStatic,
      withEventResize: props.withEventResize === true && !isStatic,
      model: model.views,
      toParentMessage: (message: Parameters<typeof gotView>[0]) => send(gotView(message)),
      onDateChange: (date: DateString) => send(Message.ChangedDate({ date })),
      onViewChange: (view: "day" | "week" | "month" | "year") => send(Message.ChangedView({ view }))
    }
    const timed = defined({
      onTimeSlotClick: props.onTimeSlotClick,
      withInteractiveBackgroundEvents: props.withInteractiveBackgroundEvents === true && !isStatic
    })
    const content = (): Html => {
      if (model.view === "day") return ResourcesDayView(config)(h, { ...common, ...timed, ...props.dayViewProps })
      if (model.view === "week") return ResourcesWeekView(config)(h, { ...common, ...timed, ...props.weekViewProps })

      return ResourcesMonthView(config)(h, {
        ...common,
        ...defined({ onDayClick: props.onDayClick }),
        ...props.monthViewProps
      })
    }

    return h.div(getStyles("root"), [content()])
  }
