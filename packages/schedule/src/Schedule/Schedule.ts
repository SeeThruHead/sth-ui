import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "@sth-ui/core/content.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import type { DateString } from "@sth-ui/dates/date/date.ts"
import type { DateTimeString } from "../datetime.ts"
import { defined } from "../defined.ts"
import { DayView } from "../DayView/DayView.ts"
import type { DayViewConfig, DayViewOptions } from "../DayView/DayView.ts"
import type { ScheduleEvent as EventData } from "../events.ts"
import type { ScheduleLabels } from "../labels.ts"
import { MobileMonthView } from "../MobileMonthView/MobileMonthView.ts"
import type { MobileMonthViewConfig, MobileMonthViewOptions } from "../MobileMonthView/MobileMonthView.ts"
import { MonthView } from "../MonthView/MonthView.ts"
import type { MonthViewConfig, MonthViewOptions } from "../MonthView/MonthView.ts"
import type { RenderEvent } from "../ScheduleEvent/ScheduleEvent.ts"
import { WeekView } from "../WeekView/WeekView.ts"
import type { WeekViewConfig, WeekViewOptions } from "../WeekView/WeekView.ts"
import { YearView } from "../YearView/YearView.ts"
import type { YearViewConfig, YearViewOptions } from "../YearView/YearView.ts"
import { gotView, Message } from "./model.ts"
import type { Message as ScheduleMessage, Model } from "./model.ts"

export type SchedulePart = "root" | "desktopView" | "mobileView"

export type ScheduleOptions = {
  readonly layout?: "default" | "responsive"
  readonly locale?: string
  readonly radius?: StyleValue
  readonly mode?: "default" | "static"
  readonly withEventsDragAndDrop?: boolean
  readonly withEventResize?: boolean
  readonly withDragSlotSelect?: boolean
  readonly withExternalEventDrop?: boolean
  readonly withInteractiveBackgroundEvents?: boolean
  readonly withAgenda?: boolean
  readonly recurrenceExpansionLimit?: number
}

export type ScheduleProps<M> = ScheduleOptions &
  StylesApiProps<SchedulePart> & {
    readonly model: Model
    readonly toParentMessage: (message: ScheduleMessage) => M
    readonly events?: ReadonlyArray<EventData>
    readonly now?: DateTimeString
    readonly labels?: Partial<ScheduleLabels>
    readonly renderEventBody?: (event: EventData) => Child
    readonly renderEvent?: RenderEvent<M>
    readonly canDragEvent?: (event: EventData) => boolean
    readonly canResizeEvent?: (event: EventData) => boolean
    readonly onTimeSlotClick?: (slot: { readonly slotStart: DateTimeString; readonly slotEnd: DateTimeString }) => M
    readonly onAllDaySlotClick?: (date: DateString) => M
    readonly onDayClick?: (date: DateString) => M
    readonly onEventClick?: (event: EventData) => M
    readonly dayViewProps?: DayViewOptions
    readonly weekViewProps?: WeekViewOptions
    readonly monthViewProps?: MonthViewOptions
    readonly yearViewProps?: YearViewOptions
    readonly mobileMonthViewProps?: MobileMonthViewOptions
  }

export type ScheduleConfig = ComponentConfig<ScheduleOptions, SchedulePart> & {
  readonly DayView?: DayViewConfig
  readonly WeekView?: WeekViewConfig
  readonly MonthView?: MonthViewConfig
  readonly YearView?: YearViewConfig
  readonly MobileMonthView?: MobileMonthViewConfig
}

const styles = stylex.create({
  responsive: { containerType: "inline-size" },
  desktop: { display: { default: "block", "@container (width <= 600px)": "none" }, height: "100%" },
  mobile: { display: { default: "none", "@container (width <= 600px)": "block" }, height: "100%" }
})

export const Schedule =
  (config: { readonly Schedule?: ScheduleConfig } & ScheduleConfig) =>
  <M>(h: HtmlBuilder<M>, input: ScheduleProps<M>): Html => {
    const props = withDefaults(config.Schedule, input)
    const getStyles = stylesApi<M, SchedulePart>(h, props, config.Schedule, "root")
    const model = props.model
    const send = props.toParentMessage
    const isStatic = props.mode === "static"
    const common = defined({
      events: props.events,
      now: props.now,
      locale: props.locale,
      radius: props.radius,
      labels: props.labels,
      mode: props.mode,
      renderEvent: props.renderEvent,
      recurrenceExpansionLimit: props.recurrenceExpansionLimit
    })
    const interactive = defined({
      renderEventBody: props.renderEventBody,
      withAgenda: props.withAgenda,
      withEventsDragAndDrop: props.withEventsDragAndDrop === true && !isStatic,
      withDragSlotSelect: props.withDragSlotSelect,
      withExternalEventDrop: props.withExternalEventDrop,
      withInteractiveBackgroundEvents: props.withInteractiveBackgroundEvents === true && !isStatic,
      canDragEvent: props.canDragEvent,
      onEventClick: props.onEventClick,
      model: model.views,
      toParentMessage: (message: Parameters<typeof gotView>[0]) => send(gotView(message)),
      onDateChange: (date: DateString) => send(Message.ChangedDate({ date })),
      onViewChange: (view: "day" | "week" | "month" | "year") => send(Message.ChangedView({ view }))
    })
    const timed = defined({
      withEventResize: props.withEventResize === true && !isStatic,
      canResizeEvent: props.canResizeEvent,
      onTimeSlotClick: props.onTimeSlotClick,
      onAllDaySlotClick: props.onAllDaySlotClick
    })
    const year = () =>
      YearView(config)(h, {
        ...common,
        ...props.yearViewProps,
        date: model.date,
        onDateChange: (date) => send(Message.ChangedDate({ date })),
        onViewChange: (view) => send(Message.ChangedView({ view })),
        onMonthClick: (date) => send(Message.OpenedMonth({ date })),
        ...defined({ onDayClick: props.onDayClick })
      })
    const desktop = (): Html => {
      if (model.view === "day")
        return DayView(config)(h, { ...common, ...interactive, ...timed, ...props.dayViewProps, date: model.date })
      if (model.view === "week")
        return WeekView(config)(h, { ...common, ...interactive, ...timed, ...props.weekViewProps, date: model.date })
      if (model.view === "month") {
        return MonthView(config)(h, {
          ...common,
          ...interactive,
          ...props.monthViewProps,
          ...defined({ onDayClick: props.onDayClick }),
          date: model.date
        })
      }

      return year()
    }
    const mobile = (): Html =>
      model.view === "year"
        ? year()
        : MobileMonthView(config)(h, {
            ...common,
            ...defined({
              onEventClick: props.onEventClick,
              weekendDays: props.monthViewProps?.weekendDays,
              withWeekendDays: props.monthViewProps?.withWeekendDays
            }),
            ...props.mobileMonthViewProps,
            date: model.date,
            selectedDate: model.selectedDate,
            onDayClick: (date) => send(Message.SelectedDay({ date })),
            onYearClick: send(Message.ChangedView({ view: "year" }))
          })

    return props.layout === "responsive"
      ? h.div(
          [...getStyles("root", styles.responsive), h.DataAttribute("layout", "responsive")],
          [
            h.div(getStyles("desktopView", styles.desktop), [desktop()]),
            h.div(getStyles("mobileView", styles.mobile), [mobile()])
          ]
        )
      : h.div(getStyles("root"), [desktop()])
  }
